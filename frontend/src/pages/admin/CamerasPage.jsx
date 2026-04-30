import { useState, useEffect } from "react";
import {
  Camera,
  Plus,
  Wifi,
  WifiOff,
  Edit2,
  Trash2,
  X,
  Search,
  Signal,
  Check,
} from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useCameraStore } from "../../store/cameraStore";
import AnimatedText from "../../components/AnimatedText";
const statusCfg = {
  live: {
    color: "#10b981",
    label: "live",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
  },
  offline: {
    color: "#6b7280",
    label: "offline",
    bg: "rgba(107,114,128,0.1)",
    border: "rgba(107,114,128,0.2)",
  },
  recording: {
    color: "#ef4444",
    label: "recording",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
  },
};
const emptyForm = {
  name: "",
  location: "",
  ip: "",
  port: "554",
  user: "",
  password: "",
  is_public: false,
};
function CameraModal({ onClose, onSave, editData }) {
  const { t } = useLanguageStore();
  const [form, setForm] = useState(
    editData
      ? {
          name: editData.name,
          location: editData.location,
          ip: editData.rtsp_url,
          port: "554",
          user: editData.username || "",
          password: "",
          is_public: editData.is_public || false,
        }
      : emptyForm,
  );
  const isEdit = !!editData;
  const fields = [
    {
      label: t("cameras.modal.name"),
      key: "name",
      placeholder: t("cameras.modal.namePH"),
    },
    {
      label: t("cameras.modal.location"),
      key: "location",
      placeholder: t("cameras.modal.locationPH"),
    },
    { label: t("cameras.modal.ip"), key: "ip", placeholder: "192.168.1.100" },
    { label: t("cameras.modal.port"), key: "port", placeholder: "554" },
    { label: t("cameras.modal.user"), key: "user", placeholder: "admin" },
    {
      label: t("cameras.modal.password"),
      key: "password",
      placeholder: "••••••••",
      type: "password",
    },
  ];
  const handleSave = () => {
    if (!form.name.trim() || !form.ip.trim()) return;
    onSave(form);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden "
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-card-border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--color-card-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#06b6d4,#00ffff)",
                boxShadow: "0 0 16px rgba(6,182,212,0.4)",
              }}
            >
              <Camera size={14} className="text-white" />
            </div>
            <div>
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--color-text-base)" }}
              >
                {isEdit ? "Edit Kamera" : t("cameras.modal.title")}
              </h3>
              <p
                className="text-[11px]"
                style={{ color: "var(--color-text-sub)" }}
              >
                {isEdit
                  ? `Mengedit: ${editData.name}`
                  : "Tambahkan kamera RTSP baru"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              color: "var(--color-text-sub)",
              backgroundColor: "var(--color-surface-elevated)",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--color-surface-elevated)")
            }
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ label, key, placeholder, type = "text" }) => (
              <div
                key={key}
                className={key === "name" || key === "ip" ? "col-span-2" : ""}
              >
                <label
                  className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--color-text-sub)" }}
                >
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: "var(--color-input-bg)",
                    border: "1px solid var(--color-card-border)",
                    color: "var(--color-text-base)",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#06b6d4";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(6,182,212,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-card-border)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                />
              </div>
            ))}
            <div
              className="col-span-2 flex items-center justify-between p-3 mt-2 rounded-xl"
              style={{
                backgroundColor: "var(--color-surface-elevated)",
                border: "1px solid var(--color-card-border)",
              }}
            >
              <div>
                <label
                  className="block text-sm font-semibold"
                  style={{ color: "var(--color-text-base)" }}
                >
                  Kamera Publik
                </label>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--color-text-sub)" }}
                >
                  Izinkan semua orang menonton (tanpa login)
                </span>
              </div>
              <button
                onClick={() => setForm({ ...form, is_public: !form.is_public })}
                className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${form.is_public ? "bg-cyan-500" : "bg-gray-600"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${form.is_public ? "left-6" : "left-1"}`}
                />
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              border: "1px solid var(--color-card-border)",
              color: "var(--color-text-sub)",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--color-surface-elevated)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            {t("cameras.modal.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg,#06b6d4,#00ffff)",
              boxShadow: "0 4px 14px rgba(6,182,212,0.45)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(6,182,212,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(6,182,212,0.45)";
            }}
          >
            <Check size={15} />{" "}
            {isEdit ? "Simpan Perubahan" : t("cameras.modal.add")}
          </button>
        </div>
      </div>
    </div>
  );
}
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="w-full max-w-xs rounded-2xl overflow-hidden "
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid rgba(239,68,68,0.3)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div className="p-6 text-center space-y-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <Trash2 size={22} style={{ color: "#ef4444" }} />
          </div>
          <div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--color-text-base)" }}
            >
              Konfirmasi Hapus
            </p>
            <p
              className="text-[12px] mt-1"
              style={{ color: "var(--color-text-sub)" }}
            >
              {message}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={{
                border: "1px solid var(--color-card-border)",
                color: "var(--color-text-sub)",
              }}
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                boxShadow: "0 4px 14px rgba(239,68,68,0.4)",
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function CamerasPage() {
  const { t } = useLanguageStore();
  const { cameras, fetchCameras, addCamera, updateCamera, deleteCamera } =
    useCameraStore();
  const [showModal, setShowModal] = useState(false);
  const [editCamera, setEditCamera] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    fetchCameras();
    const interval = setInterval(() => {
      fetchCameras();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchCameras]);
  const filtered = cameras.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()),
  );
  const counts = {
    live: cameras.filter((c) => c.status === "live").length,
    offline: cameras.filter((c) => c.status === "offline").length,
    recording: cameras.filter((c) => c.status === "recording").length,
  };
  const handleAdd = async (form) => {
    await addCamera({
      name: form.name,
      location: form.location,
      rtsp_url: form.ip,
      username: form.user,
      password: form.password,
      is_public: form.is_public,
    });
    setShowModal(false);
  };
  const handleEdit = async (form) => {
    const payload = {
      name: form.name,
      location: form.location,
      rtsp_url: form.ip,
      username: form.user,
      is_public: form.is_public,
    };
    if (form.password) payload.password = form.password;
    await updateCamera(editCamera.id, payload);
    setEditCamera(null);
  };
  const handleDelete = async () => {
    await deleteCamera(deleteTarget.id);
    setDeleteTarget(null);
  };
  return (
    <div className="relative z-10 w-full">
      {/* Modals - rendered outside content flow */}
      {showModal && (
        <CameraModal onClose={() => setShowModal(false)} onSave={handleAdd} />
      )}
      {editCamera && (
        <CameraModal
          onClose={() => setEditCamera(null)}
          onSave={handleEdit}
          editData={editCamera}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          message={`Yakin ingin menghapus kamera "${deleteTarget.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Page Content */}
      <div className="flex flex-col gap-5">
        {/* Toolbar Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Stats */}
          <div className="flex items-center gap-6">
            {[
              { label: "online", count: counts.live, dot: "#34d399" },
              { label: "rekaman", count: counts.recording, dot: "#f87171" },
              { label: "offline", count: counts.offline, dot: "#4b5563" },
            ].map(({ label, count, dot }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-[12px]"
                style={{ color: "var(--color-text-sub)" }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dot }}
                />
                <span
                  style={{
                    color:
                      count > 0
                        ? "var(--color-text-base)"
                        : "var(--color-text-sub)",
                  }}
                >
                  {count} {label}
                </span>
              </div>
            ))}
          </div>

          {/* Right: Search + Add button */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-text-sub)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("cameras.searchPlaceholder")}
                className="pl-9 pr-4 py-2 rounded-lg text-[13px] outline-none w-52"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-card-border)",
                  color: "var(--color-text-base)",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--color-card-border)";
                }}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 shrink-0"
              style={{
                backgroundColor: "var(--color-surface-elevated)",
                border: "1px solid var(--color-card-border)",
                color: "var(--color-text-base)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-card-border)";
              }}
            >
              <Plus size={14} />
              {t("cameras.addCamera")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div
        className="rounded-[18px] overflow-hidden   "
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-card-border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-card-border)",
                backgroundColor: "var(--color-surface-elevated)",
              }}
            >
              {["camera", "location", "ip", "fps", "status", "actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--color-text-sub)" }}
                  >
                    {t(`cameras.table.${h}`)}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm"
                  style={{ color: "var(--color-text-sub)" }}
                >
                  Tidak ada kamera ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((cam, i) => {
                const s = statusCfg[cam.status];
                const isHov = hovered === cam.id;
                return (
                  <tr
                    key={cam.id}
                    className=" "
                    style={{
                      borderBottom:
                        i < filtered.length - 1
                          ? "1px solid var(--color-card-border)"
                          : "none",
                      animationDelay: `${300 + i * 60}ms`,
                      backgroundColor: isHov
                        ? "var(--color-surface-elevated)"
                        : "",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={() => setHovered(cam.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--color-surface-elevated)",
                          }}
                        >
                          <Camera size={14} style={{ color: "var(--color-text-sub)" }} />
                        </div>
                        <div>
                          <span
                            className="text-[13px] font-semibold flex items-center gap-2"
                            style={{ color: "var(--color-text-base)" }}
                          >
                            {cam.name}
                            {cam.is_public && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-500 font-bold tracking-wider">
                                PUBLIC
                              </span>
                            )}
                          </span>
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--color-text-sub)" }}
                          >
                            ID #{cam.id.toString().padStart(3, "0")}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-5 py-4 text-[13px]"
                      style={{ color: "var(--color-text-sub)" }}
                    >
                      {cam.location}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="font-mono text-[12px] px-2 py-1 rounded-lg"
                        style={{
                          color: "var(--color-text-base)",
                          backgroundColor: "var(--color-surface-elevated)",
                          wordBreak: "break-all",
                        }}
                      >
                        {cam.rtsp_url}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-[13px]"
                      style={{ color: "var(--color-text-sub)" }}
                    >
                      {cam.fps && cam.fps > 0 ? (
                        <span className="flex items-center gap-1.5">
                          <Signal size={12} style={{ color: "#10b981" }} />
                          {cam.fps} FPS
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span
                          className="text-[12px] font-medium"
                          style={{ color: "var(--color-text-base)" }}
                        >
                          {t(`cameras.status.${cam.status}`)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditCamera(cam)}
                          className="p-2 rounded-xl"
                          style={{
                            color: "#06b6d4",
                            backgroundColor: isHov
                              ? "rgba(6,182,212,0.1)"
                              : "transparent",
                            transition:
                              "background-color 0.15s, transform 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "";
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cam)}
                          className="p-2 rounded-xl"
                          style={{
                            color: "#ef4444",
                            backgroundColor: isHov
                              ? "rgba(239,68,68,0.1)"
                              : "transparent",
                            transition:
                              "background-color 0.15s, transform 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "";
                          }}
                        >
                          <Trash2 size={14} />
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
    </div>
  );
}
