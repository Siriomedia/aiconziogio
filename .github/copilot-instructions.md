# Ai con Zio Gio – Copilot Instructions

## Project Overview
Italian content-creator portfolio site with a **retro-futuristic** (steampunk × cyberpunk) design. The core concept is *"What if AI existed in the past?"* – mixing vintage nostalgia with futuristic AI elements. Content and UI error strings are in **Italian**.

**Stack:** React 19 (CRA + CRACO) · FastAPI · Motor (async MongoDB) · Tailwind CSS · Framer Motion · Lenis · Radix UI (shadcn/ui)  
**Deploy:** Railway via `backend/Dockerfile` + `frontend/Dockerfile`

---

## Architecture

```
backend/server.py      ← single-file FastAPI app; all models, routes, admin CRUD
frontend/src/App.js    ← single-file React SPA; all pages/components as named functions
frontend/src/components/AdminPanel.js  ← full CMS for admin
memory/PRD.md          ← design decisions and feature backlog
design_guidelines.json ← authoritative color/typography/effect spec
```

**Data flow:** Frontend reads `REACT_APP_BACKEND_URL` → hits `/api/*` public routes. Admin UI authenticates via `POST /api/admin/login`, receives a token stored in `localStorage("admin_token")`, then calls `/api/admin/*` with header `X-Admin-Token`.

**Site settings** are fetched once from `GET /api/settings` and distributed app-wide via `SiteSettingsContext` (see `App.js`). Defaults are defined in `DEFAULT_SETTINGS` (frontend) and `SiteSettings` Pydantic model (backend).

---

## Developer Workflows

**Backend** (requires `.env` with `MONGO_URL`, `DB_NAME`, `ADMIN_PASSWORD`):
```bash
cd backend && uvicorn server:app --reload --port 8001
```

**Frontend** (requires `.env` with `REACT_APP_BACKEND_URL=http://localhost:8001`):
```bash
cd frontend && yarn start   # uses craco, not react-scripts directly
```

**Seed database** (idempotent; skips if data exists):
```
POST /api/seed               # seeds if empty
POST /api/seed?force=true    # overwrites existing data
```

**Run backend tests:**
```bash
python backend_test.py       # custom HTTP test runner, NOT pytest
```

**Optional env vars:** `RESEND_API_KEY` (email, mocked when absent), `INSTAGRAM_ACCESS_TOKEN`, `CORS_ORIGINS` (defaults to `*`), `SENDER_EMAIL`, `CONTACT_RECIPIENT_EMAIL`.

---

## Backend Conventions

- **All IDs are UUID strings** – never MongoDB ObjectIds. Every model uses `id: str = Field(default_factory=lambda: str(uuid.uuid4()))`.
- **Always exclude `_id`** from MongoDB queries: `find({}, {"_id": 0})`.
- **`datetime` roundtrip:** stored as `.isoformat()` string in MongoDB; converted back on read with `datetime.fromisoformat()`.
- **Two routers:** `api_router` (prefix `/api`, public) and `admin_router` (prefix `/api/admin`, requires `verify_admin` dependency).
- **Admin auth is in-memory:** `admin_tokens: set` is reset on server restart; tokens issued by `POST /api/admin/login`.
- **Email is mocked by default** (`IS_EMAIL_MOCKED = RESEND_API_KEY == 'MOCK_KEY'`); code path still saves to MongoDB.
- **`SiteSettings`** uses `ConfigDict(extra="allow")` and is a singleton document with `id: "main"`; auto-created on startup if absent.

---

## Frontend Conventions

- **Path alias:** `@/` → `src/` (configured in `jsconfig.json` + `craco.config.js`). Always use `@/` for imports, never relative paths from deep files.
- **API calls:** Always use `const API = \`${BACKEND_URL}/api\`` pattern; admin calls use the dedicated `adminApi` axios instance in `AdminPanel.js` (auto-injects `X-Admin-Token`).
- **shadcn/ui components** live in `src/components/ui/`; use them for new form controls and dialogs rather than custom HTML.
- **Smooth scroll** is initialized with Lenis in the root layout (`useSmoothScroll` hook); don't use `window.scrollTo` directly.
- **Animations:** Use `glitchIn` / `staggerContainer` Framer Motion variants defined in `App.js` for new section entrances.

---

## Design System

Canonical spec: [`design_guidelines.json`](../design_guidelines.json)

| Token | Value |
|---|---|
| Background base | `bg-stone-950` (`#0c0a09`) |
| Surface | `bg-stone-900` / `bg-stone-800` |
| Neon accent (primary) | `text-cyan-400` / `border-cyan-500` |
| Neon accent (secondary) | `text-amber-400` / `border-amber-500` |
| Fonts | `font-['Special_Elite']` headings · `font-mono` / `font-terminal` terminal/body |

**Effects to preserve on new components:**
- Images: `filter: sepia(80%)` at rest, clears on hover
- Cards: `terminal-card` CSS class (dark bg + subtle border + inner border)
- Hover: glitch text-shadow displacement (red/cyan shift)
- Backgrounds: film-grain SVG overlay + CRT scanlines via `repeating-linear-gradient`

---

## Data Collections & Key Fields

| Collection | Sort | Filter |
|---|---|---|
| `blog_posts` | `created_at` desc | `published: true` (public) |
| `projects` | `order` asc | none |
| `gallery` | `order` asc | optional `category` (`"photo"` \| `"ai_art"`) |
| `instagram_reels` | `order` asc | `published: true` |
| `site_settings` | — | `id: "main"` (singleton) |
| `contact_messages` | `created_at` desc | none (admin only) |
