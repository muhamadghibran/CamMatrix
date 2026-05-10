import {
  ScanFace, Camera, Clock, Shield, ChevronUp, ChevronDown,
  ArrowRight, Activity, AlertCircle, Filter, Search, TrendingUp
} from "lucide-react";
import { useState, useMemo } from "react";

const detections = [
  { id: 1, face: "Unknown #001", cam1: "Main Entrance", cam2: "Lobby",       time1: "08:14:32", time2: "08:17:05", confidence: 94, gap: "2m 33s", date: "Hari ini" },
  { id: 2, face: "Unknown #002", cam1: "Side Gate",     cam2: "Parking Lot", time1: "09:02:11", time2: "09:04:48", confidence: 88, gap: "2m 37s", date: "Hari ini" },
  { id: 3, face: "Unknown #003", cam1: "Lobby",         cam2: "Server Room", time1: "10:31:55", time2: "10:35:20", confidence: 91, gap: "3m 25s", date: "Hari ini" },
  { id: 4, face: "Unknown #004", cam1: "Main Entrance", cam2: "Rooftop",     time1: "11:05:08", time2: "11:12:44", confidence: 79, gap: "7m 36s", date: "Hari ini" },
  { id: 5, face: "Unknown #005", cam1: "Reception",     cam2: "Lobby",       time1: "13:20:35", time2: "13:22:10", confidence: 96, gap: "1m 35s", date: "Hari ini" },
];

/* ── Confidence Bar ── */
function ConfBar({ value }) {
  const level  = value >= 90 ? "Tinggi" : value >= 80 ? "Sedang" : "Rendah";
  const color  = value >= 90 ? "#FFFFFF" : value >= 80 ? "#A0A0A0" : "#555555";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 3, borderRadius: 99, background: "#1A1A26", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 30, textAlign: "right" }}>{value}%</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#71717A", padding: "2px 7px", borderRadius: 4, background: "#0A0A0F", border: "1px solid #1A1A26", letterSpacing: "0.05em", flexShrink: 0 }}>
        {level}
      </span>
    </div>
  );
}

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
        backdropFilter: "blur(12px)", cursor: "default",
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

/* ── Journey Row ── */
function JourneyRow({ det, isHov, onEnter, onLeave }) {
  const confColor = det.confidence >= 90 ? "#FFFFFF" : det.confidence >= 80 ? "#A0A0A0" : "#555";
  return (
    <tr
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={{ borderBottom: "1px solid #131320", background: isHov ? "rgba(255,255,255,0.025)" : "transparent", transition: "background 0.15s", cursor: "default" }}>

      {/* Face ID */}
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ScanFace size={14} style={{ color: "#71717A" }} />
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", display: "block" }}>{det.face}</span>
            <span style={{ fontSize: 11, color: "#3D3D4F" }}>{det.date}</span>
          </div>
        </div>
      </td>

      {/* Journey: Cam1 → Cam2 */}
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Cam 1 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF" }}>{det.cam1}</span>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#71717A" }}>{det.time1}</span>
          </div>
          {/* Arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 20, height: 1, background: "#1F1F2E" }} />
              <ArrowRight size={11} style={{ color: "#3D3D4F", flexShrink: 0 }} />
            </div>
            <span style={{ fontSize: 10, color: "#3D3D4F", fontFamily: "monospace", marginTop: 2 }}>{det.gap}</span>
          </div>
          {/* Cam 2 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#FFFFFF" }}>{det.cam2}</span>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#71717A" }}>{det.time2}</span>
          </div>
        </div>
      </td>

      {/* Confidence */}
      <td style={{ padding: "14px 20px", minWidth: 220 }}>
        <ConfBar value={det.confidence} />
      </td>
    </tr>
  );
}

