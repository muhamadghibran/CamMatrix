import { ScanFace, Camera, Clock, Shield, ChevronUp, ChevronDown } from "lucide-react";
import { useLanguageStore } from "../../store/languageStore";
import { useState } from "react";

const detections = [
  { id: 1, face: "Unknown #001", cam1: "Main Entrance", cam2: "Lobby",       time1: "08:14:32", time2: "08:17:05", confidence: 94 },
  { id: 2, face: "Unknown #002", cam1: "Side Gate",     cam2: "Parking Lot", time1: "09:02:11", time2: "09:04:48", confidence: 88 },
  { id: 3, face: "Unknown #003", cam1: "Lobby",         cam2: "Server Room", time1: "10:31:55", time2: "10:35:20", confidence: 91 },
  { id: 4, face: "Unknown #004", cam1: "Main Entrance", cam2: "Rooftop",     time1: "11:05:08", time2: "11:12:44", confidence: 79 },
  { id: 5, face: "Unknown #005", cam1: "Reception",     cam2: "Lobby",       time1: "13:20:35", time2: "13:22:10", confidence: 96 },
];

function ConfidenceBadge({ value }) {
  const level = value >= 90 ? "Tinggi" : value >= 80 ? "Sedang" : "Rendah";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: "#1F1F2E", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: value >= 90 ? "#FFFFFF" : value >= 80 ? "#A0A0A0" : "#555555", borderRadius: 99, transition: "width 1s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: value >= 90 ? "#FFFFFF" : "#71717A", minWidth: 32 }}>{value}%</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#71717A", padding: "2px 7px", borderRadius: 4, background: "#0A0A0F", border: "1px solid #1F1F2E", letterSpacing: "0.05em" }}>{level}</span>
    </div>
  );
}

export default function FaceAnalyticsPage() {
  const { t } = useLanguageStore();
  const [sortField, setSortField]   = useState("confidence");
  const [sortDir, setSortDir]       = useState("desc");
  const [hoveredRow, setHoveredRow] = useState(null);

  const sorted = [...detections].sort((a, b) => {
    const v = sortDir === "asc" ? 1 : -1;
    if (sortField === "confidence") return (a.confidence - b.confidence) * v;
    if (sortField === "face") return a.face.localeCompare(b.face) * v;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={11} style={{ color: "#2D2D3F" }} />;
    return sortDir === "asc" ? <ChevronUp size={11} style={{ color: "#71717A" }} /> : <ChevronDown size={11} style={{ color: "#71717A" }} />;
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Deteksi", value: "128", icon: ScanFace },
          { label: "Kamera Aktif",  value: "6",   icon: Camera },
          { label: "Durasi Rata-rata", value: "4.2 mnt", icon: Clock },
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

      {/* Notice */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 10, background: "#111118", border: "1px solid #1F1F2E", marginBottom: 20 }}>
        <Shield size={15} style={{ color: "#71717A", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: "0 0 2px" }}>Pelacakan Lintas Kamera</p>
          <p style={{ fontSize: 12, color: "#71717A", margin: 0 }}>Menampilkan perpindahan wajah yang terdeteksi antar kamera. Kepercayaan tinggi ≥ 90%.</p>
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 10, overflow: "hidden", background: "#111118", border: "1px solid #1F1F2E" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #1F1F2E" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Log Deteksi Wajah</span>
          <span style={{ fontSize: 12, color: "#71717A" }}>{detections.length} entri</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1A1A26" }}>
              {[
                { label: "Wajah",       field: "face" },
                { label: "Kamera 1",    field: null },
                { label: "Waktu",       field: null },
                { label: "Kamera 2",    field: null },
                { label: "Waktu",       field: null },
                { label: "Kepercayaan", field: "confidence" },
              ].map(({ label, field }, idx) => (
                <th key={idx} onClick={() => field && handleSort(field)} style={{
                  textAlign: "left", padding: "11px 16px", fontSize: 11, fontWeight: 600,
                  color: "#71717A", letterSpacing: "0.06em", textTransform: "uppercase",
                  cursor: field ? "pointer" : "default",
                  userSelect: "none"
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {label}
                    {field && <SortIcon field={field} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((det, i) => {
              const isHov = hoveredRow === det.id;
              return (
                <tr key={det.id}
                  onMouseEnter={() => setHoveredRow(det.id)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ borderBottom: i < sorted.length - 1 ? "1px solid #1A1A26" : "none", background: isHov ? "#0D0D14" : "transparent", transition: "background 0.15s" }}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <ScanFace size={13} style={{ color: "#71717A" }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{det.face}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "#FFFFFF", fontWeight: 500 }}>{det.cam1}</td>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "#71717A" }}>{det.time1}</td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "#FFFFFF", fontWeight: 500 }}>{det.cam2}</td>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "#71717A" }}>{det.time2}</td>
                  <td style={{ padding: "13px 16px", minWidth: 200 }}>
                    <ConfidenceBadge value={det.confidence} />
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
