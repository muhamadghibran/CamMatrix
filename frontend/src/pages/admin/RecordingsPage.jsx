import {
  Film, Download, Search, Filter, Clock,
  HardDrive, X, ChevronDown, Calendar, RefreshCw, Trash2, Play
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import FaceAnalyticsPage from "./FaceAnalyticsPage";
import api from "../../utils/api";

// ── Helpers ──
const fmtSize  = (b) => b > 1e9 ? `${(b/1e9).toFixed(1)} GB` : `${(b/1e6).toFixed(1)} MB`;
const fmtDur   = (s) => {
  if (!s) return "—";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}j ${m}m`;
  return m > 0 ? `${m}m ${sec}d` : `${sec}d`;
};

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
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
  const active = value !== "Semua";
  return (
    <div style={{ position: "relative" }}>
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
              onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}>
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

/* ── Video Modal ── */
function VideoModal({ rec, onClose }) {
  const videoRef = useRef(null);
  const [aiPanel, setAiPanel] = useState(false);

  const getToken = () => {
    try { return require("../../store/authStore").useAuthStore.getState().token || ""; }
    catch (_e) { return ""; }
  };
  const getBase = () => {
    try { return require("../../constants/api").API_BASE_URL || ""; }
    catch (_e) { return ""; }
  };

  const videoUrl = `${getBase()}/recordings/${rec.id}/download?token=${encodeURIComponent(getToken())}`;

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const dt      = rec.created_at ? new Date(rec.created_at) : null;
  const dateStr = dt ? dt.toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" }) : "—";
  const timeStr = dt ? dt.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" }) : "—";
  const sizeStr = rec.size_bytes ? `${(rec.size_bytes/1e6).toFixed(1)} MB` : "—";

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.92)", backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:24,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth: aiPanel ? 1160 : 860,
        background:"#0D0D14", borderRadius:20,
        border:"1px solid rgba(255,255,255,0.08)",
        boxShadow:"0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow:"hidden", display:"flex", flexDirection:"column",
        transition:"max-width 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}>

        {/* ── Header ── */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 22px",
          background:"linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
          borderBottom:"1px solid rgba(255,255,255,0.07)",
        }}>
          {/* Info kamera */}
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{
              width:40, height:40, borderRadius:10, flexShrink:0,
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
            }}>📹</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#FFF", letterSpacing:"-0.02em" }}>
                {rec.camera_name || `Kamera #${rec.camera_id}`}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                {[dateStr, timeStr, sizeStr].map((v,i) => (
                  <span key={i} style={{ fontSize:11, color:"#71717A", fontFamily:"monospace" }}>
                    {i>0 && <span style={{ marginRight:8, color:"#2D2D3F" }}>·</span>}{v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Aksi */}
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Tombol AI */}
            <button onClick={() => setAiPanel(v=>!v)} style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"8px 16px", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer",
              background: aiPanel
                ? "linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.08))"
                : "rgba(255,255,255,0.05)",
              border:`1px solid ${aiPanel ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
              color: aiPanel ? "#FFF" : "#A0A0A0",
              transition:"all 0.2s", boxShadow: aiPanel ? "0 0 16px rgba(255,255,255,0.06)" : "none",
            }}>
              <span style={{ fontSize:15 }}>🔍</span>
              Analisis Wajah
              <span style={{
                fontSize:9, fontWeight:700, letterSpacing:"0.07em",
                padding:"2px 6px", borderRadius:4,
                background: aiPanel ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                color: aiPanel ? "#FFF" : "#71717A",
              }}>AI</span>
            </button>

            {/* Unduh */}
            <a href={videoUrl}
              download={`${(rec.camera_name||"cam").replace(/ /g,"_")}_rekaman.mp4`}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"8px 16px", borderRadius:9, fontSize:12, fontWeight:600,
                background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
                color:"#FFF", textDecoration:"none", transition:"all 0.2s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.14)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";}}
            >
              <Download size={13} /> Unduh
            </a>

            {/* Tutup */}
            <button onClick={onClose} style={{
              width:34, height:34, borderRadius:9, cursor:"pointer",
              background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
              color:"#71717A", display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.color="#FFF"; e.currentTarget.style.background="rgba(255,255,255,0.12)";}}
            onMouseLeave={e=>{e.currentTarget.style.color="#71717A"; e.currentTarget.style.background="rgba(255,255,255,0.05)";}}
            >
              <X size={15}/>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ display:"flex", flex:1 }}>

          {/* Video */}
          <div style={{ flex:1, background:"#000", position:"relative", minWidth:0 }}>
            <video ref={videoRef} controls autoPlay
              style={{ width:"100%", maxHeight:"62vh", display:"block" }}
              src={videoUrl}
            />
          </div>

          {/* Panel AI */}
          {aiPanel && (
            <div style={{
              width:270, flexShrink:0,
              borderLeft:"1px solid rgba(255,255,255,0.07)",
              background:"#080810", display:"flex", flexDirection:"column",
            }}>
              {/* Panel header */}
              <div style={{
                padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)",
                background:"linear-gradient(180deg,rgba(255,255,255,0.03) 0%,transparent 100%)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>🔍</span>
                  <span style={{ fontSize:13, fontWeight:700, color:"#FFF" }}>Analisis Wajah</span>
                  <span style={{
                    fontSize:9, fontWeight:700, letterSpacing:"0.07em",
                    padding:"2px 6px", borderRadius:4,
                    background:"rgba(255,255,255,0.1)", color:"#71717A",
                  }}>BETA</span>
                </div>
                <p style={{ fontSize:11, color:"#3D3D4F", margin:0, lineHeight:1.5 }}>
                  Deteksi dan analisis wajah dari frame rekaman secara real-time
                </p>
              </div>

              {/* Placeholder konten */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, gap:16 }}>
                <div style={{
                  width:64, height:64, borderRadius:16,
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:28,
                }}>👤</div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ fontSize:13, fontWeight:600, color:"#FFFFFF", margin:"0 0 6px" }}>
                    Siap Diaktifkan
                  </p>
                  <p style={{ fontSize:11, color:"#71717A", margin:0, lineHeight:1.6 }}>
                    Fitur deteksi wajah akan menganalisis setiap frame video dan menampilkan hasil di sini
                  </p>
                </div>
                <button style={{
                  width:"100%", padding:"10px 0", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer",
                  background:"linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.06))",
                  border:"1px solid rgba(255,255,255,0.15)", color:"#FFF",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                  <span>▶</span> Mulai Deteksi
                </button>
              </div>

              {/* Panel footer */}
              <div style={{ padding:"12px 18px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize:10, color:"#2D2D3F", margin:0, lineHeight:1.5 }}>
                  Memerlukan koneksi ke backend AI endpoint
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding:"10px 22px", borderTop:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", gap:20, background:"rgba(0,0,0,0.3)",
        }}>
          <span style={{ fontSize:11, color:"#2D2D3F" }}>⌨ Esc untuk menutup</span>
          <span style={{ fontSize:11, color:"#2D2D3F" }}>🖱 Klik luar untuk menutup</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [activeTab, setActiveTab]   = useState("recordings");
  const [search, setSearch]         = useState("");
  const [filterCamera, setFilterCamera] = useState("Semua");
  const [sortField, setSortField]   = useState("created_at");
  const [sortDir, setSortDir]       = useState("desc");
  const [deletingId, setDeletingId] = useState(null);
  const [watchRec, setWatchRec]     = useState(null);

  // Fetch rekaman dari API
  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/recordings/");
      setRecordings(res.data);
    } catch (e) {
      console.error("Gagal fetch rekaman:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecordings(); }, []);

  // Daftar nama kamera unik untuk filter
  const cameraOptions = useMemo(() => {
    const names = [...new Set(recordings.map(r => r.camera_name).filter(Boolean))];
    return ["Semua", ...names];
  }, [recordings]);

  // Stats
  const totalSize  = recordings.reduce((s, r) => s + (r.size_bytes || 0), 0);
  const totalDurS  = recordings.reduce((s, r) => s + (r.duration  || 0), 0);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = recordings.filter(r => {
      const camName = r.camera_name || "";
      const dateStr = r.created_at || "";
      const ms = camName.toLowerCase().includes(search.toLowerCase()) ||
                 dateStr.toLowerCase().includes(search.toLowerCase());
      const mc = filterCamera === "Semua" || camName === filterCamera;
      return ms && mc;
    });
    if (sortField) {
      list = [...list].sort((a, b) => {
        let av = a[sortField], bv = b[sortField];
        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [recordings, search, filterCamera, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  // Download rekaman dari halaman ini
  const handleDownload = (rec) => {
    const { useAuthStore } = require("../../store/authStore");
    const token = useAuthStore.getState().token;
    if (!token) { alert("Session habis, silakan login ulang."); return; }
    const { API_BASE_URL } = require("../../constants/api");
    const url = `${API_BASE_URL}/recordings/${rec.id}/download?token=${encodeURIComponent(token)}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${(rec.camera_name || "cam").replace(/ /g, "_")}_rekaman.mp4`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hapus rekaman
  const handleDelete = async (rec) => {
    if (!confirm(`Hapus rekaman kamera "${rec.camera_name}" dari daftar?`)) return;
    setDeletingId(rec.id);
    try {
      await api.delete(`/recordings/${rec.id}`);
      setRecordings(prev => prev.filter(r => r.id !== rec.id));
    } catch (e) {
      alert("Gagal menghapus rekaman: " + (e.response?.data?.detail || e.message));
    } finally {
      setDeletingId(null);
    }
  };

  const tabs = [
    { key: "recordings", icon: Film,    label: "Daftar Rekaman" },
    { key: "analytics",  icon: Film,    label: "Analitik Wajah" },
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
        <span style={{ opacity: active ? 1 : 0.3 }}>{sortDir === "desc" ? "↓" : "↑"}</span>
      </button>
    );
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { from { transform:rotate(0deg); }  to { transform:rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", margin: "0 0 6px", letterSpacing: "-0.03em" }}>Rekaman</h1>
        <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>Kelola dan unduh rekaman kamera dari server</p>
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
            <StatCard label="Total Rekaman" value={recordings.length} sub="file tersimpan"     icon={Film}      index={0} />
            <StatCard label="Penyimpanan"   value={fmtSize(totalSize)} sub="kapasitas dipakai" icon={HardDrive} index={1} />
            <StatCard label="Total Durasi"  value={fmtDur(totalDurS)}  sub="estimasi waktu"    icon={Clock}     index={2} />
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#71717A", pointerEvents: "none" }} />
                <input placeholder="Cari rekaman atau kamera..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...inp, paddingLeft: 32, width: 260 }} onFocus={focus} onBlur={blur} />
              </div>
              <FilterDropdown value={filterCamera} onChange={setFilterCamera} options={cameraOptions} />
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#3D3D4F" }}>{filtered.length} dari {recordings.length} rekaman</span>
              <button onClick={fetchRecordings} title="Refresh" style={{
                width: 32, height: 32, borderRadius: 7, background: "transparent",
                border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
                <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div style={{
            borderRadius: 12, overflow: "hidden",
            background: "rgba(17,17,24,0.7)", border: "1px solid #1F1F2E",
            backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 100ms both"
          }}>
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
                  <th style={{ textAlign: "left", padding: "11px 20px" }}><SortBtn field="camera_name" label="Kamera" /></th>
                  <th style={{ textAlign: "left", padding: "11px 20px" }}><SortBtn field="created_at"  label="Tanggal & Waktu" /></th>
                  <th style={{ textAlign: "left", padding: "11px 20px" }}><SortBtn field="duration"    label="Durasi (Est)" /></th>
                  <th style={{ textAlign: "left", padding: "11px 20px" }}><SortBtn field="size_bytes"  label="Ukuran" /></th>
                  <th style={{ textAlign: "right", padding: "11px 20px", fontSize: 10, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.07em" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "56px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <RefreshCw size={20} style={{ color: "#2D2D3F", animation: "spin 1s linear infinite" }} />
                        <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>Memuat rekaman...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "56px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Film size={20} style={{ color: "#2D2D3F" }} />
                        </div>
                        <p style={{ fontSize: 13, color: "#71717A", margin: 0, fontWeight: 600 }}>Belum ada rekaman</p>
                        <p style={{ fontSize: 12, color: "#3D3D4F", margin: 0 }}>
                          Klik tombol <strong style={{ color: "#71717A" }}>REC</strong> di halaman Siaran Langsung untuk menyimpan rekaman.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((rec, i) => {
                  const isHov = hoveredRow === rec.id;
                  const dt    = rec.created_at ? new Date(rec.created_at) : null;
                  const dateStr = dt ? dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                  const timeStr = dt ? dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
                  const isDeleting = deletingId === rec.id;

                  return (
                    <tr key={rec.id}
                      onMouseEnter={() => setHoveredRow(rec.id)} onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #131320" : "none", background: isHov ? "rgba(255,255,255,0.025)" : "transparent", transition: "background 0.15s" }}>

                      {/* Kamera */}
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 7, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Film size={12} style={{ color: "#71717A" }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
                            {rec.camera_name || `Kamera #${rec.camera_id}`}
                          </span>
                        </div>
                      </td>

                      {/* Tanggal & Waktu */}
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#FFFFFF", fontWeight: 500 }}>
                            <Calendar size={11} style={{ color: "#71717A", flexShrink: 0 }} />{dateStr}
                          </div>
                          <span style={{ fontSize: 11, color: "#71717A", fontFamily: "monospace" }}>{timeStr}</span>
                        </div>
                      </td>

                      {/* Durasi */}
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ fontSize: 11, color: "#71717A", padding: "3px 9px", borderRadius: 5, background: "#0A0A0F", border: "1px solid #1A1A26" }}>
                          {fmtDur(rec.duration)}
                        </span>
                      </td>

                      {/* Ukuran */}
                      <td style={{ padding: "13px 20px", fontSize: 12, color: "#71717A", fontFamily: "monospace" }}>
                        {fmtSize(rec.size_bytes || 0)}
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: "13px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {/* Tonton */}
                          <button onClick={() => setWatchRec(rec)} title="Tonton rekaman" style={{
                            width: 30, height: 30, borderRadius: 7,
                            background: isHov ? "rgba(255,255,255,0.08)" : "transparent",
                            border: `1px solid ${isHov ? "rgba(255,255,255,0.2)" : "#1F1F2E"}`,
                            color: isHov ? "#FFFFFF" : "#71717A", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: isHov ? 1 : 0.4, transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color="#FFF"; e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.25)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color="#71717A"; e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="#1F1F2E"; }}>
                            <Play size={12} />
                          </button>
                          {/* Download */}
                          <button onClick={() => handleDownload(rec)} title="Unduh rekaman" style={{
                            width: 30, height: 30, borderRadius: 7, background: "transparent",
                            border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: isHov ? 1 : 0.4, transition: "opacity 0.15s, color 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
                            <Download size={12} />
                          </button>
                          {/* Hapus */}
                          <button onClick={() => handleDelete(rec)} title="Hapus dari daftar" disabled={isDeleting} style={{
                            width: 30, height: 30, borderRadius: 7, background: "transparent",
                            border: "1px solid #1F1F2E", color: "#71717A", cursor: isDeleting ? "wait" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: isHov ? 1 : 0.4, transition: "opacity 0.15s, color 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#7f1d1d"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
                            {isDeleting ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length > 0 && (
              <div style={{ padding: "10px 20px", borderTop: "1px solid #131320", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0A0A0F" }}>
                <span style={{ fontSize: 12, color: "#3D3D4F" }}>{filtered.length} rekaman ditampilkan</span>
                <span style={{ fontSize: 12, color: "#3D3D4F", fontFamily: "monospace" }}>
                  Total: {fmtSize(filtered.reduce((s, r) => s + (r.size_bytes || 0), 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal tonton video */}
      {watchRec && <VideoModal rec={watchRec} onClose={() => setWatchRec(null)} />}
    </div>
  );
}