/* ── Main Page ── */
export default function FaceAnalyticsPage() {
  const [sortField, setSortField]   = useState("confidence");
  const [sortDir, setSortDir]       = useState("desc");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [search, setSearch]         = useState("");

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const sorted = useMemo(() => {
    let list = detections.filter(d =>
      d.face.toLowerCase().includes(search.toLowerCase()) ||
      d.cam1.toLowerCase().includes(search.toLowerCase()) ||
      d.cam2.toLowerCase().includes(search.toLowerCase())
    );
    return [...list].sort((a, b) => {
      const v = sortDir === "asc" ? 1 : -1;
      if (sortField === "confidence") return (a.confidence - b.confidence) * v;
      if (sortField === "face")       return a.face.localeCompare(b.face) * v;
      return 0;
    });
  }, [sortField, sortDir, search]);

  const SortBtn = ({ field, label }) => {
    const active = sortField === field;
    return (
      <button onClick={() => handleSort(field)} style={{
        display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
        cursor: "pointer", fontSize: 10, fontWeight: 700,
        color: active ? "#FFFFFF" : "#71717A",
        textTransform: "uppercase", letterSpacing: "0.07em", padding: 0
      }}>
        {label}
        {active
          ? (sortDir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
          : <ChevronDown size={11} style={{ opacity: 0.3 }} />}
      </button>
    );
  };

  const highConf  = detections.filter(d => d.confidence >= 90).length;
  const avgConf   = Math.round(detections.reduce((a, d) => a + d.confidence, 0) / detections.length);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Total Deteksi"    value={detections.length}   sub="perjalanan tercatat" icon={ScanFace}   index={0} />
        <StatCard label="Kepercayaan Rata" value={`${avgConf}%`}       sub="tingkat akurasi"     icon={TrendingUp} index={1} />
        <StatCard label="Deteksi Tinggi"   value={highConf}            sub="kepercayaan ≥ 90%"   icon={Shield}     index={2} />
        <StatCard label="Durasi Rata-rata" value="4.2 mnt"             sub="waktu lintas kamera" icon={Clock}      index={3} />
      </div>

      {/* ── Info Banner ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
        borderRadius: 10, background: "rgba(17,17,24,0.6)", border: "1px solid #1F1F2E",
        backdropFilter: "blur(12px)", animation: "fadeUp 0.4s ease 200ms both"
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Activity size={14} style={{ color: "#71717A" }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: "0 0 2px" }}>Pelacakan Lintas Kamera</p>
          <p style={{ fontSize: 12, color: "#71717A", margin: 0 }}>
            Menampilkan perpindahan wajah yang terdeteksi antar kamera. Endpoint AI siap untuk diintegrasikan.
          </p>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: "#111118", border: "1px solid #1F1F2E", color: "#3D3D4F", letterSpacing: "0.07em", flexShrink: 0 }}>
          AI READY
        </span>
      </div>

      {/* ── Table ── */}
      <div style={{
        borderRadius: 12, overflow: "hidden",
        background: "rgba(17,17,24,0.7)", border: "1px solid #1F1F2E",
        backdropFilter: "blur(12px)", animation: "fadeUp 0.45s ease 120ms both"
      }}>
        {/* Table topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ScanFace size={13} style={{ color: "#71717A" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Log Deteksi Wajah</span>
            <span style={{ fontSize: 11, color: "#71717A", padding: "2px 8px", borderRadius: 5, background: "#111118", border: "1px solid #1F1F2E" }}>{sorted.length}</span>
          </div>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#71717A", pointerEvents: "none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari wajah atau kamera..."
              style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 7, fontSize: 12, outline: "none", background: "#111118", border: "1px solid #1F1F2E", color: "#FFFFFF", width: 220 }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
              onBlur={e => e.currentTarget.style.borderColor = "#1F1F2E"} />
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A26", background: "#0A0A0F" }}>
              <th style={{ textAlign: "left", padding: "11px 20px" }}>
                <SortBtn field="face" label="Identitas Wajah" />
              </th>
              <th style={{ textAlign: "left", padding: "11px 20px", fontSize: 10, fontWeight: 700, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Jalur Pergerakan
              </th>
              <th style={{ textAlign: "left", padding: "11px 20px" }}>
                <SortBtn field="confidence" label="Kepercayaan" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: "56px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ScanFace size={20} style={{ color: "#2D2D3F" }} />
                    </div>
                    <p style={{ fontSize: 13, color: "#71717A", margin: 0, fontWeight: 600 }}>Tidak ditemukan</p>
                    <p style={{ fontSize: 12, color: "#3D3D4F", margin: 0 }}>Coba kata kunci lain</p>
                  </div>
                </td>
              </tr>
            ) : sorted.map((det, i) => (
              <JourneyRow
                key={det.id} det={det}
                isHov={hoveredRow === det.id}
                onEnter={() => setHoveredRow(det.id)}
                onLeave={() => setHoveredRow(null)}
              />
            ))}
          </tbody>
        </table>

        {/* Footer */}
        {sorted.length > 0 && (
          <div style={{ padding: "10px 20px", borderTop: "1px solid #131320", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0A0A0F" }}>
            <span style={{ fontSize: 12, color: "#3D3D4F" }}>{sorted.length} deteksi ditampilkan</span>
            <span style={{ fontSize: 12, color: "#3D3D4F", fontFamily: "monospace" }}>Data demo · AI endpoint belum terhubung</span>
          </div>
        )}
      </div>
    </div>
  );
}
