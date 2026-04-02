import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import AdminPanel from "@/components/AdminPanel";
import { BrowserRouter, Routes, Route, Link, useLocation, Outlet } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from 'lenis';
import { Instagram, Facebook, Mail, Menu, X, Terminal, Cpu, ScanLine, Zap, Clock, ArrowRight, MessageCircle, Play, Lock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Site Settings Context ───────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  hero_title: "E se l'AI fosse esistita nel passato?",
  hero_subtitle: "Viaggio attraverso il tempo con l'intelligenza artificiale. Storie di ieri raccontate con la tecnologia di domani.",
  hero_image_url: "https://images.pexels.com/photos/35378672/pexels-photo-35378672.jpeg?auto=compress&cs=tinysrgb&w=1920",
  about_title: "Content Creator con vista Vesuvio",
  about_bio_1: "Mi chiamo Giovanni, ma tutti mi chiamano Zio Gio. Dal mio studio a Napoli, con il Vesuvio come sfondo, creo contenuti che mescolano tecnologia e storytelling.",
  about_bio_2: "Uso l'intelligenza artificiale per immaginare mondi dove passato e futuro si incontrano. I miei prompt creano visioni di come sarebbe stato il mondo se l'AI fosse esistita ieri.",
  about_bio_3: 'Il progetto "Il giro del mondo in..." nasce da questa passione: raccontare storie attraverso persone, luoghi e tecnologia.',
  stat_followers: "5K+",
  stat_stories: "50+",
  stat_prompts: "\u221e",
  social_instagram: "https://instagram.com/aiconziogio",
  social_tiktok: "https://tiktok.com/@aiconziogio",
  social_facebook: "https://facebook.com/profile.php?id=100084321234567",
  contact_email: "aiconziogio@gmail.com",
  contact_whatsapp: "+39 329 162 4908",
  footer_text: "ZIO_GIO // AI_STORYTELLER",
};

const SiteSettingsContext = createContext(DEFAULT_SETTINGS);
const useSiteSettings = () => useContext(SiteSettingsContext);

// Zio Gio's real photo
const ZIO_GIO_PHOTO = "/zio-gio.png";

// TikTok Icon
const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Generate random hex
const randomHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

// Smooth Scroll
const useSmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
};

