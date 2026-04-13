import { Camera, MonitorPlay, Film, ScanFace, HardDrive, AlertTriangle, Activity, TrendingUp, ArrowUpRight, Zap, ArrowDownRight } from "lucide-react";
import { useLanguageStore } from "../store/languageStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AnimatedText from "../components/AnimatedText";

const stats = [
  { label: "Kamera Aktif",    value: "12",  sub: "2 offline",      icon: Camera,       color: "#06b6d4", trend: "+2",   trendUp: true  },
  { label: "Siaran Langsung", value: "8",   sub: "streaming",       icon: MonitorPlay,  color: "#10b981", trend: "100%", trendUp: true  },
  { label: "Rekaman",         value: "5",   sub: "berjalan",        icon: Film,         color: "#f59e0b", trend: "+1",   trendUp: true  },
  { label: "Deteksi AI",      value: "237", sub: "24 jam terakhir", icon: ScanFace,     color: "#8b5cf6", trend: "+18",  trendUp: true  },
  { label: "Penyimpanan",     value: "3.2", sub: "GB digunakan",    icon: HardDrive,    color: "#06b6d4", trend: "68%",  trendUp: false },
  { label: "Peringatan",      value: "4",   sub: "belum dibaca",    icon: AlertTriangle,color: "#ef4444", trend: "+2",   trendUp: false },
];

const sparklineData = [
  [30, 45, 28, 60, 42, 70, 55, 80, 65, 88],
  [80, 90, 85, 88, 92, 87, 95, 90, 93, 100],
  [20, 30, 25, 35, 30, 38, 42, 35, 40, 45],
  [180, 195, 210, 198, 220, 215, 228, 232, 225, 237],
  [50, 52, 55, 58, 56, 60, 62, 59, 63, 68],
  [1, 2, 1, 3, 2, 4, 3, 3, 4, 4],
];

const cameraStatus = [
  { id: 1, name: "Main Entrance",  location: "Block A — Depan Utama", status: "live" },
  { id: 2, name: "Lobby",          location: "Block A — Lantai 1",    status: "live" },
  { id: 3, name: "Server Room",    location: "Block B — Lantai 2",    status: "live" },
  { id: 4, name: "Parking Lot",    location: "Block C — Luar",        status: "offline" },
  { id: 5, name: "Side Gate",      location: "Block C — Samping",     status: "live" },
  { id: 6, name: "Rooftop",        location: "Block D — Atap",        status: "recording" },
];

const recentAlerts = [
  { type: "Wajah Tidak Dikenal", camera: "Main Entrance",  time: "08:14", severity: "high",   emoji: "🚨" },
  { type: "Pergerakan Malam",    camera: "Parking Lot",    time: "02:33", severity: "medium", emoji: "🌙" },
  { type: "Kamera Offline",      camera: "Parking Lot",    time: "01:15", severity: "high",   emoji: "⚠️" },
  { type: "Kapasitas Penuh",     camera: "Server Room",    time: "Kemarin", severity: "low",  emoji: "💾" },
  { type: "Akses Tidak Sah",     camera: "Side Gate",      time: "Kemarin", severity: "high", emoji: "🔒" },
];

const statusConfig = {
  live:      { color: "#10b981", labelKey: "live",      glow: "rgba(16,185,129,0.3)" },
  offline:   { color: "#6b7280", labelKey: "offline",   glow: "rgba(107,114,128,0.2)" },
  recording: { color: "#ef4444", labelKey: "recording", glow: "rgba(239,68,68,0.3)" },
};

