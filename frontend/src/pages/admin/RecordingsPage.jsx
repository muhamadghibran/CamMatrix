import { Film, Download, Play, Pause, Search, Filter, Clock, HardDrive, X, ScanFace } from "lucide-react";
import { useState, useMemo } from "react";
import { useLanguageStore } from "../../store/languageStore";
import FaceAnalyticsPage from "./FaceAnalyticsPage";

const allRecordings = [
  { id: 1, camera: "Main Entrance", date: "Apr 10, 2026", start: "08:00", end: "08:30", size: "245 MB", duration: "30 min", dateRaw: "2026-04-10" },
  { id: 2, camera: "Lobby",         date: "Apr 10, 2026", start: "08:30", end: "09:00", size: "210 MB", duration: "30 min", dateRaw: "2026-04-10" },
  { id: 3, camera: "Server Room",   date: "Apr 10, 2026", start: "09:00", end: "09:30", size: "198 MB", duration: "30 min", dateRaw: "2026-04-10" },
  { id: 4, camera: "Side Gate",     date: "Apr 10, 2026", start: "09:30", end: "10:00", size: "220 MB", duration: "30 min", dateRaw: "2026-04-10" },
  { id: 5, camera: "Rooftop",       date: "Apr 10, 2026", start: "10:00", end: "10:30", size: "235 MB", duration: "30 min", dateRaw: "2026-04-10" },
  { id: 6, camera: "Main Entrance", date: "Apr 9, 2026",  start: "14:00", end: "14:30", size: "240 MB", duration: "30 min", dateRaw: "2026-04-09" },
  { id: 7, camera: "Parking Lot",   date: "Apr 9, 2026",  start: "15:00", end: "15:30", size: "195 MB", duration: "30 min", dateRaw: "2026-04-09" },
];

const cameraOptions = ["Semua", "Main Entrance", "Lobby", "Server Room", "Side Gate", "Rooftop", "Parking Lot"];

const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13, outline: "none", background: "#0A0A0F", border: "1px solid #1F1F2E", color: "#FFFFFF", transition: "border-color 0.2s" };

export default function RecordingsPage() {
  const { t } = useLanguageStore();
  const [hovered, setHovered]     = useState(null);
  const [playing, setPlaying]     = useState(null);
  const [activeTab, setActiveTab] = useState("recordings");
  const [search, setSearch]       = useState("");
  const [filterCamera, setFilterCamera] = useState("Semua");
  const [showFilter, setShowFilter]     = useState(false);
  const [toast, setToast]         = useState(null);

  const filtered = useMemo(() => allRecordings.filter(r => {
    const matchSearch = r.camera.toLowerCase().includes(search.toLowerCase()) || r.date.toLowerCase().includes(search.toLowerCase());
    const matchCamera = filterCamera === "Semua" || r.camera === filterCamera;
    return matchSearch && matchCamera;
  }), [search, filterCamera]);

  const handleDownload = (rec) => {
    const f = `${rec.camera.replace(/ /g, "_")}_${rec.dateRaw}_${rec.start.replace(":", "")}.mp4`;
    setToast(f);
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { key: "recordings", icon: Film,     label: "Daftar Rekaman" },
    { key: "analytics",  icon: ScanFace, label: "Analitik Wajah" },
  ];

  return (
    <div style={{ width: "100%" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: "#111118", border: "1px solid #1F1F2E" }}>
          <Download size={14} style={{ color: "#71717A" }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Mengunduh rekaman...</p>
            <p style={{ fontSize: 11, color: "#71717A", margin: 0 }}>{toast}</p>
          </div>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717A", marginLeft: 4 }}><X size={13} /></button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.025em" }}>Rekaman</h1>
        <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>Kelola dan putar ulang rekaman kamera</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 4, borderRadius: 9, width: "fit-content", background: "#111118", border: "1px solid #1F1F2E", marginBottom: 24 }}>
        {tabs.map(({ key, icon: Icon, label }) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 6,
              fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer", border: "none",
              background: active ? "#1F1F2E" : "transparent",
              color: active ? "#FFFFFF" : "#71717A", transition: "all 0.15s"
            }}>
              <Icon size={13} /> {label}
            </button>
          );
        })}
      </div>

      {activeTab === "analytics" ? <FaceAnalyticsPage /> : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Rekaman", value: "48", icon: Film },
              { label: "Penyimpanan", value: "3.2 GB", icon: HardDrive },
              { label: "Durasi", value: "24 jam", icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ padding: "18px 20px", borderRadius: 10, background: "#111118", border: "1px solid #1F1F2E" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#71717A", fontWeight: 500 }}>{label}</span>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={13} style={{ color: "#71717A" }} />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 300 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#71717A", pointerEvents: "none" }} />
              <input placeholder="Cari rekaman..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 32 }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"}
                onBlur={e => e.currentTarget.style.borderColor = "#1F1F2E"}
              />
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowFilter(v => !v)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: "transparent", border: `1px solid ${filterCamera !== "Semua" ? "rgba(255,255,255,0.25)" : "#1F1F2E"}`,
                color: filterCamera !== "Semua" ? "#FFFFFF" : "#71717A"
              }}>
                <Filter size={13} /> {filterCamera !== "Semua" ? filterCamera : "Filter"}
              </button>
              {showFilter && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, minWidth: 180, borderRadius: 9, overflow: "hidden", background: "#111118", border: "1px solid #1F1F2E" }}>
                  {cameraOptions.map(opt => (
                    <button key={opt} onClick={() => { setFilterCamera(opt); setShowFilter(false); }} style={{
                      display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13,
                      cursor: "pointer", border: "none", background: filterCamera === opt ? "#1F1F2E" : "transparent",
                      color: filterCamera === opt ? "#FFFFFF" : "#71717A", fontWeight: filterCamera === opt ? 600 : 400
                    }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ borderRadius: 10, overflow: "hidden", background: "#111118", border: "1px solid #1F1F2E" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1F1F2E" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Daftar Rekaman</span>
              <span style={{ fontSize: 12, color: "#71717A" }}>{filtered.length} rekaman</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1A1A26" }}>
                  {["Kamera", "Tanggal", "Mulai", "Selesai", "Durasi", "Ukuran", "Aksi"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: 11, fontWeight: 600, color: "#71717A", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#71717A" }}>Tidak ada rekaman ditemukan.</td></tr>
                ) : filtered.map((rec, i) => {
                  const isHov  = hovered === rec.id;
                  const isPlay = playing === rec.id;
                  return (
                    <tr key={rec.id}
                      onMouseEnter={() => setHovered(rec.id)} onMouseLeave={() => setHovered(null)}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1A1A26" : "none", background: isHov ? "#0D0D14" : "transparent", transition: "background 0.15s" }}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Film size={13} style={{ color: "#71717A" }} />
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", display: "block" }}>{rec.camera}</span>
                            {isPlay && <span style={{ fontSize: 10, color: "#71717A", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>▶ Memutar</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "#71717A" }}>{rec.date}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "#FFFFFF" }}>{rec.start}</td>
                      <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "#FFFFFF" }}>{rec.end}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontSize: 11, color: "#71717A", padding: "3px 8px", borderRadius: 5, background: "#0A0A0F", border: "1px solid #1F1F2E" }}>{rec.duration}</span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "#71717A" }}>{rec.size}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setPlaying(playing === rec.id ? null : rec.id)} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
                            {isPlay ? <Pause size={12} /> : <Play size={12} />}
                          </button>
                          <button onClick={() => handleDownload(rec)} style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
                            <Download size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
