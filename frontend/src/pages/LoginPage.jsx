import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../store/authStore";
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

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    const isValidId = form.email === "admin@vms.com" || form.email === "admin";
    if (isValidId && form.password === "admin123") {
      setAuth({ name: "Administrator", email: form.email, role: "Administrator" }, "mock-jwt-token");
      navigate("/app/dashboard");
    } else {
      setError(t("login.invalidCred"));
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-page)" }}
    >
      {/* Elegantly flowing lines background left */}
      <div className="absolute inset-y-0 left-0 w-full md:w-1/2 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20 hidden lg:block">
        <svg className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%] transition-opacity duration-500" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="animate-draw-line delay-100" d="M0 0C100 200 150 300 150 500C150 700 0 800 0 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" />
          <path className="animate-draw-line delay-300" d="M0 0C120 250 180 350 180 500C180 650 0 800 0 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" />
          <path className="animate-draw-line delay-500" d="M0 0C140 300 210 400 210 500C210 600 0 800 0 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" />
        </svg>
      </div>

      {/* Elegantly flowing lines background right */}
      <div className="absolute inset-y-0 right-0 w-full md:w-1/2 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20 hidden sm:block">
         <svg className="absolute w-[150%] h-[150%] top-[-25%] right-0 transition-opacity duration-500" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path className="animate-draw-line delay-200" d="M150 0C150 250 80 350 80 500C80 650 150 800 150 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" />
          <path className="animate-draw-line delay-400" d="M250 0C250 350 140 450 140 500C140 550 250 800 250 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" />
          <path className="animate-draw-line delay-1000" d="M350 0C350 450 200 450 200 500C200 570 350 800 350 800" stroke={theme === "dark" ? "#ffffff" : "#000000"} strokeWidth="1" />
        </svg>
      </div>

      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-2 rounded-lg border transition-colors z-20 hover:bg-black/5 dark:hover:bg-white/5"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-card-border)",
          color: "var(--color-text-sub)",
        }}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-sm relative z-10 animate-slide-up delay-500 opacity-0-init">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-sm animate-float">
            <Shield size={26} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--color-text-base)" }}>
            <AnimatedText text={t("login.welcomeBack")} delayOffset={800} splitBy="word" />
          </h1>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-sub)" }}>
            <AnimatedText text={t("login.subtitle")} delayOffset={1200} splitBy="word" />
          </p>
        </div>

        <div
          className="rounded-2xl border p-8 shadow-xl shadow-cyan-500/5 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 relative overflow-hidden backdrop-blur-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-surface) 90%, transparent)",
            borderColor: "var(--color-card-border)",
          }}
        >
          {/* Subtle gradient sweep inside card */}
          <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-700 bg-linear-to-br from-cyan-500 to-transparent pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            {/* Google OAuth Button */}
            <button
               type="button"
               className="w-full flex items-center justify-center gap-3 py-3 rounded-xl shadow-sm border text-sm font-semibold transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]"
               style={{
                 borderColor: "var(--color-card-border)",
                 color: "var(--color-text-base)"
               }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{t("login.signInGoogle") !== "login.signInGoogle" ? t("login.signInGoogle") : "Masuk dengan Google"}</span>
            </button>

            <div className="flex items-center gap-4 py-1">
              <div className="flex-1 h-px bg-current opacity-20" style={{ color: "var(--color-card-border)" }}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: "var(--color-text-sub)" }}>atau</span>
              <div className="flex-1 h-px bg-current opacity-20" style={{ color: "var(--color-card-border)" }}></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-tight" style={{ color: "var(--color-text-sub)" }}>
                  Email / Username
                </label>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@vms.com atau admin"
                  required
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                  style={{
                    backgroundColor: "var(--color-input-bg)",
                    borderColor: "var(--color-card-border)",
                    color: "var(--color-text-base)",
                  }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#06b6d4")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-card-border)")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-tight" style={{ color: "var(--color-text-sub)" }}>
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-10 rounded-xl border text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                  style={{
                    backgroundColor: "var(--color-input-bg)",
                    borderColor: "var(--color-card-border)",
                    color: "var(--color-text-base)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#06b6d4")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-card-border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ color: "var(--color-text-sub)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-500 bg-red-500/10 px-3 py-3 rounded-lg border border-red-500/20">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/40 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
            >
              {loading ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>
        </div>
        </div>

        <p className="text-center mt-8 text-xs font-medium" style={{ color: "var(--color-text-sub)" }}>
          <Link to="/" className="hover:text-cyan-500 transition-colors inline-block hover:-translate-x-1 duration-300">
            ← {t("login.backHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
