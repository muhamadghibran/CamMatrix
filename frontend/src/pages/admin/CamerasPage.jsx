import { useState, useEffect } from "react";
import {
  Camera, Plus, WifiOff, Wifi, Edit2, Trash2, X,
  Search, Check, Signal, Globe, Lock, RefreshCw, AlertCircle
} from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useCameraStore } from "../../store/cameraStore";

const emptyForm = { name: "", location: "", ip: "", port: "554", user: "", password: "", is_public: false };

const inp = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  borderRadius: 7, fontSize: 13, outline: "none",
  background: "#0A0A0F", border: "1px solid #1F1F2E",
  color: "#FFFFFF", transition: "border-color 0.2s"
};

function focus(e) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }
function blur(e)  { e.currentTarget.style.borderColor = "#1F1F2E"; }

/* ── Add / Edit Modal ── */
function CameraModal({ onClose, onSave, editData }) {
  const isEdit = !!editData;
  const [form, setForm] = useState(
    editData
      ? { name: editData.name, location: editData.location || "", ip: editData.rtsp_url, port: "554", user: editData.username || "", password: "", is_public: editData.is_public || false }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.name.trim() && form.ip.trim();

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const leftFields  = [
    { label: "Nama Kamera", key: "name",     placeholder: "Kamera Pintu Depan", full: true },
    { label: "Lokasi",      key: "location", placeholder: "Lantai 1 — Lobby",  full: true },
    { label: "IP / RTSP URL", key: "ip",     placeholder: "rtsp://192.168.1.100/stream", full: true },
  ];
  const rightFields = [
    { label: "Port",     key: "port",     placeholder: "554",      type: "text" },
    { label: "Username", key: "user",     placeholder: "admin" },
    { label: "Password", key: "password", placeholder: "••••••••", type: "password" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(5,5,8,0.88)", backdropFilter: "blur(12px)" }}>
      <div style={{ width: "100%", maxWidth: 520, borderRadius: 14, background: "#0D0D14", border: "1px solid #1F1F2E", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={15} style={{ color: "#71717A" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>{isEdit ? "Edit Kamera" : "Tambah Kamera Baru"}</h3>
              <p style={{ fontSize: 11, color: "#71717A", margin: 0 }}>{isEdit ? `Mengedit: ${editData.name}` : "Hubungkan sumber RTSP baru"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e=>e.currentTarget.style.color="#FFF"} onMouseLeave={e=>e.currentTarget.style.color="#71717A"}>
            <X size={13} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {leftFields.map(({ label, key, placeholder, type = "text" }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#71717A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                style={inp} onFocus={focus} onBlur={blur} />
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {rightFields.map(({ label, key, placeholder, type = "text" }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#71717A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                  style={inp} onFocus={focus} onBlur={blur} />
              </div>
            ))}
          </div>

          {/* Public toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", borderRadius: 9, background: "#0A0A0F", border: "1px solid #1F1F2E" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {form.is_public ? <Globe size={14} style={{ color: "#71717A" }} /> : <Lock size={14} style={{ color: "#71717A" }} />}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Akses Publik</p>
                <p style={{ fontSize: 11, color: "#71717A", margin: 0 }}>
                  {form.is_public ? "Dapat diakses tanpa login" : "Hanya pengguna terdaftar"}
                </p>
              </div>
            </div>
            <button onClick={() => set("is_public", !form.is_public)} style={{
              width: 42, height: 24, borderRadius: 99, position: "relative", cursor: "pointer",
              border: "none", background: form.is_public ? "#FFFFFF" : "#1F1F2E", transition: "background 0.2s", flexShrink: 0
            }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: form.is_public ? "#0A0A0F" : "#3D3D4F", position: "absolute", top: 3, left: form.is_public ? 21 : 3, transition: "left 0.2s, background 0.2s" }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Batal
          </button>
          <button onClick={handleSave} disabled={!canSave || saving} style={{
            flex: 2, padding: "10px", borderRadius: 8, background: canSave ? "#FFFFFF" : "#1A1A26",
            color: canSave ? "#0A0A0F" : "#3D3D4F", border: "none", fontSize: 13, fontWeight: 700,
            cursor: canSave ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            transition: "background 0.2s"
          }}>
            {saving ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Kamera"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm Delete ── */
function DeleteModal({ cam, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(5,5,8,0.88)", backdropFilter: "blur(12px)" }}>
      <div style={{ width: "100%", maxWidth: 360, borderRadius: 14, background: "#0D0D14", border: "1px solid #1F1F2E", padding: "28px 24px", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <AlertCircle size={20} style={{ color: "#71717A" }} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px", textAlign: "center" }}>Hapus Kamera</h3>
        <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 6px", textAlign: "center" }}>
          Yakin ingin menghapus <strong style={{ color: "#FFFFFF" }}>"{cam.name}"</strong>?
        </p>
        <p style={{ fontSize: 12, color: "#3D3D4F", textAlign: "center", margin: "0 0 24px" }}>
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Batal
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Status Pill ── */
function StatusPill({ status }) {
  const isLive = status === "live";
  const isRec  = status === "recording";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
        background: isLive || isRec ? "#FFFFFF" : "#2D2D3F",
        boxShadow: isLive ? "0 0 8px rgba(255,255,255,0.5)" : "none"
      }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: isLive || isRec ? "#FFFFFF" : "#71717A" }}>
        {status}
      </span>
    </div>
  );
}

/* ── Main Page ── */
export default function CamerasPage() {
  const { cameras, fetchCameras, addCamera, updateCamera, deleteCamera } = useCameraStore();
  const [showAdd, setShowAdd]       = useState(false);
  const [editCam, setEditCam]       = useState(null);
  const [deleteCam, setDeleteCam]   = useState(null);
  const [search, setSearch]         = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    fetchCameras();
    const t = setInterval(() => fetchCameras(), 15000);
    return () => clearInterval(t);
  }, [fetchCameras]);

  const filtered = cameras.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.location || "").toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    live:    cameras.filter(c => c.status === "live").length,
    offline: cameras.filter(c => c.status === "offline").length,
    rec:     cameras.filter(c => c.status === "recording").length,
  };

  const handleAdd = async (form) => {
    await addCamera({ name: form.name, location: form.location, rtsp_url: form.ip, username: form.user, password: form.password, is_public: form.is_public });
    setShowAdd(false);
  };
  const handleEdit = async (form) => {
    const payload = { name: form.name, location: form.location, rtsp_url: form.ip, username: form.user, is_public: form.is_public };
    if (form.password) payload.password = form.password;
    await updateCamera(editCam.id, payload);
    setEditCam(null);
  };
  const handleDelete = async () => {
    await deleteCamera(deleteCam.id);
    setDeleteCam(null);
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {showAdd   && <CameraModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {editCam   && <CameraModal onClose={() => setEditCam(null)}  onSave={handleEdit} editData={editCam} />}
      {deleteCam && <DeleteModal cam={deleteCam} onConfirm={handleDelete} onCancel={() => setDeleteCam(null)} />}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, animation: "fadeUp 0.4s ease both" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", margin: "0 0 10px", letterSpacing: "-0.03em" }}>Manajemen Kamera</h1>
          {/* Quick stats */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[
              { label: "Aktif",    count: counts.live,    active: true },
              { label: "Rekaman", count: counts.rec,     active: false },
              { label: "Offline", count: counts.offline, active: false },
              { label: "Total",   count: cameras.length, active: false },
            ].map(({ label, count, active }, i, arr) => (
              <>
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, background: "#111118", border: "1px solid #1F1F2E" }}>
                  {active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 6px rgba(255,255,255,0.5)" }} />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: count > 0 && active ? "#FFFFFF" : "#71717A" }}>{count}</span>
                  <span style={{ fontSize: 12, color: "#71717A" }}>{label}</span>
                </div>
                {i < arr.length - 1 && <span key={`sep-${i}`} style={{ width: 1, height: 12, background: "#1F1F2E" }} />}
              </>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#71717A", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kamera..."
              style={{ ...inp, paddingLeft: 32, width: 220 }} onFocus={focus} onBlur={blur} />
          </div>
          {/* Refresh */}
          <button onClick={fetchCameras} style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s, border-color 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.color="#FFF"; e.currentTarget.style.borderColor="#2D2D3F"}}
            onMouseLeave={e=>{e.currentTarget.style.color="#71717A"; e.currentTarget.style.borderColor="#1F1F2E"}}>
            <RefreshCw size={14} />
          </button>
          {/* Add button */}
          <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#E5E5E5"} onMouseLeave={e=>e.currentTarget.style.background="#FFFFFF"}>
            <Plus size={14} />Tambah Kamera
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ borderRadius: 12, overflow: "hidden", background: "rgba(17,17,24,0.7)", border: "1px solid #1F1F2E", backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 80ms both" }}>
        {/* Table header */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
              {["Kamera", "Lokasi", "IP / RTSP URL", "FPS", "Status", "Aksi"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 5 ? "right" : "left", padding: "11px 18px", fontSize: 10, fontWeight: 700, color: "#71717A", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "60px 18px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={20} style={{ color: "#2D2D3F" }} />
                    </div>
                    <p style={{ fontSize: 13, color: "#71717A", margin: 0, fontWeight: 600 }}>
                      {cameras.length === 0 ? "Belum ada kamera" : "Tidak ditemukan"}
                    </p>
                    <p style={{ fontSize: 12, color: "#3D3D4F", margin: 0 }}>
                      {cameras.length === 0 ? "Klik "+ Tambah Kamera" untuk memulai." : "Coba kata kunci lain."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((cam, i) => {
              const isHov = hoveredRow === cam.id;
              return (
                <tr key={cam.id}
                  onMouseEnter={() => setHoveredRow(cam.id)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #131320" : "none", background: isHov ? "rgba(255,255,255,0.025)" : "transparent", transition: "background 0.15s" }}>

                  {/* Name */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Camera size={14} style={{ color: "#71717A" }} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{cam.name}</span>
                          {cam.is_public && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", border: "1px solid #1F1F2E", color: "#71717A", letterSpacing: "0.05em" }}>PUBLIK</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#3D3D4F", fontFamily: "monospace" }}>#{String(cam.id).padStart(3, "0")}</span>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#71717A" }}>
                    {cam.location || <span style={{ color: "#2D2D3F" }}>—</span>}
                  </td>

                  {/* RTSP */}
                  <td style={{ padding: "14px 18px", maxWidth: 220 }}>
                    <code style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: "#0A0A0F", border: "1px solid #1A1A26", color: "#71717A", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cam.rtsp_url}
                    </code>
                  </td>

                  {/* FPS */}
                  <td style={{ padding: "14px 18px", fontSize: 12, color: "#3D3D4F", fontFamily: "monospace" }}>
                    {cam.fps && cam.fps > 0 ? `${cam.fps}fps` : "—"}
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px 18px" }}>
                    <StatusPill status={cam.status} />
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => setEditCam(cam)} title="Edit" style={{
                        width: 30, height: 30, borderRadius: 7, background: "transparent",
                        border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: isHov ? 1 : 0.5, transition: "opacity 0.15s, color 0.15s, border-color 0.15s"
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.color="#FFF"; e.currentTarget.style.borderColor="#2D2D3F"}}
                      onMouseLeave={e=>{e.currentTarget.style.color="#71717A"; e.currentTarget.style.borderColor="#1F1F2E"}}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setDeleteCam(cam)} title="Hapus" style={{
                        width: 30, height: 30, borderRadius: 7, background: "transparent",
                        border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: isHov ? 1 : 0.5, transition: "opacity 0.15s, color 0.15s, border-color 0.15s"
                      }}
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

        {/* Footer */}
        {filtered.length > 0 && (
          <div style={{ padding: "10px 18px", borderTop: "1px solid #131320", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0A0A0F" }}>
            <span style={{ fontSize: 12, color: "#3D3D4F" }}>{filtered.length} dari {cameras.length} kamera ditampilkan</span>
            <span style={{ fontSize: 12, color: "#3D3D4F", fontFamily: "monospace" }}>Auto-refresh · 15s</span>
          </div>
        )}
      </div>
    </div>
  );
}