// Glitch animation variants
const glitchIn = {
  hidden: { opacity: 0, x: -20, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    x: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// Navigation
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const settings = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setIsOpen(false), [location]);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Chi_Sono", path: "/#about" },
    { name: "Progetti", path: "/#projects" },
    { name: "Galleria", path: "/gallery" },
    { name: "Prompt_AI", path: "/blog" },
    { name: "Contatti", path: "/#contact" }
  ];

  const handleNavClick = (path) => {
    if (path.startsWith("/#")) {
      const id = path.replace("/#", "");
      if (location.pathname !== "/") {
        window.location.href = path;
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  return (
    <>
      <nav 
        data-testid="main-navigation"
        className={`nav-retro py-4 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}
      >
        <div className="container-custom flex items-center justify-between">
          <Link to="/" data-testid="logo-link" className="flex items-center gap-3">
            <Terminal size={20} className="text-cyan-500" />
            <span className="font-terminal text-lg tracking-tight">
              <span className="text-cyan-500">{'>'}</span> ZIO_GIO
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              item.path.startsWith("/#") ? (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.path)}
                  className="font-terminal text-xs tracking-wider text-stone-400 hover:text-amber-400 transition-colors"
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  [{item.name}]
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className="font-terminal text-xs tracking-wider text-stone-400 hover:text-amber-400 transition-colors"
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  [{item.name}]
                </Link>
              )
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="social-retro" data-testid="social-instagram">
              <Instagram size={16} />
            </a>
            <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" className="social-retro" data-testid="social-tiktok">
              <TikTokIcon size={16} />
            </a>
            <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="social-retro" data-testid="social-facebook">
              <Facebook size={16} />
            </a>
          </div>

          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)} data-testid="mobile-menu-toggle">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${isOpen ? 'open' : ''}`} data-testid="mobile-menu">
        <button className="absolute top-6 right-6" onClick={() => setIsOpen(false)} data-testid="mobile-menu-close">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navItems.map((item) => (
            item.path.startsWith("/#") ? (
              <button key={item.name} onClick={() => handleNavClick(item.path)} className="font-terminal text-xl tracking-wide text-stone-300 hover:text-cyan-400">
                [{item.name}]
              </button>
            ) : (
              <Link key={item.name} to={item.path} className="font-terminal text-xl tracking-wide text-stone-300 hover:text-cyan-400" onClick={() => setIsOpen(false)}>
                [{item.name}]
              </Link>
            )
          ))}
        </div>
      </div>
    </>
  );
};

// Hero Section
const HeroSection = () => {
  const [time, setTime] = useState(new Date());
  const settings = useSiteSettings();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section data-testid="hero-section" className="hero-retro scanlines">
      <div className="absolute inset-0 z-0">
        <img
          src={settings.hero_image_url}
          alt="Vintage computer terminal"
          className="w-full h-full object-cover opacity-40"
          style={{ filter: 'sepia(70%) contrast(1.2)' }}
        />
      </div>

      <div className="container-custom relative z-10 py-32">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl">
          
          <motion.div variants={glitchIn} className="flex items-center gap-4 mb-8">
            <div className="badge-retro">
              <Cpu size={12} />
              <span>AI_STORYTELLER v2.0</span>
            </div>
            <span className="font-terminal text-xs text-stone-500">
              {time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </motion.div>

          <motion.div variants={glitchIn} className="mb-6">
            <p className="font-terminal text-xs text-cyan-500 mb-2">{'>'} INITIALIZING MEMORY_BANK...</p>
            <p className="font-terminal text-xs text-amber-500">{'>'} LOADING TEMPORAL_STORIES...</p>
          </motion.div>

          <motion.h1 
            variants={glitchIn}
            className="text-4xl md:text-6xl lg:text-7xl font-typewriter leading-tight mb-8 glitch-text-hover"
            data-testid="hero-title"
          >
            {settings.hero_title}
          </motion.h1>

          <motion.p variants={glitchIn} className="text-lg md:text-xl text-stone-400 font-mono mb-10 max-w-2xl leading-relaxed">
            {settings.hero_subtitle}
            <span className="cursor-blink"></span>
          </motion.p>

          <motion.div variants={glitchIn} className="flex flex-wrap gap-4">
            <a href="#projects" className="btn-cyber" data-testid="hero-cta-projects">
              <span className="flex items-center gap-2">
                <ScanLine size={14} />
                SCAN_PROGETTI
              </span>
            </a>
            <a href="#about" className="btn-vintage" data-testid="hero-cta-about">
              <span className="flex items-center gap-2">
                <Clock size={14} />
                CHI_SONO
              </span>
            </a>
          </motion.div>

          <motion.div variants={glitchIn} className="mt-16 flex items-center gap-8 text-stone-600 font-terminal text-xs">
            <span>SYS_STATUS: ONLINE</span>
            <span>MEM: 1955-2026</span>
            <span>LOC: NAPOLI_IT</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  const settings = useSiteSettings();
  return (
    <section id="about" data-testid="about-section" className="section bg-stone-950">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          <motion.div 
            className="lg:col-span-5"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="vintage-frame">
              <div className="relative overflow-hidden aspect-square crt-effect">
                <img
                  src={ZIO_GIO_PHOTO}
                  alt="Zio Gio nel suo studio di content creation"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end ai-overlay">
                  <div className="bg-stone-950/80 px-3 py-2 border border-cyan-500/50">
                    <p className="hex-code">ID: ZG_001</p>
                    <p className="font-terminal text-xs text-cyan-400">SUBJECT: ZIO_GIO</p>
                  </div>
                  <div className="bg-stone-950/80 px-3 py-2 border border-amber-500/50">
                    <p className="font-terminal text-xs text-amber-400">NAPOLI_IT</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="hex-decoration mt-4 text-center">
              0x4E41504F4C49 // STUDIO_2026
            </p>
          </motion.div>

          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="label-terminal mb-4">{'>'} ACCESS_FILE: BIO.TXT</p>
            
            <h2 className="text-3xl md:text-4xl font-typewriter mb-8" data-testid="about-title">
              {settings.about_title}
            </h2>

            <div className="terminal-card p-8 mb-8">
              <div className="space-y-6 text-stone-400 font-mono text-sm leading-relaxed">
                <p><span className="text-cyan-500">{'>'}</span> {settings.about_bio_1}</p>
                <p><span className="text-cyan-500">{'>'}</span> {settings.about_bio_2}</p>
                <p><span className="text-cyan-500">{'>'}</span> {settings.about_bio_3}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="stat-retro">
                <div className="value">{settings.stat_followers}</div>
                <div className="label">Followers</div>
              </div>
              <div className="stat-retro">
                <div className="value text-amber-400">{settings.stat_stories}</div>
                <div className="label">Storie</div>
              </div>
              <div className="stat-retro">
                <div className="value text-cyan-400">{settings.stat_prompts}</div>
                <div className="label">Prompt AI</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Instagram Feed Section
const ProjectsSection = () => {
  const [instaData, setInstaData] = useState({ posts: [], is_configured: false, profile_url: 'https://instagram.com/aiconziogio', username: 'aiconziogio' });
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const [instaRes, reelsRes] = await Promise.allSettled([
          axios.get(`${API}/instagram`),
          axios.get(`${API}/reels`),
        ]);
        if (instaRes.status === 'fulfilled') setInstaData(instaRes.value.data);
        if (reelsRes.status === 'fulfilled') setReels(reelsRes.value.data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  // Placeholder cards per quando non è configurato il token
  const placeholderCards = Array.from({ length: 6 }, (_, i) => i);

  return (
    <section id="projects" data-testid="projects-section" className="section bg-stone-900">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="label-terminal mb-4">{'>'} LOADING INSTAGRAM_FEED...</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h2 className="text-3xl md:text-5xl font-typewriter" data-testid="projects-title">
              <span className="text-stone-200">Feed </span>
              <span className="text-cyan-400">Instagram</span>
            </h2>
            <a
              href={instaData.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-terminal text-sm text-stone-400 hover:text-cyan-400 transition-colors border border-stone-700 hover:border-cyan-500 px-4 py-2 self-start"
            >
              <Instagram size={14} />
              @{instaData.username}
            </a>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="loading-terminal" />
          </div>
        ) : instaData.is_configured && instaData.posts.length > 0 ? (
          // Post reali dall'API Instagram
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {instaData.posts.map((post, idx) => (
              <motion.a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                variants={glitchIn}
                className="group relative aspect-square overflow-hidden block"
                data-testid={`instagram-post-${idx}`}
              >
                <img
                  src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                  alt={post.caption ? post.caption.substring(0, 60) : `Post ${idx + 1}`}
                  className="w-full h-full object-cover crt-effect transition-transform duration-500 group-hover:scale-105"
                />
                {/* Overlay dati */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
                  <span className="font-terminal text-[10px] text-cyan-400 bg-stone-950/80 px-1.5 py-0.5">
                    POST_{String(idx + 1).padStart(3, '0')}
                  </span>
                  <span className="font-terminal text-[10px] text-amber-400 bg-stone-950/80 px-1.5 py-0.5">
                    {randomHex()}
                  </span>
                </div>
                {/* Overlay caption su hover */}
                <div className="absolute inset-0 bg-stone-950/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="font-terminal text-[10px] text-cyan-400 mb-2">{'>'} CAPTION.TXT</p>
                  <p className="text-stone-300 text-xs font-mono leading-relaxed line-clamp-5">
                    {post.caption || '// no caption'}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-stone-500 font-terminal text-[10px]">
                    <Instagram size={10} />
                    <span>APRI SU INSTAGRAM</span>
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        ) : (
          // Fallback: token non configurato
          <div>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {placeholderCards.map((i) => (
                <motion.a
                  key={i}
                  href={instaData.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={glitchIn}
                  className="group relative aspect-square overflow-hidden block bg-stone-800 border border-stone-700 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-30 group-hover:opacity-60 transition-opacity">
                    <Instagram size={32} className="text-stone-400" />
                  </div>
                  {/* Scanlines decorative */}
                  <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)'
                  }} />
                  <div className="absolute top-2 left-2 right-2 flex justify-between">
                    <span className="font-terminal text-[10px] text-stone-600">POST_{String(i + 1).padStart(3, '0')}</span>
                    <span className="font-terminal text-[10px] text-stone-600">{randomHex()}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-stone-950/90 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="font-terminal text-[10px] text-cyan-400">{'>'} VAI SU INSTAGRAM</p>
                  </div>
                </motion.a>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <a
                href={instaData.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cyber inline-flex items-center gap-3"
              >
                <Instagram size={16} />
                Seguimi su Instagram
                <ArrowRight size={14} />
              </a>
            </motion.div>
          </div>
        )}

        {/* CTA in fondo quando i post sono caricati */}
        {instaData.is_configured && instaData.posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <a
              href={instaData.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cyber inline-flex items-center gap-3"
            >
              <Instagram size={16} />
              Vedi tutti i post
              <ArrowRight size={14} />
            </a>
          </motion.div>
        )}

        {/* ─── Reels salvati ─── */}
        {reels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="mb-8">
              <p className="label-terminal mb-4">{'>'} REEL_ARCHIVE...</p>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <h3 className="text-2xl md:text-4xl font-typewriter">
                  <span className="text-stone-200">Reel </span>
                  <span className="text-amber-400">Selezionati</span>
                </h3>
                <a
                  href={instaData.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-terminal text-sm text-stone-400 hover:text-amber-400 transition-colors border border-stone-700 hover:border-amber-500 px-4 py-2 self-start"
                >
                  <Play size={12} />
                  Tutti i reel
                </a>
              </div>
            </div>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {reels.map((reel, idx) => (
                <motion.a
                  key={reel.id}
                  href={reel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={glitchIn}
                  className="group relative aspect-[9/16] overflow-hidden block bg-stone-800 border border-stone-700 hover:border-amber-500/60 transition-colors"
                  data-testid={`reel-${idx}`}
                >
                  {reel.thumbnail_url ? (
                    <img
                      src={reel.thumbnail_url}
                      alt={reel.title || `Reel ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-stone-700/80 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <Play size={20} className="text-stone-400 group-hover:text-amber-400 transition-colors" />
                      </div>
                    </div>
                  )}
                  {/* Scanlines */}
                  <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)'
                  }} />
                  {/* Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="font-terminal text-[9px] text-amber-400 bg-stone-950/80 px-1.5 py-0.5">
                      REEL_{String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-stone-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    {reel.title && (
                      <p className="font-typewriter text-stone-200 text-xs leading-tight mb-1 line-clamp-2">{reel.title}</p>
                    )}
                    {reel.description && (
                      <p className="font-mono text-[10px] text-stone-400 leading-relaxed line-clamp-3">{reel.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-amber-400 font-terminal text-[9px]">
                      <Play size={8} />
                      <span>APRI REEL</span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const settings = useSiteSettings();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ loading: false, success: false, error: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });
    try {
      await axios.post(`${API}/contact`, formData);
      setStatus({ loading: false, success: true, error: null });
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 5000);
    } catch {
      setStatus({ loading: false, success: false, error: 'ERRORE_TRASMISSIONE. Riprova.' });
    }
  };

  return (
    <section id="contact" data-testid="contact-section" className="section bg-stone-950">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="label-terminal mb-4">{'>'} OPEN_CHANNEL</p>
            <h2 className="text-3xl md:text-4xl font-typewriter mb-8" data-testid="contact-title">
              <span className="text-stone-200">Trasmetti un </span>
              <span className="text-cyan-400">messaggio</span>
            </h2>
            <p className="text-stone-400 font-mono text-sm mb-10 leading-relaxed">
              Vuoi collaborare? Hai una storia del passato da raccontare? 
              Invia un segnale attraverso il tempo.
            </p>

            <div className="space-y-4">
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-4 text-stone-500 hover:text-cyan-400 transition-colors font-mono text-sm">
                <Mail size={18} />
                {settings.contact_email}
              </a>
              <a href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-stone-500 hover:text-green-400 transition-colors font-mono text-sm">
                <MessageCircle size={18} />
                {settings.contact_whatsapp}
              </a>
              <div className="flex items-center gap-4 pt-4">
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="social-retro">
                  <Instagram size={16} />
                </a>
                <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" className="social-retro">
                  <TikTokIcon size={16} />
                </a>
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="social-retro">
                  <Facebook size={16} />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="terminal-card">
              <div className="terminal-header">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
                <span className="font-terminal text-xs text-stone-500 ml-4">message_terminal.exe</span>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-8" data-testid="contact-form">
                <div>
                  <label className="block text-xs text-stone-500 font-terminal mb-2">NOME_UTENTE</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-terminal"
                    placeholder="Inserisci nome..."
                    data-testid="contact-name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 font-terminal mb-2">EMAIL_ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-terminal"
                    placeholder="email@esempio.com"
                    data-testid="contact-email"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 font-terminal mb-2">MESSAGGIO_BODY</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="textarea-terminal"
                    placeholder="Scrivi il tuo messaggio..."
                    rows={4}
                    data-testid="contact-message"
                  />
                </div>
                <button type="submit" disabled={status.loading} className="btn-cyber w-full" data-testid="contact-submit">
                  {status.loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="loading-terminal w-4 h-4" />
                      TRASMISSIONE...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap size={14} />
                      INVIA_SEGNALE
                    </span>
                  )}
                </button>
                {status.success && (
                  <p className="text-green-400 font-terminal text-sm" data-testid="contact-success">
                    {'>'} MESSAGGIO_RICEVUTO. Risponderò presto.
                  </p>
                )}
                {status.error && (
                  <p className="text-red-400 font-terminal text-sm" data-testid="contact-error">{status.error}</p>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  const settings = useSiteSettings();
  return (
    <footer className="footer-retro py-12" data-testid="footer">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Terminal size={18} className="text-cyan-500" />
            <span className="font-terminal text-sm">{settings.footer_text}</span>
          </div>
          <p className="text-xs text-stone-600 font-mono">
            © 1955-2026 // TEMPORAL_RIGHTS_RESERVED
          </p>
          <div className="flex items-center gap-4">
            <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-cyan-400 transition-colors">
              <Instagram size={16} />
            </a>
            <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-cyan-400 transition-colors">
              <TikTokIcon size={16} />
            </a>
            <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-cyan-400 transition-colors">
              <Facebook size={16} />
            </a>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-stone-900 flex justify-end">
          <Link
            to="/admin"
            title="Pannello Admin"
            className="flex items-center gap-1.5 font-terminal text-[10px] text-stone-500 hover:text-cyan-400 transition-colors group border border-stone-700 hover:border-cyan-500/50 px-2 py-1"
          >
            <Lock size={10} />
            <span>ADMIN</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

// Public Layout (Navigation + content + Footer)
const PublicLayout = () => (
  <>
    <Navigation />
    <Outlet />
    <Footer />
  </>
);

// Home Page
const HomePage = () => {
  useSmoothScroll();
  useEffect(() => { axios.post(`${API}/seed`).catch(() => {}); }, []);
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ContactSection />
    </>
  );
};

// Gallery Page
const GalleryPage = () => {
  useSmoothScroll();
  const [gallery, setGallery] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await axios.get(`${API}/gallery`);
        setGallery(response.data);
      } catch {
        setGallery([
          { id: '1', title: 'Napoli 1955', image_url: 'https://images.unsplash.com/photo-1769690093979-252e3b9a8fac?w=800', category: 'photo', description: 'Ritratto d\'epoca' },
          { id: '2', title: 'Minatore', image_url: 'https://images.unsplash.com/photo-1759405185723-02e6c84c9772?w=800', category: 'photo', description: 'Lavoro nel passato' },
          { id: '3', title: 'Neon Dreams', image_url: 'https://images.pexels.com/photos/8108560/pexels-photo-8108560.jpeg?w=800', category: 'ai_art', description: 'Il futuro immaginato' },
          { id: '4', title: 'Macchine del Tempo', image_url: 'https://images.unsplash.com/photo-1768268959053-770212976791?w=800', category: 'ai_art', description: 'Steampunk AI' },
          { id: '5', title: 'Luci Cyber', image_url: 'https://images.pexels.com/photos/28122495/pexels-photo-28122495.jpeg?w=800', category: 'ai_art', description: 'Neon e nostalgia' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredGallery = filter === 'all' ? gallery : gallery.filter(item => item.category === filter);

  return (
    <section className="section pt-32 bg-stone-950" data-testid="gallery-page">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="label-terminal mb-4">{'>'} ACCESSING ARCHIVE...</p>
          <h1 className="text-3xl md:text-5xl font-typewriter mb-8" data-testid="gallery-title">
            <span className="text-stone-200">Archivio </span>
            <span className="text-cyan-400">Visivo</span>
          </h1>
          <div className="flex gap-4">
            {['all', 'photo', 'ai_art'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-terminal text-xs px-4 py-2 border transition-all ${
                  filter === f 
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' 
                    : 'border-stone-700 text-stone-500 hover:border-amber-500 hover:text-amber-400'
                }`}
                data-testid={`filter-${f}`}
              >
                [{f === 'all' ? 'TUTTI' : f === 'photo' ? 'VINTAGE' : 'AI_ART'}]
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="loading-terminal" /></div>
        ) : (
          <motion.div className="bento-retro" variants={staggerContainer} initial="hidden" animate="visible">
            <AnimatePresence>
              {filteredGallery.map((item) => (
                <motion.div
                  key={item.id}
                  variants={glitchIn}
                  layout
                  className="vintage-ai-photo relative overflow-hidden aspect-square neon-border"
                  data-testid={`gallery-item-${item.id}`}
                >
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover sepia-vintage" />
                  <div className="ai-overlay absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-stone-950/90 to-transparent">
                    <div className="flex justify-between">
                      <span className="hex-code">{randomHex()}</span>
                      <span className="hex-code">SCAN_OK</span>
                    </div>
                    <div>
                      <p className="label-terminal mb-1">{item.category === 'photo' ? 'VINTAGE' : 'AI_GEN'}</p>
                      <h3 className="font-typewriter text-lg text-stone-200">{item.title}</h3>
                      <p className="text-stone-500 text-xs font-mono">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

// Blog Page
const BlogPage = () => {
  useSmoothScroll();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API}/blog`);
        setPosts(response.data);
      } catch {
        setPosts([
          { id: '1', title: 'Il Viaggio di Phileas Fogg', slug: 'phileas-fogg', excerpt: 'Come ricreare l\'epopea vittoriana con l\'AI', prompt_text: 'Victorian gentleman, steam locomotive, sepia tones, 1880s...', image_url: 'https://images.unsplash.com/photo-1768268959053-770212976791?w=800', created_at: new Date().toISOString() },
          { id: '2', title: 'Ritratti del Nonno', slug: 'ritratti-nonno', excerpt: 'Restituire vita alle foto sbiadite', prompt_text: 'Restore vintage portrait, enhance details, warm sepia...', image_url: 'https://images.unsplash.com/photo-1769690093979-252e3b9a8fac?w=800', created_at: new Date().toISOString() },
          { id: '3', title: 'Napoli Cyberpunk', slug: 'napoli-cyberpunk', excerpt: 'E se Napoli del 1950 fosse stata cyberpunk?', prompt_text: 'Naples 1950, neon lights, cyberpunk aesthetic, vintage cars...', image_url: 'https://images.pexels.com/photos/28122495/pexels-photo-28122495.jpeg?w=800', created_at: new Date().toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <section className="section pt-32 bg-stone-950" data-testid="blog-page">
      <div className="container-custom">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <p className="label-terminal mb-4">{'>'} PROMPT_DATABASE</p>
          <h1 className="text-3xl md:text-5xl font-typewriter mb-6" data-testid="blog-title">
            <span className="text-stone-200">I miei </span>
            <span className="text-amber-400">Prompt</span>
            <span className="text-stone-200"> AI</span>
          </h1>
          <p className="text-stone-500 font-mono text-sm max-w-2xl">
            Condivido le istruzioni che uso per viaggiare nel tempo con l'intelligenza artificiale.
            Copia, sperimenta, crea.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="loading-terminal" /></div>
        ) : (
          <motion.div className="space-y-12" variants={staggerContainer} initial="hidden" animate="visible">
            {posts.map((post, idx) => (
              <motion.article
                key={post.id}
                variants={glitchIn}
                className="article-retro grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden"
                data-testid={`blog-post-${post.slug}`}
              >
                <div className="lg:col-span-1 aspect-video lg:aspect-auto overflow-hidden relative crt-effect">
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover sepia-vintage" />
                  <div className="absolute top-4 left-4 badge-retro">
                    PROMPT_{String(idx + 1).padStart(3, '0')}
                  </div>
                </div>
                <div className="lg:col-span-2 p-8">
                  <p className="timestamp mb-4">
                    {new Date(post.created_at).toLocaleDateString('it-IT')} // AI_PROMPT
                  </p>
                  <h2 className="font-typewriter text-2xl text-stone-200 mb-4">{post.title}</h2>
                  <p className="text-stone-500 font-mono text-sm mb-6">{post.excerpt}</p>
                  {post.prompt_text && (
                    <div className="prompt-block-retro mb-6">
                      <code>{post.prompt_text}</code>
                    </div>
                  )}
                  <Link to={`/blog/${post.slug}`} className="btn-vintage inline-flex items-center gap-2">
                    LEGGI_DI_PIU
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

// Blog Post Detail
const BlogPostPage = () => {
  useSmoothScroll();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const slug = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`${API}/blog/${slug}`);
        setPost(response.data);
      } catch {
        setPost({ title: 'Post non trovato', content: 'Il post che cerchi non esiste nel database temporale.', created_at: new Date().toISOString() });
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-950"><div className="loading-terminal" /></div>;

  return (
    <section className="section pt-32 bg-stone-950" data-testid="blog-post-page">
      <div className="container-custom max-w-4xl">
        <Link to="/blog" className="label-terminal flex items-center gap-2 mb-8 hover:text-amber-400 transition-colors">
          {'<'} TORNA_ARCHIVIO
        </Link>
        {post?.image_url && (
          <div className="vintage-frame mb-12">
            <div className="aspect-video overflow-hidden crt-effect">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <p className="timestamp mb-4">{new Date(post.created_at).toLocaleDateString('it-IT')} // TEMPORAL_LOG</p>
          <h1 className="text-3xl md:text-5xl font-typewriter mb-8 text-stone-200">{post.title}</h1>
          <div className="text-stone-400 font-mono text-sm leading-relaxed space-y-6 mb-12">
            {post.content?.split('\n').filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {post.prompt_text && (
            <div className="mb-12">
              <h3 className="font-typewriter text-xl text-amber-400 mb-4">{'>'} PROMPT_COMPLETO</h3>
              <div className="prompt-block-retro"><code>{post.prompt_text}</code></div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

// Main App
function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    axios.get(`${API}/settings`)
      .then((r) => setSettings({ ...DEFAULT_SETTINGS, ...r.data }))
      .catch(() => {});
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      <div className="App min-h-screen bg-stone-950">
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
            </Route>
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </BrowserRouter>
      </div>
    </SiteSettingsContext.Provider>
  );
}

export default App;
