import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Shield, MonitorPlay, ScanFace, Film, ArrowRight, Camera, Lock, Zap, Sun, Moon } from "lucide-react";
import { useThemeStore } from "../store/themeStore";
import { useLanguageStore } from "../store/languageStore";

function AnimatedText({ text, delayOffset = 0, className = "", splitBy = "char" }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const chunks = text ? (splitBy === "word" ? text.split(" ") : text.split("")) : [];

  return (
    <span ref={ref} className={`${className} inline-block`}>
      {chunks.map((chunk, index) => (
        <span
          key={index}
          className={`inline-block transition-all duration-800 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: `${delayOffset + index * (splitBy === "word" ? 100 : 40)}ms` }}
        >
          {chunk === " " ? "\u00A0" : chunk}{splitBy === "word" && index !== chunks.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

const features = [
  {
    icon: MonitorPlay,
    title: "Live Streaming",
    desc: "Monitor multiple CCTV cameras simultaneously in real-time with ultra-low latency WebRTC technology.",
  },
  {
    icon: ScanFace,
    title: "AI Face Analytics",
    desc: "Automated face detection and cross-camera tracking powered by modern computer vision models.",
  },
  {
    icon: Film,
    title: "Video Recording",
    desc: "Schedule and manage recordings with automatic storage management and instant playback.",
  },
  {
    icon: Lock,
    title: "Secure Access",
    desc: "Role-based access control with JWT authentication ensuring only authorized users gain entry.",
  },
  {
    icon: Camera,
    title: "Multi-Camera",
    desc: "Support for unlimited IP cameras via RTSP protocol with flexible grid layout views.",
  },
  {
    icon: Zap,
    title: "Real-time Alerts",
    desc: "Instant WebSocket-based alerts when AI detects persons of interest across camera networks.",
  },
];

export default function HomePage() {
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useLanguageStore();

  return (
    <div className="h-screen w-full overflow-y-auto scroll-smooth" style={{ backgroundColor: "var(--color-bg-page)", color: "var(--color-text-base)" }}>
      <nav
        className="absolute top-0 left-0 right-0 z-50 h-24 flex items-center justify-between px-6 md:px-12 bg-transparent animate-slide-up opacity-0-init"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--color-text-base)" }}>
            CamMatrix
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--color-text-sub)" }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            to="/login"
            className="px-5 py-2 text-sm font-semibold rounded bg-cyan-600 text-white hover:bg-cyan-700 transition-colors shadow-sm"
          >
            {t("home.signIn")}
          </Link>
        </div>
      </nav>

      <div className="relative h-[150vh]">
        <section 
          className="sticky top-0 w-full h-screen flex flex-col justify-between overflow-hidden"
          style={{ backgroundColor: "var(--color-bg-page)" }}
        >
        
        {/* Webflow-style Elegant Flowing Lines Background */}
        <div className="absolute inset-y-0 right-0 w-full md:w-1/2 z-0 pointer-events-none overflow-hidden hidden sm:block">
           <svg className="absolute w-[150%] h-[150%] top-[-25%] right-0 opacity-40 dark:opacity-20 transition-opacity duration-500" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="animate-draw-line delay-100" d="M100 0C100 200 50 300 50 500C50 700 100 800 100 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-200" d="M150 0C150 250 80 350 80 500C80 650 150 800 150 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-300" d="M200 0C200 300 110 400 110 500C110 600 200 800 200 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-400" d="M250 0C250 350 140 450 140 500C140 550 250 800 250 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-500" d="M300 0C300 400 170 480 170 500C170 520 300 800 300 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-1000" d="M350 0C350 450 200 450 200 500C200 570 350 800 350 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Text Content - Positioned to leave lower area free */}
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center flex-1 z-10 pt-28 pb-8">
          <h1
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] tracking-tight mb-8 max-w-4xl"
            style={{ color: "var(--color-text-base)" }}
          >
            <AnimatedText text={t("home.title1")} delayOffset={100} /> <br className="hidden md:block"/> 
            <span className="text-cyan-500"><AnimatedText text={t("home.titleAccent")} delayOffset={600} /></span>{" "}
            {t("home.title2") !== "home.title2" && t("home.title2").trim() !== "" ? <AnimatedText text={t("home.title2")} delayOffset={800} /> : ""}
          </h1>
          
          <p 
            className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl font-medium" 
            style={{ color: "var(--color-text-sub)" }}
          >
            <AnimatedText text={t("home.subtitle")} delayOffset={600} splitBy="word" />
          </p>
          
          <div className="flex flex-wrap items-center gap-4 animate-slide-up opacity-0-init delay-1000">
            <Link
              to="/login"
              className="px-6 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded text-sm transition-colors shadow-none"
            >
              <AnimatedText text={t("home.signIn")} delayOffset={1200} splitBy="char" />
            </Link>
          </div>
        </div>

        {/* Peeking Mockup - Natural Document Flow, absolutely NO overlap */}
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 z-10 mt-auto animate-slide-up opacity-0-init delay-1500">
          <div className="rounded-t-2xl overflow-hidden border-t-2 border-x-2 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] flex justify-center p-2 opacity-90 hover:opacity-100 group translate-y-12 hover:translate-y-4 transition-all duration-1000 ease-out" 
               style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)" }}>
            <div className="rounded-xl overflow-hidden border relative bg-zinc-950 aspect-21/9 w-full" style={{ borderColor: "var(--color-card-border)" }}>
               {/* Fake App header */}
               <div className="absolute top-0 w-full h-8 flex items-center px-4 gap-2 bg-black/60 z-20 backdrop-blur-md border-b border-white/10">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors cursor-pointer"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-400 transition-colors cursor-pointer"></div>
               </div>
               {/* Grid */}
               <div className="absolute inset-0 pt-10 p-3 grid grid-cols-3 gap-3 bg-zinc-900 border-x-4 border-b-4 border-zinc-900 pointer-events-auto cursor-pointer">
                 {[1,2,3].map(i => (
                   <div key={i} className="bg-zinc-950 rounded-lg relative overflow-hidden border border-white/5 group/card">
                     <img src={`https://picsum.photos/seed/${i * 42}/400/300`} alt={`feed-${i}`} className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
        </section>
      </div>

      <div className="w-full flex flex-col relative z-10 overflow-hidden" style={{ backgroundColor: "var(--color-bg-page)" }}>
        
        {/* Left-Aligned Wavy Lines Background for Lower Section */}
        <div className="absolute inset-y-0 left-0 w-[400px] z-0 pointer-events-none hidden lg:block overflow-visible">
           <svg className="absolute w-[150%] h-[120%] top-[-10%] left-[-20%] opacity-40 dark:opacity-20 transition-opacity duration-500" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="animate-draw-line delay-100" d="M0 0C100 200 150 300 150 500C150 700 0 800 0 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-300" d="M0 0C120 250 180 350 180 500C180 650 0 800 0 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-500" d="M0 0C140 300 210 400 210 500C210 600 0 800 0 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-1000" d="M0 0C160 350 240 450 240 500C240 550 0 800 0 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
            <path className="animate-draw-line delay-1500" d="M0 0C180 400 270 480 270 500C270 520 0 800 0 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Minimalist Features Section */}
        <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full relative z-10">
          <div className="mb-24 max-w-3xl relative z-20 pl-0">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight" style={{ color: "var(--color-text-base)" }}>
              <AnimatedText text={t("home.features.title")} delayOffset={100} />
            </h2>
            <p className="text-lg md:text-xl font-medium leading-relaxed" style={{ color: "var(--color-text-sub)" }}>
              <AnimatedText text={t("home.features.subtitle")} delayOffset={600} splitBy="word" />
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="p-8 md:p-10 border transition-all duration-500 hover:-translate-y-3 cursor-pointer group flex flex-col items-start rounded-none sm:rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] relative overflow-hidden"
                  style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-surface)" }}
                >
                  {/* Subtle interactive sweep */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-linear-to-br from-cyan-500 to-transparent pointer-events-none"></div>
                  
                  <div className="w-14 h-14 flex items-center justify-center mb-8 bg-cyan-500/10 text-cyan-500 rounded-xl group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-500 shadow-sm relative z-10">
                    <Icon size={26} strokeWidth={2} />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 tracking-tight group-hover:text-cyan-500 transition-colors relative z-10" style={{ color: "var(--color-text-base)" }}>
                    <AnimatedText text={t(`home.features.items.${i}.title`)} delayOffset={i * 200} splitBy="word" />
                  </h3>
                  
                  <p className="font-medium leading-relaxed text-base relative z-10 flex-1" style={{ color: "var(--color-text-sub)" }}>
                    <AnimatedText text={t(`home.features.items.${i}.desc`)} delayOffset={200 + i * 200} splitBy="word" />
                  </p>
                  
                  {/* Interactive Button / Arrow */}
                  <div className="mt-8 flex items-center justify-center w-10 h-10 border border-cyan-500/30 rounded-full text-cyan-500 opacity-0 group-hover:opacity-100 transform translate-x-[-20px] group-hover:translate-x-0 transition-all duration-500 relative z-10 group-hover:bg-cyan-500/10">
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      <footer
        className="border-t py-8 text-center text-sm"
        style={{
          borderColor: "var(--color-card-border)",
          color: "var(--color-text-sub)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <p>© 2026 {t("home.footer")}</p>
        </footer>
      </div>
    </div>
  );
}
