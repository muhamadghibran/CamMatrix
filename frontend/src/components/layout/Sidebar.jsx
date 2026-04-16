import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MonitorPlay,
  Camera,
  Film,
  ScanFace,
  Users,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useLanguageStore } from "../../store/languageStore";

const navItems = [
  { to: "/app/dashboard",  icon: LayoutDashboard, labelKey: "dashboard",    group: "monitor" },
  { to: "/app/live",       icon: MonitorPlay,      labelKey: "liveView",     group: "monitor" },
  { to: "/app/cameras",    icon: Camera,           labelKey: "cameras",      group: "monitor" },
  { to: "/app/recordings", icon: Film,             labelKey: "recordings",   group: "manage"  },
  { to: "/app/face",       icon: ScanFace,         labelKey: "faceAnalytics",group: "manage"  },
  { to: "/app/users",      icon: Users,            labelKey: "users",        group: "system", adminOnly: true },
  { to: "/app/settings",   icon: Settings,         labelKey: "settings",     group: "system" },
];

const groups = [
  { key: "monitor", label: "Pemantauan" },
  { key: "manage",  label: "Manajemen" },
  { key: "system",  label: "Sistem" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { logout, user } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className="relative flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300"
      style={{
        width: collapsed ? "68px" : "240px",
        backgroundColor: "var(--color-surface)",
        borderRight: "1px solid var(--color-card-border)",
      }}
    >
      {/* Ambient gradient top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)" }}
      />

      {/* Logo */}
      <div
        className="flex items-center h-16 px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--color-card-border)" }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #00ffff)",
              boxShadow: "0 0 20px rgba(6,182,212,0.4)",
            }}
          >
            <Shield size={15} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-bold text-sm tracking-wide block" style={{ color: "var(--color-text-base)" }}>
                CamMatrix
              </span>
              <span className="text-[10px] font-medium" style={{ color: "var(--color-text-sub)" }}>
                v2.1.0 — Enterprise
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden space-y-4">
        {groups.map((group) => {
          const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
          const items = navItems.filter(
            (n) => n.group === group.key && (!n.adminOnly || isAdmin)
          );
          if (items.length === 0) return null;
          return (
            <div key={group.key}>
              {!collapsed && (
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 mb-1"
                  style={{ color: "var(--color-text-sub)", opacity: 0.5 }}
                >
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(({ to, icon: NavIcon, labelKey }) => {
                  const isActive = pathname === to || pathname.startsWith(to + "/");
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group overflow-hidden ${
                        isActive ? "sidebar-item-active" : ""
                      }`}
                      style={isActive ? {} : { color: "var(--color-text-sub)" }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)";
                          e.currentTarget.style.color = "var(--color-text-base)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "";
                          e.currentTarget.style.color = "var(--color-text-sub)";
                        }
                      }}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                          style={{ background: "linear-gradient(180deg, #06b6d4, #00ffff)" }}
                        />
                      )}
                      <NavIcon size={17} className="shrink-0" />
                      {!collapsed && (
                        <span className="truncate flex-1">{t(`nav.${labelKey}`)}</span>
                      )}
                      {isActive && !collapsed && (
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-blink shrink-0"
                          style={{ backgroundColor: "#06b6d4" }}
                        />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: "1px solid var(--color-card-border)" }}
      >
        {!collapsed && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2 transition-colors"
            style={{
              background: "color-mix(in srgb, var(--color-surface-elevated) 60%, transparent)",
              border: "1px solid var(--color-card-border)",
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg, #06b6d4, #00ffff)" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text-base)" }}>
                {user?.name || "Administrator"}
              </p>
              <p className="text-[10px] truncate" style={{ color: "var(--color-text-sub)" }}>
                {user?.role || "Administrator"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group"
          style={{ color: "#f87171" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          <LogOut size={16} className="shrink-0 transition-transform group-hover:-translate-x-0.5 duration-200" />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full border z-20 flex items-center justify-center text-xs transition-all duration-200 hover:scale-110"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-card-border)",
          color: "var(--color-text-sub)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
