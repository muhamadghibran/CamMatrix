import { useState } from "react";
export default function CamLogo({ size = 34, radius = "10px" }) {
  const [hov, setHov] = useState(false);
  const s = size;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        width: s,
        height: s,
        flexShrink: 0,
        cursor: "pointer",
        borderRadius: radius,
        background: "linear-gradient(145deg, #071520 0%, #0a2030 100%)",
        border: "none",
        boxShadow: hov
          ? "0 0 0 1px rgba(255,255,255,0.4), 0 0 18px rgba(255,255,255,0.45)"
          : "0 0 0 1px rgba(255,255,255,0.1), 0 0 8px rgba(255,255,255,0.12)",
        animation: "borderGlow 3s ease-in-out infinite",
        transition: "box-shadow 0.3s ease, transform 0.2s ease",
        transform: hov ? "scale(1.07)" : "scale(1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={s * 0.72}
        height={s * 0.72}
        viewBox="0 0 24 24"
        fill="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id="camLensGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#E5E5E5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="camPupilGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0A0A0F" />
          </radialGradient>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="none"
          stroke={hov ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"}
          strokeWidth="1"
          style={{ transition: "stroke 0.3s ease" }}
        />
        <circle
          cx="12"
          cy="12"
          r="8.5"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.7"
          strokeDasharray="2.5 2"
          style={{
            transformOrigin: "12px 12px",
            animation: hov
              ? "radarSweep 4s linear infinite"
              : "radarSweep 12s linear infinite",
          }}
        />
        <circle cx="12" cy="12" r="7.5" fill="url(#camLensGrad)" />
        <circle
          cx="12"
          cy="12"
          r="5.8"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
        />
        <circle cx="12" cy="12" r="4" fill="url(#camPupilGrad)" />
        <ellipse
          cx="10.2"
          cy="10"
          rx="1.4"
          ry="0.9"
          fill="rgba(255,255,255,0.22)"
          transform="rotate(-30 10.2 10)"
        />
        <circle cx="14" cy="10.5" r="0.5" fill="rgba(255,255,255,0.1)" />
        <circle
          cx="12"
          cy="12"
          r="1.4"
          fill={hov ? "#FFFFFF" : "#FFFFFF"}
          style={{
            animation: "logoPulse 2.5s ease-in-out infinite",
            transition: "fill 0.25s ease",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: "#ef4444",
          boxShadow: "none",
          animation: "logoPulse 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}
