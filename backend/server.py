from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import MetaData, Table, Column, String, Boolean, Integer, Text
from sqlalchemy import select, insert, update, delete, func
import os
import json
import logging
import asyncio
import aiohttp
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ── Database setup ─────────────────────────────────────────────────────────────
# Local dev:  sqlite+aiosqlite:///./aiconziogio.db   (auto-created, zero config)
# Railway:    add PostgreSQL plugin → set DATABASE_URL automatically (postgres://...)
_raw_url = os.environ.get('DATABASE_URL', f'sqlite+aiosqlite:///{ROOT_DIR}/aiconziogio.db')

# Railway gives postgres:// or postgresql://, SQLAlchemy needs postgresql+asyncpg://
if _raw_url.startswith('postgres://'):
    _raw_url = _raw_url.replace('postgres://', 'postgresql+asyncpg://', 1)
elif _raw_url.startswith('postgresql://') and '+' not in _raw_url.split('://')[0]:
    _raw_url = _raw_url.replace('postgresql://', 'postgresql+asyncpg://', 1)

DATABASE_URL = _raw_url
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
metadata = MetaData()

# ── Table definitions ──────────────────────────────────────────────────────────
contact_messages_t = Table('contact_messages', metadata,
    Column('id', String, primary_key=True),
    Column('name', String, nullable=False),
    Column('email', String, nullable=False),
    Column('message', Text, nullable=False),
    Column('created_at', String, nullable=False),
)

blog_posts_t = Table('blog_posts', metadata,
    Column('id', String, primary_key=True),
    Column('title', String, nullable=False),
    Column('slug', String, nullable=False),
    Column('excerpt', Text),
    Column('content', Text),
    Column('prompt_text', Text, nullable=True),
    Column('image_url', String, nullable=True),
    Column('category', String, default='prompt'),
    Column('created_at', String, nullable=False),
    Column('published', Boolean, default=True),
)

projects_t = Table('projects', metadata,
    Column('id', String, primary_key=True),
    Column('title', String, nullable=False),
    Column('slug', String, nullable=False),
    Column('description', Text),
    Column('image_url', String),
    Column('video_url', String, nullable=True),
    Column('category', String),
    Column('order', Integer, default=0),
)

gallery_t = Table('gallery', metadata,
    Column('id', String, primary_key=True),
    Column('title', String, nullable=False),
    Column('image_url', String, nullable=False),
    Column('category', String, nullable=False),
    Column('description', Text, nullable=True),
    Column('prompt_text', Text, nullable=True),
    Column('order', Integer, default=0),
)

instagram_reels_t = Table('instagram_reels', metadata,
    Column('id', String, primary_key=True),
    Column('title', String, nullable=False),
    Column('url', String, nullable=False),
    Column('thumbnail_url', String, nullable=True),
    Column('description', Text, nullable=True),
    Column('order', Integer, default=0),
    Column('published', Boolean, default=True),
    Column('created_at', String, nullable=False),
)

# site_settings stores the whole settings dict as a JSON blob (id always 'main')
site_settings_t = Table('site_settings', metadata,
    Column('id', String, primary_key=True),
    Column('data', Text, nullable=False),
)

# ── DB helpers ─────────────────────────────────────────────────────────────────
async def db_all(table, *conditions, order_by=None):
    async with AsyncSessionLocal() as s:
        q = select(table)
        for c in conditions:
            q = q.where(c)
        if order_by is not None:
            q = q.order_by(order_by)
        r = await s.execute(q)
        return [dict(row._mapping) for row in r.fetchall()]

async def db_one(table, *conditions):
    async with AsyncSessionLocal() as s:
        q = select(table)
        for c in conditions:
            q = q.where(c)
        r = await s.execute(q)
        row = r.fetchone()
        return dict(row._mapping) if row else None

async def db_insert(table, data: dict):
    async with AsyncSessionLocal() as s:
        await s.execute(insert(table).values(**data))
        await s.commit()

