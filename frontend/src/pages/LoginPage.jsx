import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Lock, Mail, Tv2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { useLanguageStore } from "../store/languageStore";
import { API_BASE_URL as API } from "../constants/api";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const { setAuth }    = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t }          = useLanguageStore();
  const navigate       = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username", email);
      fd.append("password", password);
      const res = await fetch(`${API}/auth/login`, { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Email atau password salah.");
        setLoading(false); return;
      }
      const { access_token } = await res.json();
      // Ambil profil
      const profileRes = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!profileRes.ok) throw new Error("Gagal mengambil profil.");
      const profile = await profileRes.json();
      setAuth({ name: profile.full_name, email: profile.email, role: profile.role }, access_token);
      localStorage.setItem("access_token", access_token);
      navigate("/app/dashboard");
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 60%, #0a0a0f 100%)",
      fontFamily: "'Inter','Outfit',sans-serif",
      padding: "20px",
    }}>
      {/* Card */}
      <div style={{
        width: "100%", maxWidth: "400px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "24px",
        padding: "40px 36px",
        backdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 16px",
            background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(139,92,246,0.4)",
          }}>
            <Shield size={26} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            Admin Login
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
            CamMatrix — Panel Administrator
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: "20px", padding: "12px 16px", borderRadius: "12px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", fontSize: "13px",
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.05em" }}>
              EMAIL
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@vms.com"
                required
                style={{
                  width: "100%", padding: "12px 14px 12px 40px",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", color: "white", fontSize: "14px",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#8b5cf6"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "8px", letterSpacing: "0.05em" }}>
              PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%", padding: "12px 44px 12px 40px",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px", color: "white", fontSize: "14px",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#8b5cf6"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              padding: "13px",
              borderRadius: "12px",
              background: loading ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg,#8b5cf6,#06b6d4)",
              border: "none",
              color: "white",
              fontWeight: 700,
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(139,92,246,0.4)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        {/* Link ke halaman publik */}
        <div style={{ marginTop: "28px", textAlign: "center" }}>
          <Link to="/live" style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "12px", color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          >
            <Tv2 size={13} />
            Lihat Siaran Langsung (tanpa login)
          </Link>
        </div>
      </div>
    </div>
  );
}
