import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, Edit2, Trash2, X, Search, Mail,
  Check, RefreshCw, AlertCircle, Shield, Eye, UserCog
} from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import api from "../../utils/api";

const ROLES = {
  ADMIN:    { label: "Admin",    icon: Shield,  color: "#FFFFFF" },
  OPERATOR: { label: "Operator", icon: UserCog, color: "#A0A0A0" },
  VIEWER:   { label: "Viewer",   icon: Eye,     color: "#555555" },
};

function getInitial(name) { return (name || "?").charAt(0).toUpperCase(); }

const inp = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  borderRadius: 7, fontSize: 13, outline: "none",
  background: "#0A0A0F", border: "1px solid #1F1F2E",
  color: "#FFFFFF", transition: "border-color 0.2s"
};
const F = e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; };
const B = e => { e.currentTarget.style.borderColor = "#1F1F2E"; };

/* ── Role Selector ── */
function RoleSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {Object.entries(ROLES).map(([key, { label, icon: Icon, color }]) => {
        const active = value === key;
        return (
          <button key={key} onClick={() => onChange(key)} style={{
            flex: 1, padding: "9px 8px", borderRadius: 8, cursor: "pointer",
            background: active ? "#1F1F2E" : "transparent",
            border: `1px solid ${active ? "rgba(255,255,255,0.15)" : "#1F1F2E"}`,
            color: active ? color : "#71717A",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            transition: "all 0.15s"
          }}>
            <Icon size={14} style={{ color: active ? color : "#3D3D4F" }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── User Modal ── */
function UserModal({ onClose, onSave, editData, loading }) {
  const isEdit = !!editData;
  const [form, setForm] = useState(
    editData
      ? { full_name: editData.full_name, email: editData.email, role: editData.role, password: "" }
      : { full_name: "", email: "", role: "VIEWER", password: "" }
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.full_name.trim() && form.email.trim() && (isEdit || form.password.trim());

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(5,5,8,0.88)", backdropFilter: "blur(14px)" }}
      onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 420, borderRadius: 14, background: "#0D0D14", border: "1px solid #1F1F2E", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={14} style={{ color: "#71717A" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>{isEdit ? "Edit Pengguna" : "Tambah Pengguna"}</p>
              <p style={{ fontSize: 11, color: "#71717A", margin: 0 }}>{isEdit ? `Mengedit: ${editData.full_name}` : "Buat akun baru"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => e.currentTarget.style.color = "#FFF"} onMouseLeave={e => e.currentTarget.style.color = "#71717A"}>
            <X size={13} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Nama Lengkap", key: "full_name", placeholder: "John Doe",          type: "text" },
            { label: "Email",        key: "email",     placeholder: "john@example.com",   type: "email" },
            ...(!isEdit ? [{ label: "Password", key: "password", placeholder: "Min. 8 karakter", type: "password" }] : []),
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#71717A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
              <input type={type} value={form[key]} placeholder={placeholder}
                onChange={e => set(key, e.target.value)}
                style={inp} onFocus={F} onBlur={B} />
            </div>
          ))}

          {/* Role selector */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#71717A", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Role Akses</label>
            <RoleSelector value={form.role} onChange={v => set("role", v)} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Batal</button>
          <button onClick={() => canSave && !loading && onSave(form)} disabled={!canSave || loading}
            style={{ flex: 2, padding: "10px", borderRadius: 8, background: canSave ? "#FFFFFF" : "#1A1A26", color: canSave ? "#0A0A0F" : "#3D3D4F", border: "none", fontSize: 13, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.2s" }}>
            {loading ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
            {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Pengguna"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm ── */
function DeleteModal({ user, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(5,5,8,0.88)", backdropFilter: "blur(14px)" }}
      onClick={onCancel}>
      <div style={{ width: "100%", maxWidth: 340, borderRadius: 14, background: "#0D0D14", border: "1px solid #1F1F2E", padding: "28px 24px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <AlertCircle size={20} style={{ color: "#71717A" }} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px", textAlign: "center" }}>Hapus Pengguna</h3>
        <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 4px", textAlign: "center" }}>
          Hapus <strong style={{ color: "#FFFFFF" }}>"{user.full_name}"</strong>?
        </p>
        <p style={{ fontSize: 12, color: "#3D3D4F", textAlign: "center", margin: "0 0 24px" }}>Tindakan ini tidak dapat dibatalkan.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Batal</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

/* ── Role Chip ── */
function RoleChip({ role }) {
  const { label, icon: Icon, color } = ROLES[role] || ROLES.VIEWER;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "#0A0A0F", border: "1px solid #1A1A26" }}>
      <Icon size={11} style={{ color }} />
      <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
}

/* ── Main Page ── */
export default function UsersPage() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get("/users"); setUsers(r.data); }
    catch { setUsers([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (form) => {
    setSaving(true);
    try { await api.post("/users", form); await load(); setShowAdd(false); }
    catch { } finally { setSaving(false); }
  };
  const handleEdit = async (form) => {
    setSaving(true);
    const payload = { full_name: form.full_name, email: form.email, role: form.role };
    if (form.password) payload.password = form.password;
    try { await api.put(`/users/${editUser.id}`, payload); await load(); setEditUser(null); }
    catch { } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    try { await api.delete(`/users/${deleteUser.id}`); await load(); }
    catch { } finally { setDeleteUser(null); }
  };

  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === "ADMIN").length,
    active: users.filter(u => u.is_active !== false).length,
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {showAdd   && <UserModal onClose={() => setShowAdd(false)} onSave={handleAdd} loading={saving} />}
      {editUser  && <UserModal onClose={() => setEditUser(null)} onSave={handleEdit} editData={editUser} loading={saving} />}
      {deleteUser && <DeleteModal user={deleteUser} onConfirm={handleDelete} onCancel={() => setDeleteUser(null)} />}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, animation: "fadeUp 0.4s ease both" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", margin: "0 0 10px", letterSpacing: "-0.03em" }}>Manajemen Pengguna</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[
              { label: "Total",    count: counts.total,  },
              { label: "Admin",    count: counts.admin,  },
              { label: "Aktif",    count: counts.active, pulse: true },
            ].map(({ label, count, pulse }, i, arr) => (
              <>
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, background: "#111118", border: "1px solid #1F1F2E" }}>
                  {pulse && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px rgba(255,255,255,0.5)" }} />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF" }}>{count}</span>
                  <span style={{ fontSize: 12, color: "#71717A" }}>{label}</span>
                </div>
                {i < arr.length - 1 && <span key={`s${i}`} style={{ width: 1, height: 12, background: "#1F1F2E" }} />}
              </>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#71717A", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pengguna..."
              style={{ ...inp, paddingLeft: 32, width: 220 }} onFocus={F} onBlur={B} />
          </div>
          {/* Refresh */}
          <button onClick={load} style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s, border-color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          {/* Add */}
          <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#E5E5E5"}
            onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}>
            <Plus size={14} /> Tambah Pengguna
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ borderRadius: 12, overflow: "hidden", background: "rgba(17,17,24,0.7)", border: "1px solid #1F1F2E", backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 80ms both" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
              {["Pengguna", "Email", "Role", "Status", "Bergabung", "Aksi"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 5 ? "right" : "left", padding: "11px 20px", fontSize: 10, fontWeight: 700, color: "#71717A", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} style={{ padding: "14px 20px" }}>
                    <div style={{ height: 36, borderRadius: 8, background: "#111118", opacity: 1 - i * 0.25 }} />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "56px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={20} style={{ color: "#2D2D3F" }} />
                    </div>
                    <p style={{ fontSize: 13, color: "#71717A", margin: 0, fontWeight: 600 }}>
                      {users.length === 0 ? "Belum ada pengguna" : "Tidak ditemukan"}
                    </p>
                    <p style={{ fontSize: 12, color: "#3D3D4F", margin: 0 }}>
                      {users.length === 0 ? "Klik tombol Tambah Pengguna untuk memulai" : "Coba kata kunci lain"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((user, i) => {
              const isHov    = hoveredRow === user.id;
              const isActive = user.is_active !== false;
              const joined   = user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
              return (
                <tr key={user.id}
                  onMouseEnter={() => setHoveredRow(user.id)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #131320" : "none", background: isHov ? "rgba(255,255,255,0.025)" : "transparent", transition: "background 0.15s" }}>

                  {/* Avatar + Name */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "#1F1F2E", border: "1px solid #2D2D3F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{getInitial(user.full_name)}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", display: "block" }}>{user.full_name}</span>
                        <span style={{ fontSize: 11, color: "#3D3D4F", fontFamily: "monospace" }}>#{String(user.id).padStart(3, "0")}</span>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Mail size={11} style={{ color: "#3D3D4F", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#71717A" }}>{user.email}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td style={{ padding: "14px 20px" }}>
                    <RoleChip role={user.role} />
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#FFFFFF" : "#2D2D3F", boxShadow: isActive ? "0 0 6px rgba(255,255,255,0.5)" : "none" }} />
                      <span style={{ fontSize: 12, color: isActive ? "#FFFFFF" : "#71717A", fontWeight: 500 }}>{isActive ? "Aktif" : "Nonaktif"}</span>
                    </div>
                  </td>

                  {/* Joined */}
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#71717A" }}>{joined}</td>

                  {/* Actions */}
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => setEditUser(user)} title="Edit" style={{ width: 30, height: 30, borderRadius: 7, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isHov ? 1 : 0.4, transition: "opacity 0.15s, color 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setDeleteUser(user)} title="Hapus" style={{ width: 30, height: 30, borderRadius: 7, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isHov ? 1 : 0.4, transition: "opacity 0.15s, color 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "10px 20px", borderTop: "1px solid #131320", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0A0A0F" }}>
            <span style={{ fontSize: 12, color: "#3D3D4F" }}>{filtered.length} dari {users.length} pengguna</span>
            <span style={{ fontSize: 12, color: "#3D3D4F", fontFamily: "monospace" }}>Auto-refresh setelah aksi</span>
          </div>
        )}
      </div>
    </div>
  );
}
