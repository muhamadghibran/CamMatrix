import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Tv2, Wifi, WifiOff, Shield, RefreshCw, Radio } from "lucide-react";
import Hls from "hls.js";
import { useThemeStore } from "../store/themeStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

/* ── HLS Player per kamera ── */
function CameraPlayer({ camera }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | live | offline

  useEffect(() => {
    if (!videoRef.current) return;
    if (camera.status !== "live") { setStatus("offline"); return; }

    const url = camera.stream_url;

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        enableWorker: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus("live");
        videoRef.current?.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setStatus("offline");
      });
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = url;
      videoRef.current.addEventListener("loadedmetadata", () => {
        setStatus("live");
        videoRef.current?.play().catch(() => {});
      });
    } else {
      setStatus("offline");
    }

    return () => { hlsRef.current?.destroy(); };
  }, [camera.stream_url, camera.status]);

  const isOffline = status === "offline" || camera.status !== "live";

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "16px",
      overflow: "hidden",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Video area */}
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#0a0a0f" }}>
        {isOffline ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <WifiOff size={32} style={{ color: "rgba(255,255,255,0.2)" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Offline</span>
          </div>
        ) : (
          <video ref={videoRef} muted autoPlay playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}

        {/* Badge status */}
        <div style={{
          position: "absolute", top: "10px", left: "10px",
          display: "flex", alignItems: "center", gap: "6px",
          background: isOffline ? "rgba(0,0,0,0.6)" : "rgba(16,185,129,0.15)",
          border: `1px solid ${isOffline ? "rgba(255,255,255,0.1)" : "rgba(16,185,129,0.4)"}`,
          padding: "4px 10px", borderRadius: "20px",
        }}>
          <span style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: isOffline ? "#6b7280" : "#10b981",
            boxShadow: isOffline ? "none" : "0 0 8px #10b981",
            animation: isOffline ? "none" : "pulse 2s infinite",
          }} />
          <span style={{ fontSize: "10px", fontWeight: 700, color: isOffline ? "#9ca3af" : "#10b981", letterSpacing: "0.08em" }}>
            {isOffline ? "OFFLINE" : "LIVE"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "rgba(255,255,255,0.9)" }}>{camera.name}</p>
        {camera.location && (
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{camera.location}</p>
        )}
      </div>
    </div>
  );
}

/* ── Halaman Utama Viewer Publik ── */
export default function LivePublicPage() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { theme } = useThemeStore();

  const fetchCameras = async () => {
    try {
      const res = await fetch(`${API_BASE}/public/cameras`);
      if (res.ok) {
        const data = await res.json();
        setCameras(data);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error("Gagal mengambil daftar kamera:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
    // Auto-refresh status tiap 15 detik
    const interval = setInterval(fetchCameras, 15000);
    return () => clearInterval(interval);
  }, []);

  const liveCount = cameras.filter(c => c.status === "live").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)",
      color: "white",
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,15,0.85)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Tv2 size={18} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 800, letterSpacing: "-0.01em" }}>CamMatrix</h1>
            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Live View Publik</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Status count */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <Radio size={12} style={{ color: "#10b981" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>{liveCount} Live</span>
          </div>

          {/* Refresh */}
          <button onClick={fetchCameras} style={{ padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
            <RefreshCw size={14} />
          </button>

        </div>
      </header>

      {/* Konten */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Subtitle */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
            Siaran Langsung
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
            {lastUpdate ? `Diperbarui: ${lastUpdate.toLocaleTimeString("id-ID")}` : "Memuat..."} · {cameras.length} kamera terdaftar
          </p>
        </div>

        {/* Grid Kamera */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", aspectRatio: "16/9", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : cameras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <WifiOff size={48} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Belum ada kamera yang terdaftar.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {cameras.map(cam => (
              <CameraPlayer key={cam.id} camera={cam} />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
