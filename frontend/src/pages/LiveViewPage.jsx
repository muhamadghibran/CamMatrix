import { useState, useRef, useEffect } from "react";
import { Maximize2, Grid2X2, Grid3X3, LayoutGrid, Camera, WifiOff, Radio, Expand, Minimize2, Clock } from "lucide-react";
import { useLanguageStore } from "../store/languageStore";
import AnimatedText from "../components/AnimatedText";

const cameras = [
  { id: 1, name: "Main Entrance",  location: "Block A", status: "live" },
  { id: 2, name: "Lobby",          location: "Block A", status: "live" },
  { id: 3, name: "Server Room",    location: "Block B", status: "live" },
  { id: 4, name: "Parking Lot",    location: "Block C", status: "offline" },
  { id: 5, name: "Side Gate",      location: "Block C", status: "live" },
  { id: 6, name: "Rooftop",        location: "Block D", status: "recording" },
  { id: 7, name: "Emergency Exit", location: "Block B", status: "live" },
  { id: 8, name: "Reception",      location: "Block A", status: "live" },
  { id: 9, name: "Warehouse",      location: "Block E", status: "live" },
];

const gridLayouts = [
  { key: "1x1", icon: Maximize2,  cols: 1, label: "1×1" },
  { key: "2x2", icon: Grid2X2,   cols: 2, label: "2×2" },
  { key: "3x3", icon: Grid3X3,   cols: 3, label: "3×3" },
  { key: "4x4", icon: LayoutGrid, cols: 4, label: "4×4" },
];

