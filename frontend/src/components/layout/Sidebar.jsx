import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, MonitorPlay, Camera, Film, ScanFace,
  Users, Settings, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useLanguageStore } from "../../store/languageStore";
import CamLogo from "../CamLogo";

const navItems = [
  { to: "/app/dashboard",  icon: LayoutDashboard, labelKey: "dashboard",     group: "monitor" },
  { to: "/app/live",       icon: MonitorPlay,     labelKey: "liveView",      group: "monitor" },
  { to: "/app/cameras",    icon: Camera,          labelKey: "cameras",       group: "monitor" },
  { to: "/app/recordings", icon: Film,            labelKey: "recordings",    group: "manage"  },
  { to: "/app/face",       icon: ScanFace,        labelKey: "faceAnalytics", group: "manage"  },
  { to: "/app/users",      icon: Users,           labelKey: "users",         group: "system",  adminOnly: true },
  { to: "/app/settings",   icon: Settings,        labelKey: "settings",      group: "system"  },
];

const groups = [
  { key: "monitor", label: "Pemantauan" },
  { key: "manage",  label: "Manajemen"  },
  { key: "system",  label: "Sistem"     },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { logout, user } = useAuthStore();
  const { t }            = useLanguageStore();
  const navigate         = useNavigate();
  const { pathname }     = useLocation();

  const handleLogout = () => { logout(); navigate("/login"); };
  const isAdmin      = user?.role === "ADMIN" || user?.role === "admin";
  const initial      = (user?.name || "A").charAt(0).toUpperCase();

  return (
    <aside
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flexShrink: 0,
        overflow: "hidden",
        width: collapsed ? 64 : 232,
        transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: "var(--color-surface)",
        borderRight: "1px solid var(--color-card-border)",
      }}
    >
      {/* ── Logo ── */}
      <div style={{ display: "flex", alignItems: "center", height: 56, padding: "0 16px", borderBottom: "1px solid var(--color-card-border)", flexShrink: 0, gap: 10, overflow: "hidden" }}>
        <div style={{ flexShrink: 0 }}>
          <CamLogo size={30} radius="8px" />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden", minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-base)", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              CamMatrix
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-sub)", whiteSpace: "nowrap" }}>
              v2.1.0 — Enterprise
            </div>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 8px" }}>
        {groups.map((group, gi) => {
          const items = navItems.filter((n) => n.group === group.key && (!n.adminOnly || isAdmin));
          if (items.length === 0) return null;
          return (
            <div key={group.key} style={{ marginTop: gi > 0 ? 20 : 0 }}>
              {/* Group label */}
              {!collapsed && (
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--color-text-sub)", opacity: 0.45, padding: "0 10px", marginBottom: 4 }}>
                  {group.label}
                </div>
              )}
              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {items.map(({ to, icon: Icon, labelKey }) => {
                  const isActive = pathname === to || pathname.startsWith(to + "/");
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      title={collapsed ? t(`nav.${labelKey}`) : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: collapsed ? 0 : 10,
                        justifyContent: collapsed ? "center" : "flex-start",
                        padding: collapsed ? "9px 0" : "9px 10px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        textDecoration: "none",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background-color 0.12s",
                        backgroundColor: isActive ? "var(--color-surface-elevated)" : "transparent",
                        color: isActive ? "var(--color-text-base)" : "var(--color-text-sub)",
                        outline: isActive ? "1px solid var(--color-card-border)" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)";
                          e.currentTarget.style.color = "var(--color-text-base)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--color-text-sub)";
                        }
                      }}
                    >
                      {/* Active left bar */}
                      {isActive && (
                        <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 2, height: 16, borderRadius: "0 2px 2px 0", backgroundColor: "var(--color-text-sub)", opacity: 0.6 }} />
                      )}
                      <Icon size={15} style={{ flexShrink: 0, color: "inherit" }} />
                      {!collapsed && (
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t(`nav.${labelKey}`)}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ flexShrink: 0, padding: 8, borderTop: "1px solid var(--color-card-border)" }}>
        {/* User card */}
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, marginBottom: 4, backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)", overflow: "hidden" }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--color-text-base)" }}>
              {initial}
            </div>
            <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-base)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name || "Administrator"}
              </div>
              <div style={{ fontSize: 10, color: "var(--color-text-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {user?.role || "Admin"}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 9,
            width: "100%",
            padding: collapsed ? "9px 0" : "9px 10px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 400,
            cursor: "pointer",
            border: "none",
            backgroundColor: "transparent",
            color: "var(--color-text-sub)",
            transition: "background-color 0.12s, color 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.07)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--color-text-sub)"; }}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        id="sidebar-collapse-btn"
        onClick={onToggle}
        style={{
          position: "absolute",
          top: "50%",
          right: -11,
          transform: "translateY(-50%)",
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: "1px solid var(--color-card-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-sub)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