async def db_update(table, data: dict, *conditions):
    async with AsyncSessionLocal() as s:
        q = update(table).values(**data)
        for c in conditions:
            q = q.where(c)
        r = await s.execute(q)
        await s.commit()
        return r.rowcount

async def db_delete(table, *conditions):
    async with AsyncSessionLocal() as s:
        q = delete(table)
        for c in conditions:
            q = q.where(c)
        r = await s.execute(q)
        await s.commit()
        return r.rowcount

async def db_count(table, *conditions):
    async with AsyncSessionLocal() as s:
        q = select(func.count()).select_from(table)
        for c in conditions:
            q = q.where(c)
        r = await s.execute(q)
        return r.scalar()

# ── Email setup ────────────────────────────────────────────────────────────────
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', 'MOCK_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
CONTACT_RECIPIENT_EMAIL = os.environ.get('CONTACT_RECIPIENT_EMAIL', 'aiconziogio@gmail.com')
IS_EMAIL_MOCKED = RESEND_API_KEY == 'MOCK_KEY'

if not IS_EMAIL_MOCKED:
    import resend
    resend.api_key = RESEND_API_KEY

# ── Instagram setup ────────────────────────────────────────────────────────────
INSTAGRAM_ACCESS_TOKEN = os.environ.get('INSTAGRAM_ACCESS_TOKEN', '')
INSTAGRAM_USERNAME = os.environ.get('INSTAGRAM_USERNAME', 'aiconziogio')

# ── Admin auth ─────────────────────────────────────────────────────────────────
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
admin_tokens: set = set()
active_avatar_tasks: dict = {}  # request_id -> asyncio.Task

# Campi sensibili esclusi dalla risposta pubblica /api/settings
SENSITIVE_SETTINGS_KEYS = {"openai_api_key", "elevenlabs_api_key", "avatar_system_prompt"}

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    message: str

class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    excerpt: str
    content: str
    prompt_text: Optional[str] = None
    image_url: Optional[str] = None
    category: str = "prompt"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published: bool = True

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    description: str
    image_url: str
    video_url: Optional[str] = None
    category: str
    order: int = 0

class GalleryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    image_url: str
    category: str  # "photo" or "ai_art"
    description: Optional[str] = None
    prompt_text: Optional[str] = None
    order: int = 0

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str = "main"
    hero_title: str = "E se l'AI fosse esistita nel passato?"
    hero_subtitle: str = "Viaggio attraverso il tempo con l'intelligenza artificiale. Storie di ieri raccontate con la tecnologia di domani."
    hero_image_url: str = "https://images.pexels.com/photos/35378672/pexels-photo-35378672.jpeg?auto=compress&cs=tinysrgb&w=1920"
    about_title: str = "Content Creator con vista Vesuvio"
    about_bio_1: str = "Mi chiamo Giovanni, ma tutti mi chiamano Zio Gio. Dal mio studio a Napoli, con il Vesuvio come sfondo, creo contenuti che mescolano tecnologia e storytelling."
    about_bio_2: str = "Uso l'intelligenza artificiale per immaginare mondi dove passato e futuro si incontrano. I miei prompt creano visioni di come sarebbe stato il mondo se l'AI fosse esistita ieri."
    about_bio_3: str = 'Il progetto "Il giro del mondo in..." nasce da questa passione: raccontare storie attraverso persone, luoghi e tecnologia.'
    stat_followers: str = "5K+"
    stat_stories: str = "50+"
    stat_prompts: str = "\u221e"
    social_instagram: str = "https://instagram.com/aiconziogio"
    social_tiktok: str = "https://tiktok.com/@aiconziogio"
    social_facebook: str = "https://facebook.com/profile.php?id=100084321234567"
    contact_email: str = "aiconziogio@gmail.com"
    contact_whatsapp: str = "+39 329 162 4908"
    footer_text: str = "ZIO_GIO // AI_STORYTELLER"
    # ── Avatar AI ──────────────────────────────────────────────────────────────
    avatar_enabled: bool = False
    avatar_name: str = "Zio Gio AI"
    avatar_greeting: str = "Benvenuto nel terminale temporale. Sono Zio Gio, il tuo narratore AI. Come posso aiutarti nel tuo viaggio tra passato e futuro?"
    avatar_system_prompt: str = "Sei Zio Gio, un content creator napoletano appassionato di intelligenza artificiale e storytelling. Il tuo stile è caldo, ironico e appassionato. Parli sempre in italiano. Ti chiami Giovanni ma tutti ti chiamano Zio Gio. Ti piace raccontare storie mescolando passato e futuro, tecnologia e umanità. Vivi a Napoli con il Vesuvio come sfondo del tuo studio. Tieni le risposte concise ma coinvolgenti, massimo 150 parole."
    avatar_image_url: str = ""
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

