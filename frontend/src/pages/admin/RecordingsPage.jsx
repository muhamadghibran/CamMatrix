import { Film, Download, Play, Pause, Clock, HardDrive, Search, Filter, Calendar, ScanFace, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useLanguageStore } from "../../store/languageStore";
import AnimatedText from "../../components/AnimatedText";
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

const statsList = [
  { icon: Film,      labelKey: "total",    value: "48",     subKey: "today",  color: "#06b6d4" },
  { icon: HardDrive, labelKey: "storage",  value: "3.2 GB", subKey: "today",  color: "#8b5cf6" },
  { icon: Clock,     labelKey: "duration", value: "24 hrs", subKey: "today",  color: "#10b981" },
];

const cameraOptions = ["Semua", "Main Entrance", "Lobby", "Server Room", "Side Gate", "Rooftop", "Parking Lot"];

function DownloadToast({ filename, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl animate-card-enter"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid rgba(16,185,129,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(16,185,129,0.1)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
        <Download size={16} style={{ color: "#10b981" }} />
      </div>
      <div>
        <p className="text-[13px] font-bold" style={{ color: "var(--color-text-base)" }}>Mengunduh rekaman...</p>
        <p className="text-[11px]" style={{ color: "var(--color-text-sub)" }}>{filename}</p>
      </div>
      <button onClick={onClose} className="ml-2 p-1 rounded-lg" style={{ color: "var(--color-text-sub)" }}><X size={14} /></button>
    </div>
  );
}