const severityStyle = {
  high:   { bg: "rgba(239,68,68,0.09)",   text: "#ef4444", border: "rgba(239,68,68,0.22)" },
  medium: { bg: "rgba(245,158,11,0.09)",  text: "#f59e0b", border: "rgba(245,158,11,0.22)" },
  low:    { bg: "rgba(100,116,139,0.07)", text: "#94a3b8", border: "rgba(100,116,139,0.18)" },
};

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
        <linearGradient id={`sp-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#sp-${color.replace("#","")})`} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  // State untuk Realtime Data (Persiapan Endpoint WebSocket backend)
  const [liveStats, setLiveStats] = useState(stats);
  const [liveSparklines, setLiveSparklines] = useState(sparklineData);

  // Simulasi data realtime 
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulasi pergerakan AI detection & kapasitas
      setLiveStats(prev => prev.map((s, i) => {
        if (i === 3) { // Deteksi AI (naik stabil)
          return { ...s, value: (parseInt(s.value) + Math.floor(Math.random() * 3)).toString() };
        }
        if (i === 4) { // Storage (fluktuasi tipis)
          const currentStorage = parseFloat(s.value);
          const offset = (Math.random() * 0.1) - 0.05;
          return { ...s, value: Math.max(3.0, currentStorage + offset).toFixed(2) };
        }
        return s; // Sisa stat konstan
      }));

      // Simulasi chart Sparklines bergerak per detik (Random Walk)
      setLiveSparklines(prev => prev.map(data => {
         const last = data[data.length - 1];
         // Tambah/kurang sedikit dari nilai terakhir agar natural
         const next = Math.max(0, last + (Math.random() - 0.5) * 15);
         return [...data.slice(1), next];
      }));
    }, 2000); // UI update tiap 2 detik

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-7 relative z-10 w-full">

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* eslint-disable-next-line no-unused-vars */}
        {liveStats.map(({ label, value, sub, icon: StatIcon, color, trend, trendUp }, i) => (
          <div
            key={i}
            className="gradient-border noise animate-card-enter opacity-0-init cursor-pointer group relative overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface)",
              padding: "18px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              animationDelay: `${i * 70}ms`,
              transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s ease, border-color 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
              e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.14), 0 0 0 1px ${color}35, 0 0 50px ${color}12`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
            }}
          >
            {/* Ambient glow (shows on hover) */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 0% 0%, ${color}18 0%, transparent 60%)`,
                transition: "opacity 0.4s ease",
              }}
            />

            {/* Sparkline — top right */}
            <div
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 pointer-events-none"
              style={{ transition: "opacity 0.3s ease" }}
            >
              <Sparkline data={liveSparklines[i]} color={color} />
            </div>

            {/* Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 relative z-10"
              style={{
                backgroundColor: `${color}14`,
                border: `1px solid ${color}28`,
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.12)";
                e.currentTarget.style.boxShadow = `0 0 16px ${color}50`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <StatIcon size={17} style={{ color }} />
            </div>

            {/* Value */}
            <div className="stat-number text-2xl font-bold mb-0.5 relative z-10" style={{ color: "var(--color-text-base)" }}>
              <AnimatedText text={value} delayOffset={180 + i * 70} splitBy="char" />
            </div>

            {/* Label */}
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 relative z-10" style={{ color: "var(--color-text-sub)" }}>
              {label}
            </div>

            {/* Sub + Trend */}
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[11px]" style={{ color: "var(--color-text-sub)", opacity: 0.65 }}>{sub}</span>
              <span
                className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  color: trendUp ? "#10b981" : "#ef4444",
                  backgroundColor: trendUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                }}
              >
                {trendUp ? <TrendingUp size={9} /> : <ArrowDownRight size={9} />}
                {trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── BOTTOM GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Camera Status — 3 cols */}
        <div
          className="lg:col-span-3 rounded-[18px] overflow-hidden animate-card-enter opacity-0-init"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-card-border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            animationDelay: "480ms",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-card-border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <Activity size={14} style={{ color: "#06b6d4" }} />
              </div>
              <div>
                <h2 className="text-[13px] font-bold" style={{ color: "var(--color-text-base)" }}>
                  <AnimatedText text={t("dashboard.cameraStatus")} delayOffset={600} splitBy="word" />
                </h2>
                <p className="text-[11px]" style={{ color: "var(--color-text-sub)" }}>
                  {cameraStatus.filter(c => c.status === "live").length} aktif dari {cameraStatus.length} kamera
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/app/cameras")}
              className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg"
              style={{
                color: "#06b6d4",
                backgroundColor: "rgba(6,182,212,0.09)",
                border: "1px solid rgba(6,182,212,0.2)",
                transition: "background-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.backgroundColor = "rgba(6,182,212,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.backgroundColor = "rgba(6,182,212,0.09)";
              }}
            >
              {t("dashboard.viewAll")} <ArrowUpRight size={11} />
            </button>
          </div>

          {/* Camera grid */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cameraStatus.map((cam, i) => {
              const s = statusConfig[cam.status];
              return (
                <div
                  key={cam.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl cursor-pointer animate-card-enter opacity-0-init"
                  style={{
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-card-border)",
                    animationDelay: `${600 + i * 70}ms`,
                    transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = `${s.color}45`;
                    e.currentTarget.style.boxShadow = `0 6px 20px ${s.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.borderColor = "var(--color-card-border)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}12`, border: `1px solid ${s.color}22` }}>
                      <Camera size={14} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--color-text-base)" }}>{cam.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-sub)" }}>{cam.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cam.status === "live" ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: s.color }} />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: s.color }} />
                      </span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color }}>
                      {t(`dashboard.status.${s.labelKey}`)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts Feed — 2 cols */}
        <div
          className="lg:col-span-2 rounded-[18px] overflow-hidden flex flex-col animate-card-enter opacity-0-init"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-card-border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            animationDelay: "560ms",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--color-card-border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)" }}>
                <Zap size={14} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <h2 className="text-[13px] font-bold" style={{ color: "var(--color-text-base)" }}>
                  <AnimatedText text={t("dashboard.recentAlerts")} delayOffset={700} splitBy="word" />
                </h2>
                <p className="text-[11px]" style={{ color: "var(--color-text-sub)" }}>
                  {recentAlerts.filter(a => a.severity === "high").length} {t("dashboard.critical")}
                </p>
              </div>
            </div>
            <span
              className="text-[9px] font-bold tracking-widest px-2 py-1 rounded-full flex items-center gap-1"
              style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ backgroundColor: "#ef4444" }} />
              LIVE
            </span>
          </div>

          {/* Alert list */}
          <div className="flex-1 overflow-y-auto">
            {recentAlerts.map((alert, i) => {
              const sv = severityStyle[alert.severity];
              return (
                <div
                  key={i}
                  className="flex gap-3 items-start px-5 py-3.5 cursor-pointer animate-card-enter opacity-0-init"
                  style={{
                    animationDelay: `${800 + i * 80}ms`,
                    transition: "background-color 0.15s ease",
                    borderBottom: i < recentAlerts.length - 1 ? "1px solid rgba(6,182,212,0.15)" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg leading-none"
                    style={{ backgroundColor: sv.bg, border: `1px solid ${sv.border}` }}
                  >
                    {alert.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold truncate" style={{ color: "var(--color-text-base)" }}>{alert.type}</p>
                      <span className="text-[10px] font-mono shrink-0 mt-0.5" style={{ color: "var(--color-text-sub)" }}>{alert.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] truncate flex-1" style={{ color: "var(--color-text-sub)" }}>{alert.camera}</p>
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                        style={{ color: sv.text, backgroundColor: sv.bg, border: `1px solid ${sv.border}` }}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div className="p-4 shrink-0" style={{ borderTop: "1px solid var(--color-card-border)" }}>
            <button
              className="w-full py-2.5 text-[12px] font-semibold rounded-xl"
              style={{
                color: "#06b6d4",
                backgroundColor: "rgba(6,182,212,0.07)",
                border: "1px solid rgba(6,182,212,0.18)",
                transition: "transform 0.2s ease, background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.backgroundColor = "rgba(6,182,212,0.13)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.backgroundColor = "rgba(6,182,212,0.07)";
              }}
              onClick={() => navigate("/app/recordings")}>
              Lihat semua peringatan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
