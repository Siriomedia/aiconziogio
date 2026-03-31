# Ai con Zio Gio - PRD

## Original Problem Statement
Create a website for "Ai con Zio Gio" (Uncle Gio with AI) - a digital creator who tells stories through travel, people, and AI. The site needs:
- Hero section with cinematic travel imagery
- About section with biography (ex supermarket director turned digital creator)
- Projects/Series section
- Gallery with Photos and AI Art sections
- Blog section for AI prompts sharing
- Contact form with email notification
- Social links to Instagram, TikTok, Facebook
- Cinematic, warm, sepia/copper aesthetic

## User Personas
1. **Followers/Fans**: People who follow Uncle Gio on social media and want to explore his content in depth
2. **Collaborators**: Brands, agencies, other creators looking for partnership opportunities
3. **AI Enthusiasts**: People interested in learning AI prompt techniques

## Core Requirements (Static)
- [x] Responsive design with dark cinematic theme
- [x] Hero section with mission statement
- [x] About/Chi Sono section with biography
- [x] Projects/Series gallery
- [x] Photo + AI Art gallery with filters
- [x] Blog for AI prompts with code blocks
- [x] Contact form with email notification (MOCKED)
- [x] Social media links (Instagram, TikTok, Facebook)
- [x] Smooth scroll animations

## What's Been Implemented
**January 2026**
- Full-stack website with React frontend + FastAPI backend
- Cinematic dark theme with Playfair Display & Outfit fonts
- Hero section with Istanbul Bosphorus background
- About section with profile image and stats
- Projects section with 3 seeded projects (Napoli, Giro del Mondo, Sora)
- Gallery page with photo/AI art filter tabs
- Blog page with AI prompt articles and code blocks
- Contact form saving to MongoDB (email MOCKED - Resend)
- Responsive navigation with mobile menu
- Film grain texture overlay
- Glassmorphism effects
- Framer Motion animations
- Lenis smooth scrolling

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Framer Motion, Lenis
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Email**: Resend (MOCKED)

## Prioritized Backlog
### P0 (Must Have - Done)
- [x] Homepage with all sections
- [x] Gallery page
- [x] Blog/Prompts page
- [x] Contact form

### P1 (Should Have - Future)
- [ ] Real Resend email integration (requires API key)
- [ ] Blog post detail page improvements
- [ ] Admin panel for content management
- [ ] Image optimization/lazy loading

### P2 (Nice to Have)
- [ ] Newsletter subscription
- [ ] Comments on blog posts
- [ ] Share buttons for social media
- [ ] Multi-language support (IT/EN)

## Next Tasks
1. Add real Resend API key to enable email notifications
2. Create more seed content for gallery and blog
3. Consider adding newsletter signup
4. SEO optimization with meta tags
