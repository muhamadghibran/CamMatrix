import {
  Camera, MonitorPlay, Film, HardDrive, Users,
  ArrowUpRight, RefreshCw, WifiOff, Wifi, Activity,
  TrendingUp, Clock, Shield, ScanFace, AlertTriangle,
  CheckCircle2, Circle, Zap, BarChart2, Lock
} from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon, index, trend }) {
  const Icon = icon;
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "20px 22px", borderRadius: 12,
        background: hov ? "#111118" : "rgba(17,17,24,0.6)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "#1F1F2E"}`,
        display: "flex", flexDirection: "column", gap: 14, cursor: "default",
        transition: "background 0.2s, border-color 0.2s, transform 0.2s",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        animation: "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        animationDelay: `${index * 60}ms`, backdropFilter: "blur(12px)",
      }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#71717A", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: hov ? "#1F1F2E" : "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
          <Icon size={14} style={{ color: hov ? "#FFFFFF" : "#71717A", transition: "color 0.2s" }} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#71717A" }}>{sub}</span>
        {trend && <span style={{ fontSize: 11, color: "#71717A", fontFamily: "monospace" }}>{trend}</span>}
      </div>
    </div>
  );
}

/* ── Camera Row ── */
function CameraRow({ cam, onClick, isLast }) {
  const isLive = cam.status === "live";
  const isRecording = cam.status === "recording";
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", cursor: "pointer", background: hov ? "rgba(255,255,255,0.025)" : "transparent", borderBottom: isLast ? "none" : "1px solid #1A1A26", transition: "background 0.15s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: isLive ? "#FFFFFF" : isRecording ? "#A0A0A0" : "#2D2D3F", boxShadow: isLive ? "0 0 8px rgba(255,255,255,0.5)" : "none" }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cam.name}</p>
          {cam.location && <p style={{ fontSize: 11, color: "#71717A", margin: "2px 0 0" }}>{cam.location}</p>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {cam.fps > 0 && <span style={{ fontSize: 11, color: "#3D3D4F", fontFamily: "monospace" }}>{cam.fps}fps</span>}
        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, letterSpacing: "0.06em", background: isLive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)", border: `1px solid ${isLive ? "rgba(255,255,255,0.12)" : "#1F1F2E"}`, color: isLive ? "#FFFFFF" : "#3D3D4F" }}>
          {cam.status?.toUpperCase()}
        </span>
        <ArrowUpRight size={13} style={{ color: hov ? "#71717A" : "#2D2D3F", transition: "color 0.15s" }} />
      </div>
    </div>
  );
}

/* ── Alert Row ── */
function AlertRow({ level, msg, time, last }) {
  const colors = { high: "#FF4444", medium: "#A0A0A0", low: "#3D3D4F" };
  const c = colors[level] || colors.low;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: last ? "none" : "1px solid #1A1A26" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: c, boxShadow: level === "high" ? `0 0 6px ${c}88` : "none" }} />
      <p style={{ fontSize: 12, color: "#FFFFFF", margin: 0, flex: 1 }}>{msg}</p>
      <span style={{ fontSize: 11, color: "#3D3D4F", fontFamily: "monospace", flexShrink: 0 }}>{time}</span>
    </div>
  );
}