const statusCfg = {
  live:      { color: "#10b981", label: "live",      glow: "rgba(16,185,129,0.5)"  },
  offline:   { color: "#6b7280", label: "offline",   glow: "rgba(107,114,128,0.4)" },
  recording: { color: "#ef4444", label: "recording", glow: "rgba(239,68,68,0.5)"   },
};

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("id-ID", { hour12: false }));
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString("id-ID", { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-[11px]" style={{ color: "#06b6d4", letterSpacing: "0.08em" }}>{time}</span>;
}

function CameraCell({ cam, t, index }) {
  const [hovered, setHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [entered, setEntered] = useState(false);
  const cellRef = useRef(null);
  const s = statusCfg[cam.status];
  const isOffline  = cam.status === "offline";
  const isRecording = cam.status === "recording";

  // Staggered entrance
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 80 + index * 75);
    return () => clearTimeout(timer);
  }, [index]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cellRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={cellRef}
      className="relative rounded-2xl overflow-hidden aspect-video flex flex-col group cursor-pointer"
      style={{
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${hovered ? `${s.color}55` : "var(--color-card-border)"}`,
        boxShadow: hovered
          ? `0 0 0 1px ${s.color}30, 0 10px 40px ${s.color}20, 0 0 60px ${s.color}08`
          : "0 2px 8px rgba(0,0,0,0.12)",
        /* Entrance */
        opacity: entered ? 1 : 0,
        transform: entered
          ? hovered ? "scale(1.015) translateY(-2px)" : "scale(1) translateY(0)"
          : "scale(0.94) translateY(18px)",
        transition: entered
          ? "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.35s ease"
          : `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.075}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.075}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Video feed area ── */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: isOffline ? "var(--color-surface-elevated)" : "#02030d" }}>

        {isOffline ? (
          <div className="text-center space-y-2 transition-all duration-500" style={{ opacity: hovered ? 0.7 : 0.4 }}>
            <WifiOff size={28} className="mx-auto" style={{ color: "var(--color-text-sub)" }} />
            <p className="text-xs font-semibold" style={{ color: "var(--color-text-sub)" }}>{t("liveView.offline")}</p>
          </div>
        ) : (
          <>
            {/* Video gradient bg */}
            <div className="absolute inset-0 transition-all duration-700" style={{
              background: isRecording
                ? `radial-gradient(ellipse at 25% 35%, rgba(100,0,0,0.7) 0%, transparent 55%),
                   radial-gradient(ellipse at 75% 65%, rgba(80,0,20,0.6) 0%, transparent 50%),
                   linear-gradient(180deg, #090001 0%, #0d0205 60%, #0f030a 100%)`
                : `radial-gradient(ellipse at 25% 35%, rgba(0,15,55,0.75) 0%, transparent 55%),
                   radial-gradient(ellipse at 75% 65%, rgba(0,25,70,0.65) 0%, transparent 50%),
                   linear-gradient(180deg, #010209 0%, #020511 60%, #030818 100%)`,
            }} />

            {/* Hover color overlay */}
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
              style={{
                opacity: hovered ? 0.08 : 0,
                background: `radial-gradient(ellipse at 50% 50%, ${s.color}, transparent 70%)`,
              }} />

            {/* Scan line */}
            <div className="absolute left-0 right-0 h-px animate-scan"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${s.color}50 30%, ${s.color} 50%, ${s.color}50 70%, transparent 100%)`,
                opacity: hovered ? 0.5 : 0.18,
                transition: "opacity 0.4s ease",
              }} />

            {/* CRT / interlace overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 3px)",
              mixBlendMode: "multiply",
            }} />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
            }} />

            {/* Center cam icon */}
            <div className="relative text-center transition-all duration-500"
              style={{ opacity: hovered ? 0.07 : 0.12, transform: hovered ? "scale(1.15)" : "scale(1)" }}>
              <Camera size={36} style={{ color: s.color }} />
            </div>

            {/* Corner brackets on hover */}
            {["tl","tr","bl","br"].map(pos => (
              <div key={pos} className="absolute pointer-events-none transition-all duration-400"
                style={{
                  width: 18, height: 18,
                  top:    pos.startsWith("t") ? 8 : "auto",
                  bottom: pos.startsWith("b") ? 8 : "auto",
                  left:   pos.endsWith("l")   ? 8 : "auto",
                  right:  pos.endsWith("r")   ? 8 : "auto",
                  borderTop:    pos.startsWith("t") ? `2px solid ${s.color}` : "none",
                  borderBottom: pos.startsWith("b") ? `2px solid ${s.color}` : "none",
                  borderLeft:   pos.endsWith("l")   ? `2px solid ${s.color}` : "none",
                  borderRight:  pos.endsWith("r")   ? `2px solid ${s.color}` : "none",
                  opacity: hovered ? 0.85 : 0,
                  transform: hovered ? "scale(1)" : pos === "tl" ? "translate(-4px,-4px)" : pos === "tr" ? "translate(4px,-4px)" : pos === "bl" ? "translate(-4px,4px)" : "translate(4px,4px)",
                  transition: `opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)`,
                }} />
            ))}

            {/* REC indicator */}
            {isRecording && (
              <div className="absolute top-2.5 right-12 flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.4)", backdropFilter: "blur(8px)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-blink" />
                <span className="text-[9px] font-bold text-red-400 tracking-widest">REC</span>
              </div>
            )}
          </>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)",
            border: hovered ? `1px solid ${s.color}40` : "1px solid transparent",
            transform: hovered ? "translateY(0)" : "translateY(0)",
          }}>
          {cam.status === "live" ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ backgroundColor: s.color }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: s.color }} />
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>
            {t(`dashboard.status.${s.label}`)}
          </span>
        </div>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          className="absolute top-2 right-2 p-1.5 rounded-lg"
          style={{
            backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)",
            color: hovered ? "#fff" : "#94a3b8",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "scale(1) translateY(0)" : "scale(0.85) translateY(-4px)",
            transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1), color 0.2s ease, background-color 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${s.color}30`; e.currentTarget.style.transform = "scale(1.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.65)"; e.currentTarget.style.transform = "scale(1) translateY(0)"; }}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Expand size={13} />}
        </button>

        {/* Live timestamp overlay (bottom-right) */}
        {!isOffline && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
              opacity: hovered ? 1 : 0.5,
              transition: "opacity 0.3s ease",
            }}>
            <Clock size={9} style={{ color: s.color }} />
            <LiveClock />
          </div>
        )}
      </div>

      {/* ── Info bar — slides up on hover ── */}
      <div
        className="px-4 py-3 shrink-0 flex items-center justify-between relative overflow-hidden"
        style={{
          borderTop: `1px solid ${hovered ? `${s.color}30` : "var(--color-card-border)"}`,
          backgroundColor: hovered ? "var(--color-surface-elevated)" : "var(--color-surface)",
          transition: "background-color 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* Glow sweep on hover */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: hovered ? 1 : 0,
            background: `linear-gradient(90deg, ${s.color}08 0%, transparent 60%)`,
          }} />

        <div className="relative z-10">
          <p className="text-[13px] font-semibold leading-tight transition-colors duration-300"
            style={{ color: hovered ? "var(--color-text-base)" : "var(--color-text-base)" }}>
            {cam.name}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-sub)" }}>{cam.location}</p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          {!isOffline && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-all duration-300"
              style={{
                color: s.color,
                backgroundColor: `${s.color}12`,
                border: `1px solid ${s.color}25`,
                opacity: hovered ? 1 : 0.6,
              }}>
              25 fps
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveViewPage() {
  const [layout, setLayout] = useState("2x2");
  const { t } = useLanguageStore();

  const currentLayout = gridLayouts.find(l => l.key === layout);
  const cols = currentLayout?.cols || 2;
  const visibleCameras = layout === "1x1" ? cameras.slice(0, 1)
    : layout === "2x2" ? cameras.slice(0, 4)
    : layout === "3x3" ? cameras.slice(0, 9)
    : cameras;

  const liveCount = cameras.filter(c => c.status === "live" || c.status === "recording").length;

  return (
    <div className="flex flex-col gap-5 h-full relative z-10 w-full">

      {/* Toolbar */}
      <div className="flex items-center justify-between animate-slide-up opacity-0-init shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: "var(--color-text-base)" }}>
            <AnimatedText text={t("liveView.showing", { visible: visibleCameras.length, total: cameras.length })} delayOffset={200} splitBy="word" />
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ color: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-blink" />
            {liveCount} LIVE
          </span>
        </div>

        {/* Layout selector */}
        <div className="flex items-center gap-1 p-1.5 rounded-2xl"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)" }}>
          {/* eslint-disable-next-line no-unused-vars */}
          {gridLayouts.map(({ key, icon: Icon, label }) => {
            const isActive = layout === key;
            return (
              <button key={key} onClick={() => setLayout(key)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold"
                style={{
                  transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
                  ...(isActive
                    ? { background: "linear-gradient(135deg,#06b6d4,#00ffff)", color: "#fff", boxShadow: "0 2px 12px rgba(6,182,212,0.45)" }
                    : { color: "var(--color-text-sub)" }
                  ),
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = "var(--color-text-base)"; e.currentTarget.style.transform = "scale(1.05)"; }}}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = "var(--color-text-sub)"; e.currentTarget.style.transform = ""; }}}
              >
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera grid */}
      <div
        className="grid gap-4 flex-1 pb-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {visibleCameras.map((cam, index) => (
          <CameraCell key={`${layout}-${cam.id}`} cam={cam} t={t} index={index} />
        ))}
      </div>
    </div>
  );
}