export default function RecordingsPage() {
  const { t } = useLanguageStore();
  const [hovered, setHovered] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [activeTab, setActiveTab] = useState("recordings");
  const [search, setSearch] = useState("");
  const [filterCamera, setFilterCamera] = useState("Semua");
  const [showFilter, setShowFilter] = useState(false);
  const [downloadToast, setDownloadToast] = useState(null);

  const filtered = useMemo(() =>
    allRecordings.filter((r) => {
      const matchSearch = r.camera.toLowerCase().includes(search.toLowerCase()) || r.date.toLowerCase().includes(search.toLowerCase());
      const matchCamera = filterCamera === "Semua" || r.camera === filterCamera;
      return matchSearch && matchCamera;
    }),
  [search, filterCamera]);

  const handleDownload = (rec) => {
    const filename = `${rec.camera.replace(/ /g, "_")}_${rec.dateRaw}_${rec.start.replace(":", "")}.mp4`;
    setDownloadToast(filename);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  return (
    <div className="space-y-6 relative z-10 w-full">
      {downloadToast && <DownloadToast filename={downloadToast} onClose={() => setDownloadToast(null)} />}

      {/* Tabs */}
      <div className="flex bg-(--color-surface) p-1.5 rounded-xl w-max border border-(--color-card-border) animate-slide-up opacity-0-init">
        <button onClick={() => setActiveTab("recordings")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-[13px] rounded-lg transition-colors ${activeTab === "recordings" ? "bg-cyan-500/10 text-cyan-500 shadow-sm" : "text-(--color-text-sub) hover:text-(--color-text-base)"}`}>
          <Film size={16} /> Daftar Rekaman
        </button>
        <button onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-[13px] rounded-lg transition-colors ${activeTab === "analytics" ? "bg-cyan-500/10 text-cyan-500 shadow-sm" : "text-(--color-text-sub) hover:text-(--color-text-base)"}`}>
          <ScanFace size={16} /> Analitik Wajah
        </button>
      </div>

      {activeTab === "analytics" ? (
        <div className="animate-card-enter opacity-0-init"><FaceAnalyticsPage /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-5">
            {/* eslint-disable-next-line no-unused-vars */}
            {statsList.map(({ icon: Icon, labelKey, value, subKey, color }, i) => (
              <div key={labelKey} className="gradient-border noise animate-card-enter opacity-0-init cursor-pointer group relative overflow-hidden"
                style={{ backgroundColor: "var(--color-surface)", padding: "20px", animationDelay: `${i * 100}ms`, transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 14px 36px rgba(0,0,0,0.12), 0 0 0 1px ${color}35`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none" style={{ background: `radial-gradient(ellipse at 0% 0%, ${color}14, transparent 55%)`, transition: "opacity 0.4s ease" }} />
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}14`, border: `1px solid ${color}26` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg" style={{ color: "var(--color-text-sub)", backgroundColor: "var(--color-surface-elevated)" }}>
                    {t(`recordings.stats.${subKey}`)}
                  </span>
                </div>
                <div className="stat-number text-3xl font-bold mb-1 relative z-10" style={{ color }}>
                  <AnimatedText text={value} delayOffset={200 + i * 100} splitBy="char" />
                </div>
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-sub)" }}>
                  {t(`recordings.stats.${labelKey}`)}
                </p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 animate-card-enter opacity-0-init delay-300 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-sub)" }} />
              <input placeholder="Cari rekaman..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)", transition: "border-color 0.2s ease, box-shadow 0.2s ease" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.12)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.boxShadow = ""; }}
              />
            </div>

            {/* Filter by camera */}
            <div className="relative">
              <button onClick={() => setShowFilter(v => !v)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ backgroundColor: "var(--color-surface)", border: filterCamera !== "Semua" ? "1px solid #06b6d4" : "1px solid var(--color-card-border)", color: filterCamera !== "Semua" ? "#06b6d4" : "var(--color-text-sub)", transition: "border-color 0.2s, color 0.2s" }}>
                <Filter size={14} /> {filterCamera !== "Semua" ? filterCamera : "Filter"}
              </button>
              {showFilter && (
                <div className="absolute top-12 left-0 z-20 w-48 rounded-xl shadow-xl overflow-hidden animate-card-enter"
                  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)" }}>
                  {cameraOptions.map(opt => (
                    <button key={opt} onClick={() => { setFilterCamera(opt); setShowFilter(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-medium"
                      style={{ color: filterCamera === opt ? "#06b6d4" : "var(--color-text-base)", backgroundColor: filterCamera === opt ? "rgba(6,182,212,0.08)" : "transparent", transition: "background-color 0.15s" }}
                      onMouseEnter={(e) => { if (filterCamera !== opt) e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)"; }}
                      onMouseLeave={(e) => { if (filterCamera !== opt) e.currentTarget.style.backgroundColor = "transparent"; }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", color: "var(--color-text-sub)", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#06b6d4"; e.currentTarget.style.color = "#06b6d4"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; e.currentTarget.style.color = "var(--color-text-sub)"; }}>
              <Calendar size={14} /> Tanggal
            </button>
          </div>

          {/* Table */}
          <div className="rounded-[18px] overflow-hidden animate-card-enter opacity-0-init delay-400" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)" }}>
              <h2 className="text-[13px] font-bold" style={{ color: "var(--color-text-base)" }}>
                <AnimatedText text={t("recordings.table.title")} delayOffset={600} splitBy="word" />
              </h2>
              <span className="text-[11px] font-semibold" style={{ color: "var(--color-text-sub)" }}>{filtered.length} rekaman</span>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-card-border)" }}>
                  {["camera", "date", "start", "end", "duration", "size", "actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-sub)" }}>
                      {t(`recordings.table.${h}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: "var(--color-text-sub)" }}>Tidak ada rekaman ditemukan.</td></tr>
                ) : filtered.map((rec, i) => {
                  const isHov = hovered === rec.id;
                  const isPlay = playing === rec.id;
                  return (
                    <tr key={rec.id} className="animate-card-enter opacity-0-init"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-card-border)" : "none", animationDelay: `${500 + i * 60}ms`, backgroundColor: isHov ? "var(--color-surface-elevated)" : "", transition: "background-color 0.15s ease" }}
                      onMouseEnter={() => setHovered(rec.id)} onMouseLeave={() => setHovered(null)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: isPlay ? "linear-gradient(135deg,#06b6d4,#00ffff)" : "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", transition: "background 0.3s" }}>
                            <Film size={14} style={{ color: isPlay ? "#fff" : "#06b6d4" }} />
                          </div>
                          <div>
                            <span className="text-[13px] font-semibold block" style={{ color: "var(--color-text-base)" }}>{rec.camera}</span>
                            {isPlay && <span className="text-[10px] font-bold uppercase text-green-400">▶ Playing</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[12px]" style={{ color: "var(--color-text-sub)" }}>{rec.date}</td>
                      <td className="px-5 py-4 font-mono text-[12px]" style={{ color: "var(--color-text-base)" }}>{rec.start}</td>
                      <td className="px-5 py-4 font-mono text-[12px]" style={{ color: "var(--color-text-base)" }}>{rec.end}</td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ color: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.1)" }}>
                          {rec.duration}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[12px]" style={{ color: "var(--color-text-sub)" }}>{rec.size}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setPlaying(playing === rec.id ? null : rec.id)}
                            title={isPlay ? "Stop" : "Putar"}
                            className="p-2 rounded-xl"
                            style={{ color: isPlay ? "#10b981" : "#06b6d4", backgroundColor: isPlay ? "rgba(16,185,129,0.12)" : (isHov ? "rgba(6,182,212,0.1)" : "transparent"), transition: "background-color 0.15s, transform 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "")}>
                            {isPlay ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button onClick={() => handleDownload(rec)}
                            title="Unduh"
                            className="p-2 rounded-xl"
                            style={{ color: "#10b981", backgroundColor: isHov ? "rgba(16,185,129,0.1)" : "transparent", transition: "background-color 0.15s, transform 0.15s" }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "")}>
                            <Download size={14} />
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
