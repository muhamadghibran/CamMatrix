import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Edit2, Trash2, X, Search, Mail, Check, RefreshCw, AlertCircle } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import api from "../../utils/api";

const ROLES = {
  ADMIN:    { label: "Admin",    dot: "#FFFFFF" },
  OPERATOR: { label: "Operator", dot: "#A0A0A0" },
  VIEWER:   { label: "Viewer",   dot: "#555555" },
};

function getInitial(name) { return (name || "?").charAt(0).toUpperCase(); }

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  borderRadius: 7, fontSize: 13, outline: "none",
  background: "#0A0A0F", border: "1px solid #1F1F2E", color: "#FFFFFF",
  transition: "border-color 0.2s"
};

/* ── User Modal ── */
function UserModal({ onClose, onSave, editData, loading }) {
  const { t } = useLanguageStore();
  const isEdit = !!editData;
  const [form, setForm] = useState(
    editData ? { full_name: editData.full_name, email: editData.email, role: editData.role, password: "" }
             : { full_name: "", email: "", role: "VIEWER", password: "" }
  );
  const canSave = form.full_name.trim() && form.email.trim() && (isEdit || form.password.trim());
  const fields = [
    { label: "Nama Lengkap", key: "full_name", placeholder: "John Doe", type: "text" },
    { label: "Email",        key: "email",     placeholder: "john@example.com", type: "email" },
    ...(!isEdit ? [{ label: "Password", key: "password", placeholder: "Min. 8 karakter", type: "password" }] : []),
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: 400, borderRadius: 12, background: "#111118", border: "1px solid #1F1F2E", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1F1F2E" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={14} style={{ color: "#71717A" }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>{isEdit ? "Edit Pengguna" : "Tambah Pengguna"}</span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "none", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e=>e.currentTarget.style.color="#FFF"} onMouseLeave={e=>e.currentTarget.style.color="#71717A"}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#71717A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
              <input type={type} value={form[key]} placeholder={placeholder} onChange={e => setForm({ ...form, [key]: e.target.value })}
                style={inputStyle}
                onFocus={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"}
                onBlur={e=>e.currentTarget.style.borderColor="#1F1F2E"}
              />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#71717A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Batal</button>
          <button onClick={() => canSave && !loading && onSave(form)} disabled={!canSave || loading}
            style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
            {isEdit ? "Simpan" : "Tambah Pengguna"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm Delete ── */
function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: 340, borderRadius: 12, background: "#111118", border: "1px solid #1F1F2E", padding: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Trash2 size={16} style={{ color: "#71717A" }} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px", textAlign: "center" }}>Konfirmasi Hapus</h3>
        <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 20px", textAlign: "center" }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Batal</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function UsersPage() {
  const { t } = useLanguageStore();
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [editUser, setEditUser]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hoveredRow, setHoveredRow]     = useState(null);
  const [search, setSearch]             = useState("");

  const fetchUsers = useCallback(async () => {
    try { setLoading(true); setError(null); const r = await api.get("/users/"); setUsers(r.data); }
    catch (e) { setError(e.response?.data?.detail || "Gagal memuat data pengguna."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (form) => {
    try { setSaving(true); await api.post("/users/", form); setShowModal(false); await fetchUsers(); }
    catch (e) { setError(e.response?.data?.detail || "Gagal menambah pengguna."); }
    finally { setSaving(false); }
  };
  const handleEdit = async (form) => {
    try { setSaving(true); await api.put(`/users/${editUser.id}`, form); setEditUser(null); await fetchUsers(); }
    catch (e) { setError(e.response?.data?.detail || "Gagal mengubah pengguna."); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    try { setSaving(true); await api.delete(`/users/${deleteTarget.id}`); setDeleteTarget(null); await fetchUsers(); }
    catch (e) { setError(e.response?.data?.detail || "Gagal menghapus pengguna."); }
    finally { setSaving(false); }
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

  return (
    <div style={{ width: "100%" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {showModal    && <UserModal    onClose={() => setShowModal(false)}   onSave={handleAdd}    loading={saving} />}
      {editUser     && <UserModal    onClose={() => setEditUser(null)}      onSave={handleEdit}   editData={editUser} loading={saving} />}
      {deleteTarget && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} message={`Yakin ingin menghapus "${deleteTarget.full_name}"?`} loading={saving} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.025em" }}>Pengguna</h1>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>{users.length} pengguna terdaftar</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#71717A", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari pengguna..."
              style={{ ...inputStyle, paddingLeft: 32, width: 200 }}
              onFocus={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"}
              onBlur={e=>e.currentTarget.style.borderColor="#1F1F2E"}
            />
          </div>
          <button onClick={fetchUsers} style={{ width: 34, height: 34, borderRadius: 7, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e=>e.currentTarget.style.color="#FFF"} onMouseLeave={e=>e.currentTarget.style.color="#71717A"}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Pengguna", value: users.length },
          { label: "Admin", value: users.filter(u => u.role === "ADMIN").length },
          { label: "Aktif", value: users.filter(u => u.is_active !== false).length },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: "16px 20px", borderRadius: 10, background: "#111118", border: "1px solid #1F1F2E" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#71717A", fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "rgba(255,255,255,0.04)", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13 }}>
          <AlertCircle size={14} /><span style={{ flex: 1 }}>{error}</span>
          <button onClick={fetchUsers} style={{ fontSize: 12, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "#FFFFFF" }}>Coba lagi</button>
        </div>
      )}

      {/* Table */}
      <div style={{ borderRadius: 10, overflow: "hidden", background: "#111118", border: "1px solid #1F1F2E" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A26" }}>
              {["Pengguna", "Email", "Role", "Status", "Bergabung", "Aksi"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: 11, fontWeight: 600, color: "#71717A", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i} style={{ borderBottom: "1px solid #1A1A26" }}>
                  {[140,160,80,60,80,60].map((w,j) => (
                    <td key={j} style={{ padding: "14px 16px" }}>
                      <div style={{ height: 12, borderRadius: 4, width: w, background: "#1A1A26" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "#71717A" }}>
                {users.length === 0 ? "Belum ada pengguna." : "Tidak ada pengguna ditemukan."}
              </td></tr>
            ) : filtered.map((u, i) => {
              const rc = ROLES[u.role] || ROLES.VIEWER;
              const isHov = hoveredRow === u.id;
              return (
                <tr key={u.id}
                  onMouseEnter={() => setHoveredRow(u.id)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1A1A26" : "none", background: isHov ? "#0D0D14" : "transparent", transition: "background 0.15s" }}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#71717A" }}>
                        {getInitial(u.full_name)}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#71717A" }}>
                      <Mail size={11} style={{ flexShrink: 0 }} />{u.email}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 5, background: "#0A0A0F", border: "1px solid #1F1F2E", color: "#71717A" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: rc.dot, flexShrink: 0 }} />
                      {rc.label}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: u.is_active !== false ? "#FFFFFF" : "#71717A" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: u.is_active !== false ? "#FFFFFF" : "#2D2D3F", boxShadow: u.is_active !== false ? "0 0 6px rgba(255,255,255,0.4)" : "none" }} />
                      {u.is_active !== false ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "#71717A" }}>{fmt(u.created_at)}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setEditUser(u)} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e=>{e.currentTarget.style.color="#FFF"; e.currentTarget.style.borderColor="#2D2D3F"}}
                        onMouseLeave={e=>{e.currentTarget.style.color="#71717A"; e.currentTarget.style.borderColor="#1F1F2E"}}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e=>{e.currentTarget.style.color="#FFF"; e.currentTarget.style.borderColor="#2D2D3F"}}
                        onMouseLeave={e=>{e.currentTarget.style.color="#71717A"; e.currentTarget.style.borderColor="#1F1F2E"}}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
