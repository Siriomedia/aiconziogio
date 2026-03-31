# Ai con Zio Gio - PRD

## Original Problem Statement
Create a website for "Ai con Zio Gio" (Uncle Gio with AI) - a digital creator.

**REDESIGN REQUEST**: User wanted RETRO-FUTURISTIC aesthetic, NOT classic. Concept: "What if AI existed in the past?" - mixing vintage nostalgia (sepia photos, typewriter fonts, old computers) with futuristic AI elements (neon accents, terminal UI, glitch effects, scanlines).

## User Personas
1. **Nostalgic Dreamers**: People fascinated by the "what if" of AI in the past
2. **AI Enthusiasts**: Creators interested in AI prompts and retro aesthetics
3. **Collaborators**: Brands wanting unique retro-futuristic content

## Core Requirements
- [x] Retro-futuristic design theme (steampunk meets cyberpunk)
- [x] Hero with vintage computer + "E se l'AI fosse esistita nel passato?"
- [x] Terminal-style navigation [Home] [Chi_Sono] etc
- [x] About section with vintage frame + AI detection overlay
- [x] Projects with sepia filters + neon borders on hover
- [x] Gallery with VINTAGE/AI_ART filters, bento grid
- [x] Blog with terminal-style prompt code blocks
- [x] Contact form as terminal (message_terminal.exe)
- [x] Social links (Instagram, TikTok, Facebook)

## What's Been Implemented (January 2026)
- **Design System**: Dark stone-950 bg, cyan-500/amber-500 neon accents
- **Typography**: Special Elite (typewriter), Space Mono (terminal), IBM Plex Mono
- **Effects**: Film grain overlay, CRT scanlines, sepia vintage filters, glitch hover
- **Components**: Terminal cards, neon borders, AI detection overlays, vintage frames
- **Full API**: Projects, Gallery, Blog, Contact form (email MOCKED)
- **Animations**: Framer Motion glitch entrances, Lenis smooth scroll

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Lenis
- **Backend**: FastAPI, Motor (MongoDB async)
- **Database**: MongoDB
- **Email**: Resend (MOCKED - set real API key to enable)

## Prioritized Backlog
### P0 (Done)
- [x] Retro-futuristic homepage
- [x] Gallery with sepia/neon effects
- [x] Blog with prompt blocks
- [x] Contact terminal form

### P1 (Future)
- [ ] Real Resend email integration
- [ ] More AI detection animations on hover
- [ ] Typewriter text effect on hero
- [ ] Glitch transition between pages

### P2 (Nice to Have)
- [ ] "Time machine" loading animation
- [ ] Audio effects (typewriter sounds)
- [ ] More vintage photo collection
- [ ] Newsletter with retro styling

## Next Tasks
1. Add real Resend API key for email notifications
2. Create more authentic vintage content
3. Consider adding typewriter animation effect
4. Potential: audio ambient (old computer sounds)
