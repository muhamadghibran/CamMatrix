import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { WifiOff, RefreshCw, Radio } from "lucide-react";
import Hls from "hls.js";
import CamLogo from "../../components/CamLogo";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function CameraPlayer({ camera }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!videoRef.current) return;
    if (camera.status !== "live") return;
    const url = camera.stream_url;
    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus("live");
        videoRef.current?.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) setStatus("offline");
      });
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = url;
      videoRef.current.addEventListener("loadedmetadata", () => {
        setStatus("live");
        videoRef.current?.play().catch(() => {});
      });
    }
    return () => {
      hlsRef.current?.destroy();
    };
  }, [camera.stream_url, camera.status]);

  const isOffline = status === "offline" || camera.status !== "live";

  return (
    <div style={{
      background: "#111118",
      border: "1px solid #1F1F2E",
      borderRadius: "12px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#0A0A0F" }}>
        {isOffline ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <WifiOff size={24} style={{ color: "#30363D" }} />
            <span style={{ color: "#71717A", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Offline</span>
          </div>
        ) : (
          <video ref={videoRef} muted autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{
          position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 6,
          background: "rgba(0,0,0,0.8)", border: "1px solid #1F1F2E", padding: "4px 8px", borderRadius: 6
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOffline ? "#71717A" : "#FFFFFF" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: isOffline ? "#71717A" : "#FFFFFF", letterSpacing: "0.05em" }}>
            {isOffline ? "OFFLINE" : "LIVE"}
          </span>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#FFFFFF" }}>{camera.name}</p>
        {camera.location && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#71717A" }}>{camera.location}</p>
        )}
      </div>
    </div>
  );
}

export default function LivePublicPage() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchCameras = async () => {
    try {
      const res = await fetch(`${API_BASE}/public/cameras`);
      if (res.ok) {
        setCameras(await res.json());
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
    const interval = setInterval(fetchCameras, 15000);
    return () => clearInterval(interval);
  }, []);

  const liveCount = cameras.filter((c) => c.status === "live").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Header */}
      <header style={{
        padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #1F1F2E", background: "rgba(10,10,15,0.92)", backdropFilter: "blur(14px)",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <CamLogo size={24} color="#FFFFFF" />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#FFFFFF" }}>CamMatrix</h1>
            <span style={{ width: 1, height: 14, background: "#1F1F2E" }} />
            <span style={{ fontSize: 12, color: "#71717A", fontWeight: 500 }}>Live View Publik</span>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#71717A" }}>
            <Radio size={14} style={{ color: "#FFFFFF" }} />
            <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{liveCount}</span> Aktif
          </div>
          <button onClick={fetchCameras} style={{
            padding: 8, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E",
            color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
          }}
          onMouseEnter={e=>{e.currentTarget.style.color="#FFF";e.currentTarget.style.borderColor="#30363D"}}
          onMouseLeave={e=>{e.currentTarget.style.color="#71717A";e.currentTarget.style.borderColor="#1F1F2E"}}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
        
        <div style={{ marginBottom: 40, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: "#FFFFFF", letterSpacing: "-0.02em" }}>Feed Publik</h2>
            <p style={{ margin: 0, fontSize: 14, color: "#71717A" }}>
              {cameras.length} kamera terdaftar
            </p>
          </div>
          <div style={{ fontSize: 13, color: "#71717A" }}>
            {lastUpdate ? `Diperbarui ${lastUpdate.toLocaleTimeString("id-ID")}` : "Memuat..."}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ background: "#111118", borderRadius: 12, aspectRatio: "16/9", border: "1px solid #1F1F2E" }} />
            ))}
          </div>
        ) : cameras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "120px 20px", border: "1px dashed #1F1F2E", borderRadius: 12 }}>
            <WifiOff size={32} style={{ color: "#30363D", margin: "0 auto 16px", display: "block" }} />
            <p style={{ color: "#71717A", fontSize: 14, margin: 0 }}>Belum ada kamera yang terdaftar.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {cameras.map((cam) => (
              <CameraPlayer key={cam.id} camera={cam} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
