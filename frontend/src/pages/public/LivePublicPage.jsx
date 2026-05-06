import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { WifiOff, RefreshCw, MonitorPlay, ArrowRight } from "lucide-react";
import Hls from "hls.js";
import CamLogo from "../../components/CamLogo";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

/* ── Camera Player Card ─────────────────────── */
function CameraPlayer({ camera, index }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [hov, setHov] = useState(false);

  useEffect(() => {
    if (!videoRef.current || camera.status !== "live") return;
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
      hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setStatus("offline"); });
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = url;
      videoRef.current.addEventListener("loadedmetadata", () => {
        setStatus("live");
        videoRef.current?.play().catch(() => {});
      });
    }
    return () => { hlsRef.current?.destroy(); };
  }, [camera.stream_url, camera.status]);

  const isOffline = status === "offline" || camera.status !== "live";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#111118",
        border: `1px solid ${hov ? "rgba(255,255,255,0.18)" : "#1F1F2E"}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        animationDelay: `${index * 60}ms`,
        animation: "fadeUpIn 0.5s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#0A0A0F" }}>
        {isOffline ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <WifiOff size={22} style={{ color: "#2D2D3F" }} />
            <span style={{ color: "#3D3D4F", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Offline</span>
          </div>
        ) : (
          <video ref={videoRef} muted autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />
        )}
        {/* Status Badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          display: "flex", alignItems: "center", gap: 5,
          background: isOffline ? "rgba(15,15,20,0.85)" : "rgba(0,0,0,0.75)",
          border: `1px solid ${isOffline ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
          padding: "3px 8px", borderRadius: 5, backdropFilter: "blur(4px)"
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: isOffline ? "#3D3D4F" : "#FFFFFF",
            boxShadow: isOffline ? "none" : "0 0 6px rgba(255,255,255,0.6)"
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: isOffline ? "#3D3D4F" : "#FFFFFF", letterSpacing: "0.06em" }}>
            {isOffline ? "OFFLINE" : "LIVE"}
          </span>
        </div>
        {/* Camera number */}
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 4, padding: "2px 7px", backdropFilter: "blur(4px)"
        }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, fontFamily: "monospace" }}>
            CAM {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div style={{ padding: "14px 16px", borderTop: "1px solid #1A1A26" }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#FFFFFF" }}>{camera.name}</p>
        {camera.location && (
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#71717A" }}>{camera.location}</p>
        )}
      </div>
    </div>
  );
}

/* ── Skeleton Card ─── */
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

