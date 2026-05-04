import { useState, useRef, useEffect, useCallback } from "react";
import {
  Maximize2, Grid2X2, Grid3X3, LayoutGrid, Camera, WifiOff,
  Expand, Minimize2, RefreshCw, Radio, Signal, SignalZero, Clock, Download
} from "lucide-react";
import Hls from "hls.js";
import { useLanguageStore } from "../../store/languageStore";
import { useCameraStore } from "../../store/cameraStore";

const LAYOUTS = [
  { key: "1x1", icon: Maximize2, cols: 1, label: "1×1", max: 1 },
  { key: "2x2", icon: Grid2X2,  cols: 2, label: "2×2", max: 4 },
  { key: "3x3", icon: Grid3X3,  cols: 3, label: "3×3", max: 9 },
  { key: "4x4", icon: LayoutGrid, cols: 4, label: "4×4", max: 16 },
];

/* ── HLS Player ── */
function HlsPlayer({ src }) {
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, enableWorker: true, startPosition: -1, liveSyncDuration: 2, liveMaxLatencyDuration: 8 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setTimeout(() => { hls.loadSource(src); hls.startLoad(); }, 3000);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src; video.play().catch(() => {});
    }
    return () => { hlsRef.current?.destroy(); };
  }, [src]);
  return <video ref={videoRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} muted playsInline autoPlay />;
}

/* ── Live Pulse Dot ── */
function PulseDot({ active }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 8, height: 8, flexShrink: 0 }}>
      {active && (
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%", background: "#FFFFFF",
          animation: "livePulse 2s ease-out infinite", opacity: 0.4
        }} />
      )}
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#FFFFFF" : "#2D2D3F", flexShrink: 0 }} />
    </span>
  );
}

