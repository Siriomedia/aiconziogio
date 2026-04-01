from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import aiohttp
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup (MOCKED for now - set real API key to enable)
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', 'MOCK_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
CONTACT_RECIPIENT_EMAIL = os.environ.get('CONTACT_RECIPIENT_EMAIL', 'aiconziogio@gmail.com')

IS_EMAIL_MOCKED = RESEND_API_KEY == 'MOCK_KEY'

# Instagram setup
INSTAGRAM_ACCESS_TOKEN = os.environ.get('INSTAGRAM_ACCESS_TOKEN', '')
INSTAGRAM_USERNAME = os.environ.get('INSTAGRAM_USERNAME', 'aiconziogio')

if not IS_EMAIL_MOCKED:
    import resend
    resend.api_key = RESEND_API_KEY

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
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

# ============ ROUTES ============

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
    doc = contact.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.contact_messages.insert_one(doc)
    
    # Send email notification
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

@api_router.get("/contact", response_model=List[ContactMessage])
async def get_contacts():
    contacts = await db.contact_messages.find({}, {"_id": 0}).to_list(100)
    for c in contacts:
        if isinstance(c['created_at'], str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return contacts

# Blog Posts
@api_router.get("/blog", response_model=List[BlogPost])
async def get_blog_posts():
    posts = await db.blog_posts.find({"published": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for p in posts:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return posts

@api_router.get("/blog/{slug}", response_model=BlogPost)
async def get_blog_post(slug: str):
    post = await db.blog_posts.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post non trovato")
    if isinstance(post.get('created_at'), str):
        post['created_at'] = datetime.fromisoformat(post['created_at'])
    return post

# Projects
@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return projects

@api_router.get("/projects/{slug}", response_model=Project)
async def get_project(slug: str):
    project = await db.projects.find_one({"slug": slug}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Progetto non trovato")
    return project

# Gallery
@api_router.get("/gallery", response_model=List[GalleryItem])
async def get_gallery(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    items = await db.gallery.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return items

# Seed Data endpoint
@api_router.post("/seed")
async def seed_data():
    # Clear existing data
    await db.blog_posts.delete_many({})
    await db.projects.delete_many({})
    await db.gallery.delete_many({})
    
    # Seed Blog Posts (AI Prompts)
    blog_posts = [
        {
            "id": str(uuid.uuid4()),
            "title": "Il Viaggio di Phileas Fogg in 80 Giorni",
            "slug": "phileas-fogg-viaggio",
            "excerpt": "Un prompt per creare un'immagine iper-dettagliata ispirata al celebre romanzo di Jules Verne.",
            "content": """Questo prompt genera un'immagine cinematografica che cattura lo spirito avventuroso del viaggio di Phileas Fogg.
            
L'obiettivo e' creare un'atmosfera vintage con toni seppia e dorati, richiamando le illustrazioni dei libri d'avventura dell'800.""",
            "prompt_text": "Create a hyper-detailed cinematic image of a Victorian gentleman traveler standing on a steam train platform, warm sepia tones, golden hour lighting, vintage luggage, world map in background, Jules Verne aesthetic, film grain texture, 8K resolution",
            "image_url": "https://images.pexels.com/photos/30575919/pexels-photo-30575919.jpeg?auto=compress&cs=tinysrgb&w=800",
            "category": "prompt",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published": True
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Uncle Gio - Il Narratore Digitale",
            "slug": "uncle-gio-narratore",
            "excerpt": "Come creare un personaggio AI che rappresenta lo storyteller moderno.",
            "content": """Questo prompt e' stato creato per definire il mio alter ego digitale: Uncle Gio.
            
L'immagine deve trasmettere saggezza, curiosita' e il fascino del viaggio. I colori caldi evocano nostalgia e autenticita'.""",
            "prompt_text": "Cinematic portrait of an older Italian man, warm copper lighting, storyteller expression, wearing casual travel clothes, background showing blurred city streets of Naples, film photography style, shallow depth of field",
            "image_url": "https://images.unsplash.com/photo-1578069244640-976a4135fada?w=800",
            "category": "prompt",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published": True
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Napoli Segreta - Vicoli e Storie",
            "slug": "napoli-segreta",
            "excerpt": "Un prompt per esplorare i vicoli nascosti di Napoli attraverso l'AI.",
            "content": """Napoli e' una citta' di contrasti e bellezza nascosta. Questo prompt cattura l'essenza dei suoi vicoli antichi.
            
Uso colori caldi e luci naturali per creare atmosfere autentiche che ricordano il cinema neorealista italiano.""",
            "prompt_text": "Narrow alley in Naples Italy, morning light streaming through hanging laundry, warm terracotta walls, elderly locals chatting, vintage Vespa parked, cinematic composition, warm color grading, nostalgic atmosphere",
            "image_url": "https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800",
            "category": "prompt",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published": True
        }
    ]
    
    # Seed Projects
    projects = [
        {
            "id": str(uuid.uuid4()),
            "title": "Napoli - Storie di Quartiere",
            "slug": "napoli-storie",
            "description": "Un viaggio attraverso i vicoli di Napoli, incontrando personaggi autentici che raccontano le loro storie. Ogni episodio e' un incontro con l'anima della citta'.",
            "image_url": "https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800",
            "video_url": "https://www.instagram.com/aiconziogio/",
            "category": "serie",
            "order": 1
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Il Giro del Mondo in...",
            "slug": "giro-del-mondo",
            "description": "Il mio progetto principale: esplorare il mondo attraverso le persone, i luoghi e l'intelligenza artificiale. Ogni tappa e' una nuova avventura.",
            "image_url": "https://images.pexels.com/photos/35042068/pexels-photo-35042068.jpeg?w=800",
            "video_url": None,
            "category": "serie",
            "order": 2
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Collaborazione Sora",
            "slug": "sora-collaboration",
            "description": "Esperimenti creativi con Sora AI per creare contenuti video innovativi che fondono realta' e immaginazione.",
            "image_url": "https://images.unsplash.com/photo-1770170389700-eb0f9b910ed8?w=800",
            "video_url": None,
            "category": "collaborazione",
            "order": 3
        }
    ]
    
    # Seed Gallery
    gallery_items = [
        {
            "id": str(uuid.uuid4()),
            "title": "Tramonto sul Vesuvio",
            "image_url": "https://images.unsplash.com/photo-1680096485726-18b85f93ec5e?w=800",
            "category": "photo",
            "description": "I colori del tramonto napoletano",
            "order": 1
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Vicoli di Napoli",
            "image_url": "https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800",
            "category": "photo",
            "description": "La vita quotidiana nei quartieri storici",
            "order": 2
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Istanbul al Tramonto",
            "image_url": "https://images.pexels.com/photos/35042068/pexels-photo-35042068.jpeg?w=800",
            "category": "photo",
            "description": "I traghetti sul Bosforo",
            "order": 3
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Viaggio nel Tempo",
            "image_url": "https://images.pexels.com/photos/30575919/pexels-photo-30575919.jpeg?w=800",
            "category": "ai_art",
            "description": "Arte AI ispirata ai viaggi vittoriani",
            "prompt_text": "Victorian era time travel, sepia tones, ornate clock mechanism",
            "order": 1
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Sogni di Rame",
            "image_url": "https://images.unsplash.com/photo-1770170389700-eb0f9b910ed8?w=800",
            "category": "ai_art",
            "description": "Astratto in toni caldi",
            "prompt_text": "Abstract copper dreams, flowing metallic textures, warm glow",
            "order": 2
        }
    ]
    
    await db.blog_posts.insert_many(blog_posts)
    await db.projects.insert_many(projects)
    await db.gallery.insert_many(gallery_items)
    
    return {"status": "success", "message": "Dati di esempio caricati"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
