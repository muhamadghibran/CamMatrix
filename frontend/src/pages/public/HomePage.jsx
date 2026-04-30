import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MonitorPlay, ScanFace, Film, Lock, Zap, Camera, Shield, Activity, Server } from "lucide-react";

/* ─── Scroll reveal hook ─────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Section reveal wrapper ──────────────────────────── */
function Reveal({ children, delay = 0, y = 28 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : `translateY(${y}px)`, transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── Subtle dot-grid background ─────────────────────── */
function GridBg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
  );
}

/* ─── Navbar ──────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 60, backgroundColor: scrolled ? "rgba(10,10,15,0.95)" : "transparent", borderBottom: scrolled ? "1px solid #1F1F2E" : "1px solid transparent", backdropFilter: scrolled ? "blur(12px)" : "none", transition: "background-color 0.3s ease, border-color 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Camera size={14} style={{ color: "#fff" }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>CamMatrix</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {["Fitur", "Teknologi", "Keamanan"].map(n => (
          <span key={n} style={{ fontSize: 13, color: "#71717A", cursor: "pointer", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color="#FFFFFF"}
            onMouseLeave={e => e.currentTarget.style.color="#71717A"}>
            {n}
          </span>
        ))}
      </div>
      <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, color: "#FFFFFF", background: "#6366F1", textDecoration: "none", transition: "background-color 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.background="#4F46E5"}
        onMouseLeave={e => e.currentTarget.style.background="#6366F1"}>
        Masuk <ArrowRight size={13} />
      </Link>
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────── */
function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);
  const fade = (delay) => ({ opacity: ready ? 1 : 0, transform: ready ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms` });
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", zIndex: 1 }}>
      {/* Tag */}
      <div style={{ ...fade(200), display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 99, border: "1px solid #1F1F2E", backgroundColor: "rgba(99,102,241,0.08)", marginBottom: 32 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#6366F1", display: "inline-block" }} />
        <span style={{ fontSize: 12, color: "#71717A", fontWeight: 500 }}>Platform VMS Enterprise — v2.1.0</span>
      </div>
      {/* Headline */}
      <h1 style={{ ...fade(350), fontSize: "clamp(2.4rem,5.5vw,4.4rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.06, color: "#FFFFFF", maxWidth: 780, margin: "0 0 20px" }}>
        Keamanan cerdas untuk
        <br />
        <span style={{ color: "#6366F1" }}>pemantauan real-time</span>
      </h1>
      {/* Subtitle */}
      <p style={{ ...fade(500), fontSize: 17, color: "#71717A", lineHeight: 1.7, maxWidth: 520, margin: "0 0 44px", fontWeight: 400 }}>
        Platform CCTV profesional dengan deteksi wajah AI, streaming multi-kamera, dan manajemen rekaman terpadu.
      </p>
      {/* CTA */}
      <div style={{ ...fade(650), display: "flex", alignItems: "center", gap: 12, marginBottom: 72 }}>
        <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 6, fontSize: 14, fontWeight: 600, color: "#FFFFFF", background: "#6366F1", textDecoration: "none", transition: "background-color 0.15s, transform 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background="#4F46E5"; e.currentTarget.style.transform="translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#6366F1"; e.currentTarget.style.transform="translateY(0)"; }}>
          Mulai Sekarang <ArrowRight size={15} />
        </Link>
        <Link to="/live" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 6, fontSize: 14, fontWeight: 600, color: "#FFFFFF", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", textDecoration: "none", transition: "border-color 0.15s, background-color 0.15s, transform 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.35)"; e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.transform="translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"; e.currentTarget.style.background="transparent"; e.currentTarget.style.transform="translateY(0)"; }}>
          <MonitorPlay size={15} /> Live Preview
        </Link>
      </div>
      {/* Stats */}
      <div style={{ ...fade(800), display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, borderTop: "1px solid #1F1F2E", paddingTop: 36, maxWidth: 520, width: "100%" }}>
        {[["99.9%","Uptime SLA"],["<50ms","Latensi Stream"],["∞","Kamera IP"],["24/7","Monitoring AI"]].map(([v,l]) => (
          <div key={l} style={{ textAlign: "center", borderRight: "1px solid #1F1F2E", padding: "0 20px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#6366F1", letterSpacing: "-0.03em", lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 10, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Dashboard Preview ───────────────────────────────── */
function DashboardPreview() {
  const [ref, visible] = useReveal(0.1);
  return (
    <section ref={ref} style={{ padding: "100px 40px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Reveal><div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>PRODUK</div>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.035em", color: "#FFFFFF", margin: "0 0 16px" }}>Dashboard yang dirancang untuk efisiensi</h2>
          <p style={{ fontSize: 16, color: "#71717A", maxWidth: 480, margin: "0 auto" }}>Semua kamera, rekaman, dan analitik dalam satu tampilan yang bersih dan intuitif.</p>
        </div></Reveal>
        {/* Mock dashboard */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)", transition: "opacity 0.9s ease 200ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) 200ms", borderRadius: 12, overflow: "hidden", border: "1px solid #1F1F2E", backgroundColor: "#111118" }}>
          {/* Topbar mock */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #1F1F2E", display: "flex", alignItems: "center", gap: 12, backgroundColor: "#0A0A0F" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <div style={{ flex: 1, height: 24, borderRadius: 4, background: "#1F1F2E", maxWidth: 300, marginLeft: 8 }} />
          </div>
          {/* Content area */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", minHeight: 340 }}>
            {/* Sidebar mock */}
            <div style={{ borderRight: "1px solid #1F1F2E", padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {["Dashboard","Live View","Kamera","Rekaman","Pengguna","Pengaturan"].map((item, i) => (
                <div key={item} style={{ padding: "7px 10px", borderRadius: 6, fontSize: 12, color: i === 0 ? "#FFFFFF" : "#71717A", backgroundColor: i === 0 ? "rgba(99,102,241,0.12)" : "transparent", border: i === 0 ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent" }}>{item}</div>
              ))}
            </div>
            {/* Main mock */}
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[["24","Kamera Online"],["7","Rekaman Hari Ini"],["2","Deteksi Wajah"]].map(([n,l]) => (
                  <div key={l} style={{ borderRadius: 8, border: "1px solid #1F1F2E", padding: "14px 16px", backgroundColor: "#0A0A0F" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#6366F1" }}>{n}</div>
                    <div style={{ fontSize: 11, color: "#71717A", marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius: 8, border: "1px solid #1F1F2E", padding: 16, backgroundColor: "#0A0A0F", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#71717A", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Feed Kamera</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ borderRadius: 6, background: "#1F1F2E", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={16} style={{ color: "#2D2D3F" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Features ────────────────────────────────────────── */
const FEATURES = [
  { icon: MonitorPlay, title: "Live Streaming", desc: "Ultra-low latency monitoring via WebRTC — sub 50ms, semua kamera serentak.", tag: "WebRTC" },
  { icon: ScanFace,    title: "AI Face Analytics", desc: "Deteksi dan pelacakan wajah otomatis lintas kamera menggunakan computer vision.", tag: "AI" },
  { icon: Film,        title: "Video Recording", desc: "Jadwalkan, rekam, dan kelola penyimpanan video dengan playback instan.", tag: "Storage" },
  { icon: Lock,        title: "Secure Access", desc: "JWT authentication enterprise-grade dengan role-based access control.", tag: "JWT" },
  { icon: Camera,      title: "Multi-Camera", desc: "Dukung kamera IP tak terbatas via RTSP dengan tampilan grid fleksibel.", tag: "RTSP" },
  { icon: Zap,         title: "Real-time Alerts", desc: "Push alert WebSocket instan saat AI mendeteksi target di jaringan kamera.", tag: "WS" },
];

function Features() {
  return (
    <section style={{ padding: "100px 40px", position: "relative", zIndex: 1, borderTop: "1px solid #1F1F2E" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Reveal><div style={{ marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>FITUR</div>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.035em", color: "#FFFFFF", margin: 0 }}>Semua yang Anda butuhkan,<br />dalam satu platform.</h2>
        </div></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, border: "1px solid #1F1F2E", borderRadius: 12, overflow: "hidden" }}>
          {FEATURES.map(({ icon: Icon, title, desc, tag }, i) => (
            <Reveal key={title} delay={i * 60}>
              <div style={{ padding: "28px 28px", borderRight: (i+1)%3===0 ? "none" : "1px solid #1F1F2E", borderBottom: i<3 ? "1px solid #1F1F2E" : "none", backgroundColor: "#111118", transition: "background-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor="#161624"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor="#111118"}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0F" }}>
                    <Icon size={16} style={{ color: "#71717A" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 8px", border: "1px solid #1F1F2E", borderRadius: 4 }}>{tag}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF", marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#71717A", lineHeight: 1.65 }}>{desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ────────────────────────────────────── */
const STEPS = [
  { icon: Camera,   n: "01", title: "Hubungkan Kamera",   desc: "Tambahkan kamera IP via URL RTSP. Sistem langsung mendeteksi dan mengkonfigurasi stream." },
  { icon: Activity, n: "02", title: "AI Mulai Bekerja",   desc: "Engine deteksi wajah menganalisis feed secara real-time, mencocokkan dengan database target." },
  { icon: Shield,   n: "03", title: "Terima Notifikasi",  desc: "Alert instan dikirim ke operator saat target terdeteksi, dengan timestamp dan screenshot." },
];

function HowItWorks() {
  return (
    <section style={{ padding: "100px 40px", position: "relative", zIndex: 1, borderTop: "1px solid #1F1F2E" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Reveal><div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>CARA KERJA</div>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.035em", color: "#FFFFFF", margin: 0 }}>Setup dalam 3 langkah</h2>
        </div></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 32, position: "relative" }}>
          {/* Connector line */}
          <div style={{ position: "absolute", top: 24, left: "16.6%", right: "16.6%", height: 1, backgroundColor: "#1F1F2E", zIndex: 0 }} />
          {STEPS.map(({ icon: Icon, n, title, desc }, i) => (
            <Reveal key={n} delay={i * 120}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid #1F1F2E", backgroundColor: "#111118", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icon size={18} style={{ color: "#6366F1" }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#71717A", letterSpacing: "0.08em", marginBottom: 8 }}>{n}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 10 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#71717A", lineHeight: 1.7 }}>{desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Tech Stack ──────────────────────────────────────── */
const STACK = [
  { icon: Server,   label: "FastAPI",   sub: "Backend" },
  { icon: Activity, label: "WebRTC",    sub: "Streaming" },
  { icon: Camera,   label: "OpenCV",    sub: "Computer Vision" },
  { icon: Shield,   label: "JWT",       sub: "Auth" },
  { icon: Film,     label: "FFmpeg",    sub: "Recording" },
  { icon: Zap,      label: "WebSocket", sub: "Real-time" },
];

function TechStack() {
  return (
    <section style={{ padding: "100px 40px", position: "relative", zIndex: 1, borderTop: "1px solid #1F1F2E" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Reveal><div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>TEKNOLOGI</div>
          <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, letterSpacing: "-0.035em", color: "#FFFFFF", margin: 0 }}>Dibangun di atas fondasi yang solid</h2>
        </div></Reveal>
        <Reveal delay={100}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 1, border: "1px solid #1F1F2E", borderRadius: 10, overflow: "hidden" }}>
            {STACK.map(({ icon: Icon, label, sub }, i) => (
              <div key={label} style={{ padding: "24px 16px", textAlign: "center", backgroundColor: "#111118", borderRight: i < 5 ? "1px solid #1F1F2E" : "none", transition: "background-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor="#161624"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor="#111118"}>
                <div style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #1F1F2E", backgroundColor: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <Icon size={15} style={{ color: "#71717A" }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#71717A", marginTop: 3 }}>{sub}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── CTA ─────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{ padding: "100px 40px", position: "relative", zIndex: 1, borderTop: "1px solid #1F1F2E" }}>
      <Reveal>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#FFFFFF", margin: "0 0 20px" }}>Siap memulai?</h2>
          <p style={{ fontSize: 16, color: "#71717A", margin: "0 0 36px", lineHeight: 1.7 }}>Akses dashboard CamMatrix dan mulai pantau semua kamera dalam hitungan menit.</p>
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 6, fontSize: 15, fontWeight: 600, color: "#FFFFFF", background: "#6366F1", textDecoration: "none", transition: "background-color 0.15s, transform 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="#4F46E5"; e.currentTarget.style.transform="translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="#6366F1"; e.currentTarget.style.transform="translateY(0)"; }}>
            Mulai Sekarang <ArrowRight size={16} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #1F1F2E", padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Camera size={11} style={{ color: "#fff" }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>CamMatrix</span>
        <span style={{ fontSize: 12, color: "#71717A", marginLeft: 4 }}>v2.1.0 Enterprise</span>
      </div>
      <div style={{ fontSize: 12, color: "#71717A" }}>© 2026 CamMatrix. All rights reserved.</div>
    </footer>
  );
}

/* ─── Main export ─────────────────────────────────────── */
export default function HomePage() {
  return (
    <div style={{ backgroundColor: "#0A0A0F", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <GridBg />
      <Navbar />
      <Hero />
      <DashboardPreview />
      <Features />
      <HowItWorks />
      <TechStack />
      <CTA />
      <Footer />
    </div>
  );
}