class AdminLoginRequest(BaseModel):
    password: str

class BlogPostCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    prompt_text: Optional[str] = None
    image_url: Optional[str] = None
    category: str = "prompt"
    published: bool = True

class GalleryItemCreate(BaseModel):
    title: str
    image_url: str
    category: str
    description: Optional[str] = None
    prompt_text: Optional[str] = None
    order: int = 0

class ProjectCreate(BaseModel):
    title: str
    slug: str
    description: str
    image_url: str
    video_url: Optional[str] = None
    category: str
    order: int = 0

class InstagramReel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    order: int = 0
    published: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InstagramReelCreate(BaseModel):
    title: str
    url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    order: int = 0
    published: bool = True

class AvatarChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class AvatarChatRequest(BaseModel):
    message: str
    history: List[AvatarChatMessage] = []
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class AvatarSpeakRequest(BaseModel):
    text: str
    request_id: str = ""

# ============ ADMIN AUTH ============

async def verify_admin(x_admin_token: Optional[str] = Header(None)):
    if not x_admin_token or x_admin_token not in admin_tokens:
        raise HTTPException(status_code=401, detail="Non autorizzato")
    return x_admin_token

# ── Helper: parse datetime ISO string from DB row ──────────────────────────────
def _parse_dt(row: dict, field: str = 'created_at') -> dict:
    if isinstance(row.get(field), str):
        row[field] = datetime.fromisoformat(row[field])
    return row

# ============ PUBLIC ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Ai con Zio Gio API"}

# Instagram Feed
@api_router.get("/instagram")
async def get_instagram_posts():
    profile_url = f"https://instagram.com/{INSTAGRAM_USERNAME}"
    if not INSTAGRAM_ACCESS_TOKEN:
        return {"posts": [], "is_configured": False, "profile_url": profile_url, "username": INSTAGRAM_USERNAME}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://graph.instagram.com/me/media",
                params={
                    "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
                    "access_token": INSTAGRAM_ACCESS_TOKEN,
                    "limit": 9
                }
            ) as resp:
                data = await resp.json()
                posts = [
                    p for p in data.get("data", [])
                    if p.get("media_type") in ["IMAGE", "CAROUSEL_ALBUM"]
                ]
                return {"posts": posts, "is_configured": True, "profile_url": profile_url, "username": INSTAGRAM_USERNAME}
    except Exception as e:
        logger.error(f"Failed to fetch Instagram posts: {str(e)}")
        return {"posts": [], "is_configured": False, "profile_url": profile_url, "username": INSTAGRAM_USERNAME}

