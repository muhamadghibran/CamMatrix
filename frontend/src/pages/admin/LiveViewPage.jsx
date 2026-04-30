import { useState, useRef, useEffect } from "react";
import { Maximize2, Grid2X2, Grid3X3, LayoutGrid, Camera, WifiOff, Expand, Minimize2, RefreshCw } from "lucide-react";
import Hls from "hls.js";
import { useLanguageStore } from "../../store/languageStore";
import { useCameraStore } from "../../store/cameraStore";

const gridLayouts = [
  { key: "1x1", icon: Maximize2, cols: 1, label: "1×1" },
  { key: "2x2", icon: Grid2X2, cols: 2, label: "2×2" },
  { key: "3x3", icon: Grid3X3, cols: 3, label: "3×3" },
  { key: "4x4", icon: LayoutGrid, cols: 4, label: "4×4" },
];

function HlsPlayer({ src }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
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

function CameraCell({ cam, index }) {
  const [hovered, setHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cellRef = useRef(null);
  const isOffline = cam.status === "offline";
  const isRecording = cam.status === "recording";
  const isLive = cam.status === "live";

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "16/9",
        background: "#0A0A0F", border: `1px solid ${hovered ? "rgba(255,255,255,0.2)" : "#1F1F2E"}`,
        transition: "border-color 0.2s",
        animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms both`
      }}
    >
      {isOffline ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <WifiOff size={20} style={{ color: "#2D2D3F" }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: "#2D2D3F", margin: 0 }}>OFFLINE</p>
        </div>
      ) : (
        <>
          {cam.stream_url && <HlsPlayer src={cam.stream_url} />}
          {isRecording && (
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: 5, zIndex: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFFFFF" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.05em" }}>REC</span>
            </div>
          )}
        </>
      )}

      {/* Status Badge */}
      <div style={{
        position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, zIndex: 10,
        background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.08)",
        padding: "3px 8px", borderRadius: 5, backdropFilter: "blur(4px)"
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: isOffline ? "#3D3D4F" : "#FFFFFF", boxShadow: !isOffline ? "0 0 6px rgba(255,255,255,0.5)" : "none" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: isOffline ? "#3D3D4F" : "#FFFFFF", letterSpacing: "0.06em" }}>
          {isOffline ? "OFFLINE" : isRecording ? "REC" : "LIVE"}
        </span>
      </div>

      {/* Fullscreen */}
      <button onClick={toggleFullscreen} style={{
        position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 6,
        background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.08)",
        color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        opacity: hovered ? 1 : 0, transition: "opacity 0.2s", zIndex: 10
      }}>
        {isFullscreen ? <Minimize2 size={11} /> : <Expand size={11} />}
      </button>

      {/* Bottom overlay */}
      <div style={{
        position: "absolute", inset: "auto 0 0 0", zIndex: 10, pointerEvents: "none",
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        padding: "28px 12px 12px",
        opacity: hovered ? 1 : 0.7, transition: "opacity 0.2s"
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>{cam.name}</p>
        {cam.location && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>{cam.location}</p>}
      </div>
    </div>
  );
}

export default function LiveViewPage() {
  const [layout, setLayout] = useState("2x2");
  const { t } = useLanguageStore();
  const { cameras, fetchCameras, fetchStatuses, isLoading } = useCameraStore();

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(() => fetchStatuses(), 15000);
    return () => clearInterval(interval);
  }, [fetchCameras, fetchStatuses]);

  const currentLayout = gridLayouts.find((l) => l.key === layout);
  const cols = currentLayout?.cols || 2;
  const visibleCameras = layout === "1x1" ? cameras.slice(0, 1)
    : layout === "2x2" ? cameras.slice(0, 4)
    : layout === "3x3" ? cameras.slice(0, 9)
    : cameras;

  const liveCount = cameras.filter((c) => c.status === "live" || c.status === "recording").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", margin: 0, letterSpacing: "-0.025em" }}>Siaran Langsung</h1>
            <p style={{ fontSize: 12, color: "#71717A", margin: "4px 0 0" }}>
              {visibleCameras.length}/{cameras.length} kamera · {liveCount} aktif
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={fetchCameras} style={{
            width: 32, height: 32, borderRadius: 7, background: "transparent", border: "1px solid #1F1F2E",
            color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}
          onMouseEnter={e=>{e.currentTarget.style.color="#FFF"}} onMouseLeave={e=>{e.currentTarget.style.color="#71717A"}}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          </button>

          {/* Layout switcher */}
          <div style={{ display: "flex", alignItems: "center", background: "#111118", border: "1px solid #1F1F2E", borderRadius: 8, padding: 4, gap: 2 }}>
            {gridLayouts.map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setLayout(key)} title={label} style={{
                width: 30, height: 30, borderRadius: 6, border: "none", cursor: "pointer",
                background: layout === key ? "#1F1F2E" : "transparent",
                color: layout === key ? "#FFFFFF" : "#71717A",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, color 0.15s"
              }}>
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {cameras.length === 0 && !isLoading ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, border: "1px dashed #1F1F2E", borderRadius: 10 }}>
          <Camera size={28} style={{ color: "#2D2D3F" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#71717A", margin: 0 }}>Belum ada kamera terdaftar.</p>
          <p style={{ fontSize: 12, color: "#3D3D4F", margin: 0 }}>Tambahkan kamera RTSP di menu <strong style={{ color: "#71717A" }}>Kamera</strong>.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 12, flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          {visibleCameras.map((cam, i) => (
            <CameraCell key={`${layout}-${cam.id}`} cam={cam} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
