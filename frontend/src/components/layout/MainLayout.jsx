import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useThemeStore } from "../../store/themeStore";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: "var(--color-bg-page)" }}>

      {/* ── Global Ambient Orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {isDark ? (
          <>
            <div
              className="absolute rounded-full animate-orb"
              style={{
                width: "700px", height: "700px",
                top: "-20%", left: "-5%",
                background: "radial-gradient(circle, rgba(6,182,212,0.055) 0%, transparent 65%)",
              }}
            />
            <div
              className="absolute rounded-full animate-orb-alt"
              style={{
                width: "600px", height: "600px",
                bottom: "-15%", right: "0%",
                background: "radial-gradient(circle, rgba(0,255,255,0.05) 0%, transparent 65%)",
              }}
            />
            <div
              className="absolute rounded-full animate-orb"
              style={{
                width: "400px", height: "400px",
                top: "40%", right: "20%",
                background: "radial-gradient(circle, rgba(6,182,212,0.035) 0%, transparent 65%)",
                animationDelay: "7s",
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute rounded-full animate-orb"
              style={{
                width: "600px", height: "600px",
                top: "-15%", left: "-8%",
                background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%)",
              }}
            />
            <div
              className="absolute rounded-full animate-orb-alt"
              style={{
                width: "500px", height: "500px",
                bottom: "-10%", right: "5%",
                background: "radial-gradient(circle, rgba(0,255,255,0.05) 0%, transparent 65%)",
              }}
            />
          </>
        )}

        {/* Subtle dot grid pattern */}
        <div
          className="absolute inset-0 dot-grid"
          style={{ opacity: isDark ? 0.12 : 0.35 }}
        />

        {/* Global Flowing Lines - Left */}
        <div className="absolute inset-y-0 left-[240px] w-full md:w-1/2 z-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-10 hidden lg:block">
           <svg className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%] transition-opacity duration-500" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path className="animate-draw-line delay-100" d="M0 0C100 200 150 300 150 500C150 700 0 800 0 800" stroke={isDark ? "#ffffff" : "#000000"} strokeWidth="1.5" />
             <path className="animate-draw-line delay-300" d="M0 0C120 250 180 350 180 500C180 650 0 800 0 800" stroke={isDark ? "#ffffff" : "#000000"} strokeWidth="1.5" />
             <path className="animate-draw-line delay-500" d="M0 0C140 300 210 400 210 500C210 600 0 800 0 800" stroke={isDark ? "#ffffff" : "#000000"} strokeWidth="1.5" />
           </svg>
        </div>

        {/* Global Flowing Lines - Right */}
        <div className="absolute inset-y-0 right-0 w-full md:w-1/2 z-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-10 hidden lg:block">
           <svg className="absolute w-[150%] h-[150%] top-[-25%] right-0 transition-opacity duration-500" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="animate-draw-line delay-200" d="M150 0C150 250 80 350 80 500C80 650 150 800 150 800" stroke={isDark ? "#ffffff" : "#000000"} strokeWidth="1.5" />
            <path className="animate-draw-line delay-400" d="M250 0C250 350 140 450 140 500C140 550 250 800 250 800" stroke={isDark ? "#ffffff" : "#000000"} strokeWidth="1.5" />
            <path className="animate-draw-line delay-1000" d="M350 0C350 450 200 450 200 500C200 570 350 800 350 800" stroke={isDark ? "#ffffff" : "#000000"} strokeWidth="1.5" />
          </svg>
        </div>

        {/* Rotating decorative ring (dark only) */}
        {isDark && (
          <div
            className="absolute animate-rotate-slow opacity-[0.04]"
            style={{
              width: "900px", height: "900px",
              top: "-30%", left: "-20%",
              border: "1px solid rgba(0,255,255,0.8)",
              borderRadius: "50%",
            }}
          />
        )}
      </div>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Topbar onMenuToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