# Contact Form
@api_router.post("/contact", response_model=dict)
async def submit_contact(input: ContactMessageCreate):
    contact = ContactMessage(**input.model_dump())
    await db_insert(contact_messages_t, {
        "id": contact.id,
        "name": contact.name,
        "email": contact.email,
        "message": contact.message,
        "created_at": contact.created_at.isoformat(),
    })

    if IS_EMAIL_MOCKED:
        logger.info(f"[MOCKED EMAIL] New contact from {input.name} ({input.email}): {input.message}")
        email_status = "mocked"
    else:
        try:
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #B26941;">Nuovo messaggio dal sito</h2>
                <p><strong>Nome:</strong> {input.name}</p>
                <p><strong>Email:</strong> {input.email}</p>
                <p><strong>Messaggio:</strong></p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
                    {input.message}
                </div>
            </div>
            """
            params = {
                "from": SENDER_EMAIL,
                "to": [CONTACT_RECIPIENT_EMAIL],
                "subject": f"Nuovo messaggio da {input.name} - Ai con Zio Gio",
                "html": html_content
            }
            await asyncio.to_thread(resend.Emails.send, params)
            email_status = "sent"
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            email_status = "failed"

    return {
        "status": "success",
        "message": "Messaggio inviato con successo!",
        "email_status": email_status,
        "id": contact.id
    }

# Blog Posts
@api_router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts():
    rows = await db_all(blog_posts_t, blog_posts_t.c.published == True,
                        order_by=blog_posts_t.c.created_at.desc())
    return [_parse_dt(r) for r in rows]

@api_router.get("/blog/{slug}", response_model=BlogPost)
async def get_blog_post(slug: str):
    row = await db_one(blog_posts_t, blog_posts_t.c.slug == slug, blog_posts_t.c.published == True)
    if not row:
        raise HTTPException(status_code=404, detail="Post non trovato")
    return _parse_dt(row)

# Projects
@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    return await db_all(projects_t, order_by=projects_t.c.order)

@api_router.get("/projects/{slug}", response_model=Project)
async def get_project(slug: str):
    row = await db_one(projects_t, projects_t.c.slug == slug)
    if not row:
        raise HTTPException(status_code=404, detail="Progetto non trovato")
    return row

# Gallery
@api_router.get("/gallery", response_model=List[GalleryItem])
async def get_gallery(category: Optional[str] = None):
    conditions = []
    if category:
        conditions.append(gallery_t.c.category == category)
    return await db_all(gallery_t, *conditions, order_by=gallery_t.c.order)

# Instagram Reels (manually curated)
@api_router.get("/reels")
async def get_reels():
    rows = await db_all(instagram_reels_t, instagram_reels_t.c.published == True,
                        order_by=instagram_reels_t.c.order)
    return [_parse_dt(r) for r in rows]

# Public settings
@api_router.get("/settings")
async def get_public_settings():
    row = await db_one(site_settings_t, site_settings_t.c.id == "main")
    if not row:
        data = SiteSettings().model_dump()
    else:
        data = json.loads(row["data"])
    # Esclude campi sensibili (API key, system prompt)
    return {k: v for k, v in data.items() if k not in SENSITIVE_SETTINGS_KEYS}

# Seed Data
@api_router.post("/seed")
async def seed_data(force: bool = False):
    """Seed example data. By default only seeds if empty. Pass ?force=true to overwrite."""
    blog_count = await db_count(blog_posts_t)
    proj_count = await db_count(projects_t)
    gall_count = await db_count(gallery_t)

    if not force and (blog_count > 0 or proj_count > 0 or gall_count > 0):
        return {"status": "skipped", "message": "Database gia' popolato. Usa ?force=true per sovrascrivere."}

    async with AsyncSessionLocal() as s:
        await s.execute(delete(blog_posts_t))
        await s.execute(delete(projects_t))
        await s.execute(delete(gallery_t))
        await s.commit()

    now = datetime.now(timezone.utc).isoformat()

    blog_posts = [
        {"id": str(uuid.uuid4()), "title": "Il Viaggio di Phileas Fogg in 80 Giorni",
         "slug": "phileas-fogg-viaggio",
         "excerpt": "Un prompt per creare un'immagine iper-dettagliata ispirata al celebre romanzo di Jules Verne.",
         "content": "Questo prompt genera un'immagine cinematografica che cattura lo spirito avventuroso del viaggio di Phileas Fogg.\n\nL'obiettivo e' creare un'atmosfera vintage con toni seppia e dorati, richiamando le illustrazioni dei libri d'avventura dell'800.",
         "prompt_text": "Create a hyper-detailed cinematic image of a Victorian gentleman traveler standing on a steam train platform, warm sepia tones, golden hour lighting, vintage luggage, world map in background, Jules Verne aesthetic, film grain texture, 8K resolution",
         "image_url": "https://images.pexels.com/photos/30575919/pexels-photo-30575919.jpeg?auto=compress&cs=tinysrgb&w=800",
         "category": "prompt", "created_at": now, "published": True},
        {"id": str(uuid.uuid4()), "title": "Uncle Gio - Il Narratore Digitale",
         "slug": "uncle-gio-narratore",
         "excerpt": "Come creare un personaggio AI che rappresenta lo storyteller moderno.",
         "content": "Questo prompt e' stato creato per definire il mio alter ego digitale: Uncle Gio.\n\nL'immagine deve trasmettere saggezza, curiosita' e il fascino del viaggio. I colori caldi evocano nostalgia e autenticita'.",
         "prompt_text": "Cinematic portrait of an older Italian man, warm copper lighting, storyteller expression, wearing casual travel clothes, background showing blurred city streets of Naples, film photography style, shallow depth of field",
         "image_url": "https://images.unsplash.com/photo-1578069244640-976a4135fada?w=800",
         "category": "prompt", "created_at": now, "published": True},
        {"id": str(uuid.uuid4()), "title": "Napoli Segreta - Vicoli e Storie",
         "slug": "napoli-segreta",
         "excerpt": "Un prompt per esplorare i vicoli nascosti di Napoli attraverso l'AI.",
         "content": "Napoli e' una citta' di contrasti e bellezza nascosta. Questo prompt cattura l'essenza dei suoi vicoli antichi.\n\nUso colori caldi e luci naturali per creare atmosfere autentiche che ricordano il cinema neorealista italiano.",
         "prompt_text": "Narrow alley in Naples Italy, morning light streaming through hanging laundry, warm terracotta walls, elderly locals chatting, vintage Vespa parked, cinematic composition, warm color grading, nostalgic atmosphere",
         "image_url": "https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800",
         "category": "prompt", "created_at": now, "published": True},
    ]

    projects = [
        {"id": str(uuid.uuid4()), "title": "Napoli - Storie di Quartiere", "slug": "napoli-storie",
         "description": "Un viaggio attraverso i vicoli di Napoli, incontrando personaggi autentici che raccontano le loro storie. Ogni episodio e' un incontro con l'anima della citta'.",
         "image_url": "https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800",
         "video_url": "https://www.instagram.com/aiconziogio/", "category": "serie", "order": 1},
        {"id": str(uuid.uuid4()), "title": "Il Giro del Mondo in...", "slug": "giro-del-mondo",
         "description": "Il mio progetto principale: esplorare il mondo attraverso le persone, i luoghi e l'intelligenza artificiale. Ogni tappa e' una nuova avventura.",
         "image_url": "https://images.pexels.com/photos/35042068/pexels-photo-35042068.jpeg?w=800",
         "video_url": None, "category": "serie", "order": 2},
        {"id": str(uuid.uuid4()), "title": "Collaborazione Sora", "slug": "sora-collaboration",
         "description": "Esperimenti creativi con Sora AI per creare contenuti video innovativi che fondono realta' e immaginazione.",
         "image_url": "https://images.unsplash.com/photo-1770170389700-eb0f9b910ed8?w=800",
         "video_url": None, "category": "collaborazione", "order": 3},
    ]

    gallery_items = [
        {"id": str(uuid.uuid4()), "title": "Tramonto sul Vesuvio",
         "image_url": "https://images.unsplash.com/photo-1680096485726-18b85f93ec5e?w=800",
         "category": "photo", "description": "I colori del tramonto napoletano", "prompt_text": None, "order": 1},
        {"id": str(uuid.uuid4()), "title": "Vicoli di Napoli",
         "image_url": "https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800",
         "category": "photo", "description": "La vita quotidiana nei quartieri storici", "prompt_text": None, "order": 2},
        {"id": str(uuid.uuid4()), "title": "Istanbul al Tramonto",
         "image_url": "https://images.pexels.com/photos/35042068/pexels-photo-35042068.jpeg?w=800",
         "category": "photo", "description": "I traghetti sul Bosforo", "prompt_text": None, "order": 3},
        {"id": str(uuid.uuid4()), "title": "Viaggio nel Tempo",
         "image_url": "https://images.pexels.com/photos/30575919/pexels-photo-30575919.jpeg?w=800",
         "category": "ai_art", "description": "Arte AI ispirata ai viaggi vittoriani",
         "prompt_text": "Victorian era time travel, sepia tones, ornate clock mechanism", "order": 1},
        {"id": str(uuid.uuid4()), "title": "Sogni di Rame",
         "image_url": "https://images.unsplash.com/photo-1770170389700-eb0f9b910ed8?w=800",
         "category": "ai_art", "description": "Astratto in toni caldi",
         "prompt_text": "Abstract copper dreams, flowing metallic textures, warm glow", "order": 2},
    ]

    async with AsyncSessionLocal() as s:
        await s.execute(insert(blog_posts_t), blog_posts)
        await s.execute(insert(projects_t), projects)
        await s.execute(insert(gallery_t), gallery_items)
        await s.commit()

    return {"status": "success", "message": "Dati di esempio caricati"}

# ============ AVATAR AI ROUTES ============

@api_router.get("/avatar/config")
async def get_avatar_config():
    """Restituisce la configurazione pubblica dell'avatar (senza API key)."""
    row = await db_one(site_settings_t, site_settings_t.c.id == "main")
    if not row:
        s = SiteSettings()
        return {
            "avatar_enabled": s.avatar_enabled,
            "avatar_name": s.avatar_name,
            "avatar_greeting": s.avatar_greeting,
            "avatar_image_url": s.avatar_image_url,
        }
    d = json.loads(row["data"])
    return {
        "avatar_enabled": d.get("avatar_enabled", False),
        "avatar_name": d.get("avatar_name", "Zio Gio AI"),
        "avatar_greeting": d.get("avatar_greeting", ""),
        "avatar_image_url": d.get("avatar_image_url", ""),
    }

