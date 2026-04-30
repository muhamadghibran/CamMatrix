import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "#0A0A0F",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        position: "relative",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          flexShrink: 0,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(-24px)",
          transition: "opacity 0.5s ease 0.05s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s",
        }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main content */}
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{
          position: "relative",
          zIndex: 10,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s",
        }}
      >
        <Topbar onMenuToggle={() => setCollapsed(!collapsed)} />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: "28px 32px" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
