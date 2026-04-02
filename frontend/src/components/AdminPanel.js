import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Settings, FileText, Image, Layers, Mail,
  LogOut, Plus, Edit2, Trash2, Save, X, Eye, EyeOff,
  ChevronRight, Database, ArrowLeft, CheckCircle, AlertCircle,
  Globe, Play
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Token helpers ───────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("admin_token");
const saveToken = (t) => localStorage.setItem("admin_token", t);
const clearToken = () => localStorage.removeItem("admin_token");

// ─── Axios instance with auto-token ──────────────────────────────────────────
const adminApi = axios.create({ baseURL: `${BACKEND_URL}/api/admin` });
adminApi.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers["X-Admin-Token"] = t;
  return config;
});

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 border font-terminal text-sm ${
      type === "error"
        ? "bg-stone-950 border-red-500 text-red-400"
        : "bg-stone-950 border-cyan-500 text-cyan-400"
    }`}
  >
    {type === "error" ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
    {msg}
    <button onClick={onClose} className="ml-2 text-stone-600 hover:text-stone-400">
      <X size={12} />
    </button>
  </motion.div>
);

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-full max-w-sm mx-4"
    >
      <div className="terminal-card">
        <div className="terminal-header">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
          <span className="font-terminal text-xs text-stone-500 ml-4">confirm.exe</span>
        </div>
        <div className="p-6">
          <p className="font-mono text-sm text-stone-300 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 py-2 font-terminal text-xs border border-red-500/60 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              CONFERMA
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 font-terminal text-xs border border-stone-700 text-stone-400 hover:border-stone-500 transition-colors"
            >
              ANNULLA
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── Field helpers ────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs text-stone-500 font-terminal mb-1 tracking-wider">{label}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, type = "text", placeholder = "" }) => (
  <input
    type={type}
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    className="input-terminal"
  />
);

const Textarea = ({ value, onChange, rows = 4, placeholder = "" }) => (
  <textarea
    value={value ?? ""}
    onChange={onChange}
    rows={rows}
    placeholder={placeholder}
    className="textarea-terminal"
  />
);

const Select = ({ value, onChange, options }) => (
  <select value={value ?? ""} onChange={onChange} className="input-terminal">
    {options.map(([val, label]) => (
      <option key={val} value={val}>{label}</option>
    ))}
  </select>
);

// ─── Login ────────────────────────────────────────────────────────────────────
const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/admin/login`, { password });
      saveToken(data.token);
      onLogin(data.token);
    } catch {
      setError("> ERRORE: password non valida");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="terminal-card">
          <div className="terminal-header">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
            <span className="font-terminal text-xs text-stone-500 ml-4">admin_access.exe</span>
          </div>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <Terminal size={18} className="text-cyan-500" />
              <span className="font-terminal text-lg text-stone-200">ADMIN_PANEL</span>
            </div>
            <p className="font-terminal text-xs text-stone-600 mb-8">ZIO_GIO // Pannello di controllo</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <Field label="PASSWORD">
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-terminal pr-10"
                    placeholder="Inserisci password..."
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-cyan-400 transition-colors"
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              {error && <p className="font-terminal text-xs text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="btn-cyber w-full">
                {loading ? "AUTENTICAZIONE..." : "ACCEDI"}
              </button>
            </form>
            <div className="mt-6 pt-6 border-t border-stone-800">
              <Link to="/" className="flex items-center gap-2 font-terminal text-xs text-stone-600 hover:text-stone-400 transition-colors">
                <ArrowLeft size={12} /> Torna al sito
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Settings Section ─────────────────────────────────────────────────────────
const SettingsSection = ({ showToast }) => {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.get("/settings").then((r) => setSettings(r.data)).catch(() => showToast("Errore caricamento impostazioni", "error"));
  }, []);

  const set = (key, val) => setSettings((s) => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.put("/settings", settings);
      showToast("Impostazioni salvate con successo");
    } catch {
      showToast("Errore durante il salvataggio", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="flex justify-center py-20"><div className="loading-terminal" /></div>;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="terminal-card p-6">
        <h3 className="font-terminal text-xs text-cyan-400 mb-5 tracking-widest">{'>'} SEZIONE HERO</h3>
        <div className="space-y-4">
          <Field label="TITOLO PRINCIPALE">
            <Input value={settings.hero_title} onChange={(e) => set("hero_title", e.target.value)} />
          </Field>
          <Field label="SOTTOTITOLO">
            <Textarea value={settings.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} rows={2} />
          </Field>
          <Field label="URL IMMAGINE SFONDO">
            <Input value={settings.hero_image_url} onChange={(e) => set("hero_image_url", e.target.value)} placeholder="https://..." />
          </Field>
          {settings.hero_image_url && (
            <div className="overflow-hidden max-h-40">
              <img src={settings.hero_image_url} alt="preview sfondo" className="w-full object-cover opacity-60" />
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="terminal-card p-6">
        <h3 className="font-terminal text-xs text-cyan-400 mb-5 tracking-widest">{'>'} SEZIONE CHI SONO</h3>
        <div className="space-y-4">
          <Field label="TITOLO">
            <Input value={settings.about_title} onChange={(e) => set("about_title", e.target.value)} />
          </Field>
          <Field label="BIO - PARAGRAFO 1">
            <Textarea value={settings.about_bio_1} onChange={(e) => set("about_bio_1", e.target.value)} rows={3} />
          </Field>
          <Field label="BIO - PARAGRAFO 2">
            <Textarea value={settings.about_bio_2} onChange={(e) => set("about_bio_2", e.target.value)} rows={3} />
          </Field>
          <Field label="BIO - PARAGRAFO 3">
            <Textarea value={settings.about_bio_3} onChange={(e) => set("about_bio_3", e.target.value)} rows={3} />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="STAT: FOLLOWERS">
              <Input value={settings.stat_followers} onChange={(e) => set("stat_followers", e.target.value)} />
            </Field>
            <Field label="STAT: STORIE">
              <Input value={settings.stat_stories} onChange={(e) => set("stat_stories", e.target.value)} />
            </Field>
            <Field label="STAT: PROMPT">
              <Input value={settings.stat_prompts} onChange={(e) => set("stat_prompts", e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      {/* Social */}
      <div className="terminal-card p-6">
        <h3 className="font-terminal text-xs text-cyan-400 mb-5 tracking-widest">{'>'} SOCIAL LINKS</h3>
        <div className="space-y-4">
          <Field label="INSTAGRAM URL">
            <Input value={settings.social_instagram} onChange={(e) => set("social_instagram", e.target.value)} />
          </Field>
          <Field label="TIKTOK URL">
            <Input value={settings.social_tiktok} onChange={(e) => set("social_tiktok", e.target.value)} />
          </Field>
          <Field label="FACEBOOK URL">
            <Input value={settings.social_facebook} onChange={(e) => set("social_facebook", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Contatti */}
      <div className="terminal-card p-6">
        <h3 className="font-terminal text-xs text-cyan-400 mb-5 tracking-widest">{'>'} CONTATTI & FOOTER</h3>
        <div className="space-y-4">
          <Field label="EMAIL DI CONTATTO">
            <Input value={settings.contact_email} onChange={(e) => set("contact_email", e.target.value)} type="email" />
          </Field>
          <Field label="WHATSAPP (con prefisso +39)">
            <Input value={settings.contact_whatsapp} onChange={(e) => set("contact_whatsapp", e.target.value)} />
          </Field>
          <Field label="TESTO FOOTER">
            <Input value={settings.footer_text} onChange={(e) => set("footer_text", e.target.value)} />
          </Field>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-cyber w-full flex items-center justify-center gap-2 py-4">
        <Save size={14} />
        {saving ? "SALVATAGGIO IN CORSO..." : "SALVA TUTTE LE IMPOSTAZIONI"}
      </button>
    </div>
  );
};

// ─── Blog Section ─────────────────────────────────────────────────────────────
const BlogSection = ({ showToast }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const f = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/blog");
      setPosts(data);
    } catch { showToast("Errore caricamento post", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const startNew = () => {
    setForm({ title: "", slug: "", excerpt: "", content: "", prompt_text: "", image_url: "", category: "prompt", published: true });
    setEditing("new");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing === "new") await adminApi.post("/blog", form);
      else await adminApi.put(`/blog/${editing}`, form);
      await fetchPosts();
      setEditing(null);
      showToast(editing === "new" ? "Post creato!" : "Post aggiornato!");
    } catch { showToast("Errore salvataggio", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/blog/${id}`);
      await fetchPosts();
      showToast("Post eliminato");
    } catch { showToast("Errore eliminazione", "error"); }
    setConfirm(null);
  };

  if (editing !== null) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 font-terminal text-xs text-stone-500 hover:text-amber-400 transition-colors mb-6">
          <ArrowLeft size={12} /> TORNA ALLA LISTA
        </button>
        <div className="terminal-card p-6">
          <h3 className="font-terminal text-xs text-cyan-400 mb-6 tracking-widest">
            {'>'} {editing === "new" ? "NUOVO POST" : "MODIFICA POST"}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="TITOLO">
                <Input value={form.title} onChange={(e) => f("title", e.target.value)} />
              </Field>
              <Field label="SLUG (URL)">
                <Input value={form.slug} onChange={(e) => f("slug", e.target.value)} placeholder="es: nome-post" />
              </Field>
            </div>
            <Field label="EXCERPT (breve descrizione)">
              <Textarea value={form.excerpt} onChange={(e) => f("excerpt", e.target.value)} rows={2} />
            </Field>
            <Field label="CONTENUTO">
              <Textarea value={form.content} onChange={(e) => f("content", e.target.value)} rows={8} />
            </Field>
            <Field label="PROMPT AI (opzionale)">
              <Textarea value={form.prompt_text} onChange={(e) => f("prompt_text", e.target.value)} rows={3} placeholder="Il testo del prompt da mostrare..." />
            </Field>
            <Field label="URL IMMAGINE">
              <Input value={form.image_url} onChange={(e) => f("image_url", e.target.value)} placeholder="https://..." />
            </Field>
            {form.image_url && (
              <div className="overflow-hidden max-h-40">
                <img src={form.image_url} alt="preview" className="w-full object-cover opacity-60" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="CATEGORIA">
                <Select value={form.category} onChange={(e) => f("category", e.target.value)} options={[["prompt", "Prompt AI"], ["story", "Storia"]]} />
              </Field>
              <Field label="STATO">
                <Select value={form.published ? "true" : "false"} onChange={(e) => f("published", e.target.value === "true")} options={[["true", "✓ Pubblicato"], ["false", "⊘ Bozza"]]} />
              </Field>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-cyber w-full flex items-center justify-center gap-2 mt-2">
              <Save size={14} /> {saving ? "SALVATAGGIO..." : "SALVA POST"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="font-terminal text-xs text-stone-500">{posts.length} POST NEL DATABASE</span>
        <button onClick={startNew} className="btn-cyber flex items-center gap-2 text-xs py-2 px-4">
          <Plus size={12} /> NUOVO POST
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="loading-terminal" /></div>
      ) : posts.length === 0 ? (
        <p className="font-terminal text-sm text-stone-600 text-center py-20">{'>'} NESSUN POST TROVATO</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="terminal-card p-4 flex items-center gap-4 group">
              {post.image_url && (
                <img src={post.image_url} alt={post.title} className="w-14 h-14 object-cover flex-shrink-0 opacity-60" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-typewriter text-stone-200 truncate text-sm">{post.title}</p>
                <p className="font-terminal text-xs text-stone-500 truncate">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-terminal text-[10px] text-cyan-500">{post.category}</span>
                  <span className={`font-terminal text-[10px] ${post.published ? "text-green-500" : "text-amber-500"}`}>
                    {post.published ? "ONLINE" : "BOZZA"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setForm({ ...post }); setEditing(post.id); }} className="p-2 border border-stone-700 text-stone-500 hover:text-cyan-400 hover:border-cyan-500 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setConfirm(post.id)} className="p-2 border border-stone-700 text-stone-500 hover:text-red-400 hover:border-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          message={`Eliminare il post "${posts.find((p) => p.id === confirm)?.title}"?`}
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

// ─── Gallery Section ──────────────────────────────────────────────────────────
const GallerySection = ({ showToast }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const f = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/gallery");
      setItems(data);
    } catch { showToast("Errore caricamento galleria", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const startNew = () => {
    setForm({ title: "", image_url: "", category: "photo", description: "", prompt_text: "", order: 0 });
    setEditing("new");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing === "new") await adminApi.post("/gallery", { ...form, order: Number(form.order) });
      else await adminApi.put(`/gallery/${editing}`, { ...form, order: Number(form.order) });
      await fetchItems();
      setEditing(null);
      showToast(editing === "new" ? "Elemento creato!" : "Elemento aggiornato!");
    } catch { showToast("Errore salvataggio", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/gallery/${id}`);
      await fetchItems();
      showToast("Elemento eliminato");
    } catch { showToast("Errore eliminazione", "error"); }
    setConfirm(null);
  };

  if (editing !== null) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 font-terminal text-xs text-stone-500 hover:text-amber-400 transition-colors mb-6">
          <ArrowLeft size={12} /> TORNA ALLA GALLERIA
        </button>
        <div className="terminal-card p-6">
          <h3 className="font-terminal text-xs text-cyan-400 mb-6 tracking-widest">
            {'>'} {editing === "new" ? "NUOVO ELEMENTO" : "MODIFICA ELEMENTO"}
          </h3>
          <div className="space-y-4">
            <Field label="TITOLO">
              <Input value={form.title} onChange={(e) => f("title", e.target.value)} />
            </Field>
            <Field label="URL IMMAGINE">
              <Input value={form.image_url} onChange={(e) => f("image_url", e.target.value)} placeholder="https://..." />
            </Field>
            {form.image_url && (
              <div className="overflow-hidden max-h-48">
                <img src={form.image_url} alt="preview" className="w-full object-cover opacity-60" />
              </div>
            )}
            <Field label="DESCRIZIONE">
              <Textarea value={form.description} onChange={(e) => f("description", e.target.value)} rows={2} />
            </Field>
            <Field label="PROMPT AI (solo per AI_ART)">
              <Textarea value={form.prompt_text} onChange={(e) => f("prompt_text", e.target.value)} rows={2} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CATEGORIA">
                <Select value={form.category} onChange={(e) => f("category", e.target.value)} options={[["photo", "📷 Photo Vintage"], ["ai_art", "🤖 AI Art"]]} />
              </Field>
              <Field label="ORDINE (numero)">
                <Input value={form.order} onChange={(e) => f("order", e.target.value)} type="number" />
              </Field>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-cyber w-full flex items-center justify-center gap-2 mt-2">
              <Save size={14} /> {saving ? "SALVATAGGIO..." : "SALVA ELEMENTO"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="font-terminal text-xs text-stone-500">{items.length} ELEMENTI IN GALLERIA</span>
        <button onClick={startNew} className="btn-cyber flex items-center gap-2 text-xs py-2 px-4">
          <Plus size={12} /> NUOVO ELEMENTO
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="loading-terminal" /></div>
      ) : items.length === 0 ? (
        <p className="font-terminal text-sm text-stone-600 text-center py-20">{'>'} GALLERIA VUOTA</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => (
            <div key={item.id} className="terminal-card overflow-hidden group relative">
              <div className="aspect-square overflow-hidden bg-stone-800">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
              </div>
              <div className="p-2">
                <p className="font-terminal text-xs text-stone-300 truncate">{item.title}</p>
                <p className="font-terminal text-[10px] text-cyan-500">{item.category} // #{item.order}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setForm({ ...item }); setEditing(item.id); }} className="p-1.5 bg-stone-950/90 border border-stone-700 text-stone-400 hover:text-cyan-400">
                  <Edit2 size={11} />
                </button>
                <button onClick={() => setConfirm(item.id)} className="p-1.5 bg-stone-950/90 border border-stone-700 text-stone-400 hover:text-red-400">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          message={`Eliminare "${items.find((i) => i.id === confirm)?.title}" dalla galleria?`}
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

// ─── Projects Section ─────────────────────────────────────────────────────────
const ProjectsSection = ({ showToast }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const f = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/projects");
      setProjects(data);
    } catch { showToast("Errore caricamento progetti", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const startNew = () => {
    setForm({ title: "", slug: "", description: "", image_url: "", video_url: "", category: "serie", order: 0 });
    setEditing("new");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, order: Number(form.order), video_url: form.video_url || null };
      if (editing === "new") await adminApi.post("/projects", payload);
      else await adminApi.put(`/projects/${editing}`, payload);
      await fetchProjects();
      setEditing(null);
      showToast(editing === "new" ? "Progetto creato!" : "Progetto aggiornato!");
    } catch { showToast("Errore salvataggio", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/projects/${id}`);
      await fetchProjects();
      showToast("Progetto eliminato");
    } catch { showToast("Errore eliminazione", "error"); }
    setConfirm(null);
  };

  if (editing !== null) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 font-terminal text-xs text-stone-500 hover:text-amber-400 transition-colors mb-6">
          <ArrowLeft size={12} /> TORNA AI PROGETTI
        </button>
        <div className="terminal-card p-6">
          <h3 className="font-terminal text-xs text-cyan-400 mb-6 tracking-widest">
            {'>'} {editing === "new" ? "NUOVO PROGETTO" : "MODIFICA PROGETTO"}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="TITOLO">
                <Input value={form.title} onChange={(e) => f("title", e.target.value)} />
              </Field>
              <Field label="SLUG (URL)">
                <Input value={form.slug} onChange={(e) => f("slug", e.target.value)} placeholder="es: nome-progetto" />
              </Field>
            </div>
            <Field label="DESCRIZIONE">
              <Textarea value={form.description} onChange={(e) => f("description", e.target.value)} rows={4} />
            </Field>
            <Field label="URL IMMAGINE COPERTINA">
              <Input value={form.image_url} onChange={(e) => f("image_url", e.target.value)} placeholder="https://..." />
            </Field>
            {form.image_url && (
              <div className="overflow-hidden max-h-40">
                <img src={form.image_url} alt="preview" className="w-full object-cover opacity-60" />
              </div>
            )}
            <Field label="URL VIDEO (opzionale)">
              <Input value={form.video_url} onChange={(e) => f("video_url", e.target.value)} placeholder="https://..." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CATEGORIA">
                <Select value={form.category} onChange={(e) => f("category", e.target.value)} options={[["serie", "Serie"], ["collaborazione", "Collaborazione"], ["progetto", "Progetto"]]} />
              </Field>
              <Field label="ORDINE (numero)">
                <Input value={form.order} onChange={(e) => f("order", e.target.value)} type="number" />
              </Field>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-cyber w-full flex items-center justify-center gap-2 mt-2">
              <Save size={14} /> {saving ? "SALVATAGGIO..." : "SALVA PROGETTO"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="font-terminal text-xs text-stone-500">{projects.length} PROGETTI</span>
        <button onClick={startNew} className="btn-cyber flex items-center gap-2 text-xs py-2 px-4">
          <Plus size={12} /> NUOVO PROGETTO
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="loading-terminal" /></div>
      ) : projects.length === 0 ? (
        <p className="font-terminal text-sm text-stone-600 text-center py-20">{'>'} NESSUN PROGETTO TROVATO</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="terminal-card p-4 flex items-center gap-4 group">
              <img src={project.image_url} alt={project.title} className="w-14 h-14 object-cover flex-shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="font-typewriter text-stone-200 truncate text-sm">{project.title}</p>
                <p className="font-terminal text-xs text-stone-500 truncate">{project.description}</p>
                <p className="font-terminal text-[10px] text-cyan-500 mt-1">{project.category} // ordine: {project.order}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setForm({ ...project }); setEditing(project.id); }} className="p-2 border border-stone-700 text-stone-500 hover:text-cyan-400 hover:border-cyan-500 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setConfirm(project.id)} className="p-2 border border-stone-700 text-stone-500 hover:text-red-400 hover:border-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          message={`Eliminare il progetto "${projects.find((p) => p.id === confirm)?.title}"?`}
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

// ─── Reels Section ────────────────────────────────────────────────────────────
const ReelsSection = ({ showToast }) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const f = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const fetchReels = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/reels");
      setReels(data);
    } catch { showToast("Errore caricamento reel", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  const startNew = () => {
    setForm({ title: "", url: "", thumbnail_url: "", description: "", order: reels.length, published: true });
    setEditing("new");
  };

  const handleSave = async () => {
    if (!form.url) { showToast("URL reel obbligatorio", "error"); return; }
    setSaving(true);
    try {
      if (editing === "new") await adminApi.post("/reels", form);
      else await adminApi.put(`/reels/${editing}`, form);
      await fetchReels();
      setEditing(null);
      showToast(editing === "new" ? "Reel aggiunto!" : "Reel aggiornato!");
    } catch { showToast("Errore salvataggio", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/reels/${id}`);
      await fetchReels();
      showToast("Reel eliminato");
    } catch { showToast("Errore eliminazione", "error"); }
    setConfirm(null);
  };

  if (editing !== null) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 font-terminal text-xs text-stone-500 hover:text-amber-400 transition-colors mb-6">
          <ArrowLeft size={12} /> TORNA ALLA LISTA
        </button>
        <div className="terminal-card p-6">
          <h3 className="font-terminal text-xs text-cyan-400 mb-6 tracking-widest">
            {'>'} {editing === "new" ? "NUOVO REEL" : "MODIFICA REEL"}
          </h3>
          <div className="space-y-4">
            <Field label="TITOLO">
              <Input value={form.title} onChange={(e) => f("title", e.target.value)} placeholder="Es: Napoli - Piazza del Plebiscito" />
            </Field>
            <Field label="URL REEL INSTAGRAM *">
              <Input value={form.url} onChange={(e) => f("url", e.target.value)} placeholder="https://www.instagram.com/reel/..." />
            </Field>
            <Field label="URL THUMBNAIL (opzionale)">
              <Input value={form.thumbnail_url} onChange={(e) => f("thumbnail_url", e.target.value)} placeholder="https://... (lascia vuoto per icona play)" />
            </Field>
            {form.thumbnail_url && (
              <div className="overflow-hidden max-h-48 flex justify-center bg-stone-900">
                <img src={form.thumbnail_url} alt="preview" className="h-48 object-cover opacity-70" />
              </div>
            )}
            <Field label="DESCRIZIONE (opzionale)">
              <Textarea value={form.description} onChange={(e) => f("description", e.target.value)} rows={2} placeholder="Breve descrizione del reel..." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ORDINE">
                <Input value={form.order} onChange={(e) => f("order", parseInt(e.target.value) || 0)} type="number" />
              </Field>
              <Field label="STATO">
                <Select
                  value={form.published ? "true" : "false"}
                  onChange={(e) => f("published", e.target.value === "true")}
                  options={[["true", "✓ Visibile"], ["false", "⊘ Nascosto"]]}
                />
              </Field>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-cyber w-full flex items-center justify-center gap-2 mt-2">
              <Save size={14} /> {saving ? "SALVATAGGIO..." : "SALVA REEL"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-terminal text-xs text-stone-500">{reels.length} REEL NEL DATABASE</span>
        <button onClick={startNew} className="btn-cyber flex items-center gap-2 text-xs py-2 px-4">
          <Plus size={12} /> AGGIUNGI REEL
        </button>
      </div>
      <p className="font-mono text-xs text-stone-600 mb-6 leading-relaxed">
        Inserisci i link diretti ai tuoi Reel Instagram. Verranno mostrati nella sezione Feed del sito.
        Per ogni reel puoi aggiungere una thumbnail (screenshot del video).
      </p>
      {loading ? (
        <div className="flex justify-center py-20"><div className="loading-terminal" /></div>
      ) : reels.length === 0 ? (
        <p className="font-terminal text-sm text-stone-600 text-center py-20">{'>'} NESSUN REEL SALVATO</p>
      ) : (
        <div className="space-y-3">
          {reels.map((reel) => (
            <div key={reel.id} className="terminal-card p-4 flex items-center gap-4 group">
              <div className="w-14 h-14 flex-shrink-0 bg-stone-800 flex items-center justify-center overflow-hidden">
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover opacity-70" />
                ) : (
                  <Play size={20} className="text-cyan-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-typewriter text-stone-200 truncate text-sm">{reel.title || "(senza titolo)"}</p>
                <a href={reel.url} target="_blank" rel="noopener noreferrer" className="font-terminal text-xs text-cyan-500 truncate hover:underline block">{reel.url}</a>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-terminal text-[10px] text-stone-600">ordine: {reel.order}</span>
                  <span className={`font-terminal text-[10px] ${reel.published ? "text-green-500" : "text-amber-500"}`}>
                    {reel.published ? "VISIBILE" : "NASCOSTO"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setForm({ ...reel }); setEditing(reel.id); }} className="p-2 border border-stone-700 text-stone-500 hover:text-cyan-400 hover:border-cyan-500 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => setConfirm(reel.id)} className="p-2 border border-stone-700 text-stone-500 hover:text-red-400 hover:border-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          message={`Eliminare il reel "${reels.find((r) => r.id === confirm)?.title || reel?.url}"?`}
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

// ─── Messages Section ─────────────────────────────────────────────────────────
const MessagesSection = ({ showToast }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/messages")
      .then((r) => setMessages(r.data))
      .catch(() => showToast("Errore caricamento messaggi", "error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <p className="font-terminal text-xs text-stone-500 mb-6">{messages.length} MESSAGGI RICEVUTI</p>
      {loading ? (
        <div className="flex justify-center py-20"><div className="loading-terminal" /></div>
      ) : messages.length === 0 ? (
        <p className="font-terminal text-sm text-stone-600 text-center py-20">{'>'} NESSUN MESSAGGIO</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="terminal-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-typewriter text-stone-200 text-sm">{msg.name}</p>
                  <a href={`mailto:${msg.email}`} className="font-terminal text-xs text-cyan-400 hover:underline">{msg.email}</a>
                </div>
                <span className="font-terminal text-xs text-stone-600 flex-shrink-0 ml-4">
                  {new Date(msg.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <p className="font-mono text-sm text-stone-400 leading-relaxed border-l-2 border-stone-700 pl-4">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Data Section ─────────────────────────────────────────────────────────────
const DataSection = ({ showToast }) => {
  const [seeding, setSeeding] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    setConfirm(false);
    try {
      await axios.post(`${API}/seed`);
      showToast("Database popolato con i dati di esempio!");
    } catch { showToast("Errore durante il seed", "error"); }
    finally { setSeeding(false); }
  };

  return (
    <div className="space-y-6">
      <div className="terminal-card p-6">
        <h3 className="font-terminal text-xs text-cyan-400 mb-4 tracking-widest">{'>'} DATABASE INFO</h3>
        <div className="space-y-3 font-terminal text-sm text-stone-400">
          <p>{'>'} Backend: <span className="text-cyan-400">{BACKEND_URL}</span></p>
          <p>{'>'} API Version: <span className="text-amber-400">v1.0</span></p>
          <p>{'>'} Status: <span className="text-green-400">ONLINE</span></p>
        </div>
      </div>

      <div className="terminal-card p-6">
        <h3 className="font-terminal text-xs text-amber-400 mb-2 tracking-widest">{'>'} SEED DATI DI ESEMPIO</h3>
        <p className="font-mono text-xs text-stone-500 mb-5 leading-relaxed">
          Popola il database con post, galleria e progetti di esempio.<br />
          <span className="text-red-400">ATTENZIONE: sovrascrive tutti i contenuti esistenti.</span>
        </p>
        <button
          onClick={() => setConfirm(true)}
          disabled={seeding}
          className="flex items-center gap-2 font-terminal text-xs border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 px-4 py-3 transition-colors"
        >
          <Database size={14} />
          {seeding ? "CARICAMENTO DATI..." : "CARICA DATI DI ESEMPIO"}
        </button>
      </div>

      <div className="terminal-card p-6">
        <h3 className="font-terminal text-xs text-cyan-400 mb-4 tracking-widest">{'>'} LINKS UTILI</h3>
        <div className="space-y-3">
          <a href={`${BACKEND_URL}/docs`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-terminal text-xs text-stone-500 hover:text-cyan-400 transition-colors">
            <Globe size={12} /> API Docs (Swagger UI)
          </a>
          <Link to="/" className="flex items-center gap-2 font-terminal text-xs text-stone-500 hover:text-cyan-400 transition-colors">
            <Globe size={12} /> Visualizza il sito pubblico
          </Link>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          message="Sei sicuro? Tutti i contenuti esistenti verranno sostituiti con i dati di esempio."
          onConfirm={handleSeed}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
};

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "settings", label: "IMPOSTAZIONI SITO", icon: Settings, desc: "Hero, About, Social, Contatti" },
  { id: "blog", label: "BLOG & PROMPT AI", icon: FileText, desc: "Crea e modifica i post" },
  { id: "gallery", label: "GALLERIA", icon: Image, desc: "Gestisci le immagini" },
  { id: "projects", label: "PROGETTI", icon: Layers, desc: "Gestisci i progetti" },
  { id: "reels", label: "REEL INSTAGRAM", icon: Play, desc: "Link ai reel salvati" },
  { id: "messages", label: "MESSAGGI", icon: Mail, desc: "Messaggi ricevuti" },
  { id: "data", label: "DATABASE & DATI", icon: Database, desc: "Seed e configurazione" },
];

const AdminPanel = () => {
  const [token, setToken] = useState(getToken());
  const [activeSection, setActiveSection] = useState("settings");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast, show: showToast } = useToast();

  const handleLogin = (t) => setToken(t);
  const handleLogout = () => { clearToken(); setToken(null); };

  if (!token) return <AdminLogin onLogin={handleLogin} />;

  const renderSection = () => {
    const props = { showToast };
    switch (activeSection) {
      case "settings": return <SettingsSection {...props} />;
      case "blog": return <BlogSection {...props} />;
      case "gallery": return <GallerySection {...props} />;
      case "projects": return <ProjectsSection {...props} />;
      case "reels": return <ReelsSection {...props} />;
      case "messages": return <MessagesSection {...props} />;
      case "data": return <DataSection {...props} />;
      default: return null;
    }
  };

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen bg-stone-950 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 bg-stone-900 border-r border-stone-800 flex flex-col flex-shrink-0`}>
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-cyan-500" />
                <span className="font-terminal text-sm text-stone-200">ADMIN</span>
              </div>
              <p className="font-terminal text-[10px] text-stone-600 mt-0.5">ZIO_GIO PANEL</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-stone-600 hover:text-stone-400 transition-colors p-1">
            <ChevronRight size={14} className={`transition-transform duration-300 ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              title={!sidebarOpen ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 font-terminal text-[11px] transition-all rounded-none ${
                activeSection === id
                  ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/30"
                  : "text-stone-500 hover:text-stone-300 hover:bg-stone-800 border border-transparent"
              }`}
            >
              <Icon size={14} className="flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="truncate">{label}</span>
                  {activeSection === id && <ChevronRight size={10} className="ml-auto flex-shrink-0" />}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="p-2 border-t border-stone-800 space-y-1">
          <Link
            to="/"
            title={!sidebarOpen ? "Vai al sito" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 font-terminal text-[11px] text-stone-600 hover:text-stone-400 transition-colors"
          >
            <Globe size={14} className="flex-shrink-0" />
            {sidebarOpen && "VAI AL SITO"}
          </Link>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Logout" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 font-terminal text-[11px] text-stone-600 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} className="flex-shrink-0" />
            {sidebarOpen && "LOGOUT"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-stone-800 px-6 py-3 flex items-center justify-between bg-stone-900/50">
          <div>
            <p className="font-terminal text-xs text-stone-500 tracking-widest">
              ADMIN {'>'} {currentSection?.label}
            </p>
            <p className="font-terminal text-[10px] text-stone-700">{currentSection?.desc}</p>
          </div>
          <Link to="/" className="font-terminal text-[10px] text-stone-600 hover:text-cyan-400 transition-colors flex items-center gap-1">
            <Globe size={10} /> sito pubblico
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => {}} />}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