@api_router.post("/avatar/chat")
async def avatar_chat(body: AvatarChatRequest):
    """Invia un messaggio all'avatar AI (OpenAI). Supporta cancellazione via /avatar/stop/{request_id}."""
    row = await db_one(site_settings_t, site_settings_t.c.id == "main")
    if not row:
        raise HTTPException(status_code=503, detail="Configurazione non trovata")

    settings_data = json.loads(row["data"])

    if not settings_data.get("avatar_enabled", False):
        raise HTTPException(status_code=503, detail="Avatar non abilitato. Attivalo dal pannello admin.")

    openai_key = settings_data.get("openai_api_key", "").strip()
    if not openai_key:
        raise HTTPException(status_code=503, detail="API key OpenAI non configurata nel pannello admin.")

    model = settings_data.get("openai_model", "gpt-4o-mini")
    system_prompt = settings_data.get(
        "avatar_system_prompt",
        "Sei Zio Gio, un content creator napoletano appassionato di AI e storytelling. Parla in italiano."
    )

    messages = [{"role": "system", "content": system_prompt}]
    for msg in body.history[-12:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": body.message})

    async def do_chat():
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.75,
                },
                timeout=aiohttp.ClientTimeout(total=60),
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    raise HTTPException(status_code=502, detail=f"Errore OpenAI ({resp.status}): {error_text[:300]}")
                data = await resp.json()
                return data["choices"][0]["message"]["content"]

    task = asyncio.create_task(do_chat())
    active_avatar_tasks[body.request_id] = task

    try:
        response_text = await task
        return {"response": response_text, "request_id": body.request_id, "cancelled": False}
    except asyncio.CancelledError:
        return {"response": None, "request_id": body.request_id, "cancelled": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AVATAR] Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        active_avatar_tasks.pop(body.request_id, None)

