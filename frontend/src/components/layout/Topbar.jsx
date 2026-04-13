import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Sun, Moon, Menu, Search, Command, X, AlertTriangle, Camera, WifiOff, ScanFace } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { useLanguageStore } from "../../store/languageStore";
import { useState, useEffect, useRef } from "react";

const pageTitles = {
  "/app/dashboard":  "dashboard",
  "/app/live":       "liveView",
  "/app/cameras":    "cameras",
  "/app/recordings": "recordings",
  "/app/analytics":  "analytics",
  "/app/users":      "users",
  "/app/settings":   "settings",
};

const pageMeta = {
  "/app/dashboard":  { badge: "Overview",       color: "#06b6d4" },
  "/app/live":       { badge: "Real-time",       color: "#10b981" },
  "/app/cameras":    { badge: "Management",      color: "#8b5cf6" },
  "/app/recordings": { badge: "Archive",         color: "#f59e0b" },
  "/app/analytics":  { badge: "AI Powered",      color: "#a78bfa" },
  "/app/users":      { badge: "Access Control",  color: "#06b6d4" },
  "/app/settings":   { badge: "Configuration",   color: "#6b7280" },
};

// Searchable pages/features
const searchItems = [
  { label: "Dashboard",       path: "/app/dashboard",  icon: "📊", desc: "Ringkasan sistem" },
  { label: "Live View",       path: "/app/live",        icon: "📹", desc: "Pantau kamera langsung" },
  { label: "Kamera",          path: "/app/cameras",     icon: "🎥", desc: "Kelola kamera CCTV" },
  { label: "Rekaman",         path: "/app/recordings",  icon: "🎬", desc: "Daftar rekaman video" },
  { label: "Pengguna",        path: "/app/users",       icon: "👥", desc: "Manajemen pengguna" },
  { label: "Pengaturan",      path: "/app/settings",    icon: "⚙️", desc: "Konfigurasi sistem" },
  { label: "Analitik Wajah",  path: "/app/recordings",  icon: "🤖", desc: "Deteksi wajah AI" },
];

// Mock notifications
const mockNotifications = [
  { id: 1, type: "alert",   title: "Wajah Tidak Dikenal",  desc: "Main Entrance — 08:14",   time: "2 mnt lalu",  read: false, icon: "🚨",  color: "#ef4444" },
  { id: 2, type: "warning", title: "Kamera Offline",        desc: "Parking Lot",             time: "15 mnt lalu", read: false, icon: "⚠️", color: "#f59e0b" },
  { id: 3, type: "alert",   title: "Pergerakan Malam",      desc: "Side Gate — 02:33",       time: "3 jam lalu",  read: false, icon: "🌙",  color: "#8b5cf6" },
  { id: 4, type: "info",    title: "AI Model Diperbarui",   desc: "Versi 3.2.1 aktif",       time: "1 hari lalu", read: true,  icon: "🤖",  color: "#06b6d4" },
  { id: 5, type: "info",    title: "Rekaman Otomatis Aktif",desc: "5 kamera sedang merekam", time: "1 hari lalu", read: true,  icon: "🎬",  color: "#10b981" },
];

