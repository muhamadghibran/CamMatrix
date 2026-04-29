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
import CamLogo from "../CamLogo";
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
  { key: "manage",  label: "Manajemen"  },
  { key: "system",  label: "Sistem"     },
];
export default function Sidebar({ collapsed, onToggle }) {
  const { logout, user }       = useAuthStore();
  const { t }                  = useLanguageStore();
  const navigate               = useNavigate();
  const { pathname }           = useLocation();
  const isDark                 = true;
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <aside
      className="relative flex flex-col h-full shrink-0 overflow-hidden"
      style={{
        width: collapsed ? "68px" : "240px",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: "var(--color-surface)",
        borderRight: "1px solid var(--color-card-border)",
        boxShadow: isDark
          ? "2px 0 20px rgba(0,0,0,0.4)"
          : "2px 0 16px rgba(15,23,42,0.06)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), transparent)" }}
      />
      <div
        className="flex items-center h-16 px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--color-card-border)" }}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="shrink-0 flex items-center justify-center w-8 h-8">
            <CamLogo size={32} radius="10px" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              <span
                className="font-bold text-sm block truncate"
                style={{ color: "var(--color-text-base)", letterSpacing: "-0.015em" }}
              >
                CamMatrix
              </span>
              <span className="text-[10px] font-medium" style={{ color: "var(--color-text-sub)" }}>
                v2.1.0 — Enterprise
              </span>
            </div>
          )}
        </div>
      </div>
      <nav className="flex-1 py-4 px-2.5 overflow-y-auto overflow-x-hidden space-y-5">
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
                  className="text-[9px] font-extrabold uppercase px-3 mb-2"
                  style={{
                    color: "var(--color-text-sub)",
                    letterSpacing: "0.13em",
                    opacity: isDark ? 0.45 : 0.55,
                  }}
                >
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(({ to, icon, labelKey }) => {
                  const NavItemIcon = icon;
                  const isActive = pathname === to || pathname.startsWith(to + "/");
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      title={collapsed ? t(`nav.${labelKey}`) : undefined}
                      className={`flex items-center h-9 rounded-xl text-sm font-medium relative overflow-hidden group ${
                        collapsed ? "justify-center px-0" : "gap-3 px-3"
                      } ${isActive ? "sidebar-item-active" : ""}`}
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
                          style={{ background: "linear-gradient(180deg, #06b6d4, #38bdf8)" }}
                        />
                      )}
                      <NavItemIcon
                        size={16}
                        className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                        style={{ color: isActive ? "#06b6d4" : "inherit" }}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1 transition-none">{t(`nav.${labelKey}`)}</span>
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
      <div
        className="shrink-0 p-2.5"
        style={{ borderTop: "1px solid var(--color-card-border)" }}
      >
        {!collapsed && (
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2 overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              border: "1px solid var(--color-card-border)",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-[11px] text-white"
              style={{ background: "linear-gradient(135deg, #0891b2, #06b6d4)" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p
                className="text-xs font-semibold truncate leading-tight"
                style={{ color: "var(--color-text-base)" }}
              >
                {user?.name || "Administrator"}
              </p>
              <p
                className="text-[10px] truncate leading-tight mt-0.5"
                style={{ color: "var(--color-text-sub)" }}
              >
                {user?.role || "Administrator"}
              </p>
            </div>
          </div>
        )}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className={`flex items-center w-full rounded-xl text-sm font-medium group h-9 ${
            collapsed ? "justify-center px-0" : "gap-2.5 px-3"
          }`}
          style={{ color: isDark ? "#f87171" : "#ef4444" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          <LogOut
            size={15}
            className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
      </div>
      <button
        id="sidebar-collapse-btn"
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full border z-20 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:border-cyan-400"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-card-border)",
          color: "var(--color-text-sub)",
          boxShadow: isDark
            ? "0 2px 12px rgba(0,0,0,0.5)"
            : "0 2px 8px rgba(15,23,42,0.12)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
