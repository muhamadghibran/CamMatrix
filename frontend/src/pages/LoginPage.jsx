import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Sun, Moon, User, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useLanguageStore } from "../store/languageStore";

const API = "http://localhost:8000/api/v1";

/* ── Animated text helper ── */
function AnimatedText({ text, delayOffset = 0, splitBy = "char" }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const chunks = text ? (splitBy === "word" ? text.split(" ") : text.split("")) : [];
  return (
    <span ref={ref} className="inline-block">
      {chunks.map((chunk, i) => (
        <span key={i} className={`inline-block transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: `${delayOffset + i * (splitBy === "word" ? 80 : 35)}ms` }}>
          {chunk === " " ? "\u00A0" : chunk}{splitBy === "word" && i !== chunks.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

/* ── Google SVG Icon ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  const isRegister = mode === "register";

  /* Fetch profile after getting token */
  const fetchProfileAndLogin = async (token) => {
    const profileRes = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!profileRes.ok) throw new Error("Gagal mengambil profil.");
    const profile = await profileRes.json();
    setAuth({ name: profile.full_name, email: profile.email, role: profile.role }, token);
    localStorage.setItem("access_token", token);
    navigate("/app/dashboard");
  };

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username", form.email);
      fd.append("password", form.password);
      const res = await fetch(`${API}/auth/login`, { method: "POST", body: fd });
      if (!res.ok) { setError(t("login.invalidCred")); setLoading(false); return; }
      const { access_token } = await res.json();
      await fetchProfileAndLogin(access_token);
    } catch {
      // fallback demo
      if ((form.email === "admin@vms.com" || form.email === "admin") && form.password === "admin123") {
        setAuth({ name: "Administrator", email: form.email, role: "ADMIN" }, null);
        navigate("/app/dashboard");
      } else {
        setError(t("login.invalidCred"));
      }
    }
    setLoading(false);
  };

  /* ── Register ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.full_name.trim()) { setError("Nama lengkap wajib diisi."); return; }
    if (form.password !== form.confirmPassword) { setError("Password tidak cocok."); return; }
    if (form.password.length < 6) { setError("Password minimal 6 karakter."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: form.full_name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Pendaftaran gagal."); setLoading(false); return; }
      setSuccess("Akun berhasil dibuat! Silakan masuk.");
      setMode("login");
      setForm(f => ({ ...f, full_name: "", password: "", confirmPassword: "" }));
    } catch {
      setError("Tidak dapat terhubung ke server.");
    }
    setLoading(false);
  };

  /* ── Google OAuth ── */
  const handleGoogle = () => {
    // Gunakan Google Identity Services (GSI) popup
    if (!window.google) {
      setError("Google Sign-In tidak tersedia. Pastikan koneksi internet aktif.");
      return;
    }
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
      callback: async (response) => {
        setLoading(true);
        setError("");
        try {
          // Decode JWT dari Google (tanpa verifikasi — backend harus verify di produksi)
          const base64 = response.credential.split(".")[1];
          const payload = JSON.parse(atob(base64));
          const res = await fetch(`${API}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              google_id: payload.sub,
              email: payload.email,
              full_name: payload.name,
            }),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.detail || "Login Google gagal."); return; }
          await fetchProfileAndLogin(data.access_token);
        } catch {
          setError("Login Google gagal. Coba lagi.");
        }
        setLoading(false);
      },
    });
    window.google.accounts.id.prompt();
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm outline-none";
  const inputStyle = {
    backgroundColor: "var(--color-input-bg)",
    borderColor: "var(--color-card-border)",
    color: "var(--color-text-base)",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-page)" }}>

      {/* Google Identity Services script */}
      <script src="https://accounts.google.com/gsi/client" async defer />

      {/* Background lines */}
      <div className="absolute inset-y-0 left-0 w-1/2 z-0 pointer-events-none overflow-hidden opacity-30 hidden lg:block">
        <svg className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%]" viewBox="0 0 400 800" fill="none">
          <path className="animate-draw-line delay-100" d="M0 0C100 200 150 300 150 500C150 700 0 800 0 800" stroke={theme==="dark"?"#fff":"#000"} strokeWidth="1"/>
          <path className="animate-draw-line delay-300" d="M0 0C120 250 180 350 180 500C180 650 0 800 0 800" stroke={theme==="dark"?"#fff":"#000"} strokeWidth="1"/>
        </svg>
      </div>
      <div className="absolute inset-y-0 right-0 w-1/2 z-0 pointer-events-none overflow-hidden opacity-30 hidden sm:block">
        <svg className="absolute w-[150%] h-[150%] top-[-25%] right-0" viewBox="0 0 400 800" fill="none">
          <path className="animate-draw-line delay-200" d="M150 0C150 250 80 350 80 500C80 650 150 800 150 800" stroke={theme==="dark"?"#fff":"#000"} strokeWidth="1"/>
          <path className="animate-draw-line delay-500" d="M300 0C300 400 170 480 170 500C170 520 300 800 300 800" stroke={theme==="dark"?"#fff":"#000"} strokeWidth="1"/>
        </svg>
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme} className="fixed top-6 right-6 p-2 rounded-lg border z-20"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-card-border)", color: "var(--color-text-sub)" }}>
        {theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}
      </button>

      {/* Card */}
      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-5 animate-float">
            <Shield size={26} strokeWidth={2}/>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--color-text-base)" }}>
            <AnimatedText text={isRegister ? "Buat Akun" : t("login.welcomeBack")} delayOffset={300} splitBy="word"/>
          </h1>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-sub)" }}>
            <AnimatedText text={isRegister ? "Daftar ke CamMatrix" : t("login.subtitle")} delayOffset={600} splitBy="word"/>
          </p>
        </div>

        <div className="rounded-2xl border p-7 shadow-xl shadow-cyan-500/5 relative overflow-hidden"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-surface) 92%, transparent)", borderColor: "var(--color-card-border)" }}>

          {/* Gradient sweep */}
          <div className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-700 bg-linear-to-br from-cyan-500 to-transparent pointer-events-none"/>

          <div className="relative z-10 space-y-5">

            {/* Success banner */}
            {success && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                <CheckCircle size={15}/> {success}
              </div>
            )}

            {/* Google button */}
            <button type="button" onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border text-sm font-semibold active:scale-[0.98]"
              style={{ borderColor: "var(--color-card-border)", color: "var(--color-text-base)", backgroundColor: "var(--color-surface-elevated)" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-input-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)"}>
              <GoogleIcon/>
              <span>{isRegister ? "Daftar dengan Google" : "Masuk dengan Google"}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-card-border)" }}/>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-sub)", opacity: 0.6 }}>atau</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-card-border)" }}/>
            </div>

            {/* Form */}
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">

              {/* Full Name (register only) */}
              {isRegister && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-sub)" }}>
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-sub)" }}/>
                    <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})}
                      placeholder="John Doe" required className={inputClass + " pl-10"} style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.12)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.boxShadow = ""; }}/>
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-sub)" }}>
                  Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-sub)" }}/>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                    placeholder="user@email.com" required className={inputClass + " pl-10"} style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.12)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.boxShadow = ""; }}/>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-sub)" }}>
                  {t("login.passwordLabel")}
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-sub)" }}/>
                  <input type={showPassword ? "text" : "password"} value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    placeholder="••••••••" required className={inputClass + " pl-10 pr-10"} style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.12)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.boxShadow = ""; }}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md"
                    style={{ color: "var(--color-text-sub)" }}>
                    {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {/* Confirm Password (register only) */}
              {isRegister && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-sub)" }}>
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-sub)" }}/>
                    <input type={showPassword ? "text" : "password"} value={form.confirmPassword}
                      onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                      placeholder="••••••••" required className={inputClass + " pl-10"} style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.12)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.boxShadow = ""; }}/>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs font-medium px-3 py-2.5 rounded-lg border"
                  style={{ backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #06b6d4, #0ea5e9)", boxShadow: "0 4px 20px rgba(6,182,212,0.3)" }}
                onMouseEnter={(e) => { if(!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => e.currentTarget.style.transform = ""}>
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                ) : (
                  <><span>{isRegister ? "Buat Akun" : t("login.signIn")}</span><ArrowRight size={15}/></>
                )}
              </button>
            </form>

            {/* Switch mode */}
            <p className="text-center text-xs" style={{ color: "var(--color-text-sub)" }}>
              {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
              <button onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); setSuccess(""); }}
                className="font-bold transition-colors hover:text-cyan-500" style={{ color: "var(--color-text-base)" }}>
                {isRegister ? "Masuk" : "Daftar sekarang"}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-xs font-medium" style={{ color: "var(--color-text-sub)" }}>
          <Link to="/" className="hover:text-cyan-500 transition-colors hover:-translate-x-1 inline-block duration-300">
            ← {t("login.backHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