/* ── Camera Cell ── */
function CameraCell({ cam, index, totalCols }) {
  const [hovered, setHovered]       = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tick, setTick]             = useState(0);
  const cellRef = useRef(null);
  const isOffline   = cam.status === "offline";
  const isRecording = cam.status === "recording";
  const isLive      = cam.status === "live";

  /* Clock tick */
  useEffect(() => {
    if (isOffline) return;
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, [isOffline]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cellRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  /* Uptime counter (fake, resets on mount) */
  const [startTime] = useState(Date.now());
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div
      ref={cellRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", borderRadius: 10, overflow: "hidden", 
        width: "100%", paddingTop: "56.25%", /* 16:9 hack */
        background: "#050508",
        border: `1px solid ${hovered && !isOffline ? "rgba(255,255,255,0.18)" : "#1A1A26"}`,
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: hovered && !isOffline ? "0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)" : "none",
        animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 50}ms both`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
        {/* VIDEO / OFFLINE STATE */}
        {isOffline ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "#050508" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, transparent 1px, transparent 4px)", pointerEvents: "none" }} />
            <SignalZero size={22} style={{ color: "#2D2D3F", position: "relative" }} />
            <div style={{ position: "relative", textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#2D2D3F", margin: "0 0 3px", letterSpacing: "0.08em" }}>SINYAL TERPUTUS</p>
              <p style={{ fontSize: 10, color: "#1F1F2E", margin: 0 }}>{cam.location || cam.name}</p>
            </div>
          </div>
        ) : (
          <>
            {cam.stream_url && <HlsPlayer src={cam.stream_url} />}
            {!cam.stream_url && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#050508" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, transparent 1px, transparent 4px)", pointerEvents: "none" }} />
                <Camera size={20} style={{ color: "#2D2D3F", position: "relative" }} />
                <p style={{ fontSize: 11, color: "#2D2D3F", margin: 0, fontWeight: 600, position: "relative" }}>Menunggu stream...</p>
              </div>
            )}
          </>
        )}

        {/* TOP BAR overlay */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          padding: "10px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between", pointerEvents: "none"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)",
            padding: "4px 9px", borderRadius: 5, backdropFilter: "blur(8px)"
          }}>
            <PulseDot active={isLive || isRecording} />
            <span style={{ fontSize: 10, fontWeight: 700, color: isOffline ? "#3D3D4F" : "#FFFFFF", letterSpacing: "0.07em" }}>
              {isOffline ? "OFFLINE" : isRecording ? "● REC" : "LIVE"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
            {!isOffline && (
              <span style={{
                fontSize: 10, fontWeight: 600, fontFamily: "monospace",
                color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em",
                background: "rgba(0,0,0,0.5)", padding: "3px 7px", borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                {mm}:{ss}
              </span>
            )}
            <button onClick={toggleFullscreen} style={{
              width: 26, height: 26, borderRadius: 5,
              background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              opacity: hovered ? 1 : 0, transition: "opacity 0.2s", backdropFilter: "blur(8px)"
            }}>
              {isFullscreen ? <Minimize2 size={11} /> : <Expand size={11} />}
            </button>
          </div>
        </div>

        {/* BOTTOM overlay */}
        <div style={{
          position: "absolute", inset: "auto 0 0 0", zIndex: 10,
          background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
          padding: "28px 12px 12px", pointerEvents: "none",
          opacity: hovered ? 1 : 0.75, transition: "opacity 0.2s"
        }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", margin: 0, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {cam.name}
              </p>
              {cam.location && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {cam.location}
                </p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
              {cam.fps && cam.fps > 0 && !isOffline && (
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", flexShrink: 0 }}>
                  {cam.fps}fps
                </span>
              )}
              {!isOffline && (
                <button
                  onClick={() => alert("Mengunduh 30 menit terakhir...\n\n(Catatan: Membutuhkan konfigurasi 'record: yes' di server MediaMTX dan API Backend. Silakan izinkan saya mengonfigurasi backend terlebih dahulu)")}
                  title="Unduh 30 menit terakhir"
                  style={{
                    width: 24, height: 24, borderRadius: 5, background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "#FFFFFF", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
                >
                  <Download size={11} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function LiveViewPage() {
  const [layout, setLayout]   = useState("2x2");
  const { t } = useLanguageStore();
  const { cameras, fetchCameras, fetchStatuses, isLoading } = useCameraStore();
  const [now, setNow] = useState("");

  useEffect(() => {
    fetchCameras();
    const poll = setInterval(() => fetchStatuses(), 15000);
    return () => clearInterval(poll);
  }, [fetchCameras, fetchStatuses]);

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const currentLayout = LAYOUTS.find(l => l.key === layout);
  const cols = currentLayout?.cols || 2;
  const visibleCameras = cameras.slice(0, currentLayout?.max ?? cameras.length);

  const liveCount    = cameras.filter(c => c.status === "live" || c.status === "recording").length;
  const offlineCount = cameras.filter(c => c.status === "offline").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%", width: "100%" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes livePulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          70%  { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Topbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: 12 }}>

        {/* Left: title + live stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.025em" }}>Siaran Langsung</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 12, color: "#71717A", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: liveCount > 0 ? "#FFFFFF" : "#2D2D3F", boxShadow: liveCount > 0 ? "0 0 6px rgba(255,255,255,0.5)" : "none" }} />
                {liveCount} aktif
              </span>
              <span style={{ width: 1, height: 10, background: "#1F1F2E" }} />
              <span style={{ fontSize: 12, color: "#71717A" }}>{offlineCount} offline</span>
              <span style={{ width: 1, height: 10, background: "#1F1F2E" }} />
              <span style={{ fontSize: 12, color: "#71717A" }}>{cameras.length} total</span>
            </div>
          </div>

          {/* Live clock */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7, padding: "7px 12px",
            borderRadius: 8, background: "#111118", border: "1px solid #1F1F2E"
          }}>
            <Clock size={12} style={{ color: "#3D3D4F", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "#71717A", letterSpacing: "0.04em" }}>{now}</span>
          </div>
        </div>

        {/* Right: controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Refresh */}
          <button onClick={fetchCameras} title="Refresh" style={{
            width: 34, height: 34, borderRadius: 7, background: "transparent",
            border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s, border-color 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          </button>

          {/* Layout switcher */}
          <div style={{ display: "flex", alignItems: "center", background: "#111118", border: "1px solid #1F1F2E", borderRadius: 8, padding: 3, gap: 2 }}>
            {LAYOUTS.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setLayout(key)} title={label} style={{
                width: 32, height: 32, borderRadius: 6, border: "none", cursor: "pointer",
                background: layout === key ? "#1F1F2E" : "transparent",
                color: layout === key ? "#FFFFFF" : "#71717A",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, color 0.15s", flexShrink: 0
              }}
              onMouseEnter={e => { if (layout !== key) e.currentTarget.style.color = "#FFFFFF"; }}
              onMouseLeave={e => { if (layout !== key) e.currentTarget.style.color = "#71717A"; }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>

          {/* Layout label */}
          <div style={{ padding: "6px 10px", borderRadius: 7, background: "#111118", border: "1px solid #1F1F2E" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#71717A", fontFamily: "monospace" }}>{currentLayout?.label}</span>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      {cameras.length === 0 && !isLoading ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 12, borderRadius: 12, border: "1px dashed #1A1A26",
          background: "rgba(17,17,24,0.4)", backdropFilter: "blur(12px)"
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={22} style={{ color: "#2D2D3F" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#71717A", margin: "0 0 6px" }}>Belum ada kamera terdaftar</p>
            <p style={{ fontSize: 13, color: "#3D3D4F", margin: 0 }}>Tambahkan kamera RTSP di menu <strong style={{ color: "#71717A" }}>Kamera</strong></p>
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 10, flex: 1, overflowY: "auto", paddingBottom: 4,
          alignContent: "start"
        }}>
          {visibleCameras.map((cam, i) => (
            <CameraCell key={`${layout}-${cam.id}`} cam={cam} index={i} totalCols={cols} />
          ))}

          {/* Placeholder slots to fill grid */}
          {Array.from({ length: (currentLayout?.max ?? 0) - visibleCameras.length }).map((_, i) => (
            <div key={`empty-${i}`} style={{
              aspectRatio: "16/9", borderRadius: 10, border: "1px dashed #1A1A26",
              background: "rgba(5,5,8,0.5)", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 10, color: "#1F1F2E", fontWeight: 600, letterSpacing: "0.06em" }}>SLOT KOSONG</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