/* ── Metric Bar ── */
function MetricBar({ label, value, max, unit }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#71717A" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF", fontFamily: "monospace" }}>{value}{unit}</span>
      </div>
      <div style={{ height: 3, borderRadius: 99, background: "#1A1A26", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? "#FF4444" : "#FFFFFF", borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

/* ── Detection Heatmap (hour bars) ── */
function HeatBar({ hour, count, max }) {
  const pct = max > 0 ? (count / max) : 0;
  const opacity = 0.1 + pct * 0.9;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
      <div style={{ width: "100%", height: 36, borderRadius: 4, background: `rgba(255,255,255,${opacity})`, transition: "background 0.3s" }} title={`${hour}:00 — ${count} deteksi`} />
      {hour % 6 === 0 && <span style={{ fontSize: 9, color: "#3D3D4F", fontFamily: "monospace" }}>{String(hour).padStart(2, "0")}</span>}
    </div>
  );
}

/* ── Main Page ── */
export default function DashboardPage() {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [spinning, setSpinning]     = useState(false);

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
    const t = setInterval(fetchDashboard, 30000);
    return () => clearInterval(t);
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    setSpinning(true);
    await fetchDashboard();
    setTimeout(() => setSpinning(false), 600);
  };

  const liveCount = cameras.filter(c => c.status === "live").length;
  const now = lastUpdate
    ? lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : null;

  const statCards = stats ? [
    { label: "Total Kamera",    value: stats.total_cameras,    sub: `${stats.offline_cameras ?? 0} offline`,  icon: Camera,    trend: "↑ 0% hari ini" },
    { label: "Siaran Langsung", value: stats.live_cameras,     sub: "aktif sekarang",                          icon: Wifi,      trend: `${liveCount} stream` },
    { label: "Total Rekaman",   value: stats.total_recordings, sub: "tersimpan",                               icon: Film,      trend: "30 hari" },
    { label: "Penyimpanan",     value: `${stats.storage_gb} GB`, sub: "digunakan",                            icon: HardDrive, trend: "dari 500 GB" },
    { label: "Pengguna",        value: stats.active_users,     sub: "akun aktif",                              icon: Users,     trend: "online" },
  ] : [];

  /* Mock data — replace with real API when ready */
  const mockAlerts = [
    { level: "high",   msg: "Kamera HP Larix offline",             time: now ?? "—" },
    { level: "medium", msg: "Deteksi wajah tidak dikenal — Lobi",  time: "12:35"   },
    { level: "medium", msg: "Penyimpanan mendekati batas 80%",     time: "11:20"   },
    { level: "low",    msg: "Sistem dimulai ulang — Server Room",  time: "08:00"   },
  ];

  const heatData = [
    3,0,0,1,0,0,2,4,8,5,3,6, // 00-11
    9,7,11,8,5,4,10,12,7,4,2,1 // 12-23
  ];
  const heatMax = Math.max(...heatData);

  const systemHealth = [
    { label: "CPU Usage",  value: 23, max: 100, unit: "%" },
    { label: "RAM Usage",  value: 41, max: 100, unit: "%" },
    { label: "Disk Usage", value: 12, max: 100, unit: "%" },
    { label: "Network",    value: 38, max: 100, unit: " Mbps" },
  ];

  const quickActions = [
    { label: "Siaran Langsung", path: "/app/live",       icon: MonitorPlay },
    { label: "Tambah Kamera",   path: "/app/cameras",    icon: Camera      },
    { label: "Rekaman",         path: "/app/recordings", icon: Film        },
    { label: "Analitik Wajah",  path: "/app/face",       icon: ScanFace    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, animation: "fadeUp 0.4s ease both" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 8px rgba(255,255,255,0.6)", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#71717A", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sistem Online</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.03em" }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>{now ? `Diperbarui ${now}` : "Memuat data..."}</p>
        </div>
        <button onClick={handleRefresh} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "color 0.15s, border-color 0.15s", flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
          <RefreshCw size={13} style={{ animation: spinning ? "spin 0.6s linear" : "none" }} /> Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        {loading
          ? Array(5).fill(0).map((_, i) => <div key={i} style={{ height: 130, borderRadius: 12, background: "rgba(17,17,24,0.5)", border: "1px solid #1F1F2E" }} />)
          : statCards.map((card, i) => <StatCard key={i} {...card} index={i} />)
        }
      </div>

      {/* ── Detection Heatmap ── */}
      <div style={{ borderRadius: 12, border: "1px solid #1F1F2E", overflow: "hidden", background: "rgba(17,17,24,0.6)", backdropFilter: "blur(12px)", animation: "fadeUp 0.4s ease 120ms both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={13} style={{ color: "#71717A" }} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", display: "block" }}>Aktivitas Deteksi</span>
              <span style={{ fontSize: 11, color: "#71717A" }}>Distribusi per jam — 24 jam terakhir</span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#3D3D4F", fontFamily: "monospace" }}>{heatMax} maks/jam</span>
        </div>
        <div style={{ padding: "16px 20px 12px", display: "flex", gap: 3, alignItems: "flex-end" }}>
          {heatData.map((count, hour) => (
            <HeatBar key={hour} hour={hour} count={count} max={heatMax} />
          ))}
        </div>
      </div>

      {/* ── 3-column row: Camera Status | Alerts | System Health ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 12, alignItems: "start" }}>

        {/* Camera Status */}
        <div style={{ borderRadius: 12, border: "1px solid #1F1F2E", overflow: "hidden", background: "rgba(17,17,24,0.6)", backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 160ms both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MonitorPlay size={13} style={{ color: "#71717A" }} />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", display: "block" }}>Status Kamera</span>
                <span style={{ fontSize: 11, color: "#71717A" }}>{liveCount} aktif · {cameras.length} total</span>
              </div>
            </div>
            <button onClick={() => navigate("/app/cameras")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 12, cursor: "pointer", transition: "color 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
              Semua <ArrowUpRight size={11} />
            </button>
          </div>
          {loading ? Array(2).fill(0).map((_, i) => <div key={i} style={{ margin: "8px 16px", height: 48, borderRadius: 8, background: "#0A0A0F" }} />)
            : cameras.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <WifiOff size={20} style={{ color: "#2D2D3F", margin: "0 auto 10px", display: "block" }} />
                <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 10px" }}>Belum ada kamera</p>
                <button onClick={() => navigate("/app/cameras")} style={{ fontSize: 12, color: "#FFFFFF", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>+ Tambah kamera</button>
              </div>
            ) : cameras.map((cam, i) => <CameraRow key={cam.id} cam={cam} isLast={i === cameras.length - 1} onClick={() => navigate("/app/live")} />)
          }
        </div>

        {/* Alerts */}
        <div style={{ borderRadius: 12, border: "1px solid #1F1F2E", overflow: "hidden", background: "rgba(17,17,24,0.6)", backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 220ms both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={13} style={{ color: "#71717A" }} />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", display: "block" }}>Log Peringatan</span>
                <span style={{ fontSize: 11, color: "#71717A" }}>
                  <span style={{ color: "#FF4444" }}>●</span> {mockAlerts.filter(a => a.level === "high").length} kritis ·&nbsp;
                  {mockAlerts.filter(a => a.level === "medium").length} sedang
                </span>
              </div>
            </div>
            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "#0A0A0F", border: "1px solid #1F1F2E", color: "#3D3D4F", fontWeight: 600, letterSpacing: "0.06em" }}>LIVE</span>
          </div>
          {mockAlerts.map((a, i) => <AlertRow key={i} {...a} last={i === mockAlerts.length - 1} />)}
        </div>

        {/* Right col: System Health + Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* System Health */}
          <div style={{ borderRadius: 12, border: "1px solid #1F1F2E", overflow: "hidden", background: "rgba(17,17,24,0.6)", backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 280ms both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={13} style={{ color: "#71717A" }} />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", display: "block" }}>Kesehatan Sistem</span>
                <span style={{ fontSize: 11, color: "#71717A" }}>Resource server</span>
              </div>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {systemHealth.map(m => <MetricBar key={m.label} {...m} />)}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ borderRadius: 12, border: "1px solid #1F1F2E", overflow: "hidden", background: "rgba(17,17,24,0.6)", backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 340ms both" }}>
            <div style={{ padding: "13px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.06em" }}>Aksi Cepat</span>
            </div>
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: 4 }}>
              {quickActions.map(({ label, path, icon: Icon }) => (
                <button key={path} onClick={() => navigate(path)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 12px", borderRadius: 8, background: "transparent", border: "1px solid transparent", color: "#71717A", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "border-color 0.15s, color 0.15s, background 0.15s", textAlign: "left" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#1F1F2E"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}>
                  <Icon size={13} style={{ flexShrink: 0 }} />
                  {label}
                  <ArrowUpRight size={11} style={{ marginLeft: "auto", opacity: 0.4 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
