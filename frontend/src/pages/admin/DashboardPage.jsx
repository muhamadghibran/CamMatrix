import { Camera, MonitorPlay, Film, HardDrive, Users, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import AnimatedText from "../../components/AnimatedText";
import api from "../../utils/api";
function Sparkline({ data, color }) {
  const w = 72, h = 26;
  const mn = Math.min(...data), mx = Math.max(...data);
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - mn) / (mx - mn || 1)) * h}`
  ).join(" ");
  const fill = `${pts} ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sp-${color.replace("#", "")})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
const statusConfig = {
  live:    { color: "#10b981", labelKey: "live",    glow: "rgba(16,185,129,0.25)" },
  offline: { color: "#6b7280", labelKey: "offline", glow: "rgba(107,114,128,0.15)" },
};
function StatCard({ label, value, sub, icon, color, trend, trendUp, sparkData, index, isDark }) {
  const StatCardIcon = icon;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="gradient-border noise relative overflow-hidden cursor-pointer animate-card-enter opacity-0-init"
      style={{
        backgroundColor: "var(--color-surface)",
        padding: "20px",
        boxShadow: hovered
          ? (isDark
            ? `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px ${color}35`
            : `0 12px 32px rgba(15,23,42,0.12), 0 0 0 1px ${color}30`)
          : "var(--shadow-card)",
        animationDelay: `${index * 70}ms`,
        transform: hovered ? "translateY(-4px) scale(1.01)" : "none",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-400"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${color}15, transparent 65%)`,
          opacity: hovered ? 1 : 0,
        }}
      />
      <div
        className="absolute top-3.5 right-3.5 pointer-events-none transition-opacity duration-300"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <Sparkline data={sparkData || [0]} color={color} />
      </div>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3.5 relative z-10"
        style={{
          backgroundColor: `${color}12`,
          border: `1px solid ${color}25`,
        }}
      >
        <StatCardIcon size={17} style={{ color }} />
      </div>
      <div
        className="stat-number text-2xl font-bold mb-0.5 relative z-10"
        style={{ color: "var(--color-text-base)" }}
      >
        <AnimatedText text={value} delayOffset={180 + index * 70} splitBy="char" />
      </div>
      <div
        className="text-[11px] font-semibold uppercase tracking-wider mb-3 relative z-10"
        style={{ color: "var(--color-text-sub)", letterSpacing: "0.07em" }}
      >
        {label}
      </div>
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[11px]" style={{ color: "var(--color-text-sub)", opacity: 0.7 }}>
          {sub}
        </span>
        <span
          className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={{
            color:           trendUp ? "#10b981" : "#ef4444",
            backgroundColor: trendUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          }}
        >
          {trendUp ? <TrendingUp size={9} /> : <ArrowDownRight size={9} />}
          {trend}
        </span>
      </div>
    </div>
  );
}
function CameraStatusCard({ cam, index, isDark, onClick }) {
  const [hovered, setHovered] = useState(false);
  const s = statusConfig[cam.status] || statusConfig.offline;
  return (
    <div
      className="flex items-center justify-between p-3.5 rounded-2xl cursor-pointer animate-card-enter opacity-0-init"
      style={{
        backgroundColor: hovered ? "var(--color-surface-elevated)" : "var(--color-surface-elevated)",
        border: `1px solid ${hovered ? `${s.color}40` : "var(--color-card-border)"}`,
        boxShadow: hovered
          ? (isDark ? `0 6px 20px ${s.glow}` : `0 4px 12px ${s.glow}`)
          : "none",
        animationDelay: `${600 + index * 70}ms`,
        transition: "border-color 0.2s, transform 0.2s, box-shadow 0.25s",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${s.color}10`,
            border: `1px solid ${s.color}20`,
          }}
        >
          <Camera size={14} style={{ color: s.color }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--color-text-base)" }}>
            {cam.name}
          </p>
          {cam.location && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-sub)" }}>
              {cam.location}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {cam.status === "live" ? (
          <span className="relative flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ backgroundColor: s.color }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: s.color }}
            />
          </span>
        ) : (
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
        )}
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: s.color }}
        >
          {cam.status}
        </span>
      </div>
    </div>
  );
}
export default function DashboardPage() {
  const { t }        = useLanguageStore();
  const navigate     = useNavigate();
  const isDark       = true;
  const [stats, setStats]           = useState(null);
  const [cameras, setCameras]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sparklines, setSparklines] = useState([
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
  ]);
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
        const realVal = [
          s.total_cameras,
          s.live_cameras,
          s.total_recordings,
          s.storage_gb,
          s.active_users,
        ][i] || 0;
        return line.map((_, j) =>
          Math.max(0, realVal + (Math.random() - 0.5) * realVal * 0.3 * (j / 9))
        );
      }));
    } catch (e) {
      console.error("Gagal memuat data dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDashboard();
    const refreshInterval = setInterval(fetchDashboard, 30000);
    const sparkInterval = setInterval(() => {
      setSparklines(prev => prev.map(data => {
        const last = data[data.length - 1];
        const next = Math.max(0, last + (Math.random() - 0.5) * Math.max(1, last * 0.1));
        return [...data.slice(1), next];
      }));
    }, 2000);
    return () => { clearInterval(refreshInterval); clearInterval(sparkInterval); };
  }, [fetchDashboard]);
  const statCards = stats ? [
    {
      label: "Kamera Aktif",
      value: String(stats.total_cameras),
      sub:   `${stats.offline_cameras} offline`,
      icon:  Camera,
      color: "#06b6d4",
      trend: stats.live_cameras > 0 ? `${stats.live_cameras} live` : "0 live",
      trendUp: stats.live_cameras > 0,
    },
    {
      label: "Siaran Langsung",
      value: String(stats.live_cameras),
      sub:   "streaming sekarang",
      icon:  MonitorPlay,
      color: "#10b981",
      trend: stats.total_cameras > 0 ? `${Math.round((stats.live_cameras / stats.total_cameras) * 100)}%` : "0%",
      trendUp: stats.live_cameras > 0,
    },
    {
      label: "Rekaman",
      value: String(stats.total_recordings),
      sub:   "total tersimpan",
      icon:  Film,
      color: "#f59e0b",
      trend: stats.total_recordings > 0 ? `+${stats.total_recordings}` : "0",
      trendUp: stats.total_recordings > 0,
    },
    {
      label: "Penyimpanan",
      value: String(stats.storage_gb),
      sub:   "GB digunakan",
      icon:  HardDrive,
      color: "#8b5cf6",
      trend: stats.storage_gb > 0 ? `${stats.storage_gb} GB` : "0 GB",
      trendUp: false,
    },
    {
      label: "Pengguna Aktif",
      value: String(stats.active_users),
      sub:   "administrator",
      icon:  Users,
      color: "#ec4899",
      trend: `${stats.active_users} akun`,
      trendUp: true,
    },
  ] : [];
  const liveCount = cameras.filter(c => c.status === "live").length;
  return (
    <div className="space-y-6 relative z-10 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--color-text-base)", letterSpacing: "-0.025em" }}
          >
            Dashboard
          </h1>
          {lastUpdate && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-sub)" }}>
              Diperbarui: {lastUpdate.toLocaleTimeString("id-ID")}
            </p>
          )}
        </div>
        <button
          id="dashboard-refresh-btn"
          onClick={fetchDashboard}
          className="flex items-center gap-2 text-[12px] font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          style={{
            border: "1px solid var(--color-card-border)",
            color: "var(--color-text-sub)",
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-card)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.color = "#06b6d4"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.color = "var(--color-text-sub)"; }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {loading
          ? Array(5).fill(0).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{
                  height: "130px",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-card-border)",
                }}
              />
            ))
          : statCards.map((card, i) => (
              <StatCard
                key={i}
                {...card}
                sparkData={sparklines[i]}
                index={i}
                isDark={isDark}
              />
            ))
        }
      </div>
      <div
        className="rounded-2xl overflow-hidden animate-card-enter opacity-0-init"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-card-border)",
          boxShadow: "var(--shadow-card)",
          animationDelay: "480ms",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--color-card-border)" }}
        >
          <div className="flex items-center gap-4">
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "5px 12px", borderRadius: "6px",
              border: "1px solid rgba(6,182,212,0.25)",
              background: "rgba(6,182,212,0.06)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px rgba(34,197,94,0.8)",
                animation: "blinkDot 2s ease-in-out infinite",
                flexShrink: 0,
              }} />
              <span style={{ fontSize: "9px", fontWeight: 700, color: "rgba(6,182,212,0.7)", letterSpacing: "0.1em" }}>SYS</span>
            </div>
            <div>
              <h2 className="text-[13px] font-bold" style={{ color: "var(--color-text-base)" }}>
                <AnimatedText text={t("dashboard.cameraStatus")} delayOffset={600} splitBy="word" />
              </h2>
              <p className="text-[11px]" style={{ color: "var(--color-text-sub)" }}>
                {liveCount} live dari {cameras.length} kamera
              </p>
            </div>
          </div>
          <button
            id="dashboard-view-all-btn"
            onClick={() => navigate("/app/cameras")}
            className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
            style={{
              color: "#06b6d4",
              backgroundColor: "rgba(6,182,212,0.08)",
              border: "1px solid rgba(6,182,212,0.2)",
            }}
          >
            {t("dashboard.viewAll")} <ArrowUpRight size={11} />
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading
            ? Array(3).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl animate-pulse"
                  style={{ height: "68px", backgroundColor: "var(--color-surface-elevated)" }}
                />
              ))
            : cameras.length === 0
            ? (
              <div className="col-span-3 text-center py-12" style={{ color: "var(--color-text-sub)" }}>
                <Camera size={36} className="mx-auto mb-3 opacity-25" />
                <p className="text-sm font-semibold">Belum ada kamera terdaftar.</p>
                <button
                  onClick={() => navigate("/app/cameras")}
                  className="mt-2 text-[12px] font-semibold underline"
                  style={{ color: "#06b6d4" }}
                >
                  Tambah kamera
                </button>
              </div>
            )
            : cameras.map((cam, i) => (
                <CameraStatusCard
                  key={cam.id}
                  cam={cam}
                  index={i}
                  isDark={isDark}
                  onClick={() => navigate("/app/live")}
                />
              ))
          }
        </div>
      </div>
    </div>
  );
}