/* ── Main Page ─────────────────────────────── */
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
      <style>{`
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Subtle dot grid background */
        .live-bg {
          background-color: #0A0A0F;
          background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        /* Fade grid near top */
        .live-bg::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 200px;
          background: linear-gradient(to bottom, #0A0A0F, transparent);
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #1A1A26",
        background: "rgba(10,10,15,0.9)", backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <CamLogo size={22} color="#FFFFFF" />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#FFFFFF" }}>CamMatrix</span>
            <span style={{ width: 1, height: 14, background: "#2D2D3F" }} />
            <span style={{ fontSize: 13, color: "#71717A" }}>Live View Publik</span>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Live indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "5px 12px", borderRadius: 99,
            background: liveCount > 0 ? "rgba(255,255,255,0.06)" : "transparent",
            border: `1px solid ${liveCount > 0 ? "rgba(255,255,255,0.12)" : "#1A1A26"}`,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: liveCount > 0 ? "#FFFFFF" : "#3D3D4F",
              boxShadow: liveCount > 0 ? "0 0 8px rgba(255,255,255,0.5)" : "none"
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: liveCount > 0 ? "#FFFFFF" : "#3D3D4F" }}>
              {liveCount} Aktif
            </span>
          </div>

          {/* Refresh */}
          <button onClick={fetchCameras} title="Refresh" style={{
            width: 34, height: 34, borderRadius: 8, background: "transparent",
            border: "1px solid #1A1A26", color: "#71717A", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.15s, border-color 0.15s"
          }}
          onMouseEnter={e=>{e.currentTarget.style.color="#FFF"; e.currentTarget.style.borderColor="#2D2D3F"}}
          onMouseLeave={e=>{e.currentTarget.style.color="#71717A"; e.currentTarget.style.borderColor="#1A1A26"}}
          >
            <RefreshCw size={14} />
          </button>

          {/* Login CTA */}
          <Link to="/login" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600,
            background: "#FFFFFF", color: "#0A0A0F", textDecoration: "none",
            transition: "background 0.15s"
          }}
          onMouseEnter={e=>e.currentTarget.style.background="#E5E5E5"}
          onMouseLeave={e=>e.currentTarget.style.background="#FFFFFF"}
          >
            Admin <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="live-bg" style={{ position: "relative", minHeight: "calc(100vh - 64px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "52px 32px", position: "relative", zIndex: 2 }}>

          {/* Page Title */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <MonitorPlay size={16} style={{ color: "#71717A" }} />
              <span style={{ fontSize: 12, color: "#71717A", fontWeight: 500, letterSpacing: "0.04em" }}>Siaran Langsung</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: "#FFFFFF", letterSpacing: "-0.02em" }}>Feed Publik</h1>
                <p style={{ margin: 0, fontSize: 13, color: "#71717A" }}>
                  {loading ? "Memuat kamera..." : `${cameras.length} kamera terdaftar · ${liveCount} aktif`}
                </p>
              </div>
              {lastUpdate && (
                <p style={{ margin: 0, fontSize: 12, color: "#3D3D4F", fontVariantNumeric: "tabular-nums" }}>
                  Diperbarui {lastUpdate.toLocaleTimeString("id-ID")}
                </p>
              )}
            </div>

            {/* Thin divider */}
            <div style={{ marginTop: 24, height: 1, background: "linear-gradient(to right, #1F1F2E, transparent)" }} />
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : cameras.length === 0 ? (
            /* ── Premium Empty State ── */
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "96px 24px", textAlign: "center",
              border: "1px dashed #1F1F2E", borderRadius: 16,
              background: "rgba(17,17,24,0.4)"
            }}>
              {/* Icon */}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "#111118", border: "1px solid #1F1F2E",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 24
              }}>
                <MonitorPlay size={24} style={{ color: "#2D2D3F" }} />
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#FFFFFF", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                Belum Ada Kamera Aktif
              </h2>
              <p style={{ fontSize: 14, color: "#71717A", margin: "0 0 32px", maxWidth: 340, lineHeight: 1.7 }}>
                Kamera publik belum dikonfigurasi atau belum ada yang aktif. Login sebagai admin untuk mulai menambahkan kamera.
              </p>

              <Link to="/login" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 99, fontSize: 14, fontWeight: 600,
                color: "#0A0A0F", background: "#FFFFFF", textDecoration: "none",
                transition: "background 0.15s, transform 0.15s"
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="#E5E5E5"; e.currentTarget.style.transform="translateY(-1px)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="#FFFFFF"; e.currentTarget.style.transform="translateY(0)"}}
              >
                Masuk sebagai Admin <ArrowRight size={14} />
              </Link>

              {/* decorative subtle grid lines */}
              <div style={{ marginTop: 48, display: "flex", gap: 20 }}>
                {["Tambah Kamera","Konfigurasi Stream","Pantau Real-time"].map((s, i) => (
                  <div key={s} style={{
                    padding: "8px 16px", borderRadius: 99,
                    border: "1px solid #1A1A26",
                    fontSize: 12, color: "#3D3D4F", fontWeight: 500
                  }}>
                    {String(i + 1).padStart(2, "0")} — {s}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {cameras.map((cam, i) => (
                <CameraPlayer key={cam.id} camera={cam} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
