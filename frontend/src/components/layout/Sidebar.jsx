import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, MonitorPlay, Camera, Film, ScanFace,
  Users, Settings, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
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

function NavItem({ to, icon: Icon, label, collapsed, isActive }) {
  const [hov, setHov] = useState(false);
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "8px 0" : "8px 12px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        textDecoration: "none",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
        background: isActive
          ? "rgba(255,255,255,0.07)"
          : hov ? "rgba(255,255,255,0.04)" : "transparent",
        color: isActive ? "#FFFFFF" : hov ? "#CCCCCC" : "#71717A",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Active pill indicator */}
      {isActive && (
        <span style={{
          position: "absolute", left: 0, top: "50%",
          transform: "translateY(-50%)",
          width: 3, height: 18, borderRadius: "0 3px 3px 0",
          background: "#FFFFFF",
          boxShadow: "0 0 8px rgba(255,255,255,0.4)",
        }} />
      )}
      <Icon size={15} style={{ flexShrink: 0, color: "inherit", transition: "color 0.15s" }} />
      {!collapsed && (
        <span style={{
          flex: 1, overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", transition: "opacity 0.2s",
        }}>
          {label}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { logout, user } = useAuthStore();
  const { t }            = useLanguageStore();
  const navigate         = useNavigate();
  const { pathname }     = useLocation();
  const [logHov, setLogHov] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };
  const isAdmin  = user?.role === "ADMIN" || user?.role === "admin";
  const initial  = (user?.full_name || user?.name || "A").charAt(0).toUpperCase();
  const fullName = user?.full_name || user?.name || "Administrator";
  const role     = user?.role || "Admin";

  return (
    <aside style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      flexShrink: 0,
      overflow: "hidden",
      width: collapsed ? 60 : 228,
      transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
      background: "rgba(10,10,15,0.97)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRight: "1px solid #1A1A26",
    }}>

      {/* ── Logo ── */}
      <div style={{
        display: "flex", alignItems: "center", height: 58,
        padding: collapsed ? "0 12px" : "0 16px",
        borderBottom: "1px solid #1A1A26",
        flexShrink: 0, gap: 10, overflow: "hidden",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <div style={{ flexShrink: 0 }}>
          <CamLogo size={28} radius="7px" />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden", minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              CamMatrix
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: "#3D3D4F", whiteSpace: "nowrap" }}>v2.1.0</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#2D2D3F" }} />
              <span style={{ fontSize: 10, color: "#3D3D4F", whiteSpace: "nowrap" }}>Enterprise</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>
        {groups.map((group, gi) => {
          const items = navItems.filter(n => n.group === group.key && (!n.adminOnly || isAdmin));
          if (items.length === 0) return null;
          return (
            <div key={group.key} style={{ marginTop: gi > 0 ? 18 : 0 }}>
              {/* Group label */}
              {!collapsed && (
                <div style={{
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.12em", color: "#2D2D3F",
                  padding: "0 12px", marginBottom: 4,
                }}>
                  {group.label}
                </div>
              )}
              {collapsed && gi > 0 && (
                <div style={{ width: 20, height: 1, background: "#1A1A26", margin: "8px auto 8px" }} />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {items.map(({ to, icon, labelKey }) => {
                  const isActive = pathname === to || pathname.startsWith(to + "/");
                  return (
                    <NavItem
                      key={to} to={to} icon={icon}
                      label={t(`nav.${labelKey}`)}
                      collapsed={collapsed} isActive={isActive}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ flexShrink: 0, padding: "8px 8px 10px", borderTop: "1px solid #1A1A26" }}>
        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "10px 0" : "10px 12px",
          borderRadius: 9, marginBottom: 4,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid #1A1A26",
          overflow: "hidden",
          transition: "background 0.15s",
        }}>
          {/* Avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "#1F1F2E", border: "1px solid #2D2D3F",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#FFFFFF",
          }}>
            {initial}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fullName}
              </div>
              <div style={{ fontSize: 10, color: "#3D3D4F", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {role}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          onMouseEnter={() => setLogHov(true)}
          onMouseLeave={() => setLogHov(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 9, width: "100%",
            padding: collapsed ? "8px 0" : "8px 12px",
            borderRadius: 8, fontSize: 13, fontWeight: 400,
            cursor: "pointer", border: "none",
            background: logHov ? "rgba(239,68,68,0.06)" : "transparent",
            color: logHov ? "#f87171" : "#3D3D4F",
            transition: "background 0.15s, color 0.15s",
          }}
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
          position: "absolute", top: "50%", right: -11,
          transform: "translateY(-50%)",
          width: 22, height: 22, borderRadius: "50%",
          border: "1px solid #1F1F2E",
          background: "#0D0D14",
          color: "#71717A",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 20,
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#FFF"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1F1F2E"; e.currentTarget.style.color = "#71717A"; }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </aside>
  );
}
