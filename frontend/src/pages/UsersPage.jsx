import { useState } from "react";
import { Users, Plus, Edit2, Trash2, X, ShieldCheck, User, Search, Mail, Crown, Check } from "lucide-react";
import { useLanguageStore } from "../store/languageStore";
import AnimatedText from "../components/AnimatedText";

const initialUsers = [
  { id: 1, name: "Administrator",  email: "admin@vms.com",   role: "Admin",    status: "active",   joined: "Jan 1, 2026",  avatar: "A", color: "#06b6d4" },
  { id: 2, name: "Security Guard", email: "guard1@vms.com",  role: "Operator", status: "active",   joined: "Feb 10, 2026", avatar: "S", color: "#8b5cf6" },
  { id: 3, name: "Supervisor",     email: "super@vms.com",   role: "Operator", status: "active",   joined: "Mar 5, 2026",  avatar: "S", color: "#06b6d4" },
  { id: 4, name: "IT Personnel",   email: "it@vms.com",      role: "Viewer",   status: "inactive", joined: "Mar 20, 2026", avatar: "I", color: "#6b7280" },
  { id: 5, name: "Auditor",        email: "audit@vms.com",   role: "Viewer",   status: "active",   joined: "Apr 1, 2026",  avatar: "A", color: "#10b981" },
];

const roleStyle = {
  Admin:    { color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)",   icon: Crown },
  Operator: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)",  icon: ShieldCheck },
  Viewer:   { color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.2)",  icon: User },
};

const avatarColors = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

function UserModal({ onClose, onSave, editData }) {
  const { t } = useLanguageStore();
  const [form, setForm] = useState(editData
    ? { name: editData.name, email: editData.email, role: editData.role, password: "" }
    : { name: "", email: "", role: "Viewer", password: "" }
  );
  const isEdit = !!editData;

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
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
            { label: t("users.modal.name"),  key: "name",  placeholder: t("users.modal.namePH"),  type: "text" },
            { label: t("users.modal.email"), key: "email", placeholder: t("users.modal.emailPH"), type: "email" },
            ...(!isEdit ? [{ label: t("users.modal.password"), key: "password", placeholder: t("users.modal.passPH"), type: "password" }] : []),
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-sub)" }}>{label}</label>
              <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--color-input-bg)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)", transition: "border-color 0.2s ease, box-shadow 0.2s ease" }}
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
              <option value="Admin">Admin</option>
              <option value="Operator">Operator</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ border: "1px solid var(--color-card-border)", color: "var(--color-text-sub)", transition: "background-color 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>{t("users.modal.cancel")}</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#00ffff)", boxShadow: "0 4px 14px rgba(0,255,255,0.4)", transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
            <Check size={15} /> {isEdit ? "Simpan" : t("users.modal.add")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
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
            <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}>Hapus</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { t } = useLanguageStore();
  const [users, setUsers] = useState(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const statItems = [
    { labelKey: "total",  value: users.length,                               icon: Users,      color: "#06b6d4" },
    { labelKey: "admins", value: users.filter(u => u.role === "Admin").length, icon: Crown,     color: "#8b5cf6" },
    { labelKey: "active", value: users.filter(u => u.status === "active").length, icon: ShieldCheck, color: "#10b981" },
  ];

  const handleAdd = (form) => {
    const newUser = {
      id: Date.now(),
      name: form.name, email: form.email, role: form.role,
      status: "active",
      joined: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      avatar: form.name.charAt(0).toUpperCase(),
      color: avatarColors[users.length % avatarColors.length],
    };
    setUsers(prev => [...prev, newUser]);
    setShowModal(false);
  };

  const handleEdit = (form) => {
    setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, name: form.name, email: form.email, role: form.role } : u));
    setEditUser(null);
  };

  const handleDelete = () => {
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
  };

  return (
    <div className="space-y-6 relative z-10 w-full">
      {showModal && <UserModal onClose={() => setShowModal(false)} onSave={handleAdd} />}
      {editUser && <UserModal onClose={() => setEditUser(null)} onSave={handleEdit} editData={editUser} />}
      {deleteTarget && <ConfirmModal message={`Yakin ingin menghapus "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5">
        {/* eslint-disable-next-line no-unused-vars */}
        {statItems.map(({ labelKey, value, icon: Icon, color }, i) => (
          <div key={labelKey} className="gradient-border noise animate-card-enter opacity-0-init cursor-pointer group relative overflow-hidden"
            style={{ backgroundColor: "var(--color-surface)", padding: "20px", animationDelay: `${i * 100}ms`, transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 14px 36px rgba(0,0,0,0.12), 0 0 0 1px ${color}35`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none" style={{ background: `radial-gradient(ellipse at 0% 0%, ${color}14, transparent 55%)`, transition: "opacity 0.4s ease" }} />
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
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)", transition: "border-color 0.2s ease, box-shadow 0.2s ease" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.boxShadow = ""; }}
          />
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#00ffff)", boxShadow: "0 4px 14px rgba(0,255,255,0.4)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
          <Plus size={16} /> {t("users.addUser")}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-[18px] overflow-hidden animate-card-enter opacity-0-init delay-400" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
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
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "var(--color-text-sub)" }}>Tidak ada pengguna ditemukan.</td></tr>
            ) : filtered.map((u, i) => {
              const rc = roleStyle[u.role];
              const RoleIcon = rc.icon;
              const isHov = hovered === u.id;
              return (
                <tr key={u.id} className="animate-card-enter opacity-0-init"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-card-border)" : "none", animationDelay: `${500 + i * 70}ms`, backgroundColor: isHov ? "var(--color-surface-elevated)" : "", transition: "background-color 0.15s ease" }}
                  onMouseEnter={() => setHovered(u.id)} onMouseLeave={() => setHovered(null)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${u.color}cc, ${u.color})`, boxShadow: isHov ? `0 0 12px ${u.color}60` : "none", transition: "box-shadow 0.2s ease" }}>
                        {u.avatar}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-base)" }}>{u.name}</p>
                        {u.role === "Admin" && <span className="text-[10px] font-bold text-amber-400">★ ADMIN</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--color-text-sub)" }}>
                      <Mail size={11} style={{ color: "var(--color-text-sub)", opacity: 0.6 }} />{u.email}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg w-fit" style={{ color: rc.color, backgroundColor: rc.bg, border: `1px solid ${rc.border}` }}>
                      <RoleIcon size={11} /> {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleStatus(u.id)} className="flex items-center gap-2 cursor-pointer" title="Klik untuk ubah status">
                      <span className={`w-2 h-2 rounded-full ${u.status === "active" ? "animate-blink" : ""}`} style={{ backgroundColor: u.status === "active" ? "#10b981" : "#6b7280", boxShadow: u.status === "active" ? "0 0 6px rgba(16,185,129,0.5)" : "none" }} />
                      <span className="text-[12px] font-semibold capitalize" style={{ color: u.status === "active" ? "#10b981" : "#6b7280" }}>
                        {t(`users.status.${u.status}`)}
                      </span>
                    </button>
                  </td>
                  <td className="px-5 py-4 text-[12px]" style={{ color: "var(--color-text-sub)" }}>{u.joined}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditUser(u)} className="p-2 rounded-xl" style={{ color: "#06b6d4", backgroundColor: isHov ? "rgba(6,182,212,0.1)" : "transparent", transition: "background-color 0.15s, transform 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "")}><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteTarget(u)} className="p-2 rounded-xl" style={{ color: "#ef4444", backgroundColor: isHov ? "rgba(239,68,68,0.1)" : "transparent", transition: "background-color 0.15s, transform 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "")}><Trash2 size={13} /></button>
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
