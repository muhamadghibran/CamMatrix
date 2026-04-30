import {
  Film, Download, Play, Pause, Search, Filter, Clock,
  HardDrive, X, ScanFace, ChevronDown, Calendar, RefreshCw
} from "lucide-react";
import VideoPlayerModal from "../../components/VideoPlayerModal";
import { useState, useMemo, useRef, useEffect } from "react";
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

const inp = {
  boxSizing: "border-box", padding: "9px 12px", borderRadius: 7,
  fontSize: 13, outline: "none", background: "#0A0A0F",
  border: "1px solid #1F1F2E", color: "#FFFFFF", transition: "border-color 0.2s"
};
const focus = e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; };
const blur  = e => { e.currentTarget.style.borderColor = "#1F1F2E"; };

/* ── Stat Card ── */
function StatCard({ label, value, sub, icon: Icon, index }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "20px 22px", borderRadius: 12, display: "flex", flexDirection: "column", gap: 14,
        background: hov ? "#111118" : "rgba(17,17,24,0.6)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "#1F1F2E"}`,
        backdropFilter: "blur(12px)",
        transition: "background 0.2s, border-color 0.2s, transform 0.2s",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 70}ms both`,
      }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
          <Icon size={14} style={{ color: hov ? "#FFFFFF" : "#71717A", transition: "color 0.2s" }} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#71717A" }}>{sub}</div>}
    </div>
  );
}

/* ── Filter Dropdown ── */
function FilterDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = value !== "Semua";

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 7,
        fontSize: 13, fontWeight: 500, cursor: "pointer",
        background: active ? "rgba(255,255,255,0.05)" : "transparent",
        border: `1px solid ${active ? "rgba(255,255,255,0.2)" : "#1F1F2E"}`,
        color: active ? "#FFFFFF" : "#71717A", transition: "all 0.15s"
      }}>
        <Filter size={13} style={{ flexShrink: 0 }} />
        <span>{active ? value : "Filter Kamera"}</span>
        <ChevronDown size={12} style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30,
          minWidth: 200, borderRadius: 10, overflow: "hidden",
          background: "#0D0D14", border: "1px solid #1F1F2E",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)"
        }}>
          <div style={{ padding: 6 }}>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13,
                cursor: "pointer", border: "none", borderRadius: 7,
                background: value === opt ? "#1F1F2E" : "transparent",
                color: value === opt ? "#FFFFFF" : "#71717A", fontWeight: value === opt ? 600 : 400,
                transition: "background 0.12s"
              }}
              onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = "#111118"; }}
              onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}
              >
                {opt}
                {value === opt && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF" }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Toast ── */
function Toast({ filename, onClose }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 50,
      display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
      borderRadius: 12, background: "#111118", border: "1px solid #1F1F2E",
      boxShadow: "0 16px 48px rgba(0,0,0,0.5)", animation: "slideUp 0.3s ease",
      maxWidth: 340, backdropFilter: "blur(12px)"
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Download size={14} style={{ color: "#71717A" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", margin: "0 0 2px" }}>Mengunduh rekaman</p>
        <p style={{ fontSize: 11, color: "#71717A", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{filename}</p>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717A", flexShrink: 0, display: "flex" }}>
        <X size={13} />
      </button>
    </div>
  );
}

/* ── Main Page ── */
export default function RecordingsPage() {
  const { t } = useLanguageStore();
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);
  const [activeTab, setActiveTab]   = useState("recordings");
  const [search, setSearch]         = useState("");
  const [filterCamera, setFilterCamera] = useState("Semua");
  const [toast, setToast]           = useState(null);
  const [sortField, setSortField]   = useState(null);
  const [sortDir, setSortDir]       = useState("asc");

  const filtered = useMemo(() => {
    let list = allRecordings.filter(r => {
      const ms = r.camera.toLowerCase().includes(search.toLowerCase()) || r.date.toLowerCase().includes(search.toLowerCase());
      const mc = filterCamera === "Semua" || r.camera === filterCamera;
      return ms && mc;
    });
    if (sortField) {
      list = [...list].sort((a, b) => {
        const av = a[sortField], bv = b[sortField];
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [search, filterCamera, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleDownload = (rec) => {
    const f = `${rec.camera.replace(/ /g, "_")}_${rec.dateRaw}_${rec.start.replace(":", "")}.mp4`;
    setToast(f);
    setTimeout(() => setToast(null), 3500);
  };

  const tabs = [
    { key: "recordings", icon: Film,     label: "Daftar Rekaman" },
    { key: "analytics",  icon: ScanFace, label: "Analitik Wajah" },
  ];

  const SortBtn = ({ field, label }) => {
    const active = sortField === field;
    return (
      <button onClick={() => handleSort(field)} style={{
        background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 700, color: active ? "#FFFFFF" : "#71717A",
        textTransform: "uppercase", letterSpacing: "0.07em", padding: 0
      }}>
        {label}
        <span style={{ opacity: active ? 1 : 0.3 }}>{active && sortDir === "desc" ? "↓" : "↑"}</span>
      </button>
    );
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {toast && <Toast filename={toast} onClose={() => setToast(null)} />}
  {selectedRec && <VideoPlayerModal rec={selectedRec} onClose={() => setSelectedRec(null)} onDownload={handleDownload} />}

      {/* ── Header ── */}
      <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", margin: "0 0 6px", letterSpacing: "-0.03em" }}>Rekaman</h1>
        <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>Kelola dan putar ulang rekaman kamera</p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 4, borderRadius: 10, width: "fit-content", background: "#111118", border: "1px solid #1F1F2E", marginBottom: 28 }}>
        {tabs.map(({ key, icon: Icon, label }) => {
          const a = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 7,
              fontSize: 13, fontWeight: a ? 600 : 500, cursor: "pointer", border: "none",
              background: a ? "#1F1F2E" : "transparent",
              color: a ? "#FFFFFF" : "#71717A", transition: "all 0.15s"
            }}>
              <Icon size={13} /> {label}
            </button>
          );
        })}
      </div>

      {activeTab === "analytics" ? <FaceAnalyticsPage /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ── Stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <StatCard label="Total Rekaman" value={allRecordings.length} sub="file tersimpan"    icon={Film}      index={0} />
            <StatCard label="Penyimpanan"   value="3.2 GB"               sub="kapasitas dipakai" icon={HardDrive} index={1} />
            <StatCard label="Total Durasi"  value="24 jam"               sub="waktu rekaman"     icon={Clock}     index={2} />
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Search */}
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#71717A", pointerEvents: "none" }} />
                <input placeholder="Cari rekaman atau kamera..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...inp, paddingLeft: 32, width: 260 }} onFocus={focus} onBlur={blur} />
              </div>
              {/* Filter dropdown */}
              <FilterDropdown value={filterCamera} onChange={setFilterCamera} options={cameraOptions} />
              {/* Clear filter */}
              {(search || filterCamera !== "Semua") && (
                <button onClick={() => { setSearch(""); setFilterCamera("Semua"); }} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 7,
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  background: "transparent", border: "1px solid #1F1F2E", color: "#71717A"
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#FFF"}
                onMouseLeave={e => e.currentTarget.style.color = "#71717A"}>
                  <X size={12} /> Reset
                </button>
              )}
            </div>
            <span style={{ fontSize: 12, color: "#3D3D4F" }}>{filtered.length} dari {allRecordings.length} rekaman</span>
          </div>

          {/* ── Table ── */}
          <div style={{
            borderRadius: 12, overflow: "hidden",
            background: "rgba(17,17,24,0.7)", border: "1px solid #1F1F2E",
            backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 100ms both"
          }}>
            {/* Table header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Film size={13} style={{ color: "#71717A" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Daftar Rekaman</span>
                <span style={{ fontSize: 11, color: "#71717A", padding: "2px 8px", borderRadius: 5, background: "#111118", border: "1px solid #1F1F2E" }}>{filtered.length}</span>
              </div>
              <span style={{ fontSize: 11, color: "#3D3D4F", fontFamily: "monospace" }}>Klik kolom untuk mengurutkan</span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1A1A26" }}>
                  <th style={{ textAlign: "left", padding: "11px 20px" }}><SortBtn field="camera" label="Kamera" /></th>
                  <th style={{ textAlign: "left", padding: "11px 20px" }}><SortBtn field="dateRaw" label="Tanggal" /></th>
                  <th style={{ textAlign: "left", padding: "11px 20px", fontSize: 10, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.07em" }}>Mulai</th>
                  <th style={{ textAlign: "left", padding: "11px 20px", fontSize: 10, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.07em" }}>Selesai</th>
                  <th style={{ textAlign: "left", padding: "11px 20px", fontSize: 10, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.07em" }}>Durasi</th>
                  <th style={{ textAlign: "left", padding: "11px 20px" }}><SortBtn field="size" label="Ukuran" /></th>
                  <th style={{ textAlign: "right", padding: "11px 20px", fontSize: 10, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.07em" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "56px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Film size={20} style={{ color: "#2D2D3F" }} />
                        </div>
                        <p style={{ fontSize: 13, color: "#71717A", margin: 0, fontWeight: 600 }}>Tidak ada rekaman ditemukan</p>
                        <p style={{ fontSize: 12, color: "#3D3D4F", margin: 0 }}>Coba ubah filter atau kata kunci pencarian</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((rec, i) => {
                  const isHov  = hoveredRow === rec.id;
                  return (
                    <tr key={rec.id}
                      onMouseEnter={() => setHoveredRow(rec.id)} onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #131320" : "none", background: isHov ? "rgba(255,255,255,0.025)" : "transparent", transition: "background 0.15s" }}>

                      {/* Camera */}
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 7, background: isPlay ? "#1F1F2E" : "#0A0A0F", border: `1px solid ${isPlay ? "#2D2D3F" : "#1F1F2E"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                            {isPlay ? <Pause size={12} style={{ color: "#FFFFFF" }} /> : <Film size={12} style={{ color: "#71717A" }} />}
                          </div>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", display: "block" }}>{rec.camera}</span>
                            {isPlay && <span style={{ fontSize: 10, color: "#71717A", fontWeight: 600, letterSpacing: "0.05em" }}>▶ MEMUTAR</span>}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#71717A" }}>
                          <Calendar size={11} style={{ flexShrink: 0 }} />{rec.date}
                        </div>
                      </td>

                      {/* Start */}
                      <td style={{ padding: "13px 20px", fontFamily: "monospace", fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>{rec.start}</td>

                      {/* End */}
                      <td style={{ padding: "13px 20px", fontFamily: "monospace", fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>{rec.end}</td>

                      {/* Duration */}
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ fontSize: 11, color: "#71717A", padding: "3px 9px", borderRadius: 5, background: "#0A0A0F", border: "1px solid #1A1A26" }}>{rec.duration}</span>
                      </td>

                      {/* Size */}
                      <td style={{ padding: "13px 20px", fontSize: 12, color: "#71717A", fontFamily: "monospace" }}>{rec.size}</td>

                      {/* Actions */}
                      <td style={{ padding: "13px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => setSelectedRec(rec)} title="Putar" style={{
                            width: 30, height: 30, borderRadius: 7, background: "transparent",
                            border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: isHov ? 1 : 0.4, transition: "opacity 0.15s, color 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
                            <Play size={12} />
                          </button>
                          <button onClick={() => handleDownload(rec)} title="Unduh" style={{
                            width: 30, height: 30, borderRadius: 7, background: "transparent",
                            border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: isHov ? 1 : 0.4, transition: "opacity 0.15s, color 0.15s, border-color 0.15s"
                          }}
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

            {/* Table footer */}
            {filtered.length > 0 && (
              <div style={{ padding: "10px 20px", borderTop: "1px solid #131320", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0A0A0F" }}>
                <span style={{ fontSize: 12, color: "#3D3D4F" }}>{filtered.length} rekaman ditampilkan</span>
                <span style={{ fontSize: 12, color: "#3D3D4F", fontFamily: "monospace" }}>
                  {filtered.reduce((acc) => acc, 0)} · Data lokal
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
