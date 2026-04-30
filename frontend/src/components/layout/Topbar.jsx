import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  Command,
  X,
  AlertTriangle,
  Camera,
  WifiOff,
  ScanFace,
} from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useState, useEffect, useRef } from "react";
const pageTitles = {
  "/app/dashboard": "dashboard",
  "/app/live": "liveView",
  "/app/cameras": "cameras",
  "/app/recordings": "recordings",
  "/app/analytics": "analytics",
  "/app/users": "users",
  "/app/settings": "settings",
};
const pageMeta = {
  "/app/dashboard": { badge: "Overview", color: "#FFFFFF" },
  "/app/live": { badge: "Real-time", color: "#10b981" },
  "/app/cameras": { badge: "Management", color: "#FFFFFF" },
  "/app/recordings": { badge: "Archive", color: "#f59e0b" },
  "/app/analytics": { badge: "AI Powered", color: "#a78bfa" },
  "/app/users": { badge: "Access Control", color: "#FFFFFF" },
  "/app/settings": { badge: "Configuration", color: "#6b7280" },
};
const searchItems = [
  {
    label: "Dashboard",
    path: "/app/dashboard",
    icon: "📊",
    desc: "Ringkasan sistem",
  },
  {
    label: "Live View",
    path: "/app/live",
    icon: "📹",
    desc: "Pantau kamera langsung",
  },
  {
    label: "Kamera",
    path: "/app/cameras",
    icon: "🎥",
    desc: "Kelola kamera CCTV",
  },
  {
    label: "Rekaman",
    path: "/app/recordings",
    icon: "🎬",
    desc: "Daftar rekaman video",
  },
  {
    label: "Pengguna",
    path: "/app/users",
    icon: "👥",
    desc: "Manajemen pengguna",
  },
  {
    label: "Pengaturan",
    path: "/app/settings",
    icon: "⚙️",
    desc: "Konfigurasi sistem",
  },
  {
    label: "Analitik Wajah",
    path: "/app/recordings",
    icon: "🤖",
    desc: "Deteksi wajah AI",
  },
];
const mockNotifications = [
  {
    id: 1,
    type: "alert",
    title: "Wajah Tidak Dikenal",
    desc: "Main Entrance — 08:14",
    time: "2 mnt lalu",
    read: false,
    icon: "🚨",
    color: "#ef4444",
  },
  {
    id: 2,
    type: "warning",
    title: "Kamera Offline",
    desc: "Parking Lot",
    time: "15 mnt lalu",
    read: false,
    icon: "⚠️",
    color: "#f59e0b",
  },
  {
    id: 3,
    type: "alert",
    title: "Pergerakan Malam",
    desc: "Side Gate — 02:33",
    time: "3 jam lalu",
    read: false,
    icon: "🌙",
    color: "#FFFFFF",
  },
  {
    id: 4,
    type: "info",
    title: "AI Model Diperbarui",
    desc: "Versi 3.2.1 aktif",
    time: "1 hari lalu",
    read: true,
    icon: "🤖",
    color: "#FFFFFF",
  },
  {
    id: 5,
    type: "info",
    title: "Rekaman Otomatis Aktif",
    desc: "5 kamera sedang merekam",
    time: "1 hari lalu",
    read: true,
    icon: "🎬",
    color: "#10b981",
  },
];
function SearchModal({ onClose, isDark }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const results = query.trim()
    ? searchItems.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          i.desc.toLowerCase().includes(query.toLowerCase()),
      )
    : searchItems;
  const go = (path) => {
    navigate(path);
    onClose();
  };
  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-20 px-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-card-enter"
        style={{
          backgroundColor: "rgba(17,17,24,0.92)",
          border: "1px solid var(--color-card-border)",
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)"
            : "0 20px 60px rgba(15,23,42,0.16), 0 0 0 1px rgba(15,23,42,0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b"
          style={{ borderColor: "var(--color-card-border)" }}
        >
          <Search size={16} style={{ color: "var(--color-text-sub)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari halaman atau fitur..."
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: "var(--color-text-base)" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ color: "var(--color-text-sub)" }}
            >
              <X size={15} />
            </button>
          )}
          <kbd
            className="hidden sm:flex items-center gap-0.5 text-[10px] px-2 py-1 rounded-lg font-mono"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              color: "var(--color-text-sub)",
              border: "1px solid var(--color-card-border)",
            }}
          >
            ESC
          </kbd>
        </div>
        <div className="py-1.5 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <p
              className="text-center py-8 text-sm"
              style={{ color: "var(--color-text-sub)" }}
            >
              Tidak ditemukan
            </p>
          ) : (
            results.map((item) => (
              <button
                key={item.path + item.label}
                onClick={() => go(item.path)}
                className="w-full flex items-center gap-3.5 px-4 py-2.5 text-left rounded-lg mx-1.5 transition-colors"
                style={{
                  width: "calc(100% - 12px)",
                  transition: "background-color 0.12s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "var(--color-surface-elevated)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <span className="text-xl w-8 text-center shrink-0">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[13px] font-semibold truncate"
                    style={{ color: "var(--color-text-base)" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-[11px] truncate"
                    style={{ color: "var(--color-text-sub)" }}
                  >
                    {item.desc}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
        <div
          className="px-4 py-2.5 border-t flex items-center gap-3"
          style={{ borderColor: "var(--color-card-border)" }}
        >
          <span
            className="text-[10px]"
            style={{ color: "var(--color-text-sub)" }}
          >
            ↑↓ navigate · Enter select · ESC close
          </span>
        </div>
      </div>
    </div>
  );
}
function NotificationPanel({
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  isDark,
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <div
      className="absolute top-14 right-0 z-50 w-80 rounded-2xl overflow-hidden animate-card-enter"
      style={{
        backgroundColor: "rgba(17,17,24,0.92)",
        border: "1px solid var(--color-card-border)",
        boxShadow: isDark
          ? "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)"
          : "0 16px 48px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.04)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid #1F1F2E" }}
      >
        <div>
          <p
            className="text-[13px] font-bold"
            style={{ color: "var(--color-text-base)" }}
          >
            Notifikasi
          </p>
          {unreadCount > 0 && (
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--color-text-sub)" }}
            >
              {unreadCount} belum dibaca
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={{
                color: "#FFFFFF",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              Tandai semua
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{
              color: "var(--color-text-sub)",
              backgroundColor: "var(--color-surface-elevated)",
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((n, idx) => (
          <div
            key={n.id}
            onClick={() => onMarkRead(n.id)}
            className="flex gap-3 items-start px-4 py-3 cursor-pointer transition-colors"
            style={{
              backgroundColor: n.read ? "transparent" : `${n.color}06`,
              borderBottom:
                idx < notifications.length - 1
                  ? "1px solid var(--color-card-border)"
                  : "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--color-surface-elevated)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = n.read
                ? "transparent"
                : `${n.color}06`)
            }
          >
            <div
              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-base"
              style={{
                backgroundColor: `${n.color}12`,
                border: `1px solid ${n.color}22`,
              }}
            >
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1.5">
                <p
                  className="text-[12px] font-semibold leading-tight"
                  style={{ color: "var(--color-text-base)" }}
                >
                  {n.title}
                </p>
                {!n.read && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: n.color }}
                  />
                )}
              </div>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--color-text-sub)" }}
              >
                {n.desc}
              </p>
              <p
                className="text-[10px] mt-1 font-mono"
                style={{ color: "var(--color-text-sub)", opacity: 0.6 }}
              >
                {n.time}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div
        className="px-5 py-3"
        style={{ borderTop: "1px solid var(--color-card-border)" }}
      >
        <p
          className="text-center text-[11px] font-medium"
          style={{ color: "var(--color-text-sub)" }}
        >
          Semua notifikasi telah ditampilkan
        </p>
      </div>
    </div>
  );
}
export default function Topbar({ onMenuToggle }) {
  const { pathname } = useLocation();
  const { t } = useLanguageStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const notifRef = useRef(null);
  const isDark = true;
  const titleKey = pageTitles[pathname];
  const title = titleKey ? t(`topbar.titles.${titleKey}`) : "CamMatrix";
  const meta = pageMeta[pathname];
  const unread = notifications.filter((n) => !n.read).length;
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
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotif(false);
    };
    if (showNotif) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotif]);
  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  return (
    <>
      {showSearch && (
        <SearchModal onClose={() => setShowSearch(false)} isDark={isDark} />
      )}
      <header
        className="h-14 flex items-center justify-between px-5 shrink-0"
        style={{
          backgroundColor: "rgba(10,10,15,0.95)",
          borderBottom: "1px solid #1F1F2E",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            id="topbar-menu-toggle"
            onClick={onMenuToggle}
            className="p-2 rounded-xl transition-all duration-200 hover:scale-105"
            style={{ color: "var(--color-text-sub)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--color-surface-elevated)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <Menu size={17} />
          </button>
          <div className="flex items-center gap-2.5">
            <h1
              className="text-[15px] font-bold"
              style={{
                color: "var(--color-text-base)",
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>
            {meta && (
              <span
                className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-md shrink-0"
                style={{
                  color: "var(--color-text-sub)",
                  backgroundColor: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-card-border)",
                  letterSpacing: "0.03em",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
                />
                {meta.badge}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="topbar-search-btn"
            onClick={() => setShowSearch(true)}
            className="hidden md:flex items-center gap-2.5"
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              background: "#111118",
              border: "1px solid #1F1F2E",
              color: "#71717A",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
              minWidth: 200,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#1F1F2E";
              e.currentTarget.style.color = "#71717A";
            }}
          >
            <Search size={13} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left" }}>Cari halaman...</span>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 2,
                fontSize: 10, padding: "2px 6px", borderRadius: 5,
                background: "#0A0A0F", border: "1px solid #2D2D3F",
                color: "#3D3D4F", fontFamily: "monospace", letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              <Command size={9} /> K
            </span>
          </button>
          <div ref={notifRef} className="relative">
            <button
              id="topbar-notif-btn"
              onClick={() => setShowNotif((v) => !v)}
              className="relative p-2 rounded-xl transition-all duration-200 hover:scale-105"
              style={{
                color: "var(--color-text-sub)",
                backgroundColor: showNotif
                  ? "var(--color-surface-elevated)"
                  : "",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--color-surface-elevated)")
              }
              onMouseLeave={(e) => {
                if (!showNotif) e.currentTarget.style.backgroundColor = "";
              }}
            >
              <Bell size={17} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute", top: 5, right: 5,
                    minWidth: 16, height: 16, borderRadius: 99,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "#0A0A0F",
                    background: "#FFFFFF", padding: "0 3px",
                    lineHeight: 1,
                  }}
                >
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
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
