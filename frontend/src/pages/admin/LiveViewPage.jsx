import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Maximize2, Grid2X2, Grid3X3, LayoutGrid, WifiOff,
  Expand, Minimize2, RefreshCw, Download, MonitorPlay,
  ScanFace
} from "lucide-react";
import Hls from "hls.js";
import { useCameraStore } from "../../store/cameraStore";
import { useAuthStore } from "../../store/authStore";
import api from "../../utils/api";
import { WS_BASE_URL } from "../../constants/api";

const LAYOUTS = [
  { key: "1x1", icon: Maximize2,  cols: 1, label: "1×1",  max: 1  },
  { key: "2x2", icon: Grid2X2,   cols: 2, label: "2×2",  max: 4  },
  { key: "3x3", icon: Grid3X3,   cols: 3, label: "3×3",  max: 9  },
  { key: "4x4", icon: LayoutGrid, cols: 4, label: "4×4",  max: 16 },
];

/* ── HLS Player ── */
// Dibungkus memo() agar TIDAK di-render ulang saat status kamera berubah.
// Tanpa ini, setiap update status (tiap 10 detik) akan restart stream HLS.
const MemoHlsPlayer = memo(function HlsPlayer({ src, objectFit = "cover" }) {
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        enableWorker: true,
        startPosition: -1,
        liveSyncDuration: 2,
        liveMaxLatencyDuration: 8,
      });
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
});

/* ── Detection Overlay — Canvas untuk menggambar kotak hijau ── */
function DetectionOverlay({ cameraId, enabled }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const facesRef = useRef([]);
  const targetFacesRef = useRef([]);
  const animFrameRef = useRef(null);
  const faceCountRef = useRef(0);
  const [faceCount, setFaceCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      // Cleanup saat dimatikan
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      facesRef.current = [];
      targetFacesRef.current = [];
      setFaceCount(0);
      setWsConnected(false);

      // Clear canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    // ── Connect WebSocket ──
    const token = useAuthStore.getState().token;
    if (!token) return;

    const wsUrl = `${WS_BASE_URL}/realtime/${cameraId}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "connected") return; // Pesan awal

        // Simpan target faces untuk interpolasi smooth
        targetFacesRef.current = data.faces || [];
        const count = data.face_count || 0;
        if (count !== faceCountRef.current) {
          faceCountRef.current = count;
          setFaceCount(count);
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    // ── Animation loop: gambar kotak hijau dengan smooth interpolation ──
    const LERP_SPEED = 0.3; // Kecepatan interpolasi (0-1, lebih tinggi = lebih cepat)

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function animate() {
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Resize canvas mengikuti parent
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      }

      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const targets = targetFacesRef.current;
      const current = facesRef.current;

      // Interpolasi smooth: pindahkan current menuju target
      while (current.length < targets.length) {
        current.push({ ...targets[current.length] });
      }
      // Jika target berkurang, fade out kelebihan
      if (current.length > targets.length) {
        current.length = targets.length;
      }

      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const c = current[i];
        c.x = lerp(c.x, t.x, LERP_SPEED);
        c.y = lerp(c.y, t.y, LERP_SPEED);
        c.w = lerp(c.w, t.w, LERP_SPEED);
        c.h = lerp(c.h, t.h, LERP_SPEED);

        // Konversi koordinat relatif → pixel
        const px = c.x * w;
        const py = c.y * h;
        const pw = c.w * w;
        const ph = c.h * h;

        // ── Gambar kotak hijau ──
        // Outer glow
        ctx.shadowColor = "rgba(0, 255, 0, 0.4)";
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // Corner accents (garis pendek di tiap sudut untuk tampilan futuristik)
        const cornerLen = Math.min(pw, ph) * 0.25;
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(px, py + cornerLen);
        ctx.lineTo(px, py);
        ctx.lineTo(px + cornerLen, py);
        // Top-right
        ctx.moveTo(px + pw - cornerLen, py);
        ctx.lineTo(px + pw, py);
        ctx.lineTo(px + pw, py + cornerLen);
        // Bottom-right
        ctx.moveTo(px + pw, py + ph - cornerLen);
        ctx.lineTo(px + pw, py + ph);
        ctx.lineTo(px + pw - cornerLen, py + ph);
        // Bottom-left
        ctx.moveTo(px + cornerLen, py + ph);
        ctx.lineTo(px, py + ph);
        ctx.lineTo(px, py + ph - cornerLen);
        ctx.stroke();

        // Label "FACE" di atas kotak
        const labelH = 18;
        const labelText = "FACE";
        ctx.font = "bold 10px monospace";
        const textWidth = ctx.measureText(labelText).width;
        const labelW = textWidth + 12;

        // Background label
        ctx.fillStyle = "rgba(0, 255, 0, 0.85)";
        ctx.beginPath();
        ctx.roundRect(px, py - labelH - 2, labelW, labelH, 3);
        ctx.fill();

        // Text label
        ctx.fillStyle = "#000000";
        ctx.fillText(labelText, px + 6, py - labelH + 13);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    // ── Cleanup ──
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [enabled, cameraId]);

  if (!enabled) return null;

  return (
    <>
      {/* Canvas overlay transparan di atas video */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* AI Status indicator — top-left bawah LIVE badge */}
      <div style={{
        position: "absolute",
        top: 32,
        left: 10,
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: "rgba(0, 0, 0, 0.72)",
        border: `1px solid ${wsConnected ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 100, 100, 0.3)"}`,
        padding: "3px 9px",
        borderRadius: 5,
        backdropFilter: "blur(6px)",
        zIndex: 6,
      }}>
        <ScanFace size={10} style={{ color: wsConnected ? "#00FF00" : "#f87171" }} />
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: wsConnected ? "#00FF00" : "#f87171",
          letterSpacing: "0.06em",
        }}>
          AI {faceCount > 0 ? `· ${faceCount}` : ""}
        </span>
      </div>
    </>
  );
}

