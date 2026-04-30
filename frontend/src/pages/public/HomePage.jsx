import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MonitorPlay, ScanFace, Film, Lock, Zap, Camera, Shield, Activity, Server } from "lucide-react";

/* ── IntersectionObserver scroll reveal ──────────── */
function useSR(opts = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
    }, { threshold: opts.threshold ?? 0.12, rootMargin: opts.rootMargin ?? "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── CountUp ─────────────────────────────────────── */
function CountUp({ target, duration = 1400 }) {
  const [val, setVal] = useState("0");
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const isSpecial = isNaN(parseFloat(target));
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      if (isSpecial) { setVal(target); return; }
      const num = parseFloat(target);
      const suffix = target.replace(/[\d.]/g, "");
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        setVal((num * ease).toFixed(num % 1 !== 0 ? 1 : 0) + suffix);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val}</span>;
}

/* ── Grid bg ─────────────────────────────────────── */
const GridBg = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "30px 30px" }} />
);

/* ── Navbar ──────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 60, backgroundColor: scrolled ? "rgba(10,10,15,0.92)" : "transparent", borderBottom: scrolled ? "1px solid #1F1F2E" : "1px solid transparent", backdropFilter: scrolled ? "blur(14px)" : "none", transition: "all 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 27, height: 27, borderRadius: 6, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Camera size={14} style={{ color: "#0A0A0F" }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Vektor</span>
      </div>
      <div style={{ display: "flex", gap: 32 }}>
        {["Fitur","Teknologi","Keamanan"].map(n => (
          <span key={n} style={{ fontSize: 13, color: "#71717A", cursor: "pointer", transition: "color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.color="#FFF"} onMouseLeave={e=>e.currentTarget.style.color="#71717A"}>{n}</span>
        ))}
      </div>
      <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 18px", borderRadius:5, fontSize:13, fontWeight:600, color:"#0A0A0F", background:"#FFFFFF", textDecoration:"none", transition:"background-color 0.15s" }}
        onMouseEnter={e=>e.currentTarget.style.background="#E5E5E5"} onMouseLeave={e=>e.currentTarget.style.background="#FFFFFF"}>
        Masuk <ArrowRight size={12} />
      </Link>
    </nav>
  );
}

/* ── Hero ────────────────────────────────────────── */
function Hero() {
  const [rdy, setRdy] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRdy(true), 80); return () => clearTimeout(t); }, []);
  const s = (d) => ({ opacity: rdy?1:0, transform: rdy?"translateY(0)":"translateY(28px)", transition:`opacity 0.8s ease ${d}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${d}ms` });
  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 24px 80px", position:"relative", zIndex:1 }}>

      <h1 style={{ ...s(280), fontSize:"clamp(2.6rem,5.5vw,4.6rem)", fontWeight:800, letterSpacing:"-0.045em", lineHeight:1.05, color:"#FFFFFF", maxWidth:800, margin:"0 0 22px" }}>
        Keamanan cerdas untuk<br />pemantauan real-time
      </h1>
      <p style={{ ...s(420), fontSize:17, color:"#71717A", lineHeight:1.75, maxWidth:500, margin:"0 0 48px" }}>
        Platform CCTV profesional dengan deteksi wajah AI, streaming multi-kamera, dan manajemen rekaman terpadu.
      </p>
      <div style={{ ...s(560), display:"flex", gap:12, marginBottom:80 }}>
        <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 26px", borderRadius:5, fontSize:14, fontWeight:600, color:"#0A0A0F", background:"#FFFFFF", textDecoration:"none", transition:"background-color 0.15s, transform 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="#E5E5E5";e.currentTarget.style.transform="translateY(-1px)"}}
          onMouseLeave={e=>{e.currentTarget.style.background="#FFFFFF";e.currentTarget.style.transform="translateY(0)"}}>
          Mulai Sekarang <ArrowRight size={14} />
        </Link>
        <Link to="/live" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 26px", borderRadius:5, fontSize:14, fontWeight:600, color:"#FFFFFF", background:"transparent", border:"1px solid rgba(255,255,255,0.16)", textDecoration:"none", transition:"border-color 0.15s, background 0.15s, transform 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.38)";e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.transform="translateY(-1px)"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.16)";e.currentTarget.style.background="transparent";e.currentTarget.style.transform="translateY(0)"}}>
          <MonitorPlay size={14} /> Live Preview
        </Link>
      </div>
      {/* Mockup Perspective */}
      <div className="hero-mockup" style={{ marginTop: 60, width: "100%", maxWidth: 1040, zIndex: 10, marginBottom: 80 }}>
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #1F1F2E", backgroundColor: "#111118" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #1F1F2E", display: "flex", alignItems: "center", gap: 8, backgroundColor: "#0A0A0F" }}>
            {["#333", "#444", "#555"].map(c=><div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
            <div style={{ flex: 1, height: 24, borderRadius: 4, background: "#1F1F2E", maxWidth: 300, marginLeft: 16 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: 460, textAlign: "left" }}>
            <div style={{ borderRight: "1px solid #1F1F2E", padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {["Dashboard","Live View","Kamera","Rekaman","Pengguna","Pengaturan"].map((item,i)=>(
                <div key={item} style={{ padding: "8px 12px", borderRadius: 6, fontSize: 13, fontWeight: i===0?600:500, color: i===0?"#FFFFFF":"#71717A", backgroundColor: i===0?"rgba(255,255,255,0.06)":"transparent", border: i===0?"1px solid rgba(255,255,255,0.1)":"none" }}>{item}</div>
              ))}
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                {[["24","Kamera"],["7","Rekaman"],["2","Deteksi"]].map(([n,l])=>(
                  <div key={l} style={{ borderRadius: 8, border: "1px solid #1F1F2E", padding: "16px 20px", backgroundColor: "#0A0A0F" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>{n}</div>
                    <div style={{ fontSize: 12, color: "#71717A", marginTop: 4, fontWeight: 500 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius: 8, border: "1px solid #1F1F2E", padding: 20, backgroundColor: "#0A0A0F", flex: 1 }}>
                <div style={{ fontSize: 11, color: "#71717A", marginBottom: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Feed Kamera</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[1,2,3].map(i=><div key={i} style={{ borderRadius: 6, background: "#1F1F2E", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={18} style={{ color: "#333" }} /></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ ...s(900), display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderTop:"1px solid #1F1F2E", paddingTop:36, maxWidth:520, width:"100%" }}>
        {[["99.9%","Uptime SLA"],["50","Latensi ms"],["∞","Kamera IP"],["24","Monitoring /7"]].map(([v,l],i) => (
          <div key={l} style={{ textAlign:"center", borderRight:i<3?"1px solid #1F1F2E":"none", padding:"0 16px" }}>
            <div style={{ fontSize:24, fontWeight:800, color:"#FFFFFF", letterSpacing:"-0.035em", lineHeight:1 }}>
              {v==="∞"||v==="24"||v==="50" ? <CountUp target={v} /> : <CountUp target="99.9" />}{v==="50"?"ms":v==="24"?"/7":""}
            </div>
            <div style={{ fontSize:10, color:"#71717A", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:7, fontWeight:600 }}>{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Features ────────────────────────────────────── */
const FEATURES = [
  { icon:MonitorPlay, title:"Live Streaming",   desc:"Ultra-low latency monitoring via WebRTC — sub 50ms, semua kamera serentak.", tag:"WebRTC" },
  { icon:ScanFace,    title:"AI Face Analytics",desc:"Deteksi & tracking wajah otomatis lintas kamera menggunakan computer vision.", tag:"AI" },
  { icon:Film,        title:"Video Recording",  desc:"Jadwalkan, rekam, dan kelola penyimpanan video dengan playback instan.", tag:"Storage" },
  { icon:Lock,        title:"Secure Access",    desc:"JWT authentication enterprise-grade dengan role-based access control.", tag:"JWT" },
  { icon:Camera,      title:"Multi-Camera",     desc:"Dukung kamera IP tak terbatas via RTSP dengan tampilan grid fleksibel.", tag:"RTSP" },
  { icon:Zap,         title:"Real-time Alerts", desc:"Push alert WebSocket instan saat AI mendeteksi target di jaringan kamera.", tag:"WS" },
];
function Features() {
  const refs = FEATURES.map(() => useSR({ threshold: 0.1 }));
  const hdrRef = useSR();
  return (
    <section style={{ padding:"100px 40px", position:"relative", zIndex:1, borderTop:"1px solid #1F1F2E" }}>
      <div style={{ maxWidth:960, margin:"0 auto" }}>
        <div ref={hdrRef} className="sr" style={{ marginBottom:56 }}>
          <div style={{ fontSize:10, color:"#71717A", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>FITUR</div>
          <h2 style={{ fontSize:"clamp(1.9rem,3.5vw,2.9rem)", fontWeight:800, letterSpacing:"-0.04em", color:"#FFFFFF", margin:0 }}>Semua yang Anda butuhkan,<br />dalam satu platform.</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, border:"1px solid #1F1F2E", borderRadius:12, overflow:"hidden" }}>
          {FEATURES.map(({ icon:Icon, title, desc, tag }, i) => (
            <div key={title} ref={refs[i]} className={`sr sr-d${i+1}`} style={{ padding:"28px 26px", borderRight:(i+1)%3===0?"none":"1px solid #1F1F2E", borderBottom:i<3?"1px solid #1F1F2E":"none", backgroundColor:"#111118", transition:"background-color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor="#161624"}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="#111118"}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ width:34, height:34, borderRadius:7, border:"1px solid #1F1F2E", display:"flex", alignItems:"center", justifyContent:"center", backgroundColor:"#0A0A0F" }}>
                  <Icon size={15} style={{ color:"#71717A" }} />
                </div>
                <span style={{ fontSize:9, fontWeight:700, color:"#71717A", textTransform:"uppercase", letterSpacing:"0.08em", padding:"3px 8px", border:"1px solid #1F1F2E", borderRadius:4 }}>{tag}</span>
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:"#FFFFFF", marginBottom:8 }}>{title}</div>
              <div style={{ fontSize:13, color:"#71717A", lineHeight:1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ────────────────────────────────── */
const STEPS = [
  { icon:Camera,   n:"01", title:"Hubungkan Kamera",  desc:"Tambahkan kamera IP via URL RTSP. Sistem langsung mendeteksi dan mengkonfigurasi stream secara otomatis." },
  { icon:Activity, n:"02", title:"AI Mulai Bekerja",  desc:"Engine deteksi wajah menganalisis feed real-time, mencocokkan dengan database target yang Anda tentukan." },
  { icon:Shield,   n:"03", title:"Terima Notifikasi", desc:"Alert instan ke operator saat target terdeteksi, lengkap dengan timestamp, lokasi kamera, dan screenshot." },
];
function HowItWorks() {
  const lineRef = useSR({ threshold: 0.2 });
  const hdrRef  = useSR();
  const stepRefs = STEPS.map(() => useSR({ threshold: 0.15 }));
  return (
    <section style={{ padding:"100px 40px", position:"relative", zIndex:1, borderTop:"1px solid #1F1F2E" }}>
      <div style={{ maxWidth:960, margin:"0 auto" }}>
        <div ref={hdrRef} className="sr" style={{ textAlign:"center", marginBottom:72 }}>
          <div style={{ fontSize:10, color:"#71717A", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>CARA KERJA</div>
          <h2 style={{ fontSize:"clamp(1.9rem,3.5vw,2.9rem)", fontWeight:800, letterSpacing:"-0.04em", color:"#FFFFFF", margin:0 }}>Setup dalam 3 langkah</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:48, position:"relative" }}>
          <div ref={lineRef} className="sr-line" style={{ position:"absolute", top:24, left:"calc(16.6% + 24px)", right:"calc(16.6% + 24px)", height:"1px", backgroundColor:"rgba(255,255,255,0.08)", zIndex:0, transformOrigin:"left" }} />
          {STEPS.map(({ icon:Icon, n, title, desc }, i) => (
            <div key={n} ref={stepRefs[i]} className={`sr sr-d${i*2+1}`} style={{ position:"relative", zIndex:1 }}>
              <div style={{ width:48, height:48, borderRadius:"50%", border:"1px solid #1F1F2E", backgroundColor:"#111118", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
                <Icon size={18} style={{ color:"#FFFFFF", opacity:0.7 }} />
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:"#71717A", letterSpacing:"0.08em", marginBottom:8 }}>{n}</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#FFFFFF", marginBottom:10, letterSpacing:"-0.02em" }}>{title}</div>
              <div style={{ fontSize:13, color:"#71717A", lineHeight:1.72 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Tech Stack ──────────────────────────────────── */
const STACK = [
  { icon:Server,   label:"FastAPI",   sub:"Backend" },
  { icon:Activity, label:"WebRTC",    sub:"Streaming" },
  { icon:Camera,   label:"OpenCV",    sub:"Vision" },
  { icon:Shield,   label:"JWT",       sub:"Auth" },
  { icon:Film,     label:"FFmpeg",    sub:"Recording" },
  { icon:Zap,      label:"WebSocket", sub:"Real-time" },
];
function TechStack() {
  const hdrRef = useSR();
  const gridRef = useSR({ threshold: 0.1 });
  return (
    <section style={{ padding:"100px 40px", position:"relative", zIndex:1, borderTop:"1px solid #1F1F2E" }}>
      <div style={{ maxWidth:960, margin:"0 auto" }}>
        <div ref={hdrRef} className="sr" style={{ textAlign:"center", marginBottom:52 }}>
          <div style={{ fontSize:10, color:"#71717A", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>TEKNOLOGI</div>
          <h2 style={{ fontSize:"clamp(1.7rem,3vw,2.4rem)", fontWeight:800, letterSpacing:"-0.04em", color:"#FFFFFF", margin:0 }}>Dibangun di atas fondasi yang solid</h2>
        </div>
        <div ref={gridRef} className="sr" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:1, border:"1px solid #1F1F2E", borderRadius:10, overflow:"hidden" }}>
          {STACK.map(({ icon:Icon, label, sub }, i) => (
            <div key={label} style={{ padding:"24px 16px", textAlign:"center", backgroundColor:"#111118", borderRight:i<5?"1px solid #1F1F2E":"none", transition:"background-color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor="#161624"}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="#111118"}>
              <div style={{ width:34, height:34, borderRadius:7, border:"1px solid #1F1F2E", backgroundColor:"#0A0A0F", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                <Icon size={14} style={{ color:"#71717A" }} />
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:"#FFFFFF" }}>{label}</div>
              <div style={{ fontSize:11, color:"#71717A", marginTop:3 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────── */
function CTA() {
  const ref = useSR({ threshold: 0.2 });
  return (
    <section style={{ padding:"100px 40px", position:"relative", zIndex:1, borderTop:"1px solid #1F1F2E" }}>
      <div ref={ref} className="sr" style={{ maxWidth:580, margin:"0 auto", textAlign:"center" }}>
        <h2 style={{ fontSize:"clamp(2rem,4vw,3.2rem)", fontWeight:800, letterSpacing:"-0.045em", color:"#FFFFFF", margin:"0 0 18px" }}>Siap memulai?</h2>
        <p style={{ fontSize:16, color:"#71717A", margin:"0 0 38px", lineHeight:1.72 }}>Akses dashboard Vektor dan mulai pantau semua kamera dalam hitungan menit.</p>
        <Link to="/login" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"13px 30px", borderRadius:5, fontSize:15, fontWeight:600, color:"#0A0A0F", background:"#FFFFFF", textDecoration:"none", transition:"background-color 0.15s, transform 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="#E5E5E5";e.currentTarget.style.transform="translateY(-1px)"}}
          onMouseLeave={e=>{e.currentTarget.style.background="#FFFFFF";e.currentTarget.style.transform="translateY(0)"}}>
          Mulai Sekarang <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ borderTop:"1px solid #1F1F2E", padding:"28px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:1 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:22, height:22, borderRadius:5, background:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Camera size={11} style={{ color:"#0A0A0F" }} />
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:"#FFFFFF" }}>Vektor</span>
        <span style={{ fontSize:12, color:"#71717A", marginLeft:4 }}>v2.1.0</span>
      </div>
      <span style={{ fontSize:12, color:"#71717A" }}>© 2026 Vektor. All rights reserved.</span>
    </footer>
  );
}

/* ── Export ──────────────────────────────────────── */
export default function HomePage() {
  return (
    <div style={{ backgroundColor:"#0A0A0F", minHeight:"100vh", fontFamily:"Inter,system-ui,sans-serif" }}>
      <GridBg />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <TechStack />
      <CTA />
      <Footer />
    </div>
  );
}
