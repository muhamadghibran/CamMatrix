import { useState, useEffect } from "react";
import { Camera, Plus, WifiOff, Wifi, Edit2, Trash2, X, Search, Check } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useCameraStore } from "../../store/cameraStore";

const emptyForm = { name: "", location: "", ip: "", port: "554", user: "", password: "", is_public: false };

/* ── Shared input style ── */
const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 13, outline: "none",
  background: "#0A0A0F", border: "1px solid #1F1F2E", color: "#FFFFFF",
  transition: "border-color 0.2s"
};

/* ── Camera Modal ── */
function CameraModal({ onClose, onSave, editData }) {
  const { t } = useLanguageStore();
  const [form, setForm] = useState(editData
    ? { name: editData.name, location: editData.location, ip: editData.rtsp_url, port: "554", user: editData.username || "", password: "", is_public: editData.is_public || false }
    : emptyForm
  );
  const isEdit = !!editData;
  const fields = [
    { label: "Nama Kamera", key: "name", placeholder: "Kamera Depan" },
    { label: "Lokasi", key: "location", placeholder: "Ruang Utama" },
    { label: "IP / RTSP URL", key: "ip", placeholder: "192.168.1.100" },
    { label: "Port", key: "port", placeholder: "554" },
    { label: "Username", key: "user", placeholder: "admin" },
    { label: "Password", key: "password", placeholder: "••••••••", type: "password" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 12, background: "#111118", border: "1px solid #1F1F2E", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1F1F2E" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera size={14} style={{ color: "#71717A" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>{isEdit ? "Edit Kamera" : "Tambah Kamera"}</h3>
              <p style={{ fontSize: 12, color: "#71717A", margin: 0 }}>{isEdit ? `Mengedit: ${editData.name}` : "Tambahkan kamera RTSP baru"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "none", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e=>e.currentTarget.style.color="#FFF"} onMouseLeave={e=>e.currentTarget.style.color="#71717A"}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {fields.map(({ label, key, placeholder, type = "text" }) => (
            <div key={key} style={{ gridColumn: key === "name" || key === "ip" ? "1 / -1" : "auto" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#71717A", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
                style={inputStyle}
                onFocus={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"}
                onBlur={e=>e.currentTarget.style.borderColor="#1F1F2E"}
              />
            </div>
          ))}
          {/* Toggle public */}
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 8, background: "#0A0A0F", border: "1px solid #1F1F2E" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Kamera Publik</p>
              <p style={{ fontSize: 12, color: "#71717A", margin: 0 }}>Izinkan akses tanpa login</p>
            </div>
            <button onClick={() => setForm({ ...form, is_public: !form.is_public })} style={{
              width: 40, height: 22, borderRadius: 99, position: "relative", cursor: "pointer", border: "none",
              background: form.is_public ? "#FFFFFF" : "#2D2D3F", transition: "background 0.2s"
            }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: form.is_public ? "#0A0A0F" : "#71717A", position: "absolute", top: 3, left: form.is_public ? 20 : 2, transition: "left 0.2s, background 0.2s" }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Batal</button>
          <button onClick={() => { if (!form.name.trim() || !form.ip.trim()) return; onSave(form); }}
            style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Check size={14} />{isEdit ? "Simpan" : "Tambah Kamera"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm Delete ── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: 340, borderRadius: 12, background: "#111118", border: "1px solid #1F1F2E", padding: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Trash2 size={18} style={{ color: "#71717A" }} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", margin: "0 0 8px", textAlign: "center" }}>Konfirmasi Hapus</h3>
        <p style={{ fontSize: 13, color: "#71717A", margin: "0 0 20px", textAlign: "center" }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Batal</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function CamerasPage() {
  const { t } = useLanguageStore();
  const { cameras, fetchCameras, addCamera, updateCamera, deleteCamera } = useCameraStore();
  const [showModal, setShowModal] = useState(false);
  const [editCamera, setEditCamera] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(() => fetchCameras(), 15000);
    return () => clearInterval(interval);
  }, [fetchCameras]);

  const filtered = cameras.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );
  const counts = {
    live: cameras.filter(c => c.status === "live").length,
    offline: cameras.filter(c => c.status === "offline").length,
    recording: cameras.filter(c => c.status === "recording").length,
  };

  const handleAdd = async (form) => {
    await addCamera({ name: form.name, location: form.location, rtsp_url: form.ip, username: form.user, password: form.password, is_public: form.is_public });
    setShowModal(false);
  };
  const handleEdit = async (form) => {
    const payload = { name: form.name, location: form.location, rtsp_url: form.ip, username: form.user, is_public: form.is_public };
    if (form.password) payload.password = form.password;
    await updateCamera(editCamera.id, payload);
    setEditCamera(null);
  };
  const handleDelete = async () => { await deleteCamera(deleteTarget.id); setDeleteTarget(null); };

  return (
    <div style={{ width: "100%" }}>
      {showModal && <CameraModal onClose={() => setShowModal(false)} onSave={handleAdd} />}
      {editCamera && <CameraModal onClose={() => setEditCamera(null)} onSave={handleEdit} editData={editCamera} />}
      {deleteTarget && <ConfirmModal message={`Yakin ingin menghapus "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.025em" }}>Kamera</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[{ label: "aktif", count: counts.live }, { label: "rekaman", count: counts.recording }, { label: "offline", count: counts.offline }].map(({ label, count }) => (
              <span key={label} style={{ fontSize: 12, color: count > 0 ? "#FFFFFF" : "#71717A" }}>
                <span style={{ fontWeight: 700 }}>{count}</span> {label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#71717A", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kamera..."
              style={{ ...inputStyle, width: 200, paddingLeft: 32 }}
              onFocus={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"}
              onBlur={e=>e.currentTarget.style.borderColor="#1F1F2E"}
            />
          </div>
          <button onClick={() => setShowModal(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 8,
            background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>
            <Plus size={14} /> Tambah Kamera
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ borderRadius: 10, overflow: "hidden", background: "#111118", border: "1px solid #1F1F2E" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1F1F2E" }}>
              {["Kamera", "Lokasi", "IP / RTSP", "FPS", "Status", "Aksi"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#71717A", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "#71717A" }}>Tidak ada kamera ditemukan.</td></tr>
            ) : filtered.map((cam, i) => {
              const isLive = cam.status === "live";
              const isHov = hoveredRow === cam.id;
              return (
                <tr key={cam.id}
                  onMouseEnter={() => setHoveredRow(cam.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1A1A26" : "none", background: isHov ? "#0D0D14" : "transparent", transition: "background 0.15s" }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Camera size={13} style={{ color: "#71717A" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", display: "flex", alignItems: "center", gap: 6 }}>
                          {cam.name}
                          {cam.is_public && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.07)", color: "#71717A", fontWeight: 700, letterSpacing: "0.05em" }}>PUBLIK</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#71717A" }}>#{String(cam.id).padStart(3,"0")}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#71717A" }}>{cam.location || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <code style={{ fontSize: 11, padding: "3px 7px", borderRadius: 5, background: "#0A0A0F", border: "1px solid #1F1F2E", color: "#71717A", wordBreak: "break-all" }}>{cam.rtsp_url}</code>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#71717A" }}>{cam.fps && cam.fps > 0 ? `${cam.fps} fps` : "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLive ? "#FFFFFF" : "#2D2D3F", boxShadow: isLive ? "0 0 6px rgba(255,255,255,0.5)" : "none", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: isLive ? "#FFFFFF" : "#71717A", fontWeight: 500 }}>{cam.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setEditCamera(cam)} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e=>{e.currentTarget.style.color="#FFF"; e.currentTarget.style.borderColor="#2D2D3F"}}
                        onMouseLeave={e=>{e.currentTarget.style.color="#71717A"; e.currentTarget.style.borderColor="#1F1F2E"}}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(cam)} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
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
