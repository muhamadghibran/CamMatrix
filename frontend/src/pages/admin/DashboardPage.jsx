import { Camera, MonitorPlay, Film, HardDrive, Users, ArrowUpRight, RefreshCw, WifiOff, Wifi, Activity } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon, index }) {
  const Icon = icon;
  return (
    <div style={{
      padding: "20px", borderRadius: 10,
      background: "#111118", border: "1px solid #1F1F2E",
      display: "flex", flexDirection: "column", gap: 12,
      animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
      animationDelay: `${index * 60}ms`
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#71717A", fontWeight: 500 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} style={{ color: "#71717A" }} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.035em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#71717A" }}>{sub}</div>
    </div>
  );
}

/* ── Camera Row ── */
function CameraRow({ cam, onClick }) {
  const isLive = cam.status === "live";
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px", cursor: "pointer", borderRadius: 8,
      transition: "background 0.15s",
    }}
    onMouseEnter={e=>e.currentTarget.style.background="#111118"}
    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isLive ? "#FFFFFF" : "#2D2D3F", flexShrink: 0, boxShadow: isLive ? "0 0 6px rgba(255,255,255,0.5)" : "none" }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cam.name}</p>
          {cam.location && <p style={{ fontSize: 12, color: "#71717A", margin: 0 }}>{cam.location}</p>}
        </div>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
        background: isLive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isLive ? "rgba(255,255,255,0.15)" : "#1F1F2E"}`,
        color: isLive ? "#FFFFFF" : "#3D3D4F",
        letterSpacing: "0.05em", flexShrink: 0, marginLeft: 12
      }}>
        {cam.status.toUpperCase()}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [spinning, setSpinning] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const [statsRes, camRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/cameras-status"),
      ]);
      setStats(statsRes.data);
      setCameras(camRes.data);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Gagal memuat data dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const refresh = setInterval(fetchDashboard, 30000);
    return () => clearInterval(refresh);
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    setSpinning(true);
    await fetchDashboard();
    setTimeout(() => setSpinning(false), 600);
  };

  const statCards = stats ? [
    { label: "Total Kamera", value: stats.total_cameras, sub: `${stats.offline_cameras ?? 0} offline`, icon: Camera },
    { label: "Siaran Langsung", value: stats.live_cameras, sub: "aktif sekarang", icon: Wifi },
    { label: "Total Rekaman", value: stats.total_recordings, sub: "tersimpan", icon: Film },
    { label: "Penyimpanan", value: `${stats.storage_gb} GB`, sub: "digunakan", icon: HardDrive },
    { label: "Pengguna", value: stats.active_users, sub: "akun aktif", icon: Users },
  ] : [];

  const liveCount = cameras.filter(c => c.status === "live").length;
  const now = lastUpdate ? lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, animation: "fadeUp 0.4s ease both" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 8px rgba(255,255,255,0.5)" }} />
            <span style={{ fontSize: 11, color: "#71717A", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sistem Online</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", margin: 0, letterSpacing: "-0.025em" }}>Dashboard</h1>
          {now && <p style={{ fontSize: 12, color: "#71717A", margin: "4px 0 0" }}>Diperbarui {now}</p>}
        </div>
        <button onClick={handleRefresh} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
          background: "transparent", border: "1px solid #1F1F2E", color: "#71717A",
          fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "color 0.15s, border-color 0.15s"
        }}
        onMouseEnter={e=>{e.currentTarget.style.color="#FFF"; e.currentTarget.style.borderColor="#30363D"}}
        onMouseLeave={e=>{e.currentTarget.style.color="#71717A"; e.currentTarget.style.borderColor="#1F1F2E"}}
        >
          <RefreshCw size={13} style={{ animation: spinning ? "spin 0.6s linear" : "none" }} />
          Refresh
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {loading
          ? Array(5).fill(0).map((_, i) => <div key={i} style={{ height: 120, borderRadius: 10, background: "#111118", border: "1px solid #1F1F2E" }} />)
          : statCards.map((card, i) => <StatCard key={i} {...card} index={i} />)
        }
      </div>

      {/* ── Camera Status Table ── */}
      <div style={{ borderRadius: 10, border: "1px solid #1F1F2E", overflow: "hidden", background: "#111118", animation: "fadeUp 0.4s ease 200ms both" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #1F1F2E" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MonitorPlay size={15} style={{ color: "#71717A" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Status Kamera</span>
            <span style={{ fontSize: 12, color: "#71717A" }}>{liveCount} aktif · {cameras.length} total</span>
          </div>
          <button onClick={() => navigate("/app/cameras")} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6,
            background: "transparent", border: "1px solid #1F1F2E", color: "#71717A",
            fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "color 0.15s"
          }}
          onMouseEnter={e=>{e.currentTarget.style.color="#FFF"}}
          onMouseLeave={e=>{e.currentTarget.style.color="#71717A"}}
          >
            Lihat Semua <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Rows */}
        <div style={{ padding: "8px 0" }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ margin: "4px 16px", height: 44, borderRadius: 8, background: "#0A0A0F" }} />
            ))
          ) : cameras.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center" }}>
              <WifiOff size={24} style={{ color: "#2D2D3F", margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 12px" }}>Belum ada kamera terdaftar</p>
              <button onClick={() => navigate("/app/cameras")} style={{ fontSize: 12, color: "#FFFFFF", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Tambah kamera
              </button>
            </div>
          ) : (
            cameras.map((cam) => (
              <CameraRow key={cam.id} cam={cam} onClick={() => navigate("/app/live")} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
