import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CosmicBackground from "../CosmicBackground";
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ backgroundColor: "#0A0A0F" }}
    >
      <CosmicBackground particleOpacity={0.22} />
      <div
        style={{
          position: "relative",
          zIndex: 20,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(-24px)",
          transition:
            "opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s",
        }}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{
          position: "relative",
          zIndex: 10,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition:
            "opacity 0.7s ease 0.2s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s",
        }}
      >
        <Topbar onMenuToggle={() => setCollapsed(!collapsed)} />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: "24px 28px" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
