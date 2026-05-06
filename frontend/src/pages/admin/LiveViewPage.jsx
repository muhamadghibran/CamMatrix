import { useState, useRef, useEffect, useCallback } from "react";
import {
  Maximize2, Grid2X2, Grid3X3, LayoutGrid, WifiOff,
  Expand, Minimize2, RefreshCw, Download, MonitorPlay
} from "lucide-react";
import Hls from "hls.js";
import { useCameraStore } from "../../store/cameraStore";
import api from "../../utils/api";

const LAYOUTS = [
  { key: "1x1", icon: Maximize2,  cols: 1, label: "1×1",  max: 1  },
  { key: "2x2", icon: Grid2X2,   cols: 2, label: "2×2",  max: 4  },
  { key: "3x3", icon: Grid3X3,   cols: 3, label: "3×3",  max: 9  },
  { key: "4x4", icon: LayoutGrid, cols: 4, label: "4×4",  max: 16 },
];

/* ── HLS Player ── */
function HlsPlayer({ src, objectFit = "cover" }) {
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
      video.src = src;
      video.play().catch(() => {});
    }
    return () => { hlsRef.current?.destroy(); };
  }, [src]);

  return (
    <video
      ref={videoRef}
      muted playsInline autoPlay
      style={{ width: "100%", height: "100%", objectFit, background: "#000" }}
    />
  );
}

