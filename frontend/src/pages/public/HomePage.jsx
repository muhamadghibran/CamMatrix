import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  MonitorPlay,
  ScanFace,
  Film,
  Lock,
  Zap,
  Camera,
  ChevronRight,
} from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
function ParticleCanvas() {
  const cvs = useRef(null);
  useEffect(() => {
    const c = cvs.current;
    const ctx = c.getContext("2d", { alpha: true });
    const isLowEnd =
      (navigator.hardwareConcurrency ?? 4) <= 4 ||
      (navigator.deviceMemory ?? 4) <= 2;
    const N = isLowEnd ? 40 : 80;
    const CONN_D = isLowEnd ? 100 : 130;
    const CONN_D2 = CONN_D * CONN_D;
    const FPS_CAP = isLowEnd ? 30 : 60;
    const INTERVAL = 1000 / FPS_CAP;
    const SPEED = isLowEnd ? 0.3 : 0.45;
    let W = (c.width = window.innerWidth);
    let H = (c.height = window.innerHeight);
    let mouse = { x: W / 2, y: H / 2 };
    let lastTime = 0;
    let raf;
    let resizeTimer;
    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        W = c.width = window.innerWidth;
        H = c.height = window.innerHeight;
      }, 150);
    };
    const onMouse = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    const HUES = [190, 190, 190, 270, 210];
    const pts = Array.from({ length: N }, () => {
      const hue = HUES[Math.floor(Math.random() * HUES.length)];
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: Math.random() * 1.5 + 0.4,
        fill: `hsla(${hue},90%,72%,0.85)`,
      };
    });
    const draw = (ts) => {
      raf = requestAnimationFrame(draw);
      if (ts - lastTime < INTERVAL) return;
      lastTime = ts;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        if (!isLowEnd) {
          const dx = mouse.x - p.x,
            dy = mouse.y - p.y;
          const md2 = dx * dx + dy * dy;
          if (md2 < 10000) {
            p.x -= dx * 0.01;
            p.y -= dy * 0.01;
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.fill;
        ctx.fill();
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONN_D2) {
            const alpha = (1 - Math.sqrt(d2) / CONN_D) * 0.2;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(255,176,0,${alpha.toFixed(2)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);
  return (
    <canvas
      ref={cvs}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.45, willChange: "transform" }}
    />
  );
}
function Nebula() {
  const isLowEnd = (navigator.hardwareConcurrency ?? 4) <= 4;
  const blur = isLowEnd ? "40px" : "70px";
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute animate-orb"
        style={{
          width: 700,
          height: 700,
          top: "-25%",
          left: "-15%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,176,0,0.13) 0%, rgba(255,176,0,0.03) 45%, transparent 70%)",
          filter: `blur(${blur})`,
          willChange: "transform",
          contain: "strict",
        }}
      />
      <div
        className="absolute animate-orb-alt"
        style={{
          width: 600,
          height: 600,
          top: "-8%",
          right: "-12%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.03) 45%, transparent 70%)",
          filter: `blur(${blur})`,
          willChange: "transform",
          contain: "strict",
        }}
      />
      {!isLowEnd && (
        <div
          className="absolute animate-orb"
          style={{
            width: 450,
            height: 450,
            bottom: "8%",
            left: "32%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,176,0,0.05) 0%, transparent 65%)",
            filter: "blur(50px)",
            animationDelay: "7s",
            willChange: "transform",
            contain: "strict",
          }}
        />
      )}
    </div>
  );
}
const FEATURES = [
  {
    icon: MonitorPlay,
    color: "#FFB000",
    rgb: "255,176,0",
    badge: "WebRTC",
    title: "Live Streaming",
    desc: "Ultra-low latency real-time monitoring across all cameras simultaneously with sub-50ms WebRTC streaming.",
  },
  {
    icon: ScanFace,
    color: "#8b5cf6",
    rgb: "139,92,246",
    badge: "AI",
    title: "AI Face Analytics",
    desc: "Automatic face detection and cross-camera tracking powered by modern computer vision models.",
  },
  {
    icon: Film,
    color: "#f59e0b",
    rgb: "245,158,11",
    badge: "Storage",
    title: "Video Recording",
    desc: "Schedule, record, and manage video storage automatically with instant playback capability.",
  },
  {
    icon: Lock,
    color: "#10b981",
    rgb: "16,185,129",
    badge: "JWT",
    title: "Secure Access",
    desc: "Enterprise-grade JWT authentication with role-based access control for every user.",
  },
  {
    icon: Camera,
    color: "#3b82f6",
    rgb: "59,130,246",
    badge: "RTSP",
    title: "Multi-Camera",
    desc: "Support unlimited IP cameras via RTSP protocol with a fully flexible grid view layout.",
  },
  {
    icon: Zap,
    color: "#ec4899",
    rgb: "236,72,153",
    badge: "WS",
    title: "Real-time Alerts",
    desc: "Instant WebSocket push alerts the moment AI detects a target across your camera network.",
  },
];
function FeatureCard({ feature }) {
  const Icon = feature.icon;
  const [hov, setHov] = useState(false);
  const { rgb, color } = feature;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "28px",
        borderRadius: "20px",
        overflow: "hidden",
        cursor: "pointer",
        minHeight: "220px",
        background: hov
          ? `linear-gradient(135deg, rgba(${rgb},0.08) 0%, rgba(2,4,8,0.9) 100%)`
          : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? `rgba(${rgb},0.4)` : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transform: hov
          ? "translateY(-6px) translateZ(0)"
          : "translateY(0) translateZ(0)",
        boxShadow: hov
          ? `0 24px 56px rgba(0,0,0,0.6), 0 0 0 1px rgba(${rgb},0.25), 0 0 40px rgba(${rgb},0.08)`
          : "0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
        willChange: "transform",
        transition:
          "transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease, background 0.35s ease, border-color 0.35s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 15% 15%, rgba(${rgb},0.14), transparent 55%)`,
          opacity: hov ? 1 : 0,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: "1px",
          background: `linear-gradient(90deg, transparent, rgba(${rgb},${hov ? 0.7 : 0.2}), transparent)`,
          transition: "all 0.35s ease",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, rgba(${rgb},0.2), rgba(${rgb},0.08))`,
            border: `1px solid rgba(${rgb},0.3)`,
            boxShadow: hov
              ? `0 0 20px rgba(${rgb},0.35), 0 0 0 4px rgba(${rgb},0.08)`
              : `0 0 0 0 transparent`,
            transform: hov
              ? "scale(1.1) rotate(-3deg)"
              : "scale(1) rotate(0deg)",
            transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "2px",
              borderRadius: "13px",
              background: `radial-gradient(circle at 35% 35%, rgba(${rgb},0.3), transparent 70%)`,
              opacity: hov ? 1 : 0.5,
              transition: "opacity 0.3s ease",
            }}
          />
          <Icon
            size={24}
            style={{ color, position: "relative", zIndex: 1 }}
            strokeWidth={1.75}
          />
        </div>
        <div
          style={{
            padding: "3px 10px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: color,
            background: `rgba(${rgb},0.1)`,
            border: `1px solid rgba(${rgb},0.25)`,
            opacity: hov ? 1 : 0.6,
            transition: "opacity 0.3s ease",
          }}
        >
          {feature.badge}
        </div>
      </div>
      <h3
        style={{
          fontSize: "15px",
          fontWeight: 800,
          color: hov ? "#ffffff" : "#FFFFFF",
          letterSpacing: "-0.025em",
          marginBottom: "10px",
          transition: "color 0.2s ease",
          lineHeight: 1.3,
          position: "relative",
        }}
      >
        {feature.title}
      </h3>
      <p
        style={{
          fontSize: "13px",
          lineHeight: 1.75,
          color: hov ? "#FFFFFF" : "rgba(226,240,255,0.42)",
          flexGrow: 1,
          transition: "color 0.25s ease",
          position: "relative",
        }}
      >
        {feature.desc}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "18px",
          fontSize: "12px",
          fontWeight: 700,
          color: color,
          opacity: hov ? 1 : 0,
          transform: hov ? "translateY(0)" : "translateY(6px)",
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          position: "relative",
        }}
      >
        Selengkapnya
        <ArrowRight
          size={12}
          style={{
            transform: hov ? "translateX(3px)" : "translateX(0)",
            transition: "transform 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
function AnimatedLogo({ size = 34 }) {
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
        borderRadius: "4px",
        background: "linear-gradient(145deg, #071520 0%, #0a2030 100%)",
        border: "none",
        boxShadow: hov
          ? "0 0 0 1px rgba(255,176,0,0.4), 0 0 18px rgba(255,176,0,0.45)"
          : "0 0 0 1px rgba(255,176,0,0.1), 0 0 8px rgba(255,176,0,0.12)",
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
          <radialGradient id="lensGrad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FFC333" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#E69000" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="pupilGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0D1117" />
          </radialGradient>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="11"
          fill="none"
          stroke={hov ? "rgba(255,176,0,0.7)" : "rgba(255,176,0,0.35)"}
          strokeWidth="1"
          style={{ transition: "stroke 0.3s ease" }}
        />
        <circle
          cx="12"
          cy="12"
          r="8.5"
          fill="none"
          stroke="rgba(255,176,0,0.15)"
          strokeWidth="0.7"
          strokeDasharray="2.5 2"
          style={{
            transformOrigin: "12px 12px",
            animation: hov
              ? "radarSweep 4s linear infinite"
              : "radarSweep 12s linear infinite",
            transition: "animation-duration 0.5s",
          }}
        />
        <circle cx="12" cy="12" r="7.5" fill="url(#lensGrad)" />
        <circle
          cx="12"
          cy="12"
          r="5.8"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
        />
        <circle cx="12" cy="12" r="4" fill="url(#pupilGrad)" />
        <ellipse
          cx="10.2"
          cy="10.0"
          rx="1.4"
          ry="0.9"
          fill="rgba(255,255,255,0.22)"
          transform="rotate(-30 10.2 10.0)"
        />
        <circle cx="14" cy="10.5" r="0.5" fill="rgba(255,255,255,0.1)" />
        <circle
          cx="12"
          cy="12"
          r="1.4"
          fill={hov ? "#FFB000" : "#FFB000"}
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
          boxShadow: "0 0 5px rgba(239,68,68,0.8)",
          animation: "logoPulse 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}
function LiveHUD() {
  const [camCount, setCamCount] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [bars, setBars] = useState([0.4, 0.6, 0.3, 0.8, 0.5, 0.9, 0.4, 0.7]);
  const TARGET_CAMS = 247;
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(TARGET_CAMS / 60);
    const id = setInterval(() => {
      start = Math.min(
        start + step + Math.floor(Math.random() * 4),
        TARGET_CAMS,
      );
      setCamCount(start);
      if (start >= TARGET_CAMS) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setUptime((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) =>
        prev.map((b) => {
          const delta = (Math.random() - 0.5) * 0.3;
          return Math.max(0.2, Math.min(1, b + delta));
        }),
      );
    }, 600);
    return () => clearInterval(id);
  }, []);
  const fmt = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };
  return (
    <div
      className="animate-slide-up opacity-0-init delay-100"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0",
        marginBottom: "28px",
        borderRadius: "14px",
        overflow: "hidden",
        border: "1px solid rgba(255,176,0,0.22)",
        backdropFilter: "blur(16px)",
        background: "rgba(2,8,18,0.75)",
        boxShadow: "0 0 0 1px rgba(255,176,0,0.06), 0 4px 24px rgba(0,0,0,0.5)",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          padding: "9px 14px",
          borderRight: "1px solid rgba(255,176,0,0.08)",
          background: "rgba(239,68,68,0.06)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ef4444",
            boxShadow: "0 0 8px rgba(239,68,68,0.9)",
            animation: "pulse 1.2s ease-in-out infinite",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#ef4444",
            letterSpacing: "0.12em",
          }}
        >
          REC
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "7px 16px",
          borderRight: "1px solid rgba(255,176,0,0.08)",
          minWidth: "90px",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#FFB000",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {String(camCount).padStart(3, "0")}
        </span>
        <span
          style={{
            fontSize: "8px",
            color: "rgba(255,176,0,0.4)",
            letterSpacing: "0.14em",
            marginTop: 2,
          }}
        >
          KAMERA AKTIF
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "2px",
          padding: "10px 14px",
          borderRight: "1px solid rgba(255,176,0,0.08)",
          height: "38px",
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: "3px",
              height: `${Math.round(h * 18)}px`,
              borderRadius: "2px",
              background:
                h > 0.65
                  ? "rgba(255,176,0,0.9)"
                  : h > 0.4
                    ? "rgba(255,176,0,0.4)"
                    : "rgba(255,176,0,0.15)",
              transition:
                "height 0.5s cubic-bezier(0.4,0,0.2,1), background 0.5s ease",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "7px 14px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#FFFFFF",
            letterSpacing: "0.06em",
          }}
        >
          {fmt(uptime)}
        </span>
        <span
          style={{
            fontSize: "8px",
            color: "rgba(255,176,0,0.3)",
            letterSpacing: "0.14em",
            marginTop: 2,
          }}
        >
          UPTIME
        </span>
      </div>
    </div>
  );
}
function BootOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0D1117",
        animation: "bootOverlayFade 1.8s ease forwards",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,176,0,0.07) 10%, #FFB000 40%, #FFB000 50%, #FFB000 60%, rgba(255,176,0,0.07) 90%, transparent 100%)",
          boxShadow:
            "0 0 24px 6px rgba(255,176,0,0.5), 0 0 60px 12px rgba(255,176,0,0.12)",
          animation: "bootScanLine 1.5s cubic-bezier(0.4,0,0.6,1) forwards",
        }}
      />
      {["20%", "40%", "60%", "80%"].map((top, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top,
            height: "1px",
            background: "rgba(255,176,0,0.04)",
            transform: "scaleX(0)",
            transformOrigin: "left",
            animation: `bootGridExpand 0.4s ease ${0.1 + i * 0.1}s forwards`,
          }}
        />
      ))}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          position: "relative",
          zIndex: 2,
          animation:
            "cinematicReveal 0.6s cubic-bezier(0.16,1,0.3,1) 0.15s both",
        }}
      >
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
          <defs>
            <radialGradient id="bootLens" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#FFC333" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0c4a6e" stopOpacity="1" />
            </radialGradient>
          </defs>
          <circle
            cx="12"
            cy="12"
            r="11"
            fill="none"
            stroke="rgba(255,176,0,0.3)"
            strokeWidth="0.8"
          />
          <circle cx="12" cy="12" r="7.5" fill="url(#bootLens)" />
          <circle cx="12" cy="12" r="4" fill="#0D1117" />
          <circle cx="12" cy="12" r="1.4" fill="#FFB000" />
          <ellipse
            cx="10.2"
            cy="10"
            rx="1.4"
            ry="0.9"
            fill="rgba(255,255,255,0.2)"
            transform="rotate(-30 10.2 10)"
          />
        </svg>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.3em",
            color: "rgba(255,176,0,0.7)",
            textTransform: "uppercase",
          }}
        >
          Initializing...
        </span>
      </div>
    </div>
  );
}
export default function HomePage() {
  const { t } = useLanguageStore();
  const [scrolled, setScrolled] = useState(false);
  const [booted, setBooted] = useState(false);
  const pageRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 200);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);
  return (
    <div
      ref={pageRef}
      className="h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{
        backgroundColor: "#0D1117",
        color: "#FFFFFF",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
      }}
    >
      <BootOverlay />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Nebula />
        <ParticleCanvas />
      </div>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between transition-all duration-400"
        style={{
          height: scrolled ? "60px" : "72px",
          padding: "0 clamp(24px, 5vw, 80px)",
          background: scrolled ? "rgba(2,4,8,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,176,0,0.07)" : "none",
          boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none",
          opacity: booted ? 1 : 0,
          transform: booted ? "translateY(0)" : "translateY(-40px)",
          filter: booted ? "blur(0)" : "blur(6px)",
          transition:
            "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s, filter 0.7s ease 0.3s, height 0.4s ease, background 0.4s ease, backdrop-filter 0.4s ease, border-bottom 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <AnimatedLogo size={34} />
          <span
            style={{
              fontWeight: 800,
              fontSize: "15px",
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              background: "linear-gradient(90deg, #FFFFFF 0%, #FFB000 120%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CamMatrix
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-9">
          {["Fitur", "Teknologi", "Keamanan"].map((n) => (
            <span
              key={n}
              className="text-[13px] font-medium cursor-pointer transition-colors duration-200"
              style={{ color: "#94A3B8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFB000")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#94A3B8")
              }
            >
              {n}
            </span>
          ))}
        </div>
        <div className="flex items-center">
          <Link
            to="/login"
            className="shrink-0"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 18px",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#0D1117",
              background: "linear-gradient(135deg, #FFB000, #E69000)",
              boxShadow: "none",
              border: "none",
              transition: "all 0.2s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "none";
            }}
          >
            Masuk <ChevronRight size={12} />
          </Link>
        </div>
      </nav>
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{
          minHeight: "100vh",
          background: "transparent",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 75% 55% at 50% 50%, transparent 35%, rgba(2,4,8,0.6) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-4xl mx-auto">
          <div
            style={{
              opacity: booted ? 1 : 0,
              transform: booted
                ? "translateY(0) scale(1)"
                : "translateY(-20px) scale(0.9)",
              filter: booted ? "blur(0)" : "blur(8px)",
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s",
            }}
          >
            <LiveHUD />
          </div>
          <h1
            className="font-black leading-[1.04] tracking-tighter mb-6"
            style={{
              fontSize: "clamp(2.6rem,6.5vw,5.2rem)",
              letterSpacing: "-0.04em",
              opacity: booted ? 1 : 0,
              filter: booted ? "blur(0)" : "blur(20px)",
              transform: booted ? "translateY(0)" : "translateY(24px)",
              transition:
                "opacity 1s cubic-bezier(0.16,1,0.3,1) 0.75s, filter 1s ease 0.75s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.75s",
            }}
          >
            <span style={{ color: "#FFFFFF" }}>Ketika keamanan</span>
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg,#FFB000 0%,#FFC333 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              bertemu kecerdasan
            </span>
          </h1>
          <p
            style={{
              color: "#94A3B8",
              fontStyle: "italic",
              fontWeight: 400,
              letterSpacing: "0.01em",
              opacity: booted ? 1 : 0,
              transform: booted ? "translateY(0)" : "translateY(20px)",
              filter: booted ? "blur(0)" : "blur(10px)",
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 1.05s",
            }}
            className="text-lg md:text-xl mb-5"
          >
            AI yang melindungi
          </p>
          <p
            className="text-base md:text-[17px] leading-[1.8] max-w-2xl"
            style={{
              color: "#94A3B8",
              fontWeight: 400,
              opacity: booted ? 1 : 0,
              transform: booted ? "translateY(0)" : "translateY(20px)",
              filter: booted ? "blur(0)" : "blur(8px)",
              transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 1.25s",
            }}
          >
            {t("home.subtitle")}
          </p>
          <div
            style={{
              width: "40px",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,176,0,0.4), transparent)",
              margin: "28px auto",
              opacity: booted ? 1 : 0,
              transform: booted ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "center",
              transition:
                "opacity 0.6s ease 1.45s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 1.45s",
            }}
          />
          <div
            className="flex flex-wrap items-center justify-center gap-4 mb-14"
            style={{
              opacity: booted ? 1 : 0,
              transform: booted
                ? "translateY(0) scale(1)"
                : "translateY(24px) scale(0.93)",
              filter: booted ? "blur(0)" : "blur(6px)",
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 1.6s",
            }}
          >
            <Link
              to="/login"
              className="btn-primary rounded-2xl px-8 py-4 text-[14px]"
            >
              Mulai Sekarang <ArrowRight size={16} />
            </Link>
            <Link
              to="/live"
              className="btn-secondary rounded-2xl px-8 py-4 text-[14px]"
            >
              <MonitorPlay size={16} /> Live Preview
            </Link>
          </div>
          <div
            className="w-full max-w-xl grid grid-cols-4 gap-4"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "32px",
              opacity: booted ? 1 : 0,
              transform: booted ? "translateY(0)" : "translateY(30px)",
              transition:
                "opacity 0.9s ease 1.85s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 1.85s",
            }}
          >
            {[
              { val: "99.9%", label: "Uptime SLA" },
              { val: "<50ms", label: "Latensi Stream" },
              { val: "∞", label: "Kamera IP" },
              { val: "24/7", label: "Monitoring AI" },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <span
                  className="text-2xl md:text-3xl font-black stat-number"
                  style={{
                    color: "#FFB000",
                    textShadow: "0 0 18px rgba(255,176,0,0.4)",
                  }}
                >
                  {val}
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest text-center"
                  style={{ color: "rgba(148,163,184,0.7)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in opacity-0-init delay-1500">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.25em]"
            style={{ color: "rgba(148,163,184,0.5)" }}
          >
            Scroll
          </span>
          <div
            className="w-px h-10 overflow-hidden relative"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="absolute w-full animate-scan"
              style={{
                height: "50%",
                background:
                  "linear-gradient(to bottom, transparent, #FFB000, transparent)",
              }}
            />
          </div>
        </div>
      </section>
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          padding: "100px 32px 80px",
          overflow: "hidden",
          background: "transparent",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,176,0,0.1), transparent)",
          }}
        />
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "64px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
                padding: "7px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255,176,0,0.12)",
                background: "rgba(255,176,0,0.04)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px rgba(34,197,94,0.8)",
                  animation: "blinkDot 2s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "rgba(255,176,0,0.5)",
                  letterSpacing: "0.12em",
                }}
              >
                SYS
              </span>
              <span
                style={{
                  width: "1px",
                  height: "12px",
                  background: "rgba(255,176,0,0.12)",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#94A3B8",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Kapabilitas Platform
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(2rem,5vw,3.5rem)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#FFFFFF",
                marginBottom: "16px",
                maxWidth: "560px",
                lineHeight: 1.1,
              }}
            >
              {t("home.features.title")}
            </h2>
            <p
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "rgba(226,240,255,0.42)",
                maxWidth: "420px",
                lineHeight: 1.7,
              }}
            >
              {t("home.features.subtitle")}
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "18px",
            }}
          >
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>
      <footer
        style={{
          padding: "24px 32px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "#0D1117",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <p style={{ fontSize: "12px", color: "rgba(148,163,184,0.5)" }}>
            © 2026 {t("home.footer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
