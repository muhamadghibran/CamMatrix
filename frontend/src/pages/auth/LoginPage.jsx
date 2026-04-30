import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Tv2, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useLanguageStore } from "../../store/languageStore";
import { API_BASE_URL as API } from "../../constants/api";
import CosmicBackground from "../../components/CosmicBackground";
import CamLogo from "../../components/CamLogo";

/* ── Input Field ── */
function InputField({
  type,
  value,
  onChange,
  placeholder,
  label,
  icon,
  rightEl,
  required,
}) {
  const FieldIcon = icon;
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        className="block text-[11px] font-bold mb-2 uppercase tracking-widest"
        style={{
          color: focused ? "#6366F1" : "#71717A",
          transition: "color 0.2s",
        }}
      >
        {label}
      </label>
      <div
        className="relative flex items-center rounded-xl"
        style={{
          border: `1px solid ${focused ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
          background: "rgba(255,255,255,0.04)",
          boxShadow: focused
            ? "0 0 0 3px rgba(99,102,241,0.08), 0 0 20px rgba(99,102,241,0.06)"
            : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        <FieldIcon
          size={14}
          className="absolute left-4 shrink-0"
          style={{
            color: focused ? "#6366F1" : "rgba(148,163,184,0.6)",
            transition: "color 0.2s",
          }}
        />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent outline-none text-sm font-medium"
          style={{ color: "#FFFFFF", padding: "14px 42px 14px 42px" }}
        />
        {rightEl && <div className="absolute right-3">{rightEl}</div>}
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
  const [visible, setVisible] = useState(false); // entrance anim

  const { setAuth } = useAuthStore();
  useLanguageStore();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
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
      setAuth(
        { name: p.full_name, email: p.email, role: p.role },
        data.access_token,
      );
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
      setAuth(
        { name: p.full_name, email: p.email, role: p.role },
        data.access_token,
      );
      localStorage.setItem("access_token", data.access_token);
      navigate("/app/dashboard");
    } catch {
      setError("Tidak dapat terhubung ke server.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "#0A0A0F",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes floatAstronaut {
          0% { transform: translateY(0) translateX(0) rotate(-2deg); }
          33% { transform: translateY(-30px) translateX(15px) rotate(1deg); }
          66% { transform: translateY(15px) translateX(-10px) rotate(-1deg); }
          100% { transform: translateY(0) translateX(0) rotate(-2deg); }
        }
      `}</style>

      {/* Cosmic background */}
      <CosmicBackground particleOpacity={0.35} />

      {/* Floating Astronaut Layer */}
      <div
        style={{
          position: "absolute",
          right: "-5%",
          bottom: "-10%",
          width: "55vw",
          minWidth: "500px",
          pointerEvents: "none",
          zIndex: 5,
          opacity: visible ? 0.55 : 0,
          transition: "opacity 3s ease 1s",
          animation: "floatAstronaut 18s ease-in-out infinite",
          mixBlendMode: "lighten",
        }}
      >
        <img
          src="/astronaut_camera.png"
          alt="Astronaut Camera Background"
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 40%, black 30%, transparent 75%)",
            maskImage:
              "radial-gradient(circle at 50% 40%, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "380px",
          background: "rgba(4,10,20,0.85)",
          border: "1px solid rgba(99,102,241,0.1)",
          borderRadius: "24px",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          padding: "40px 36px 36px",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(99,102,241,0.06), 0 0 60px rgba(99,102,241,0.06)",
          /* Entrance animation */
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(28px) scale(0.97)",
          filter: visible ? "blur(0)" : "blur(10px)",
          transition:
            "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1), filter 0.8s ease",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "32px",
            right: "32px",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)",
          }}
        />

        {/* Logo + title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(-12px)",
              transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s",
            }}
          >
            <CamLogo size={52} radius="14px" />
          </div>
          <h1
            style={{
              margin: "24px 0 6px",
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.7s ease 0.35s",
            }}
          >
            Admin Login
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#71717A",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.7s ease 0.45s",
            }}
          >
            CamMatrix — Panel Administrator
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 500,
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#ef4444",
                marginTop: "4px",
                flexShrink: 0,
              }}
            />
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
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
                style={{
                  color: "rgba(148,163,184,0.6)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className={`btn-primary mt-2 w-full py-3.5 rounded-xl text-sm ${loading ? "btn-loading" : ""}`}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Masuk...
              </>
            ) : (
              <>
                Masuk <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            margin: "20px 0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.06)",
            }}
          />
          <span style={{ fontSize: "11px", color: "rgba(148,163,184,0.5)" }}>
            atau
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "rgba(255,255,255,0.06)",
            }}
          />
        </div>

        <Link
          to="/live"
          id="login-live-link"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderRadius: "16px",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            border: "1px solid rgba(255,255,255,0.06)",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(145deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))";
            e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(99,102,241,0.07)",
                border: "1px solid rgba(99,102,241,0.12)",
              }}
            >
              <Tv2 size={16} style={{ color: "#6366F1" }} />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  lineHeight: 1,
                }}
              >
                Akses Publik
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#71717A",
                  lineHeight: 1,
                }}
              >
                Siaran langsung (tanpa login)
              </span>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: "rgba(148,163,184,0.6)" }} />
        </Link>
      </div>

      {/* Change Password Modal */}
      {mustChangePass && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "360px",
              borderRadius: "20px",
              background: "rgba(4,10,20,0.95)",
              border: "1px solid rgba(99,102,241,0.12)",
              padding: "36px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
              animation: "cinematicReveal 0.6s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.3)",
                }}
              >
                <Lock size={18} style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    margin: 0,
                  }}
                >
                  Wajib Ganti Password
                </h2>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#71717A",
                    margin: 0,
                  }}
                >
                  Demi keamanan akun Anda
                </p>
              </div>
            </div>
            <form
              onSubmit={handleChangePassword}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <InputField
                type={showNewPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                label="Password Baru"
                icon={Lock}
                required
                rightEl={
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      color: "rgba(148,163,184,0.6)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
              {error && (
                <p style={{ fontSize: "12px", color: "#f87171", margin: 0 }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0A0A0F",
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #4F46E5, #6366F1)",
                  opacity: loading ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