@api_router.post("/avatar/stop/{request_id}")
async def avatar_stop(request_id: str):
    """Interrompe un task di chat avatar in corso."""
    task = active_avatar_tasks.get(request_id)
    if task and not task.done():
        task.cancel()
        return {"status": "stopped", "request_id": request_id}
    return {"status": "not_found", "request_id": request_id}

@api_router.post("/avatar/speak")
async def avatar_speak(body: AvatarSpeakRequest):
    """Sintetizza voce tramite ElevenLabs e restituisce audio MP3."""
    from fastapi.responses import Response as FastAPIResponse
    row = await db_one(site_settings_t, site_settings_t.c.id == "main")
    if not row:
        raise HTTPException(status_code=503, detail="Configurazione non trovata")

    settings_data = json.loads(row["data"])
    el_key = settings_data.get("elevenlabs_api_key", "").strip()
    voice_id = settings_data.get("elevenlabs_voice_id", "").strip()

    if not el_key or not voice_id:
        raise HTTPException(status_code=503, detail="ElevenLabs non configurato (API key o Voice ID mancante).")

    async def do_speak():
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": el_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": body.text[:1000],
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    raise HTTPException(status_code=502, detail=f"Errore ElevenLabs ({resp.status}): {error_text[:200]}")
                return await resp.read()

    task = asyncio.create_task(do_speak())
    if body.request_id:
        active_avatar_tasks[body.request_id] = task

    try:
        audio_bytes = await task
        return FastAPIResponse(content=audio_bytes, media_type="audio/mpeg")
    except asyncio.CancelledError:
        raise HTTPException(status_code=499, detail="Sintesi vocale interrotta")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AVATAR] Speak error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if body.request_id:
            active_avatar_tasks.pop(body.request_id, None)

