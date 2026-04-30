import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Wifi, WifiOff, RefreshCw, Radio } from "lucide-react";
import Hls from "hls.js";
import CosmicBackground from "../../components/CosmicBackground";
import CamLogo from "../../components/CamLogo";
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
function CameraPlayer({ camera }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [hov, setHov] = useState(false);
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
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "16px",
        overflow: "hidden",
        willChange: "transform",
        transform: hov
          ? "translateY(-4px) translateZ(0)"
          : "translateY(0) translateZ(0)",
        boxShadow: hov
          ? "0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.12)"
          : "0 4px 16px rgba(0,0,0,0.3)",
        transition:
          "transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          background: "#040c18",
        }}
      >
        {isOffline ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <WifiOff size={28} style={{ color: "rgba(255,255,255,0.2)" }} />
            <span
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Offline
            </span>
          </div>
        ) : (
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: isOffline ? "rgba(0,0,0,0.6)" : "rgba(16,185,129,0.12)",
            border: `1px solid ${isOffline ? "rgba(255,255,255,0.1)" : "rgba(16,185,129,0.35)"}`,
            padding: "4px 10px",
            borderRadius: "6px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isOffline ? "#6b7280" : "#10b981",
              boxShadow: isOffline ? "none" : "0 0 8px rgba(16,185,129,0.8)",
              animation: isOffline
                ? "none"
                : "blinkDot 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: isOffline ? "#6b7280" : "#10b981",
              letterSpacing: "0.08em",
            }}
          >
            {isOffline ? "OFFLINE" : "LIVE"}
          </span>
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "14px",
            color: "rgba(226,240,255,0.9)",
          }}
        >
          {camera.name}
        </p>
        {camera.location && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "11px",
              color: "#71717A",
            }}
          >
            {camera.location}
          </p>
        )}
      </div>
    </div>
  );
}
export default function LivePublicPage() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [visible, setVisible] = useState(false);
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
    const t = setTimeout(() => setVisible(true), 80);
    const interval = setInterval(fetchCameras, 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, []);
  const liveCount = cameras.filter((c) => c.status === "live").length;
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0F",
        color: "#FFFFFF",
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <CosmicBackground particleOpacity={0.35} />
      <style>{`
        @keyframes floatDrone {
          0% { transform: translateY(0) translateX(0) rotate(1deg) scale(1); }
          25% { transform: translateY(-40px) translateX(20px) rotate(-1deg) scale(1.02); }
          50% { transform: translateY(-10px) translateX(40px) rotate(-2deg) scale(0.98); }
          75% { transform: translateY(30px) translateX(15px) rotate(1deg) scale(1.01); }
          100% { transform: translateY(0) translateX(0) rotate(1deg) scale(1); }
        }
        @keyframes spinRadar {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulseRing {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { opacity: 0.25; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "120vh",
          height: "120vh",
          minWidth: "800px",
          minHeight: "800px",
          pointerEvents: "none",
          zIndex: 0,
          opacity: visible ? 0.6 : 0,
          transition: "opacity 3s ease 1s",
          mixBlendMode: "screen",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background:
              "conic-gradient(from 0deg at 50% 50%, transparent 60%, rgba(255,255,255,0.05) 85%, rgba(255,255,255,0.2) 100%)",
            animation: "spinRadar 12s linear infinite",
            maskImage:
              "radial-gradient(circle at 50% 50%, black 10%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 50%, black 10%, transparent 70%)",
          }}
        />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: `${i * 20}%`,
              height: `${i * 20}%`,
              borderRadius: "50%",
              border: "1px dashed rgba(255,255,255,0.06)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "0",
            right: "0",
            height: "1px",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "0",
            bottom: "0",
            width: "1px",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "30%",
            height: "30%",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.3)",
            animation: "pulseRing 4s ease-out infinite",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: "-8%",
          top: "15%",
          width: "60vw",
          minWidth: "500px",
          maxWidth: "900px",
          pointerEvents: "none",
          zIndex: 0,
          opacity: visible ? 0.35 : 0,
          transition: "opacity 3s ease 1.5s",
          animation: "floatDrone 28s ease-in-out infinite",
          mixBlendMode: "lighten",
        }}
      >
        <img
          src="/surveillance_drone.png"
          alt="Surveillance Drone Background"
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
            maskImage:
              "radial-gradient(circle at 50% 40%, black 20%, transparent 75%)",
          }}
        />
      </div>
      <header
        style={{
          padding: "0 clamp(20px,4vw,48px)",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(2,4,8,0.88)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-20px)",
          transition:
            "opacity 0.7s ease 0.1s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <CamLogo size={34} />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
              }}
            >
              Vektor
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.08em",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              LIVE VIEW PUBLIK
            </p>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "6px 14px",
              borderRadius: "8px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.25)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10b981",
                boxShadow: "none",
                animation: "blinkDot 2s ease-in-out infinite",
              }}
            />
            <Radio size={11} style={{ color: "#10b981" }} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#10b981",
                letterSpacing: "0.06em",
              }}
            >
              {liveCount} LIVE
            </span>
          </div>
          <button
            onClick={fetchCameras}
            style={{
              padding: "8px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#71717A",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.color = "#71717A";
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>
      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "clamp(24px,4vw,48px) clamp(16px,3vw,32px)",
          position: "relative",
          zIndex: 10,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition:
            "opacity 0.8s ease 0.3s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "none",
                animation: "blinkDot 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.12em",
              }}
            >
              FEED
            </span>
            <span
              style={{
                width: "1px",
                height: "12px",
                background: "rgba(255,255,255,0.12)",
              }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#71717A",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Siaran Langsung
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "rgba(148,163,184,0.7)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {lastUpdate
              ? `Diperbarui: ${lastUpdate.toLocaleTimeString("id-ID")}`
              : "Memuat..."}{" "}
            · {cameras.length} kamera terdaftar
          </p>
        </div>
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "16px",
                  aspectRatio: "16/9",
                  border: "1px solid rgba(255,255,255,0.06)",
                  animation: "borderGlow 2s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : cameras.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <WifiOff
              size={44}
              style={{
                color: "rgba(148,163,184,0.15)",
                margin: "0 auto 16px",
                display: "block",
              }}
            />
            <p style={{ color: "rgba(148,163,184,0.6)", fontSize: "14px" }}>
              Belum ada kamera yang terdaftar.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {cameras.map((cam) => (
              <CameraPlayer key={cam.id} camera={cam} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
