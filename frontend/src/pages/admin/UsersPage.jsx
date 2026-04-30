import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Edit2, Trash2, X, ShieldCheck, User, Search, Mail, Crown, Check, RefreshCw, AlertCircle } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import api from "../../utils/api";

/* ─── Role config ───────────────────────────────────────── */
const ROLES = {
  ADMIN:    { label: "Admin",    dot: "#e5e7eb" },
  OPERATOR: { label: "Operator", dot: "#9ca3af" },
  VIEWER:   { label: "Viewer",   dot: "#6b7280" },
};

function getInitial(name) { return (name || "?").charAt(0).toUpperCase(); }

/* ─── UserModal ─────────────────────────────────────────── */
function UserModal({ onClose, onSave, editData, loading }) {
  const { t } = useLanguageStore();
  const [form, setForm] = useState(
    editData ? { full_name: editData.full_name, email: editData.email, role: editData.role, password: "" }
             : { full_name: "", email: "", role: "VIEWER", password: "" }
  );
  const isEdit = !!editData;
  const canSave = form.full_name.trim() && form.email.trim() && (isEdit || form.password.trim());

  const fields = [
    { label: t("users.modal.name"),     key: "full_name", placeholder: t("users.modal.namePH"), type: "text" },
    { label: t("users.modal.email"),    key: "email",     placeholder: t("users.modal.emailPH"), type: "email" },
    ...(!isEdit ? [{ label: t("users.modal.password"), key: "password", placeholder: t("users.modal.passPH"), type: "password" }] : []),
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
      <div style={{ width: "100%", maxWidth: 380, borderRadius: 16, overflow: "hidden", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={14} style={{ color: "var(--color-text-sub)" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-base)" }}>
              {isEdit ? "Edit Pengguna" : t("users.modal.title")}
            </span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} style={{ color: "var(--color-text-sub)" }} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-sub)", marginBottom: 6 }}>{label}</label>
              <input
                type={type} value={form[key]} placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
              />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-sub)", marginBottom: 6 }}>{t("users.modal.role")}</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none", cursor: "pointer", backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)" }}>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid var(--color-card-border)", backgroundColor: "transparent", color: "var(--color-text-sub)" }}>
            {t("users.modal.cancel")}
          </button>
          <button onClick={() => canSave && onSave(form)} disabled={!canSave || loading}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed", border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-base)", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
            {isEdit ? "Simpan" : t("users.modal.add")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ConfirmModal ──────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}>
      <div style={{ width: "100%", maxWidth: 340, borderRadius: 16, overflow: "hidden", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", margin: "0 auto 16px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={20} style={{ color: "#ef4444" }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-base)", margin: "0 0 6px" }}>Konfirmasi Hapus</p>
          <p style={{ fontSize: 12, color: "var(--color-text-sub)", margin: "0 0 20px" }}>{message}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid var(--color-card-border)", backgroundColor: "transparent", color: "var(--color-text-sub)" }}>Batal</button>
            <button onClick={onConfirm} disabled={loading}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {loading && <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />}
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function UsersPage() {
  const { t } = useLanguageStore();
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [editUser, setEditUser]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hovered, setHovered]         = useState(null);
  const [search, setSearch]           = useState("");

  const fetchUsers = useCallback(async () => {
    try { setLoading(true); setError(null); const r = await api.get("/users/"); setUsers(r.data); }
    catch (e) { setError(e.response?.data?.detail || "Gagal memuat data pengguna."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (form) => {
    try { setSaving(true); await api.post("/users/", form); setShowModal(false); await fetchUsers(); }
    catch (e) { setError(e.response?.data?.detail || "Gagal menambah pengguna."); }
    finally { setSaving(false); }
  };
  const handleEdit = async (form) => {
    try { setSaving(true); await api.put(`/users/${editUser.id}`, { ...form, ...(form.password ? {} : { password: undefined }) }); setEditUser(null); await fetchUsers(); }
    catch (e) { setError(e.response?.data?.detail || "Gagal mengubah pengguna."); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    try { setSaving(true); await api.delete(`/users/${deleteTarget.id}`); setDeleteTarget(null); await fetchUsers(); }
    catch (e) { setError(e.response?.data?.detail || "Gagal menghapus pengguna."); }
    finally { setSaving(false); }
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

  const stats = [
    { label: t("users.stats.total"),   value: users.length },
    { label: t("users.stats.admins"),  value: users.filter((u) => u.role === "ADMIN").length },
    { label: t("users.stats.active"),  value: users.filter((u) => u.is_active !== false).length },
  ];

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* spin keyframe */}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {showModal    && <UserModal    onClose={() => setShowModal(false)}   onSave={handleAdd}    loading={saving} />}
      {editUser     && <UserModal    onClose={() => setEditUser(null)}      onSave={handleEdit}   editData={editUser} loading={saving} />}
      {deleteTarget && <ConfirmModal onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} message={`Yakin ingin menghapus "${deleteTarget.full_name}"?`} loading={saving} />}

      {/* ── Stats row ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ flex: 1, padding: "18px 20px", borderRadius: 12, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-base)", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-sub)", marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-sub)", pointerEvents: "none" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cari ${users.length} pengguna...`}
            style={{ width: "100%", boxSizing: "border-box", paddingLeft: 36, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderRadius: 8, fontSize: 13, outline: "none", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={fetchUsers} title="Refresh"
            style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={14} style={{ color: "var(--color-text-sub)", animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-base)", whiteSpace: "nowrap" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; }}>
            <Plus size={14} /> {t("users.addUser")}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 8, marginBottom: 16, backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13 }}>
          <AlertCircle size={14} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={fetchUsers} style={{ fontSize: 12, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>Coba lagi</button>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ borderRadius: 14, overflow: "hidden", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)" }}>
              {["user", "email", "role", "status", "joined", "actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "13px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-sub)" }}>
                  {t(`users.table.${h}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-card-border)" }}>
                  {[140, 160, 80, 60, 80, 60].map((w, j) => (
                    <td key={j} style={{ padding: "16px 20px" }}>
                      <div style={{ height: 14, borderRadius: 6, width: w, backgroundColor: "var(--color-surface-elevated)", opacity: 0.6 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: "var(--color-text-sub)" }}>
                  {users.length === 0 ? "Belum ada pengguna terdaftar." : "Tidak ada pengguna ditemukan."}
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => {
                const rc = ROLES[u.role] || ROLES.VIEWER;
                const isHov = hovered === u.id;
                const initial = getInitial(u.full_name);
                return (
                  <tr key={u.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-card-border)" : "none", backgroundColor: isHov ? "var(--color-surface-elevated)" : "transparent", transition: "background-color 0.12s" }}
                    onMouseEnter={() => setHovered(u.id)} onMouseLeave={() => setHovered(null)}>

                    {/* User */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--color-text-base)" }}>
                          {initial}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-base)" }}>{u.full_name || "—"}</div>
                          {u.role === "ADMIN" && (
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-sub)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Admin</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-sub)" }}>
                        <Mail size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                        {u.email}
                      </span>
                    </td>

                    {/* Role */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "var(--color-text-sub)", padding: "4px 10px", borderRadius: 6, backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: rc.dot, display: "inline-block", flexShrink: 0 }} />
                        {rc.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: u.is_active !== false ? "var(--color-text-base)" : "var(--color-text-sub)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, display: "inline-block", backgroundColor: u.is_active !== false ? "#34d399" : "#4b5563" }} />
                        {u.is_active !== false ? t("users.status.active") : t("users.status.inactive")}
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "var(--color-text-sub)" }}>{fmt(u.created_at)}</td>

                    {/* Actions */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => setEditUser(u)}
                          style={{ padding: 7, borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: isHov ? "var(--color-surface)" : "transparent", color: "var(--color-text-sub)", transition: "background-color 0.12s" }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(u)}
                          style={{ padding: 7, borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: isHov ? "rgba(239,68,68,0.08)" : "transparent", color: "#ef4444", transition: "background-color 0.12s" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