# ============ ADMIN ROUTER ============

admin_router = APIRouter(prefix="/api/admin")

@admin_router.post("/login")
async def admin_login(body: AdminLoginRequest):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Password errata")
    token = secrets.token_urlsafe(32)
    admin_tokens.add(token)
    return {"token": token}

# Settings
@admin_router.get("/settings")
async def admin_get_settings(token: str = Depends(verify_admin)):
    row = await db_one(site_settings_t, site_settings_t.c.id == "main")
    if not row:
        d = SiteSettings().model_dump()
        await db_insert(site_settings_t, {"id": "main", "data": json.dumps(d)})
        return d
    return json.loads(row["data"])

@admin_router.put("/settings")
async def admin_update_settings(request: Request, token: str = Depends(verify_admin)):
    data = await request.json()
    data["id"] = "main"
    existing = await db_one(site_settings_t, site_settings_t.c.id == "main")
    if existing:
        await db_update(site_settings_t, {"data": json.dumps(data)}, site_settings_t.c.id == "main")
    else:
        await db_insert(site_settings_t, {"id": "main", "data": json.dumps(data)})
    return {"status": "ok"}

# Blog CRUD
@admin_router.get("/blog")
async def admin_get_blog(token: str = Depends(verify_admin)):
    rows = await db_all(blog_posts_t, order_by=blog_posts_t.c.created_at.desc())
    return [_parse_dt(r) for r in rows]

@admin_router.post("/blog")
async def admin_create_blog(post: BlogPostCreate, token: str = Depends(verify_admin)):
    doc = post.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db_insert(blog_posts_t, doc)
    return {"status": "ok", "id": doc["id"]}

@admin_router.put("/blog/{post_id}")
async def admin_update_blog(post_id: str, post: BlogPostCreate, token: str = Depends(verify_admin)):
    count = await db_update(blog_posts_t, post.model_dump(), blog_posts_t.c.id == post_id)
    if count == 0:
        raise HTTPException(status_code=404, detail="Post non trovato")
    return {"status": "ok"}

@admin_router.delete("/blog/{post_id}")
async def admin_delete_blog(post_id: str, token: str = Depends(verify_admin)):
    count = await db_delete(blog_posts_t, blog_posts_t.c.id == post_id)
    if count == 0:
        raise HTTPException(status_code=404, detail="Post non trovato")
    return {"status": "ok"}

# Gallery CRUD
@admin_router.get("/gallery")
async def admin_get_gallery(token: str = Depends(verify_admin)):
    return await db_all(gallery_t, order_by=gallery_t.c.order)

@admin_router.post("/gallery")
async def admin_create_gallery(item: GalleryItemCreate, token: str = Depends(verify_admin)):
    doc = item.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db_insert(gallery_t, doc)
    return {"status": "ok", "id": doc["id"]}

