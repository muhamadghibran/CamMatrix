import { ScanFace, Camera, Clock, ArrowRight, TrendingUp, Shield, ChevronUp, ChevronDown } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useState } from "react";

const detections = [
  { id: 1, face: "Unknown #001", cam1: "Main Entrance", cam2: "Lobby",       time1: "08:14:32", time2: "08:17:05", confidence: 94 },
  { id: 2, face: "Unknown #002", cam1: "Side Gate",     cam2: "Parking Lot", time1: "09:02:11", time2: "09:04:48", confidence: 88 },
  { id: 3, face: "Unknown #003", cam1: "Lobby",         cam2: "Server Room", time1: "10:31:55", time2: "10:35:20", confidence: 91 },
  { id: 4, face: "Unknown #004", cam1: "Main Entrance", cam2: "Rooftop",     time1: "11:05:08", time2: "11:12:44", confidence: 79 },
  { id: 5, face: "Unknown #005", cam1: "Reception",     cam2: "Lobby",       time1: "13:20:35", time2: "13:22:10", confidence: 96 },
];

function ConfidenceBar({ value }) {
  const color = value >= 90 ? "#10b981" : value >= 80 ? "#f59e0b" : "#ef4444";
  const label = value >= 90 ? "TINGGI" : value >= 80 ? "SEDANG" : "RENDAH";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "10px", color: "#71717A" }}>Kepercayaan</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color }}>{value}%</span>
          <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", color, background: `${color}18`, border: `1px solid ${color}30` }}>
            {label}
          </span>
        </div>
      </div>
      <div style={{ height: "5px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "99px",
          width: `${value}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}50`,
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

function StatCard({ label, sub, value, color, icon: StatIcon, trend, trendUp, delay }) {
  const Icon = StatIcon;
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", borderRadius: "16px", padding: "24px 22px",
        background: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? color + "50" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hov ? `0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px ${color}25` : "0 2px 8px rgba(0,0,0,0.25)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        cursor: "default", overflow: "hidden",
        animation: `fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      }}
    >
      <div style={{
        position: "absolute", inset: 0, borderRadius: "16px", pointerEvents: "none",
        background: `radial-gradient(ellipse at 0% 0%, ${color}18, transparent 65%)`,
        opacity: hov ? 1 : 0, transition: "opacity 0.3s ease",
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px", position: "relative" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "13px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `linear-gradient(135deg, ${color}25, ${color}0a)`,
          border: `1px solid ${color}35`,
          boxShadow: hov ? `0 0 20px ${color}30` : "none",
          transition: "box-shadow 0.25s ease",
          flexShrink: 0,
        }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "3px",
          fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "8px",
          color: trendUp ? "#10b981" : "#ef4444",
          background: trendUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${trendUp ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
          {trendUp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {trend}
        </span>
      </div>
      <div style={{ fontSize: "38px", fontWeight: 800, color, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "6px", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {value}
      </div>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: "11px", color: "#71717A", margin: 0 }}>{sub}</p>
    </div>
  );
}

function DetectionRow({ det, index, isLast }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto 1fr 1.2fr",
        gap: "16px",
        alignItems: "center",
        padding: "14px 20px",
        background: hov ? "rgba(255,255,255,0.04)" : "transparent",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
        transition: "background 0.2s ease",
        cursor: "pointer",
        animation: `fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${700 + index * 80}ms both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "4px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.08))",
          border: "1px solid rgba(139,92,246,0.3)",
        }}>
          <ScanFace size={16} style={{ color: "#a78bfa" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{det.face}</span>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#a78bfa" }}>UNKNOWN</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Camera size={10} style={{ color: "rgba(148,163,184,0.7)", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#FFFFFF" }}>{det.cam1}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={10} style={{ color: "rgba(148,163,184,0.7)", flexShrink: 0 }} />
          <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#71717A" }}>{det.time1}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
        <div style={{ width: "32px", height: "1px", background: "linear-gradient(90deg, rgba(99,102,241,0.12), rgba(99,102,241,0.5))", borderRadius: "99px" }} />
        <ArrowRight size={13} style={{ color: "#6366F1" }} />
        <div style={{ width: "32px", height: "1px", background: "linear-gradient(90deg, rgba(99,102,241,0.5), rgba(99,102,241,0.12))", borderRadius: "99px" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Camera size={10} style={{ color: "rgba(148,163,184,0.7)", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#FFFFFF" }}>{det.cam2}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={10} style={{ color: "rgba(148,163,184,0.7)", flexShrink: 0 }} />
          <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "#71717A" }}>{det.time2}</span>
        </div>
      </div>

      <ConfidenceBar value={det.confidence} />
    </div>
  );
}

export default function FaceAnalyticsPage() {
  const { t } = useLanguageStore();

  const statItems = [
    { label: t("analytics.stats.total"),   sub: t("analytics.period.last24h"),    value: "237", color: "#6366F1", icon: ScanFace,    trend: "+18%", trendUp: true,  delay: 0   },
    { label: t("analytics.stats.unique"),  sub: t("analytics.period.identified"), value: "41",  color: "#6366F1", icon: Shield,       trend: "+5",   trendUp: true,  delay: 100 },
    { label: t("analytics.stats.matches"), sub: t("analytics.period.today"),      value: "18",  color: "#10b981", icon: TrendingUp,   trend: "+3",   trendUp: true,  delay: 200 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative", zIndex: 10, width: "100%" }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {statItems.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div style={{
        borderRadius: "18px", overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        animation: "fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) 400ms both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "4px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))",
            border: "1px solid rgba(139,92,246,0.25)",
          }}>
            <ScanFace size={16} style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
              {t("analytics.table.title")}
            </h2>
            <p style={{ fontSize: "11px", color: "#71717A", margin: "2px 0 0" }}>
              {t("analytics.table.subtitle")}
            </p>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "4px 12px", borderRadius: "6px",
              border: "1px solid rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.08)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px", fontWeight: 700, color: "rgba(139,92,246,0.8)", letterSpacing: "0.12em",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#a78bfa", boxShadow: "none", animation: "blinkDot 2s ease-in-out infinite" }} />
              AI ENGINE
            </span>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto 1fr 1.2fr",
          gap: "16px",
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          {["Wajah", "Kamera Asal", "", "Kamera Tujuan", "Kepercayaan"].map((h, i) => (
            <span key={i} style={{ fontSize: "10px", fontWeight: 700, color: "rgba(148,163,184,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
          ))}
        </div>

        {detections.map((det, i) => (
          <DetectionRow key={det.id} det={det} index={i} isLast={i === detections.length - 1} />
        ))}
      </div>
    </div>
  );
}
