import { useEffect, useState, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from 'lenis';
import { Instagram, Facebook, Mail, Menu, X, MapPin, ArrowRight, ExternalLink } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Social Links
const SOCIAL_LINKS = {
  instagram: "https://instagram.com/aiconziogio",
  facebook: "https://facebook.com/profile.php?id=100084321234567",
  tiktok: "https://tiktok.com/@aiconziogio"
};

// TikTok Icon Component
const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Smooth Scroll Provider
const useSmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

// Navigation Component
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Chi Sono", path: "/#about" },
    { name: "Progetti", path: "/#projects" },
    { name: "Galleria", path: "/gallery" },
    { name: "Prompt AI", path: "/blog" },
    { name: "Contatti", path: "/#contact" }
  ];

  const handleNavClick = (path) => {
    if (path.startsWith("/#")) {
      const id = path.replace("/#", "");
      if (location.pathname !== "/") {
        window.location.href = path;
      } else {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  return (
    <>
      <nav 
        data-testid="main-navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass py-4' : 'py-6 bg-transparent'
        }`}
      >
        <div className="container-custom flex items-center justify-between">
          <Link to="/" data-testid="logo-link" className="flex items-center gap-3">
            <span className="font-serif text-2xl font-bold tracking-tight">
              Uncle <span className="text-[#B26941]">Gio</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              item.path.startsWith("/#") ? (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.path)}
                  className="nav-link text-sm font-light tracking-wide text-[#A6988D] hover:text-[#FDFBF7] transition-colors"
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className="nav-link text-sm font-light tracking-wide text-[#A6988D] hover:text-[#FDFBF7] transition-colors"
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>

          {/* Social Icons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="social-icon" data-testid="social-instagram">
              <Instagram size={18} />
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="social-icon" data-testid="social-tiktok">
              <TikTokIcon size={18} />
            </a>
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="social-icon" data-testid="social-facebook">
              <Facebook size={18} />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-menu-toggle"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`} data-testid="mobile-menu">
        <button 
          className="absolute top-6 right-6"
          onClick={() => setIsOpen(false)}
          data-testid="mobile-menu-close"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-center gap-8">
          {navItems.map((item) => (
            item.path.startsWith("/#") ? (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.path)}
                className="text-2xl font-serif tracking-wide"
              >
                {item.name}
              </button>
            ) : (
              <Link
                key={item.name}
                to={item.path}
                className="text-2xl font-serif tracking-wide"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            )
          ))}
          <div className="flex items-center gap-6 mt-8">
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="social-icon">
              <Instagram size={20} />
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="social-icon">
              <TikTokIcon size={20} />
            </a>
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="social-icon">
              <Facebook size={20} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section data-testid="hero-section" className="relative min-h-screen flex items-end pb-24 md:pb-32">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/35042068/pexels-photo-35042068.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Tramonto cinematografico sul Bosforo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      {/* Content */}
      <div className="container-custom relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl"
        >
          <motion.p variants={fadeInUp} className="label-accent mb-6">
            Digital Creator & AI Storyteller
          </motion.p>
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-8"
            data-testid="hero-title"
          >
            Racconto il mondo attraverso{" "}
            <span className="text-[#B26941]">persone</span>,{" "}
            <span className="text-[#D9875A]">luoghi</span> e{" "}
            <span className="text-[#E6C9A8]">intelligenza artificiale</span>
          </motion.h1>
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-[#A6988D] font-light mb-10 max-w-2xl"
          >
            Benvenuti nel mio viaggio. Sono Uncle Gio e vi porto con me alla scoperta di storie autentiche, 
            dall'Italia al mondo intero.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
            <a href="#projects" className="btn-primary" data-testid="hero-cta-projects">
              Scopri i Progetti
            </a>
            <a href="#about" className="btn-outline" data-testid="hero-cta-about">
              Chi Sono
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  return (
    <section id="about" data-testid="about-section" className="section bg-[#0F0D0C]">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div 
            className="lg:col-span-5"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1578069244640-976a4135fada?w=800"
                alt="Uncle Gio - Digital Creator"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0F0D0C] to-transparent">
                <div className="flex items-center gap-2 text-[#B26941]">
                  <MapPin size={16} />
                  <span className="text-sm font-light">Napoli, Italia</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="label-accent mb-4">Chi Sono</p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-8" data-testid="about-title">
              Da direttore di supermercato a{" "}
              <span className="text-[#B26941]">narratore digitale</span>
            </h2>
            <div className="space-y-6 text-[#A6988D] font-light text-lg leading-relaxed">
              <p>
                Mi chiamo Gio, ma tutti mi chiamano Uncle Gio. Dopo anni passati a dirigere supermercati, 
                ho deciso di seguire la mia vera passione: raccontare storie.
              </p>
              <p>
                Oggi sono un digital creator che esplora il mondo attraverso le persone che incontra. 
                Il mio progetto <strong className="text-[#E6C9A8]">"Il giro del mondo in..."</strong> nasce 
                dall'idea che ogni luogo ha anime da scoprire e storie da raccontare.
              </p>
              <p>
                Uso l'intelligenza artificiale come strumento creativo per generare immagini evocative 
                e condivido i miei prompt per ispirare altri a sperimentare con l'AI Art.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              <div>
                <span className="block text-4xl font-serif font-bold text-[#B26941]">5K+</span>
                <span className="text-sm text-[#A6988D]">Follower</span>
              </div>
              <div>
                <span className="block text-4xl font-serif font-bold text-[#B26941]">50+</span>
                <span className="text-sm text-[#A6988D]">Storie Raccontate</span>
              </div>
              <div>
                <span className="block text-4xl font-serif font-bold text-[#B26941]">∞</span>
                <span className="text-sm text-[#A6988D]">Luoghi da Esplorare</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Projects Section
const ProjectsSection = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API}/projects`);
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Fallback data
        setProjects([
          {
            id: '1',
            title: 'Napoli - Storie di Quartiere',
            slug: 'napoli-storie',
            description: 'Un viaggio attraverso i vicoli di Napoli, incontrando personaggi autentici.',
            image_url: 'https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800',
            category: 'serie'
          },
          {
            id: '2',
            title: 'Il Giro del Mondo in...',
            slug: 'giro-del-mondo',
            description: 'Esplorare il mondo attraverso le persone, i luoghi e l\'intelligenza artificiale.',
            image_url: 'https://images.pexels.com/photos/35042068/pexels-photo-35042068.jpeg?w=800',
            category: 'serie'
          },
          {
            id: '3',
            title: 'Collaborazione Sora',
            slug: 'sora-collaboration',
            description: 'Esperimenti creativi con Sora AI per creare contenuti video innovativi.',
            image_url: 'https://images.unsplash.com/photo-1770170389700-eb0f9b910ed8?w=800',
            category: 'collaborazione'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <section id="projects" data-testid="projects-section" className="section bg-[#1A1614]">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="label-accent mb-4">Progetti & Serie</p>
          <h2 className="text-3xl md:text-5xl font-serif font-bold" data-testid="projects-title">
            Le mie <span className="text-[#B26941]">avventure</span>
          </h2>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="loading-spinner" />
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {projects.map((project) => (
              <motion.div
                key={project.id}
                variants={fadeInUp}
                className="project-card card-glow"
                data-testid={`project-card-${project.slug}`}
              >
                <img src={project.image_url} alt={project.title} />
                <div className="project-overlay">
                  <span className="label-accent mb-2 block">{project.category}</span>
                  <h3 className="text-xl font-serif font-bold mb-2">{project.title}</h3>
                  <p className="text-sm text-[#A6988D] font-light line-clamp-2">{project.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
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
    } catch (error) {
      setStatus({ loading: false, success: false, error: 'Errore nell\'invio. Riprova.' });
    }
  };

  return (
    <section id="contact" data-testid="contact-section" className="section bg-[#0F0D0C]">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="label-accent mb-4">Contatti</p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-8" data-testid="contact-title">
              Parliamo del tuo{" "}
              <span className="text-[#B26941]">prossimo progetto</span>
            </h2>
            <p className="text-[#A6988D] font-light text-lg mb-10">
              Hai un'idea, una collaborazione in mente, o semplicemente vuoi condividere una storia? 
              Mi farebbe piacere sentirti.
            </p>

            <div className="space-y-6">
              <a 
                href={`mailto:info@aiconziogio.com`}
                className="flex items-center gap-4 text-[#A6988D] hover:text-[#B26941] transition-colors"
              >
                <Mail size={20} />
                <span>info@aiconziogio.com</span>
              </a>
              <div className="flex items-center gap-4 pt-4">
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="social-icon">
                  <Instagram size={18} />
                </a>
                <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="social-icon">
                  <TikTokIcon size={18} />
                </a>
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="social-icon">
                  <Facebook size={18} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
            data-testid="contact-form"
          >
            <div>
              <label className="block text-sm text-[#A6988D] mb-2">Nome</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-underline"
                placeholder="Il tuo nome"
                data-testid="contact-name"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A6988D] mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-underline"
                placeholder="La tua email"
                data-testid="contact-email"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A6988D] mb-2">Messaggio</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="textarea-underline"
                placeholder="Scrivi il tuo messaggio..."
                rows={4}
                data-testid="contact-message"
              />
            </div>
            <button
              type="submit"
              disabled={status.loading}
              className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
              data-testid="contact-submit"
            >
              {status.loading ? (
                <div className="loading-spinner w-5 h-5" />
              ) : (
                <>
                  Invia Messaggio
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {status.success && (
              <p className="text-green-500" data-testid="contact-success">
                Messaggio inviato con successo! Ti risponderò presto.
              </p>
            )}
            {status.error && (
              <p className="text-red-500" data-testid="contact-error">{status.error}</p>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="py-12 border-t border-[#332A25]" data-testid="footer">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-bold">
              Uncle <span className="text-[#B26941]">Gio</span>
            </span>
          </div>
          <p className="text-sm text-[#A6988D] font-light">
            © 2024 Ai con Zio Gio. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-4">
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-[#A6988D] hover:text-[#B26941] transition-colors">
              <Instagram size={18} />
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="text-[#A6988D] hover:text-[#B26941] transition-colors">
              <TikTokIcon size={18} />
            </a>
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-[#A6988D] hover:text-[#B26941] transition-colors">
              <Facebook size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Home Page
const HomePage = () => {
  useSmoothScroll();

  useEffect(() => {
    // Seed data on first load
    axios.post(`${API}/seed`).catch(() => {});
  }, []);

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
      } catch (error) {
        // Fallback data
        setGallery([
          { id: '1', title: 'Tramonto sul Vesuvio', image_url: 'https://images.unsplash.com/photo-1680096485726-18b85f93ec5e?w=800', category: 'photo', description: 'I colori del tramonto napoletano' },
          { id: '2', title: 'Vicoli di Napoli', image_url: 'https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800', category: 'photo', description: 'La vita quotidiana nei quartieri storici' },
          { id: '3', title: 'Istanbul al Tramonto', image_url: 'https://images.pexels.com/photos/35042068/pexels-photo-35042068.jpeg?w=800', category: 'photo', description: 'I traghetti sul Bosforo' },
          { id: '4', title: 'Viaggio nel Tempo', image_url: 'https://images.pexels.com/photos/30575919/pexels-photo-30575919.jpeg?w=800', category: 'ai_art', description: 'Arte AI ispirata ai viaggi vittoriani' },
          { id: '5', title: 'Sogni di Rame', image_url: 'https://images.unsplash.com/photo-1770170389700-eb0f9b910ed8?w=800', category: 'ai_art', description: 'Astratto in toni caldi' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredGallery = filter === 'all' ? gallery : gallery.filter(item => item.category === filter);

  return (
    <section className="section pt-32" data-testid="gallery-page">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="label-accent mb-4">Galleria</p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-8" data-testid="gallery-title">
            Foto & <span className="text-[#B26941]">AI Art</span>
          </h1>

          {/* Filters */}
          <div className="flex justify-center gap-4 mb-12">
            {['all', 'photo', 'ai_art'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 text-sm font-light tracking-wide transition-all ${
                  filter === f 
                    ? 'text-[#B26941] border-b-2 border-[#B26941]' 
                    : 'text-[#A6988D] hover:text-[#FDFBF7]'
                }`}
                data-testid={`filter-${f}`}
              >
                {f === 'all' ? 'Tutti' : f === 'photo' ? 'Foto' : 'AI Art'}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="loading-spinner" />
          </div>
        ) : (
          <motion.div 
            className="gallery-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredGallery.map((item) => (
                <motion.div
                  key={item.id}
                  variants={fadeInUp}
                  layout
                  className="relative overflow-hidden aspect-square group"
                  data-testid={`gallery-item-${item.id}`}
                >
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover image-hover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0D0C] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div>
                      <span className="label-accent mb-1 block">{item.category === 'photo' ? 'Foto' : 'AI Art'}</span>
                      <h3 className="text-lg font-serif font-bold">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-[#A6988D] mt-1">{item.description}</p>
                      )}
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
      } catch (error) {
        // Fallback data
        setPosts([
          {
            id: '1',
            title: 'Il Viaggio di Phileas Fogg in 80 Giorni',
            slug: 'phileas-fogg-viaggio',
            excerpt: 'Un prompt per creare un\'immagine iper-dettagliata ispirata al celebre romanzo di Jules Verne.',
            prompt_text: 'Create a hyper-detailed cinematic image of a Victorian gentleman traveler...',
            image_url: 'https://images.pexels.com/photos/30575919/pexels-photo-30575919.jpeg?w=800',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Uncle Gio - Il Narratore Digitale',
            slug: 'uncle-gio-narratore',
            excerpt: 'Come creare un personaggio AI che rappresenta lo storyteller moderno.',
            prompt_text: 'Cinematic portrait of an older Italian man...',
            image_url: 'https://images.unsplash.com/photo-1578069244640-976a4135fada?w=800',
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            title: 'Napoli Segreta - Vicoli e Storie',
            slug: 'napoli-segreta',
            excerpt: 'Un prompt per esplorare i vicoli nascosti di Napoli attraverso l\'AI.',
            prompt_text: 'Narrow alley in Naples Italy...',
            image_url: 'https://images.unsplash.com/photo-1763906667343-dcdb19b1ee4e?w=800',
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <section className="section pt-32" data-testid="blog-page">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="label-accent mb-4">Prompt AI</p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-6" data-testid="blog-title">
            I miei <span className="text-[#B26941]">prompt</span> creativi
          </h1>
          <p className="text-[#A6988D] font-light text-lg max-w-2xl mx-auto">
            Condivido i prompt che uso per creare immagini con l'AI. 
            Sperimenta e crea le tue opere d'arte digitale.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="loading-spinner" />
          </div>
        ) : (
          <motion.div 
            className="space-y-16"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {posts.map((post, index) => (
              <motion.article
                key={post.id}
                variants={fadeInUp}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
                data-testid={`blog-post-${post.slug}`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="overflow-hidden aspect-video">
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover image-hover"
                    />
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <p className="label-accent mb-4">
                    {new Date(post.created_at).toLocaleDateString('it-IT', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">
                    {post.title}
                  </h2>
                  <p className="text-[#A6988D] font-light mb-6">
                    {post.excerpt}
                  </p>
                  {post.prompt_text && (
                    <div className="prompt-block mb-6">
                      <p className="text-xs text-[#B26941] mb-2 uppercase tracking-wider">Prompt:</p>
                      {post.prompt_text}
                    </div>
                  )}
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="btn-outline inline-flex items-center gap-2"
                  >
                    Leggi di più
                    <ArrowRight size={16} />
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

// Blog Post Detail Page
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
      } catch (error) {
        // Fallback
        setPost({
          title: 'Post non trovato',
          content: 'Il post che stai cercando non esiste.',
          created_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <section className="section pt-32" data-testid="blog-post-page">
      <div className="container-custom max-w-4xl">
        <Link to="/blog" className="label-accent flex items-center gap-2 mb-8 hover:text-[#D9875A] transition-colors">
          ← Torna ai Prompt
        </Link>

        {post?.image_url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-video overflow-hidden mb-12"
          >
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="label-accent mb-4">
            {new Date(post.created_at).toLocaleDateString('it-IT', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-8">
            {post.title}
          </h1>

          <div className="text-[#A6988D] font-light text-lg leading-relaxed space-y-6 mb-12">
            {post.content?.split('\n').filter(p => p.trim()).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {post.prompt_text && (
            <div className="mb-12">
              <h3 className="text-xl font-serif font-bold mb-4">Il Prompt Completo</h3>
              <div className="prompt-block">
                {post.prompt_text}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

// Main App
function App() {
  return (
    <div className="App min-h-screen bg-[#0F0D0C]">
      <div className="grain-overlay" />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