@admin_router.put("/gallery/{item_id}")
async def admin_update_gallery(item_id: str, item: GalleryItemCreate, token: str = Depends(verify_admin)):
    count = await db_update(gallery_t, item.model_dump(), gallery_t.c.id == item_id)
    if count == 0:
        raise HTTPException(status_code=404, detail="Elemento non trovato")
    return {"status": "ok"}

@admin_router.delete("/gallery/{item_id}")
async def admin_delete_gallery(item_id: str, token: str = Depends(verify_admin)):
    count = await db_delete(gallery_t, gallery_t.c.id == item_id)
    if count == 0:
        raise HTTPException(status_code=404, detail="Elemento non trovato")
    return {"status": "ok"}

# Projects CRUD
@admin_router.get("/projects")
async def admin_get_projects(token: str = Depends(verify_admin)):
    return await db_all(projects_t, order_by=projects_t.c.order)

@admin_router.post("/projects")
async def admin_create_project(project: ProjectCreate, token: str = Depends(verify_admin)):
    doc = project.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db_insert(projects_t, doc)
    return {"status": "ok", "id": doc["id"]}

@admin_router.put("/projects/{project_id}")
async def admin_update_project(project_id: str, project: ProjectCreate, token: str = Depends(verify_admin)):
    count = await db_update(projects_t, project.model_dump(), projects_t.c.id == project_id)
    if count == 0:
        raise HTTPException(status_code=404, detail="Progetto non trovato")
    return {"status": "ok"}

@admin_router.delete("/projects/{project_id}")
async def admin_delete_project(project_id: str, token: str = Depends(verify_admin)):
    count = await db_delete(projects_t, projects_t.c.id == project_id)
    if count == 0:
        raise HTTPException(status_code=404, detail="Progetto non trovato")
    return {"status": "ok"}

# Messages (admin read-only)
@admin_router.get("/messages")
async def admin_get_messages(token: str = Depends(verify_admin)):
    rows = await db_all(contact_messages_t, order_by=contact_messages_t.c.created_at.desc())
    return [_parse_dt(r) for r in rows]

# Reels CRUD
@admin_router.get("/reels")
async def admin_get_reels(token: str = Depends(verify_admin)):
    rows = await db_all(instagram_reels_t, order_by=instagram_reels_t.c.order)
    return [_parse_dt(r) for r in rows]

@admin_router.post("/reels")
async def admin_create_reel(reel: InstagramReelCreate, token: str = Depends(verify_admin)):
    doc = reel.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db_insert(instagram_reels_t, doc)
    return {"status": "ok", "id": doc["id"]}

@admin_router.put("/reels/{reel_id}")
async def admin_update_reel(reel_id: str, reel: InstagramReelCreate, token: str = Depends(verify_admin)):
    count = await db_update(instagram_reels_t, reel.model_dump(), instagram_reels_t.c.id == reel_id)
    if count == 0:
        raise HTTPException(status_code=404, detail="Reel non trovato")
    return {"status": "ok"}

@admin_router.delete("/reels/{reel_id}")
async def admin_delete_reel(reel_id: str, token: str = Depends(verify_admin)):
    count = await db_delete(instagram_reels_t, instagram_reels_t.c.id == reel_id)
    if count == 0:
        raise HTTPException(status_code=404, detail="Reel non trovato")
    return {"status": "ok"}

# ============ APP ASSEMBLY ============

app.include_router(api_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Create all tables (idempotent – safe to run on every start)
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)
    # Initialize site settings if absent
    existing = await db_one(site_settings_t, site_settings_t.c.id == "main")
    if not existing:
        default = SiteSettings()
        await db_insert(site_settings_t, {"id": "main", "data": json.dumps(default.model_dump())})
        logger.info("[STARTUP] Impostazioni del sito inizializzate con i valori di default.")
    else:
        logger.info("[STARTUP] Impostazioni del sito gia' presenti nel database.")

@app.on_event("shutdown")
async def shutdown_db_client():
    await engine.dispose()
