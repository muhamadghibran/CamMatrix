import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Tv2, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useLanguageStore } from "../../store/languageStore";
import { API_BASE_URL as API } from "../../constants/api";
import CamLogo from "../../components/CamLogo";

/* ── Input Field ── */
function InputField({ type, value, onChange, placeholder, label, icon, rightEl, required }) {
  const FieldIcon = icon;
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: focused ? "#FFFFFF" : "#8a8f98", transition: "color 0.2s" }}>
        {label}
      </label>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          borderRadius: 8,
          border: `1px solid ${focused ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)"}`,
          background: "rgba(255,255,255,0.02)",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        <FieldIcon size={16} style={{ position: "absolute", left: 14, color: focused ? "#FFFFFF" : "rgba(255,255,255,0.3)", transition: "color 0.2s" }} />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 14,
            color: "#FFFFFF",
            padding: "12px 40px 12px 40px",
          }}
        />
        {rightEl && <div style={{ position: "absolute", right: 12 }}>{rightEl}</div>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mustChangePass, setMustChangePass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [visible, setVisible] = useState(false);

  const { setAuth } = useAuthStore();
  useLanguageStore();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username", email);
      fd.append("password", password);
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || "Email atau password salah.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.must_change_password) {
        setTempToken(data.access_token);
        setMustChangePass(true);
        setLoading(false);
        return;
      }
      const prof = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (!prof.ok) throw new Error();
      const p = await prof.json();
      setAuth({ name: p.full_name, email: p.email, role: p.role }, data.access_token);
      localStorage.setItem("access_token", data.access_token);
      navigate("/app/dashboard");
    } catch {
      setError("Tidak dapat terhubung ke server.");
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || "Gagal mengganti password.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      const prof = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const p = await prof.json();
      setAuth({ name: p.full_name, email: p.email, role: p.role }, data.access_token);
      localStorage.setItem("access_token", data.access_token);
      navigate("/app/dashboard");
    } catch {
      setError("Tidak dapat terhubung ke server.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0F", padding: 24 }}>
      <div style={{
        width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 32,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          <CamLogo size={36} color="#FFFFFF" />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Admin Login</h1>
            <p style={{ fontSize: 14, color: "#8a8f98", margin: 0 }}>CamMatrix — Panel Administrator</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <InputField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@vms.com"
            label="Email"
            icon={Mail}
            required
          />
          <InputField
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            label="Password"
            icon={Lock}
            required
            rightEl={
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
          
          <button type="submit" disabled={loading} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4,
            width: "100%", padding: "12px", borderRadius: 99,
            background: "#FFFFFF", color: "#0A0A0F", fontSize: 14, fontWeight: 600,
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s", opacity: loading ? 0.7 : 1
          }}
          onMouseEnter={e=>!loading && (e.currentTarget.style.background="#E5E5E5")}
          onMouseLeave={e=>!loading && (e.currentTarget.style.background="#FFFFFF")}
          >
             {loading ? "Masuk..." : <>Masuk <ArrowRight size={14} /></>}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: 12, color: "#6b7280" }}>atau</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        <Link to="/live" style={{
           display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
           width: "100%", padding: "12px", borderRadius: 99,
           background: "transparent", color: "#FFFFFF", fontSize: 14, fontWeight: 600,
           border: "1px solid rgba(255,255,255,0.16)", cursor: "pointer",
           textDecoration: "none", transition: "background 0.2s, border-color 0.2s"
        }}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.38)"}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="rgba(255,255,255,0.16)"}}
        >
          <Tv2 size={16} /> Akses Publik
        </Link>
      </div>

      {/* Change Password Modal */}
      {mustChangePass && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,10,15,0.9)", backdropFilter: "blur(8px)" }}>
          <div style={{ width: "100%", maxWidth: 360, borderRadius: 16, background: "#111118", border: "1px solid #1F1F2E", padding: 32, boxShadow: "0 24px 48px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Lock size={18} style={{ color: "#FFFFFF" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>Ubah Password</h2>
                <p style={{ fontSize: 13, color: "#8a8f98", margin: 0 }}>Amankan akun Anda</p>
              </div>
            </div>
            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InputField
                type={showNewPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                label="Password Baru"
                icon={Lock}
                required
                rightEl={
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              {error && <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "12px", borderRadius: 99, fontSize: 14, fontWeight: 600,
                color: "#0A0A0F", background: "#FFFFFF", border: "none", cursor: "pointer",
                marginTop: 8, opacity: loading ? 0.7 : 1
              }}>
                {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
