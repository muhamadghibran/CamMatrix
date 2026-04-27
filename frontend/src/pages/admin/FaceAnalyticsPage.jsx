import { ScanFace, Camera, Clock, ArrowRight, TrendingUp, Shield, ChevronUp, ChevronDown } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import AnimatedText from "../../components/AnimatedText";

const detections = [
  { id: 1, face: "Unknown #001", cam1: "Main Entrance",  cam2: "Lobby",       time1: "08:14:32", time2: "08:17:05", confidence: 94 },
  { id: 2, face: "Unknown #002", cam1: "Side Gate",      cam2: "Parking Lot", time1: "09:02:11", time2: "09:04:48", confidence: 88 },
  { id: 3, face: "Unknown #003", cam1: "Lobby",          cam2: "Server Room", time1: "10:31:55", time2: "10:35:20", confidence: 91 },
  { id: 4, face: "Unknown #004", cam1: "Main Entrance",  cam2: "Rooftop",     time1: "11:05:08", time2: "11:12:44", confidence: 79 },
  { id: 5, face: "Unknown #005", cam1: "Reception",      cam2: "Lobby",       time1: "13:20:35", time2: "13:22:10", confidence: 96 },
];

function ConfidenceBar({ value }) {
  const color = value >= 90 ? "#10b981" : value >= 80 ? "#f59e0b" : "#ef4444";
  const label = value >= 90 ? "Tinggi" : value >= 80 ? "Sedang" : "Rendah";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-medium" style={{ color: "var(--color-text-sub)" }}>
          Kepercayaan
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold" style={{ color }}>{value}%</span>
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{ color, backgroundColor: `${color}18` }}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-elevated)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

export default function FaceAnalyticsPage() {
  const { t } = useLanguageStore();

  const statItems = [
    { labelKey: "total",   value: "237", subKey: "last24h",    color: "#8b5cf6", icon: ScanFace,    trend: "+18%", trendUp: true  },
    { labelKey: "unique",  value: "41",  subKey: "identified", color: "#06b6d4", icon: Shield,      trend: "+5",   trendUp: true  },
    { labelKey: "matches", value: "18",  subKey: "today",      color: "#10b981", icon: TrendingUp,  trend: "+3",   trendUp: true  },
  ];

  return (
    <div className="space-y-6 relative z-10 w-full">

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* eslint-disable-next-line no-unused-vars */}
        {statItems.map(({ labelKey, value, subKey, color, icon: StatIcon, trend, trendUp }, i) => (
          <div
            key={labelKey}
            className="relative rounded-2xl p-6 group overflow-hidden cursor-pointer animate-slide-up opacity-0-init transition-all duration-300"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-card-border)",
              animationDelay: `${i * 120}ms`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.15), 0 0 0 1px ${color}30`;
              e.currentTarget.style.borderColor = `${color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              e.currentTarget.style.borderColor = "var(--color-card-border)";
            }}
          >
            {/* Radial glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 0% 0%, ${color}15, transparent 60%)` }}
            />

            {/* Corner accent */}
            <div
              className="absolute top-0 right-0 w-20 h-20 opacity-5 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
            />

            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
              >
                <StatIcon size={22} style={{ color }} />
              </div>
              <span
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                style={{ color: trendUp ? "#10b981" : "#ef4444", backgroundColor: trendUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}
              >
                {trendUp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {trend}
              </span>
            </div>

            <div className="stat-number text-4xl font-bold mb-1" style={{ color }}>
              <AnimatedText text={value} delayOffset={300 + i * 120} splitBy="char" />
            </div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--color-text-base)" }}>
              {t(`analytics.stats.${labelKey}`)}
            </p>
            <p className="text-[12px]" style={{ color: "var(--color-text-sub)" }}>
              {t(`analytics.period.${subKey}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Tracking table */}
      <div
        className="rounded-2xl overflow-hidden animate-slide-up opacity-0-init delay-400"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-card-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--color-card-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,255,255,0.12)" }}>
              <ScanFace size={16} style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--color-text-base)" }}>
                <AnimatedText text={t("analytics.table.title")} delayOffset={600} splitBy="word" />
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-sub)" }}>
                {t("analytics.table.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div style={{ borderColor: "rgba(6,182,212,0.15)" }}>
          {detections.map((det, i) => (
            <div
              key={det.id}
              className="px-6 py-4 grid grid-cols-5 gap-4 items-center group cursor-pointer transition-all duration-200 animate-slide-up opacity-0-init"
              style={{
                animationDelay: `${700 + i * 100}ms`,
                borderBottom: i < detections.length - 1 ? "1px solid rgba(6,182,212,0.12)" : "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              {/* Face avatar */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,255,255,0.2), rgba(6,182,212,0.15))",
                    border: "1px solid rgba(0,255,255,0.25)",
                  }}
                >
                  <ScanFace size={18} className="text-purple-400" />
                </div>
                <div>
                  <span className="text-[13px] font-semibold block" style={{ color: "var(--color-text-base)" }}>
                    {det.face}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">UNKNOWN</span>
                </div>
              </div>

              {/* Cam 1 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Camera size={11} style={{ color: "var(--color-text-sub)" }} />
                  <span className="text-[12px] font-medium" style={{ color: "var(--color-text-base)" }}>{det.cam1}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} style={{ color: "var(--color-text-sub)" }} />
                  <span className="font-mono text-[11px]" style={{ color: "var(--color-text-sub)" }}>{det.time1}</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="h-px w-12 rounded"
                  style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.3), rgba(0,255,255,0.3))" }}
                />
                <ArrowRight size={14} style={{ color: "#00ffff" }} />
              </div>

              {/* Cam 2 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Camera size={11} style={{ color: "var(--color-text-sub)" }} />
                  <span className="text-[12px] font-medium" style={{ color: "var(--color-text-base)" }}>{det.cam2}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} style={{ color: "var(--color-text-sub)" }} />
                  <span className="font-mono text-[11px]" style={{ color: "var(--color-text-sub)" }}>{det.time2}</span>
                </div>
              </div>

              {/* Confidence */}
              <div className="min-w-0">
                <ConfidenceBar value={det.confidence} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