/* ── Camera Card (mirip halaman publik, dengan fitur admin) ── */
function CameraCard({ cam, index }) {
  const [hov, setHov] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloadState, setDownloadState] = useState({ state: "idle", progress: 0 });
  const cardRef = useRef(null);
  const isOffline = cam.status === "offline";
  const isLive    = cam.status === "live" || cam.status === "recording";

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleDownload = async () => {
    if (downloadState.state !== "idle") return;
    setDownloadState({ state: "processing", progress: 0 });
    try {
      const res = await api.get(`/cameras/${cam.id}/download`, {
        responseType: "blob",
        onDownloadProgress: (e) => {
          if (e.total) {
            setDownloadState({ state: "downloading", progress: Math.round((e.loaded * 100) / e.total) });
          } else {
            setDownloadState({ state: "downloading", progress: 0 });
          }
        },
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `${cam.name.replace(/ /g, "_")}_terakhir_30_menit.mp4`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setDownloadState({ state: "success", progress: 100 });
      setTimeout(() => setDownloadState({ state: "idle", progress: 0 }), 2500);
    } catch (err) {
      let msg = "Belum ada rekaman. Biarkan kamera menyala beberapa menit terlebih dahulu.";
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try { const j = JSON.parse(text); if (j.detail) msg = j.detail; } catch {}
      } else if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      }
      alert(`[Download] ${msg}`);
      setDownloadState({ state: "idle", progress: 0 });
    }
  };

  const dlBusy = downloadState.state !== "idle" && downloadState.state !== "success";

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#111118",
        border: `1px solid ${hov ? "rgba(255,255,255,0.18)" : "#1F1F2E"}`,
        borderRadius: isFullscreen ? 0 : 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
        transform: hov && !isOffline && !isFullscreen ? "translateY(-2px)" : "translateY(0)",
        animation: `fadeUpIn 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms both`,
      }}
    >
      {/* Video Area */}
      <div style={{
        position: isFullscreen ? "absolute" : "relative",
        inset: isFullscreen ? 0 : "auto",
        aspectRatio: isFullscreen ? "unset" : "16/9",
        background: "#000",
        zIndex: isFullscreen ? 10 : "auto",
      }}>
        {isOffline ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <WifiOff size={22} style={{ color: "#2D2D3F" }} />
            <span style={{ color: "#3D3D4F", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sinyal Terputus</span>
          </div>
        ) : (
          cam.stream_url && <HlsPlayer src={cam.stream_url} objectFit={isFullscreen ? "contain" : "cover"} />
        )}

        {/* LIVE / OFFLINE badge — top left */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.1)",
          padding: "3px 9px", borderRadius: 5, backdropFilter: "blur(6px)",
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: isOffline ? "#3D3D4F" : "#FFFFFF",
            boxShadow: isOffline ? "none" : "0 0 6px rgba(255,255,255,0.6)",
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: isOffline ? "#3D3D4F" : "#FFFFFF", letterSpacing: "0.06em" }}>
            {isOffline ? "OFFLINE" : "LIVE"}
          </span>
        </div>

        {/* CAM number — bottom right */}
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 4, padding: "2px 7px", backdropFilter: "blur(4px)",
        }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, fontFamily: "monospace" }}>
            CAM {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Admin controls — top right (muncul saat hover) */}
        {hov && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            display: "flex", gap: 6,
          }}>
            {/* Download button */}
            {!isOffline && (
              <button
                onClick={handleDownload}
                disabled={dlBusy}
                title={downloadState.state === "processing" ? "Memproses..." : downloadState.state === "downloading" ? "Mengunduh..." : "Unduh 30 menit terakhir"}
                style={{
                  height: 28, padding: "0 10px", borderRadius: 6,
                  background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#FFFFFF", cursor: dlBusy ? "wait" : "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 10, fontWeight: 700, backdropFilter: "blur(6px)",
                  opacity: dlBusy ? 0.7 : 1, transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!dlBusy) e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
                onMouseLeave={e => { if (!dlBusy) e.currentTarget.style.background = "rgba(0,0,0,0.72)"; }}
              >
                {downloadState.state === "idle"        && <><Download size={11} /> REC</>}
                {downloadState.state === "processing"  && <><RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> PROSES</>}
                {downloadState.state === "downloading" && <><Download size={11} /> {downloadState.progress}%</>}
                {downloadState.state === "success"     && <span style={{ color: "#4ade80" }}>✓ SELESAI</span>}
              </button>
            )}

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#FFFFFF", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(6px)", transition: "background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.72)"; }}
            >
              {isFullscreen ? <Minimize2 size={11} /> : <Expand size={11} />}
            </button>
          </div>
        )}
      </div>

      {/* Info bawah — disembunyikan saat fullscreen */}
      {!isFullscreen && (
        <div style={{ padding: "14px 16px", borderTop: "1px solid #1A1A26" }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#FFFFFF" }}>{cam.name}</p>
          {cam.location && (
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#71717A" }}>{cam.location}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div style={{ background: "#111118", borderRadius: 12, border: "1px solid #1F1F2E", overflow: "hidden" }}>
      <div style={{ aspectRatio: "16/9", background: "#0D0D14" }} />
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 14, borderRadius: 4, background: "#1A1A26", width: "55%" }} />
        <div style={{ height: 11, borderRadius: 4, background: "#1A1A26", width: "35%" }} />
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function LiveViewPage() {
  const { cameras, fetchCameras, fetchStatuses, loading } = useCameraStore();
  const [layout, setLayout] = useState("2x2");
  const [lastUpdate, setLastUpdate] = useState(null);
  const fullscreenRef = useRef(null);

  const refresh = useCallback(async () => {
    await fetchCameras();
    await fetchStatuses();
    setLastUpdate(new Date());
  }, [fetchCameras, fetchStatuses]);

  useEffect(() => {
    refresh();
    const interval = setInterval(fetchStatuses, 10000);
    return () => clearInterval(interval);
  }, [refresh, fetchStatuses]);

  const currentLayout = LAYOUTS.find(l => l.key === layout);
  const cols          = currentLayout?.cols || 2;
  const visibleCams   = cameras.slice(0, currentLayout?.max ?? cameras.length);

  const liveCount    = cameras.filter(c => c.status === "live" || c.status === "recording").length;
  const offlineCount = cameras.filter(c => c.status === "offline").length;

  const handleFullscreen = (cam) => {
    // Buka URL stream dalam tab baru sebagai fallback sederhana
    if (cam.stream_url) {
      window.open(cam.stream_url, "_blank");
    }
  };

  const cols_css = `repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
      <style>{`
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        {/* Title */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <MonitorPlay size={14} style={{ color: "#71717A" }} />
            <span style={{ fontSize: 12, color: "#71717A", fontWeight: 500, letterSpacing: "0.04em" }}>Siaran Langsung</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
            Semua Kamera
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#71717A" }}>
            {loading ? "Memuat..." : `${cameras.length} kamera · `}
            {!loading && <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{liveCount} aktif</span>}
            {!loading && offlineCount > 0 && <span style={{ color: "#52525B" }}> · {offlineCount} mati</span>}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Last update */}
          {lastUpdate && (
            <span style={{ fontSize: 12, color: "#3D3D4F" }}>
              {lastUpdate.toLocaleTimeString("id-ID")}
            </span>
          )}

          {/* Refresh */}
          <button onClick={refresh} title="Refresh" style={{
            width: 34, height: 34, borderRadius: 8, background: "transparent",
            border: "1px solid #1A1A26", color: "#71717A", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.15s, border-color 0.15s"
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1A1A26"; }}
          >
            <RefreshCw size={14} />
          </button>

          {/* Layout switcher */}
          <div style={{ display: "flex", gap: 4, background: "#111118", border: "1px solid #1F1F2E", borderRadius: 8, padding: 4 }}>
            {LAYOUTS.map(l => {
              const Icon    = l.icon;
              const active  = layout === l.key;
              return (
                <button
                  key={l.key}
                  onClick={() => setLayout(l.key)}
                  title={l.label}
                  style={{
                    width: 32, height: 32, borderRadius: 6, background: active ? "#FFFFFF" : "transparent",
                    border: "none", color: active ? "#0A0A0F" : "#52525B", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(to right, #1F1F2E, transparent)", marginTop: -8 }} />

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: cols_css, gap: 16 }}>
          {Array.from({ length: cols * 2 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : cameras.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "96px 24px", textAlign: "center",
          border: "1px dashed #1F1F2E", borderRadius: 16, background: "rgba(17,17,24,0.4)",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <MonitorPlay size={22} style={{ color: "#2D2D3F" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", margin: "0 0 8px" }}>Belum Ada Kamera</h2>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0, maxWidth: 320, lineHeight: 1.7 }}>
            Tambahkan kamera melalui menu <strong style={{ color: "#FFF" }}>Kamera</strong> untuk mulai memantau.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: cols_css, gap: 16 }}>
          {visibleCams.map((cam, i) => (
            <CameraCard key={cam.id} cam={cam} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
