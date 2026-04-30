import {
  Camera, MonitorPlay, Film, HardDrive, Users,
  ArrowUpRight, RefreshCw, WifiOff, Wifi, Activity, TrendingUp, Clock
} from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon, index }) {
  const Icon = icon;
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "20px 22px",
        borderRadius: 12,
        background: hov ? "#111118" : "rgba(17,17,24,0.6)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "#1F1F2E"}`,
        display: "flex", flexDirection: "column", gap: 14,
        cursor: "default",
        transition: "background 0.2s, border-color 0.2s, transform 0.2s",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        animation: "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        animationDelay: `${index * 60}ms`,
        backdropFilter: "blur(12px)",
      }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#71717A", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: hov ? "#1F1F2E" : "#0A0A0F",
          border: "1px solid #1F1F2E",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s"
        }}>
          <Icon size={14} style={{ color: hov ? "#FFFFFF" : "#71717A", transition: "color 0.2s" }} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#71717A" }}>{sub}</div>
    </div>
  );
}

/* ── Camera Row ── */
function CameraRow({ cam, onClick, isLast }) {
  const isLive = cam.status === "live";
  const isRecording = cam.status === "recording";
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 20px", cursor: "pointer",
        background: hov ? "rgba(255,255,255,0.025)" : "transparent",
        borderBottom: isLast ? "none" : "1px solid #1A1A26",
        transition: "background 0.15s"
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        {/* Status dot */}
        <div style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          background: isLive ? "#FFFFFF" : isRecording ? "#A0A0A0" : "#2D2D3F",
          boxShadow: isLive ? "0 0 8px rgba(255,255,255,0.5)" : "none",
          transition: "background 0.2s"
        }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {cam.name}
          </p>
          {cam.location && (
            <p style={{ fontSize: 11, color: "#71717A", margin: "2px 0 0" }}>{cam.location}</p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 16 }}>
        {cam.fps && cam.fps > 0 && (
          <span style={{ fontSize: 11, color: "#3D3D4F", fontFamily: "monospace" }}>{cam.fps}fps</span>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
          letterSpacing: "0.06em",
          background: isLive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${isLive ? "rgba(255,255,255,0.12)" : "#1F1F2E"}`,
          color: isLive ? "#FFFFFF" : "#3D3D4F",
        }}>
          {cam.status.toUpperCase()}
        </span>
        <ArrowUpRight size={13} style={{ color: hov ? "#71717A" : "#2D2D3F", transition: "color 0.15s" }} />
      </div>
    </div>
  );
}

/* ── Activity Item ── */
function ActivityItem({ icon: Icon, label, time, last }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 20px",
      borderBottom: last ? "none" : "1px solid #1A1A26"
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={13} style={{ color: "#71717A" }} />
      </div>
      <p style={{ fontSize: 13, color: "#FFFFFF", margin: 0, flex: 1, fontWeight: 500 }}>{label}</p>
      <span style={{ fontSize: 11, color: "#3D3D4F", fontFamily: "monospace", flexShrink: 0 }}>{time}</span>
    </div>
  );
}

/* ── Main Page ── */
export default function DashboardPage() {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const [stats, setStats]       = useState(null);
  const [cameras, setCameras]   = useState([]);
  const [loading, setLoading]   = useState(true);
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
    { label: "Total Kamera",    value: stats.total_cameras,    sub: `${stats.offline_cameras ?? 0} offline`,  icon: Camera },
    { label: "Siaran Langsung", value: stats.live_cameras,     sub: "aktif sekarang",                          icon: Wifi },
    { label: "Total Rekaman",   value: stats.total_recordings, sub: "tersimpan",                               icon: Film },
    { label: "Penyimpanan",     value: `${stats.storage_gb} GB`, sub: "digunakan",                            icon: HardDrive },
    { label: "Pengguna",        value: stats.active_users,     sub: "akun aktif",                              icon: Users },
  ] : [];

  const liveCount  = cameras.filter(c => c.status === "live").length;
  const now = lastUpdate
    ? lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : null;

  /* Mock activity feed */
  const activityItems = [
    { icon: Wifi,       label: "Sistem pemantauan aktif",           time: now ?? "—" },
    { icon: Camera,     label: `${cameras.length} kamera terdaftar`, time: now ?? "—" },
    { icon: TrendingUp, label: `${liveCount} siaran langsung`,       time: now ?? "—" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, animation: "fadeUp 0.4s ease both" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 8px rgba(255,255,255,0.6)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#71717A", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sistem Online</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.03em" }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>
            {now ? `Diperbarui ${now}` : "Memuat data..."}
          </p>
        </div>
        <button onClick={handleRefresh} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8,
          background: "transparent", border: "1px solid #1F1F2E", color: "#71717A",
          fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
          flexShrink: 0
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}
        >
          <RefreshCw size={13} style={{ animation: spinning ? "spin 0.6s linear" : "none" }} />
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        {loading
          ? Array(5).fill(0).map((_, i) => (
              <div key={i} style={{
                height: 130, borderRadius: 12, background: "rgba(17,17,24,0.5)",
                border: "1px solid #1F1F2E", animation: "fadeUp 0.4s ease both",
                animationDelay: `${i * 60}ms`
              }} />
            ))
          : statCards.map((card, i) => <StatCard key={i} {...card} index={i} />)
        }
      </div>

      {/* ── Two-column lower section ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 12, alignItems: "start" }}>

        {/* Camera Status */}
        <div style={{
          borderRadius: 12, border: "1px solid #1F1F2E", overflow: "hidden",
          background: "rgba(17,17,24,0.6)", backdropFilter: "blur(12px)",
          animation: "fadeUp 0.45s ease 200ms both"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1F1F2E" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MonitorPlay size={13} style={{ color: "#71717A" }} />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", display: "block" }}>Status Kamera</span>
                <span style={{ fontSize: 11, color: "#71717A" }}>{liveCount} aktif · {cameras.length} total</span>
              </div>
            </div>
            <button onClick={() => navigate("/app/cameras")} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7,
              background: "transparent", border: "1px solid #1F1F2E", color: "#71717A",
              fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "color 0.15s, border-color 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}
            >
              Lihat Semua <ArrowUpRight size={12} />
            </button>
          </div>

          <div>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} style={{ margin: "8px 16px", height: 48, borderRadius: 8, background: "#0A0A0F" }} />
              ))
            ) : cameras.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center" }}>
                <WifiOff size={24} style={{ color: "#2D2D3F", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 12px" }}>Belum ada kamera terdaftar</p>
                <button onClick={() => navigate("/app/cameras")} style={{ fontSize: 12, color: "#FFFFFF", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  + Tambah kamera
                </button>
              </div>
            ) : (
              cameras.map((cam, i) => (
                <CameraRow
                  key={cam.id}
                  cam={cam}
                  isLast={i === cameras.length - 1}
                  onClick={() => navigate("/app/live")}
                />
              ))
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{
          borderRadius: 12, border: "1px solid #1F1F2E", overflow: "hidden",
          background: "rgba(17,17,24,0.6)", backdropFilter: "blur(12px)",
          animation: "fadeUp 0.45s ease 280ms both"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid #1F1F2E" }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={13} style={{ color: "#71717A" }} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", display: "block" }}>Aktivitas Sistem</span>
              <span style={{ fontSize: 11, color: "#71717A" }}>Real-time status</span>
            </div>
          </div>
          <div>
            {activityItems.map((item, i) => (
              <ActivityItem key={i} {...item} last={i === activityItems.length - 1} />
            ))}
          </div>
          {/* Quick actions */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid #1F1F2E", display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#71717A", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Aksi Cepat</p>
            {[
              { label: "Siaran Langsung", path: "/app/live", icon: MonitorPlay },
              { label: "Tambah Kamera",   path: "/app/cameras", icon: Camera },
              { label: "Rekaman",         path: "/app/recordings", icon: Film },
            ].map(({ label, path, icon: Icon }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 12px",
                borderRadius: 8, background: "#0A0A0F", border: "1px solid #1F1F2E",
                color: "#71717A", fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s", textAlign: "left"
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}
              >
                <Icon size={13} style={{ flexShrink: 0 }} />
                {label}
                <ArrowUpRight size={11} style={{ marginLeft: "auto" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