/* ── Camera Card (mirip halaman publik, dengan fitur admin) ── */
function CameraCard({ cam, index, aiEnabled, onToggleAI }) {
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

  const handleSaveRecording = async () => {
    if (downloadState.state !== "idle") return;
    setDownloadState({ state: "processing", progress: 0 });
    try {
      await api.post(`/recordings/capture/${cam.id}`);
      setDownloadState({ state: "success", progress: 100 });
      setTimeout(() => {
        setDownloadState({ state: "idle", progress: 0 });
        // Arahkan ke halaman Rekaman
        window.location.href = "/app/recordings";
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.detail
        || "Gagal menyimpan rekaman. Pastikan kamera sudah menyala beberapa menit.";
      alert(`[Rekaman] ${msg}`);
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
        border: `1px solid ${hov ? "rgba(255,255,255,0.18)" : aiEnabled ? "rgba(0,255,0,0.15)" : "#1F1F2E"}`,
        borderRadius: isFullscreen ? 0 : 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
        transform: hov && !isOffline && !isFullscreen ? "translateY(-2px)" : "translateY(0)",
        animation: `fadeUpIn 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms both`,
      }}
    >
      {/* Video Area — paddingTop hack untuk rasio 16:9 yang stabil */}
      <div style={{
        position: isFullscreen ? "absolute" : "relative",
        inset: isFullscreen ? 0 : "auto",
        paddingTop: isFullscreen ? 0 : "56.25%",
        background: "#000",
        zIndex: isFullscreen ? 10 : "auto",
      }}>
        {/* Inner wrapper yang mengisi seluruh area */}
        <div style={{ position: "absolute", inset: 0 }}>
          {isOffline ? (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <WifiOff size={22} style={{ color: "#2D2D3F" }} />
              <span style={{ color: "#3D3D4F", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sinyal Terputus</span>
            </div>
          ) : (
            cam.stream_url && <MemoHlsPlayer src={cam.stream_url} objectFit={isFullscreen ? "contain" : "cover"} />
          )}

          {/* ── AI Detection Overlay (canvas kotak hijau) ── */}
          {!isOffline && (
            <DetectionOverlay cameraId={cam.id} enabled={aiEnabled} />
          )}
        </div>{/* /inner wrapper */}

        {/* LIVE / OFFLINE badge — top left */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(0,0,0,0.72)", border: "1px solid rgba(255,255,255,0.1)",
          padding: "3px 9px", borderRadius: 5, backdropFilter: "blur(6px)",
          zIndex: 7,
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
          zIndex: 7,
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
            zIndex: 8,
          }}>
            {/* Toggle AI Detection per kamera */}
            {!isOffline && (
              <button
                onClick={() => onToggleAI(cam.id)}
                title={aiEnabled ? "Matikan AI Detection" : "Aktifkan AI Detection"}
                style={{
                  height: 28, padding: "0 10px", borderRadius: 6,
                  background: aiEnabled ? "rgba(0,255,0,0.18)" : "rgba(0,0,0,0.72)",
                  border: `1px solid ${aiEnabled ? "rgba(0,255,0,0.4)" : "rgba(255,255,255,0.12)"}`,
                  color: aiEnabled ? "#00FF00" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 10, fontWeight: 700, backdropFilter: "blur(6px)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  if (!aiEnabled) { e.currentTarget.style.background = "rgba(0,255,0,0.12)"; e.currentTarget.style.color = "#00FF00"; }
                }}
                onMouseLeave={e => {
                  if (!aiEnabled) { e.currentTarget.style.background = "rgba(0,0,0,0.72)"; e.currentTarget.style.color = "#FFFFFF"; }
                }}
              >
                <ScanFace size={11} /> AI
              </button>
            )}

            {/* Simpan Rekaman button */}
            {!isOffline && (
              <button
                onClick={handleSaveRecording}
                disabled={dlBusy}
                title={downloadState.state === "processing" ? "Menyimpan..." : "Simpan ke daftar rekaman"}
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
                {downloadState.state === "idle"       && <><Download size={11} /> REC</>}
                {downloadState.state === "processing" && <><RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> SIMPAN...</>}
                {downloadState.state === "success"    && <span style={{ color: "#4ade80" }}>✓ TERSIMPAN</span>}
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
        <div style={{ padding: "14px 16px", borderTop: "1px solid #1A1A26", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#FFFFFF" }}>{cam.name}</p>
            {cam.location && (
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#71717A" }}>{cam.location}</p>
            )}
          </div>
          {aiEnabled && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "3px 8px", borderRadius: 4,
              background: "rgba(0,255,0,0.08)", border: "1px solid rgba(0,255,0,0.15)",
            }}>
              <ScanFace size={10} style={{ color: "#00FF00" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#00FF00", letterSpacing: "0.06em" }}>AI AKTIF</span>
            </div>
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
  const [aiCameras, setAiCameras] = useState({}); // { [cameraId]: true/false }
  const fullscreenRef = useRef(null);

  const refresh = useCallback(async () => {
    await fetchCameras();
    await fetchStatuses();
    setLastUpdate(new Date());
  }, [fetchCameras, fetchStatuses]);

  // Efek untuk mengaktifkan AI Detection secara otomatis pada semua kamera yang live/recording saat halaman dimuat atau status terupdate
  useEffect(() => {
    if (cameras.length > 0) {
      setAiCameras(prev => {
        let changed = false;
        const updated = { ...prev };
        cameras.forEach(cam => {
          if (updated[cam.id] === undefined && (cam.status === "live" || cam.status === "recording")) {
            updated[cam.id] = true;
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [cameras]);

  useEffect(() => {
    // Jika kamera sudah ada di store (navigasi kembali), JANGAN fetch ulang
    // agar HlsPlayer tidak di-unmount dan stream tidak restart dari awal.
    // Cukup update status saja.
    if (cameras.length === 0) {
      refresh(); // Hanya fetch lengkap jika belum ada data sama sekali
    } else {
      fetchStatuses();
      setLastUpdate(new Date());
    }
    const interval = setInterval(fetchStatuses, 10000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentLayout = LAYOUTS.find(l => l.key === layout);
  const cols          = currentLayout?.cols || 2;
  const visibleCams   = cameras.slice(0, currentLayout?.max ?? cameras.length);

  const liveCount    = cameras.filter(c => c.status === "live" || c.status === "recording").length;
  const offlineCount = cameras.filter(c => c.status === "offline").length;
  const aiActiveCount = Object.values(aiCameras).filter(Boolean).length;

  const handleToggleAI = (camId) => {
    setAiCameras(prev => ({
      ...prev,
      [camId]: !prev[camId],
    }));
  };

  const handleToggleAllAI = () => {
    const liveCams = cameras.filter(c => c.status === "live" || c.status === "recording");
    if (aiActiveCount > 0) {
      // Matikan semua (atur secara eksplisit ke false agar tidak diaktifkan kembali oleh useEffect)
      const newState = {};
      cameras.forEach(c => { newState[c.id] = false; });
      setAiCameras(newState);
    } else {
      // Aktifkan semua kamera yang live
      const newState = {};
      liveCams.forEach(c => { newState[c.id] = true; });
      setAiCameras(newState);
    }
  };

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
        @keyframes aiPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,0,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(0,255,0,0); }
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
            {!loading && aiActiveCount > 0 && (
              <span style={{ color: "#00FF00", fontWeight: 600 }}> · 🧠 {aiActiveCount} AI</span>
            )}
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

          {/* Toggle AI Detection (semua kamera) */}
          <button
            onClick={handleToggleAllAI}
            title={aiActiveCount > 0 ? "Matikan Semua AI Detection" : "Aktifkan AI Detection (Semua Kamera)"}
            style={{
              height: 34, padding: "0 14px", borderRadius: 8,
              background: aiActiveCount > 0 ? "rgba(0,255,0,0.1)" : "transparent",
              border: `1px solid ${aiActiveCount > 0 ? "rgba(0,255,0,0.3)" : "#1A1A26"}`,
              color: aiActiveCount > 0 ? "#00FF00" : "#71717A",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7,
              fontSize: 12, fontWeight: 600,
              transition: "all 0.2s",
              animation: aiActiveCount > 0 ? "aiPulse 2s ease-in-out infinite" : "none",
            }}
            onMouseEnter={e => {
              if (aiActiveCount === 0) { e.currentTarget.style.color = "#00FF00"; e.currentTarget.style.borderColor = "rgba(0,255,0,0.3)"; }
            }}
            onMouseLeave={e => {
              if (aiActiveCount === 0) { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1A1A26"; }
            }}
          >
            <ScanFace size={14} />
            {aiActiveCount > 0 ? `AI (${aiActiveCount})` : "AI Detection"}
          </button>

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
            <CameraCard
              key={cam.id}
              cam={cam}
              index={i}
              aiEnabled={!!aiCameras[cam.id]}
              onToggleAI={handleToggleAI}
            />
          ))}
        </div>
      )}
    </div>
  );
}
