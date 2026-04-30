import {
  Camera,
  MonitorPlay,
  Film,
  HardDrive,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  RefreshCw,
  Wifi,
  WifiOff,
  Activity,
  Zap,
} from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";

function Sparkline({ data, color }) {
  const w = 80, h = 28;
  const mn = Math.min(...data), mx = Math.max(...data);
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - mn) / (mx - mn || 1)) * h}`
  ).join(" ");
  const fill = `${pts} ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sp-${color.replace("#", "")})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, sub, icon, color, trend, trendUp, sparkData, index }) {
  const Icon = icon;
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        borderRadius: "16px",
        padding: "20px 20px 16px",
        background: hov
          ? `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? color + "50" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hov ? `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}30` : "0 2px 8px rgba(0,0,0,0.3)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        cursor: "default",
        overflow: "hidden",
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div style={{
        position: "absolute", inset: 0, borderRadius: "16px", pointerEvents: "none",
        background: `radial-gradient(ellipse at -10% -10%, ${color}18, transparent 60%)`,
        opacity: hov ? 1 : 0, transition: "opacity 0.3s ease",
      }} />

      <div style={{ position: "absolute", top: "14px", right: "14px", opacity: hov ? 1 : 0, transition: "opacity 0.3s ease" }}>
        <Sparkline data={sparkData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]} color={color} />
      </div>

      <div style={{
        width: "40px", height: "40px", borderRadius: "12px", display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: "14px",
        background: `linear-gradient(135deg, ${color}22, ${color}0a)`,
        border: `1px solid ${color}30`,
        boxShadow: hov ? `0 0 16px ${color}30` : "none",
        transition: "box-shadow 0.25s ease",
      }}>
        <Icon size={18} style={{ color }} />
      </div>

      <div style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "4px", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
        {label}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.7)" }}>{sub}</span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "3px",
          fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
          color: trendUp ? "#10b981" : "#6b7280",
          background: trendUp ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.1)",
          border: `1px solid ${trendUp ? "rgba(16,185,129,0.25)" : "rgba(107,114,128,0.15)"}`,
        }}>
          {trendUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {trend}
        </span>
      </div>
    </div>
  );
}

function CameraCard({ cam, index, onClick }) {
  const [hov, setHov] = useState(false);
  const isLive = cam.status === "live";
  const color = isLive ? "#10b981" : "#6b7280";
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", borderRadius: "12px", cursor: "pointer",
        background: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? color + "40" : "rgba(255,255,255,0.06)"}`,
        boxShadow: hov && isLive ? `0 4px 16px rgba(16,185,129,0.12)` : "none",
        transform: hov ? "translateY(-1px)" : "none",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        animationDelay: `${600 + index * 60}ms`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "4px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${color}15`, border: `1px solid ${color}25`,
        }}>
          {isLive
            ? <Wifi size={15} style={{ color }} />
            : <WifiOff size={15} style={{ color }} />
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {cam.name}
          </p>
          {cam.location && (
            <p style={{ fontSize: "11px", color: "#71717A", margin: 0, marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cam.location}
            </p>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "8px" }}>
        {isLive && (
          <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px" }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%", background: color,
              animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite", opacity: 0.6,
            }} />
            <span style={{ position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: color, display: "block" }} />
          </span>
        )}
        <span style={{
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
          padding: "3px 8px", borderRadius: "5px", textTransform: "uppercase",
          color, background: `${color}15`, border: `1px solid ${color}30`,
        }}>
          {cam.status}
        </span>
      </div>
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
  const [sparklines, setSparklines] = useState(Array(5).fill(null).map(() => Array(10).fill(0)));

  const fetchDashboard = useCallback(async () => {
    try {
      const [statsRes, camRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/cameras-status"),
      ]);
      const s = statsRes.data;
      setStats(s);
      setCameras(camRes.data);
      setLastUpdate(new Date());
      setSparklines(prev => prev.map((line, i) => {
        const realVal = [s.total_cameras, s.live_cameras, s.total_recordings, s.storage_gb, s.active_users][i] || 0;
        return line.map((_, j) => Math.max(0, realVal + (Math.random() - 0.5) * realVal * 0.3 * (j / 9)));
      }));
    } catch (e) {
      console.error("Gagal memuat data dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const refresh = setInterval(fetchDashboard, 30000);
    const spark = setInterval(() => {
      setSparklines(prev => prev.map(data => {
        const last = data[data.length - 1];
        return [...data.slice(1), Math.max(0, last + (Math.random() - 0.5) * Math.max(1, last * 0.1))];
      }));
    }, 2000);
    return () => { clearInterval(refresh); clearInterval(spark); };
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    setSpinning(true);
    await fetchDashboard();
    setTimeout(() => setSpinning(false), 600);
  };

  const statCards = stats ? [
    { label: "Total Kamera", value: String(stats.total_cameras), sub: `${stats.offline_cameras ?? 0} offline`, icon: Camera, color: "#FFFFFF", trend: `${stats.live_cameras} live`, trendUp: stats.live_cameras > 0 },
    { label: "Siaran Langsung", value: String(stats.live_cameras), sub: "streaming aktif", icon: Zap, color: "#10b981", trend: stats.total_cameras > 0 ? `${Math.round((stats.live_cameras / stats.total_cameras) * 100)}%` : "0%", trendUp: stats.live_cameras > 0 },
    { label: "Total Rekaman", value: String(stats.total_recordings), sub: "tersimpan", icon: Film, color: "#f59e0b", trend: stats.total_recordings > 0 ? `+${stats.total_recordings}` : "0", trendUp: stats.total_recordings > 0 },
    { label: "Penyimpanan", value: `${stats.storage_gb}`, sub: "GB digunakan", icon: HardDrive, color: "#FFFFFF", trend: `${stats.storage_gb} GB`, trendUp: false },
    { label: "Pengguna", value: String(stats.active_users), sub: "administrator", icon: Users, color: "#ec4899", trend: `${stats.active_users} akun`, trendUp: true },
  ] : [];

  const liveCount = cameras.filter(c => c.status === "live").length;
  const now = lastUpdate ? lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative", zIndex: 10, width: "100%" }}>
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-anim {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
      `}</style>

      <div className="dash-anim" style={{ animationDelay: "0ms", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "4px 10px", borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", boxShadow: "none", animation: "blinkDot 2s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.12em" }}>SYS ONLINE</span>
            </div>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em", margin: 0 }}>
            Dashboard
          </h1>
          {now && (
            <p style={{ fontSize: "11px", color: "rgba(148,163,184,0.7)", margin: "3px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
              <Activity size={10} style={{ display: "inline", marginRight: "5px", verticalAlign: "middle" }} />
              Diperbarui {now}
            </p>
          )}
        </div>
        <button
          id="dashboard-refresh-btn"
          onClick={handleRefresh}
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            padding: "9px 16px", borderRadius: "12px", cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#71717A", fontSize: "12px", fontWeight: 600,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#FFFFFF"; e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#71717A"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        >
          <RefreshCw size={13} style={{ animation: spinning ? "spin 0.6s linear" : "none" }} />
          Refresh
        </button>
      </div>

      <div className="dash-anim" style={{ animationDelay: "60ms", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px" }}>
        {loading
          ? Array(5).fill(0).map((_, i) => (
            <div key={i} style={{ height: "136px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))
          : statCards.map((card, i) => (
            <StatCard key={i} {...card} sparkData={sparklines[i]} index={i} />
          ))
        }
      </div>

      <div className="dash-anim" style={{
        animationDelay: "200ms", borderRadius: "18px", overflow: "hidden",
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "4px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
              <MonitorPlay size={16} style={{ color: "#FFFFFF" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                {t("dashboard.cameraStatus")}
              </h2>
              <p style={{ fontSize: "11px", color: "#71717A", margin: "2px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
                {liveCount} live · {cameras.length} total
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "10px", fontWeight: 700, color: "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981", boxShadow: "none", animation: "blinkDot 2s ease-in-out infinite" }} />
                {liveCount} LIVE
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "6px", background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)", fontSize: "10px", fontWeight: 700, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace" }}>
                {cameras.length - liveCount} OFF
              </span>
            </div>
            <button
              id="dashboard-view-all-btn"
              onClick={() => navigate("/app/cameras")}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "7px 14px", borderRadius: "9px", cursor: "pointer",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#FFFFFF", fontSize: "11px", fontWeight: 600, transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              {t("dashboard.viewAll")} <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ height: "60px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))
          ) : cameras.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 20px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Camera size={24} style={{ color: "rgba(148,163,184,0.4)" }} />
              </div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#71717A", margin: "0 0 8px" }}>Belum ada kamera terdaftar</p>
              <button
                onClick={() => navigate("/app/cameras")}
                style={{ fontSize: "12px", fontWeight: 600, color: "#FFFFFF", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Tambah kamera sekarang
              </button>
            </div>
          ) : (
            cameras.map((cam, i) => (
              <CameraCard key={cam.id} cam={cam} index={i} onClick={() => navigate("/app/live")} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
