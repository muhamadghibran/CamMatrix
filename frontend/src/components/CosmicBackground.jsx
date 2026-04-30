import { useEffect, useRef } from "react";
export function ParticleCanvas({ opacity = 0.45 }) {
  const cvs = useRef(null);
  useEffect(() => {
    const c = cvs.current;
    const ctx = c.getContext("2d", { alpha: true });
    const isLowEnd =
      (navigator.hardwareConcurrency ?? 4) <= 4 ||
      (navigator.deviceMemory ?? 4) <= 2;
    const N = isLowEnd ? 35 : 65;
    const CONN_D = isLowEnd ? 90 : 120;
    const CONN_D2 = CONN_D * CONN_D;
    const FPS_CAP = isLowEnd ? 30 : 60;
    const INTERVAL = 1000 / FPS_CAP;
    const SPEED = isLowEnd ? 0.28 : 0.4;
    let W = (c.width = window.innerWidth);
    let H = (c.height = window.innerHeight);
    let mouse = { x: W / 2, y: H / 2 };
    let lastTime = 0,
      raf;
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
        r: Math.random() * 1.4 + 0.4,
        fill: `hsla(${hue},88%,72%,0.8)`,
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
          if (dx * dx + dy * dy < 8100) {
            p.x -= dx * 0.009;
            p.y -= dy * 0.009;
          }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.fill;
        ctx.fill();
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x,
            dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONN_D2) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(6,182,212,${((1 - Math.sqrt(d2) / CONN_D) * 0.18).toFixed(2)})`;
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
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity,
        willChange: "transform",
      }}
    />
  );
}
export function Nebula() {
  const isLowEnd = (navigator.hardwareConcurrency ?? 4) <= 4;
  const blur = isLowEnd ? "35px" : "60px";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        className="animate-orb"
        style={{
          position: "absolute",
          width: 650,
          height: 650,
          top: "-20%",
          left: "-12%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.03) 45%, transparent 70%)",
          filter: `blur(${blur})`,
          willChange: "transform",
        }}
      />
      <div
        className="animate-orb-alt"
        style={{
          position: "absolute",
          width: 550,
          height: 550,
          top: "-5%",
          right: "-10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.09) 0%, rgba(99,102,241,0.03) 45%, transparent 70%)",
          filter: `blur(${blur})`,
          willChange: "transform",
        }}
      />
      {!isLowEnd && (
        <div
          className="animate-orb"
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            bottom: "5%",
            left: "35%",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%)",
            filter: "blur(45px)",
            animationDelay: "7s",
            willChange: "transform",
          }}
        />
      )}
    </div>
  );
}
export default function CosmicBackground({ particleOpacity = 0.4 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#0A0A0F",
      }}
    >
      <Nebula />
      <ParticleCanvas opacity={particleOpacity} />
    </div>
  );
}