function SearchModal({ onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = query.trim()
    ? searchItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.desc.toLowerCase().includes(query.toLowerCase()))
    : searchItems;

  const go = (path) => { navigate(path); onClose(); };

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-24 px-4" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-card-enter"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--color-card-border)" }}>
          <Search size={18} style={{ color: "var(--color-text-sub)" }} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari halaman atau fitur..."
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: "var(--color-text-base)" }}
          />
          {query && <button onClick={() => setQuery("")} style={{ color: "var(--color-text-sub)" }}><X size={16} /></button>}
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-mono" style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-sub)", border: "1px solid var(--color-card-border)" }}>ESC</kbd>
        </div>
        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {results.length === 0
            ? <p className="text-center py-8 text-sm" style={{ color: "var(--color-text-sub)" }}>Tidak ditemukan</p>
            : results.map((item) => (
              <button key={item.path + item.label} onClick={() => go(item.path)}
                className="w-full flex items-center gap-4 px-5 py-3 text-left transition-colors"
                style={{ transition: "background-color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                <span className="text-xl w-8 text-center">{item.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-base)" }}>{item.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-sub)" }}>{item.desc}</p>
                </div>
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ onClose, notifications, onMarkRead, onMarkAllRead }) {
  const unreadCount = notifications.filter(n => !n.read).length;
  return (
    <div className="absolute top-14 right-0 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden animate-card-enter"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-card-border)" }}>
        <div>
          <p className="text-[13px] font-bold" style={{ color: "var(--color-text-base)" }}>Notifikasi</p>
          {unreadCount > 0 && <p className="text-[11px]" style={{ color: "var(--color-text-sub)" }}>{unreadCount} belum dibaca</p>}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ color: "#06b6d4", backgroundColor: "rgba(6,182,212,0.1)" }}>
              Tandai semua
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--color-text-sub)", backgroundColor: "var(--color-surface-elevated)" }}><X size={14} /></button>
        </div>
      </div>
      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((n, idx) => (
          <div key={n.id} onClick={() => onMarkRead(n.id)}
            className="flex gap-3 items-start px-5 py-3.5 cursor-pointer"
            style={{
              backgroundColor: n.read ? "transparent" : `${n.color}06`,
              transition: "background-color 0.15s",
              borderBottom: idx < notifications.length - 1 ? "1px solid rgba(6,182,212,0.12)" : "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = n.read ? "transparent" : `${n.color}06`)}>
            <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-lg" style={{ backgroundColor: `${n.color}15`, border: `1px solid ${n.color}25` }}>
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1">
                <p className="text-[12px] font-semibold leading-tight" style={{ color: "var(--color-text-base)" }}>{n.title}</p>
                {!n.read && <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: n.color }} />}
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-sub)" }}>{n.desc}</p>
              <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--color-text-sub)", opacity: 0.6 }}>{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="p-3" style={{ borderTop: "1px solid var(--color-card-border)" }}>
        <p className="text-center text-[11px] font-medium" style={{ color: "var(--color-text-sub)" }}>Semua notifikasi telah ditampilkan</p>
      </div>
    </div>
  );
}

export default function Topbar({ onMenuToggle }) {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useLanguageStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const notifRef = useRef(null);

  const titleKey = pageTitles[pathname];
  const title = titleKey ? t(`topbar.titles.${titleKey}`) : "CamMatrix";
  const meta = pageMeta[pathname];
  const unread = notifications.filter(n => !n.read).length;

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    if (showNotif) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotif]);

  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}

      <header className="h-16 flex items-center justify-between px-6 shrink-0 relative"
        style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-card-border)" }}>
        {/* Ambient gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.3) 30%, rgba(0,255,255,0.3) 70%, transparent 100%)" }} />

        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="p-2 rounded-xl transition-all duration-200 hover:scale-105" style={{ color: "var(--color-text-sub)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--color-text-base)" }}>{title}</h1>
            {meta && (
              <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                style={{ color: meta.color, backgroundColor: `${meta.color}18`, border: `1px solid ${meta.color}30` }}>
                {meta.badge}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search — Ctrl+K */}
          <button onClick={() => setShowSearch(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all duration-200"
            style={{ backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)", color: "var(--color-text-sub)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.color = "#06b6d4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.color = "var(--color-text-sub)"; }}>
            <Search size={13} />
            <span className="text-xs">Cari...</span>
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-mono" style={{ backgroundColor: "var(--color-card-border)", color: "var(--color-text-sub)" }}>
              <Command size={9} />K
            </span>
          </button>

          {/* Notification bell */}
          <div ref={notifRef} className="relative">
            <button onClick={() => setShowNotif(v => !v)}
              className="relative p-2 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ color: "var(--color-text-sub)", backgroundColor: showNotif ? "var(--color-surface-elevated)" : "" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)")}
              onMouseLeave={(e) => { if (!showNotif) e.currentTarget.style.backgroundColor = ""; }}>
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
                  style={{ backgroundColor: "#ef4444", boxShadow: "0 0 6px rgba(239,68,68,0.8)" }}>
                  {unread}
                </span>
              )}
            </button>
            {showNotif && (
              <NotificationPanel
                onClose={() => setShowNotif(false)}
                notifications={notifications}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
              />
            )}
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ color: "var(--color-text-sub)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
    </>
  );
}
