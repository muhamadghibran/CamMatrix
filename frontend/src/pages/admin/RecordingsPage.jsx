import {
  Film, Download, Play, Pause, Clock, HardDrive, Search, Filter, Calendar, ScanFace, X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLanguageStore } from "../../store/languageStore";
import FaceAnalyticsPage from "./FaceAnalyticsPage";

/* ─── Static data ──────────────────────────────────────────── */
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

/* ─── Download toast ───────────────────────────────────────── */
function DownloadToast({ filename, onClose }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "var(--color-surface-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Download size={14} style={{ color: "var(--color-text-sub)" }} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-base)", margin: 0 }}>Mengunduh rekaman...</p>
        <p style={{ fontSize: 11, color: "var(--color-text-sub)", margin: "2px 0 0" }}>{filename}</p>
      </div>
      <button onClick={onClose} style={{ marginLeft: 8, padding: 4, border: "none", cursor: "pointer", backgroundColor: "transparent" }}>
        <X size={14} style={{ color: "var(--color-text-sub)" }} />
      </button>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function RecordingsPage() {
  const { t } = useLanguageStore();
  const [hovered, setHovered]         = useState(null);
  const [playing, setPlaying]         = useState(null);
  const [activeTab, setActiveTab]     = useState("recordings");
  const [search, setSearch]           = useState("");
  const [filterCamera, setFilterCamera] = useState("Semua");
  const [showFilter, setShowFilter]   = useState(false);
  const [downloadToast, setDownloadToast] = useState(null);

  const filtered = useMemo(() =>
    allRecordings.filter((r) => {
      const matchSearch = r.camera.toLowerCase().includes(search.toLowerCase()) || r.date.toLowerCase().includes(search.toLowerCase());
      const matchCamera = filterCamera === "Semua" || r.camera === filterCamera;
      return matchSearch && matchCamera;
    }), [search, filterCamera]);

  const handleDownload = (rec) => {
    const f = `${rec.camera.replace(/ /g, "_")}_${rec.dateRaw}_${rec.start.replace(":", "")}.mp4`;
    setDownloadToast(f);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const stats = [
    { label: t("recordings.stats.total"),    value: "48",     sub: t("recordings.stats.today"), icon: Film },
    { label: t("recordings.stats.storage"),  value: "3.2 GB", sub: t("recordings.stats.today"), icon: HardDrive },
    { label: t("recordings.stats.duration"), value: "24 hrs", sub: t("recordings.stats.today"), icon: Clock },
  ];

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {downloadToast && <DownloadToast filename={downloadToast} onClose={() => setDownloadToast(null)} />}

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 4, borderRadius: 10, width: "fit-content", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", marginBottom: 24 }}>
        {[
          { key: "recordings", Icon: Film,     label: "Daftar Rekaman" },
          { key: "analytics",  Icon: ScanFace, label: "Analitik Wajah" },
        ].map(({ key, Icon, label }) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", transition: "background-color 0.15s", backgroundColor: active ? "var(--color-surface-elevated)" : "transparent", color: active ? "var(--color-text-base)" : "var(--color-text-sub)", outline: active ? "1px solid var(--color-card-border)" : "none" }}>
              <Icon size={14} /> {label}
            </button>
          );
        })}
      </div>

      {/* ── Analytics tab ── */}
      {activeTab === "analytics" ? (
        <FaceAnalyticsPage />
      ) : (
        <>
          {/* ── Stats ── */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            {stats.map(({ label, value, sub, icon: Icon }) => (
              <div key={label} style={{ flex: 1, padding: "18px 20px", borderRadius: 12, backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} style={{ color: "var(--color-text-sub)" }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-sub)", padding: "3px 8px", borderRadius: 5, backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)" }}>
                    {sub}
                  </span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-text-base)", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-sub)", marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
              <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-sub)", pointerEvents: "none" }} />
              <input placeholder="Cari rekaman..." value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", paddingLeft: 36, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderRadius: 8, fontSize: 13, outline: "none", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", color: "var(--color-text-base)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; }}
              />
            </div>

            {/* Filter camera */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowFilter((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", backgroundColor: "var(--color-surface)", border: filterCamera !== "Semua" ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--color-card-border)", color: "var(--color-text-sub)" }}>
                <Filter size={13} />
                {filterCamera !== "Semua" ? filterCamera : "Filter"}
              </button>
              {showFilter && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, minWidth: 180, borderRadius: 10, overflow: "hidden", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}>
                  {cameraOptions.map((opt) => (
                    <button key={opt} onClick={() => { setFilterCamera(opt); setShowFilter(false); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, cursor: "pointer", border: "none", backgroundColor: filterCamera === opt ? "var(--color-surface-elevated)" : "transparent", color: filterCamera === opt ? "var(--color-text-base)" : "var(--color-text-sub)", fontWeight: filterCamera === opt ? 600 : 400 }}
                      onMouseEnter={(e) => { if (filterCamera !== opt) e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)"; }}
                      onMouseLeave={(e) => { if (filterCamera !== opt) e.currentTarget.style.backgroundColor = "transparent"; }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date button */}
            <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)", color: "var(--color-text-sub)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-card-border)"; }}>
              <Calendar size={13} /> Tanggal
            </button>
          </div>

          {/* ── Table card ── */}
          <div style={{ borderRadius: 14, overflow: "hidden", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)" }}>
            {/* Table header bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-base)" }}>{t("recordings.table.title")}</span>
              <span style={{ fontSize: 11, color: "var(--color-text-sub)" }}>{filtered.length} rekaman</span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-card-border)", backgroundColor: "var(--color-surface-elevated)" }}>
                  {["camera", "date", "start", "end", "duration", "size", "actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-sub)" }}>
                      {t(`recordings.table.${h}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: "var(--color-text-sub)" }}>
                      Tidak ada rekaman ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((rec, i) => {
                    const isHov  = hovered === rec.id;
                    const isPlay = playing === rec.id;
                    return (
                      <tr key={rec.id}
                        style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--color-card-border)" : "none", backgroundColor: isHov ? "var(--color-surface-elevated)" : "transparent", transition: "background-color 0.12s" }}
                        onMouseEnter={() => setHovered(rec.id)} onMouseLeave={() => setHovered(null)}>

                        {/* Camera */}
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, backgroundColor: isPlay ? "rgba(255,255,255,0.06)" : "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.15s" }}>
                              <Film size={13} style={{ color: "var(--color-text-sub)" }} />
                            </div>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 600, display: "block", color: "var(--color-text-base)" }}>{rec.camera}</span>
                              {isPlay && <span style={{ fontSize: 10, color: "var(--color-text-sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>▶ Memutar</span>}
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: "14px 20px", fontSize: 12, color: "var(--color-text-sub)" }}>{rec.date}</td>

                        {/* Start */}
                        <td style={{ padding: "14px 20px", fontFamily: "monospace", fontSize: 12, color: "var(--color-text-base)" }}>{rec.start}</td>

                        {/* End */}
                        <td style={{ padding: "14px 20px", fontFamily: "monospace", fontSize: 12, color: "var(--color-text-base)" }}>{rec.end}</td>

                        {/* Duration */}
                        <td style={{ padding: "14px 20px" }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-sub)", padding: "3px 8px", borderRadius: 5, backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-card-border)" }}>
                            {rec.duration}
                          </span>
                        </td>

                        {/* Size */}
                        <td style={{ padding: "14px 20px", fontSize: 12, color: "var(--color-text-sub)" }}>{rec.size}</td>

                        {/* Actions */}
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button onClick={() => setPlaying(playing === rec.id ? null : rec.id)} title={isPlay ? "Stop" : "Putar"}
                              style={{ padding: 7, borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: isHov ? "var(--color-surface)" : "transparent", color: "var(--color-text-sub)", transition: "background-color 0.12s" }}>
                              {isPlay ? <Pause size={13} /> : <Play size={13} />}
                            </button>
                            <button onClick={() => handleDownload(rec)} title="Unduh"
                              style={{ padding: 7, borderRadius: 6, border: "none", cursor: "pointer", backgroundColor: isHov ? "var(--color-surface)" : "transparent", color: "var(--color-text-sub)", transition: "background-color 0.12s" }}>
                              <Download size={13} />
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
        </>
      )}
    </div>
  );
}
