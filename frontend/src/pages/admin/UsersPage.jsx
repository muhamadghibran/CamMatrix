import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Edit2, Trash2, X, ShieldCheck, User, Search, Mail, Crown, Check, RefreshCw, AlertCircle } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import AnimatedText from "../../components/AnimatedText";
import api from "../../utils/api";

const roleStyle = {
  ADMIN:    { label: "Admin",    color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)",   icon: Crown },
  OPERATOR: { label: "Operator", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)",  icon: ShieldCheck },
  VIEWER:   { label: "Viewer",   color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)",  icon: User },
};

const avatarColors = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6"];

function getInitial(name) {
  return (name || "?").charAt(0).toUpperCase();
}

function getAvatarColor(id) {
  return avatarColors[id % avatarColors.length];
}

/* ── Modal Tambah/Edit User ── */
function UserModal({ onClose, onSave, editData, loading }) {
  const { t } = useLanguageStore();
  const [form, setForm] = useState(
    editData
      ? { full_name: editData.full_name, email: editData.email, role: editData.role, password: "" }
      : { full_name: "", email: "", role: "VIEWER", password: "" }
  );
  const isEdit = !!editData;

  const handleSave = () => {
    if (!form.full_name.trim() || !form.email.trim()) return;
    if (!isEdit && !form.password.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-card-enter" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-card-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8b5cf6,#00ffff)", boxShadow: "0 0 16px rgba(0,255,255,0.4)" }}>
              <Users size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-bold" style={{ color: "var(--color-text-base)" }}>{isEdit ? "Edit Pengguna" : t("users.modal.title")}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: "var(--color-text-sub)", backgroundColor: "var(--color-surface-elevated)" }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {[
            { label: t("users.modal.name"),  key: "full_name", placeholder: t("users.modal.namePH"),  type: "text" },
            { label: t("users.modal.email"), key: "email",     placeholder: t("users.modal.emailPH"), type: "email" },
            ...(!isEdit ? [{ label: t("users.modal.password"), key: "password", placeholder: t("users.modal.passPH"), type: "password" }] : []),
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-sub)" }}>{label}</label>
              <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--color-input-bg)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.boxShadow = ""; }}
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-sub)" }}>{t("users.modal.role")}</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ backgroundColor: "var(--color-input-bg)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)" }}>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ border: "1px solid var(--color-card-border)", color: "var(--color-text-sub)" }}>
            {t("users.modal.cancel")}
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#00ffff)", boxShadow: "0 4px 14px rgba(0,255,255,0.4)", opacity: loading ? 0.7 : 1 }}>
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={15} />}
            {isEdit ? "Simpan" : t("users.modal.add")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal Konfirmasi Hapus ── */
function ConfirmModal({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-xs rounded-2xl overflow-hidden animate-card-enter" style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <Trash2 size={22} style={{ color: "#ef4444" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-base)" }}>Konfirmasi Hapus</p>
            <p className="text-[12px] mt-1" style={{ color: "var(--color-text-sub)" }}>{message}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ border: "1px solid var(--color-card-border)", color: "var(--color-text-sub)" }}>Batal</button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 14px rgba(239,68,68,0.4)", opacity: loading ? 0.7 : 1 }}>
              {loading ? <RefreshCw size={13} className="animate-spin" /> : null}
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function UsersPage() {
  const { t } = useLanguageStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [search, setSearch] = useState("");

  /* Fetch semua user dari backend */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const statItems = [
    { labelKey: "total",  value: users.length,                                        icon: Users,      color: "#06b6d4" },
    { labelKey: "admins", value: users.filter(u => u.role === "ADMIN").length,         icon: Crown,      color: "#8b5cf6" },
    { labelKey: "active", value: users.filter(u => u.is_active !== false).length,      icon: ShieldCheck,color: "#10b981" },
  ];

  /* Tambah user */
  const handleAdd = async (form) => {
    try {
      setSaving(true);
      await api.post("/users/", {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setShowModal(false);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menambah pengguna.");
    } finally {
      setSaving(false);
    }
  };

  /* Edit user */
  const handleEdit = async (form) => {
    try {
      setSaving(true);
      await api.put(`/users/${editUser.id}`, {
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      });
      setEditUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal mengubah pengguna.");
    } finally {
      setSaving(false);
    }
  };

  /* Hapus user */
  const handleDelete = async () => {
    try {
      setSaving(true);
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal menghapus pengguna.");
    } finally {
      setSaving(false);
    }
  };

  /* Format tanggal */
  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6 relative z-10 w-full">
      {showModal && <UserModal onClose={() => setShowModal(false)} onSave={handleAdd} loading={saving} />}
      {editUser  && <UserModal onClose={() => setEditUser(null)}   onSave={handleEdit} editData={editUser} loading={saving} />}
      {deleteTarget && <ConfirmModal message={`Yakin ingin menghapus "${deleteTarget.full_name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={saving} />}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5">
        {statItems.map(({ labelKey, value, icon: Icon, color }, i) => (
          <div key={labelKey} className="gradient-border noise animate-card-enter opacity-0-init cursor-pointer group relative overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", padding: "20px", animationDelay: `${i * 100}ms` }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 14px 36px rgba(0,0,0,0.12), 0 0 0 1px ${color}35`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none" style={{ background: `radial-gradient(ellipse at 0% 0%, ${color}14, transparent 55%)` }} />
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}14`, border: `1px solid ${color}26` }}>
                <Icon size={21} style={{ color }} />
              </div>
            </div>
            <div className="stat-number text-3xl font-bold mb-1" style={{ color }}>
              <AnimatedText text={String(value)} delayOffset={200 + i * 100} splitBy="char" />
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-sub)" }}>
              {t(`users.stats.${labelKey}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 animate-card-enter opacity-0-init delay-300">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-sub)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cari ${users.length} pengguna...`}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.boxShadow = ""; }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} title="Refresh"
            className="p-2.5 rounded-xl" style={{ border: "1px solid var(--color-card-border)", color: "var(--color-text-sub)", backgroundColor: "var(--color-surface)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#00ffff)", boxShadow: "0 4px 14px rgba(0,255,255,0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
            <Plus size={16} /> {t("users.addUser")}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={fetchUsers} className="ml-auto text-xs underline">Coba lagi</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-[18px] overflow-hidden animate-card-enter opacity-0-init delay-400"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)" }}>
              {["user", "email", "role", "status", "joined", "actions"].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-sub)" }}>
                  {t(`users.table.${h}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              /* Loading skeleton */
              [1, 2, 3].map(i => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-card-border)" }}>
                  {[1, 2, 3, 4, 5, 6].map(j => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded-lg animate-pulse" style={{ backgroundColor: "var(--color-surface-elevated)", width: j === 1 ? "140px" : j === 6 ? "60px" : "90px" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "var(--color-text-sub)" }}>
                  {users.length === 0 ? "Belum ada pengguna terdaftar." : "Tidak ada pengguna ditemukan."}
                </td>
              </tr>
            ) : filtered.map((u, i) => {
              const rc = roleStyle[u.role] || roleStyle.VIEWER;
              const RoleIcon = rc.icon;
              const isHov = hovered === u.id;
              const avatarColor = getAvatarColor(u.id);
              return (
                <tr key={u.id}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-card-border)" : "none", backgroundColor: isHov ? "var(--color-surface-elevated)" : "", transition: "background-color 0.15s ease" }}
                  onMouseEnter={() => setHovered(u.id)}
                  onMouseLeave={() => setHovered(null)}>
                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor})`, boxShadow: isHov ? `0 0 12px ${avatarColor}60` : "none", transition: "box-shadow 0.2s ease" }}>
                        {getInitial(u.full_name)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-base)" }}>{u.full_name || "-"}</p>
                        {u.role === "ADMIN" && <span className="text-[10px] font-bold text-amber-400">★ ADMIN</span>}
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--color-text-sub)" }}>
                      <Mail size={11} style={{ opacity: 0.6 }} />{u.email}
                    </span>
                  </td>
                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg w-fit"
                      style={{ color: rc.color, backgroundColor: rc.bg, border: `1px solid ${rc.border}` }}>
                      <RoleIcon size={11} /> {rc.label}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${u.is_active !== false ? "animate-blink" : ""}`}
                        style={{ backgroundColor: u.is_active !== false ? "#10b981" : "#6b7280", boxShadow: u.is_active !== false ? "0 0 6px rgba(16,185,129,0.5)" : "none" }} />
                      <span className="text-[12px] font-semibold" style={{ color: u.is_active !== false ? "#10b981" : "#6b7280" }}>
                        {u.is_active !== false ? t("users.status.active") : t("users.status.inactive")}
                      </span>
                    </span>
                  </td>
                  {/* Joined */}
                  <td className="px-5 py-4 text-[12px]" style={{ color: "var(--color-text-sub)" }}>{formatDate(u.created_at)}</td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditUser(u)} className="p-2 rounded-xl"
                        style={{ color: "#06b6d4", backgroundColor: isHov ? "rgba(6,182,212,0.1)" : "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "")}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="p-2 rounded-xl"
                        style={{ color: "#ef4444", backgroundColor: isHov ? "rgba(239,68,68,0.1)" : "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "")}>
                        <Trash2 size={13} />
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
