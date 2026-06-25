import { useState, useEffect, useRef } from "react";
import {
  ScanFace, Play, RefreshCw, Trash2, ChevronRight,
  Camera, Clock, Users, AlertCircle, CheckCircle2, Eye
} from "lucide-react";
import api from "../../utils/api";
import { API_BASE_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";

const BASE = API_BASE_URL;
const token = () => useAuthStore.getState().token || "";


const fmtSec = (s) => {
  if (!s && s !== 0) return "—";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/* ── Status badge ── */
function StatusBadge({ status }) {
  const map = {
    pending: { label: "Menunggu", color: "#71717A", bg: "#111118" },
    running: { label: "Berjalan", color: "#FFF",   bg: "#1F1F2E" },
    done:    { label: "Selesai",  color: "#4ade80", bg: "#052e16" },
    failed:  { label: "Gagal",    color: "#f87171", bg: "#2a0a0a" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
      background: s.bg, color: s.color, letterSpacing: "0.06em",
    }}>{s.label.toUpperCase()}</span>
  );
}

/* ── Camera Trail Step ── */
function TrailStep({ step, isLast }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 12 }}>
        {/* Dot */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "#111118", border: "1px solid #1F1F2E",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Camera size={12} style={{ color: "#71717A" }} />
        </div>
        {/* Connector */}
        {!isLast && <div style={{ width: 1, flex: 1, minHeight: 20, background: "#1F1F2E", margin: "4px 0" }} />}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>
            {step.camera_name || `Kamera #${step.camera_id}`}
          </span>
          <span style={{ fontSize: 10, color: "#3D3D4F" }}>Langkah {step.step}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Thumbnail */}
          {step.thumbnail ? (
            <img src={`data:image/jpeg;base64,${step.thumbnail}`}
              alt="" style={{ width: 44, height: 44, borderRadius: 7, objectFit: "cover", border: "1px solid #1F1F2E", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 7, background: "#0A0A0F", border: "1px solid #1A1A26", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ScanFace size={16} style={{ color: "#2D2D3F" }} />
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#71717A" }}>
              <Clock size={10} />
              <span>{fmtSec(step.first_timestamp_sec)} – {fmtSec(step.last_timestamp_sec)}</span>
            </div>
            <span style={{ fontSize: 10, color: "#3D3D4F" }}>
              {step.frame_count} frame terdeteksi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Person Card ── */
function PersonCard({ person, index }) {
  const [expanded, setExpanded] = useState(false);
  const cameraNames = [...new Set(person.trail.map(t => t.camera_name || `Kamera ${t.camera_id}`))];

  return (
    <div style={{
      borderRadius: 10, background: "#111118", border: "1px solid #1A1A26",
      overflow: "hidden", transition: "border-color 0.15s",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#1A1A26"}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
        onClick={() => setExpanded(v => !v)}>
        {/* Avatar */}
        {person.first_thumbnail ? (
          <img src={`data:image/jpeg;base64,${person.first_thumbnail}`}
            alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid #1F1F2E", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#0A0A0F", border: "1px solid #1A1A26", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ScanFace size={20} style={{ color: "#2D2D3F" }} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>Orang #{index + 1}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: "#0A0A0F", border: "1px solid #1A1A26", color: "#3D3D4F" }}>ID {person.person_id}</span>
          </div>

          {/* Camera trail summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            {cameraNames.map((cam, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 10, color: "#71717A", padding: "1px 6px", borderRadius: 4, background: "#0A0A0F", border: "1px solid #1A1A26" }}>
                  {cam}
                </span>
                {i < cameraNames.length - 1 && (
                  <ChevronRight size={9} style={{ color: "#2D2D3F", flexShrink: 0 }} />
                )}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#71717A" }}>{person.total_cameras} kamera</span>
          <ChevronRight size={14} style={{ color: "#3D3D4F", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </div>

      {/* Trail Detail */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1A1A26" }}>
          <p style={{ fontSize: 11, color: "#3D3D4F", margin: "12px 0 16px" }}>
            Perjalanan orang ini terdeteksi di <strong style={{ color: "#71717A" }}>{person.trail.length}</strong> rekaman berbeda
          </p>
          {person.trail.map((step, i) => (
            <TrailStep key={i} step={step} isLast={i === person.trail.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function FaceAnalyticsPage() {
  const [persons,     setPersons]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [tracking,    setTracking]    = useState(false);
  const [sessionId,   setSessionId]   = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [error,       setError]       = useState(null);
  const pollRef = useRef(null);

  const headers = { Authorization: `Bearer ${token()}` };

  const fetchPersons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/ai/persons`, { headers });
      if (res.ok) setPersons(await res.json());
    } catch (e) { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPersons(); return () => clearInterval(pollRef.current); }, []);

  // ── Polling status sesi ──
  const startPoll = (sid) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/ai/track/${sid}`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        setSessionInfo(data);
        if (data.status === "done" || data.status === "failed") {
          clearInterval(pollRef.current);
          setTracking(false);
          if (data.status === "done") await fetchPersons();
        }
      } catch (_) {}
    }, 3000);
  };

  // ── Mulai tracking ──
  const handleStartTracking = async () => {
    setTracking(true);
    setError(null);
    setSessionInfo(null);
    try {
      const res = await fetch(`${BASE}/ai/track`, { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Gagal memulai tracking");
      setSessionId(data.session_id);
      setSessionInfo({ status: "pending", recordings_to_analyze: data.recordings_to_analyze });
      startPoll(data.session_id);
    } catch (e) {
      setError(e.message);
      setTracking(false);
    }
  };

  // ── Reset data ──
  const handleReset = async () => {
    if (!confirm("Hapus semua data tracking? Data orang dan jejak kamera akan hilang.")) return;
    try {
      await fetch(`${BASE}/ai/persons`, { method: "DELETE", headers });
      setPersons([]);
      setSessionInfo(null);
    } catch (_) {}
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header + Actions ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#FFF", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Tracking Lintas Kamera
          </h2>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>
            AI mendeteksi orang yang sama di berbagai kamera dan membangun jejak perjalanannya
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchPersons} title="Refresh" style={{
            width: 34, height: 34, borderRadius: 8, background: "transparent",
            border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>

          {persons.length > 0 && (
            <button onClick={handleReset} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
              background: "transparent", border: "1px solid #1F1F2E", color: "#71717A",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "#7f1d1d"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
              <Trash2 size={12} /> Reset Data
            </button>
          )}

          <button onClick={handleStartTracking} disabled={tracking} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 8,
            background: tracking ? "#1F1F2E" : "#FFFFFF",
            border: tracking ? "1px solid #2D2D3F" : "none",
            color: tracking ? "#71717A" : "#0A0A0F",
            fontSize: 12, fontWeight: 700, cursor: tracking ? "wait" : "pointer",
            transition: "all 0.2s",
          }}>
            {tracking
              ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Menganalisis...</>
              : <><ScanFace size={13} /> Mulai Tracking</>}
          </button>
        </div>
      </div>

      {/* ── Status Sesi Aktif ── */}
      {sessionInfo && (
        <div style={{
          padding: "14px 18px", borderRadius: 10,
          background: sessionInfo.status === "done" ? "rgba(5,46,22,0.4)" : sessionInfo.status === "failed" ? "rgba(42,10,10,0.4)" : "#111118",
          border: `1px solid ${sessionInfo.status === "done" ? "#14532d" : sessionInfo.status === "failed" ? "#450a0a" : "#1F1F2E"}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          {sessionInfo.status === "done" ? (
            <CheckCircle2 size={16} style={{ color: "#4ade80", flexShrink: 0 }} />
          ) : sessionInfo.status === "failed" ? (
            <AlertCircle size={16} style={{ color: "#f87171", flexShrink: 0 }} />
          ) : (
            <RefreshCw size={16} style={{ color: "#71717A", animation: "spin 1s linear infinite", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#FFF", margin: "0 0 2px" }}>
              {sessionInfo.status === "done"
                ? `Tracking selesai — ${sessionInfo.persons_found} orang teridentifikasi`
                : sessionInfo.status === "failed"
                ? `Tracking gagal: ${sessionInfo.error_msg || "error tidak diketahui"}`
                : `Menganalisis ${sessionInfo.recordings_to_analyze || "semua"} rekaman...`}
            </p>
            <p style={{ fontSize: 11, color: "#71717A", margin: 0 }}>
              {sessionInfo.status === "done"
                ? `${sessionInfo.recordings_analyzed} rekaman dianalisis dari berbagai kamera`
                : sessionInfo.status === "running"
                ? "AI sedang mengekstrak sidik jari wajah dan membandingkan lintas kamera"
                : "Sesi antri, akan dimulai sebentar"}
            </p>
          </div>
          <StatusBadge status={sessionInfo.status} />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 9, background: "rgba(42,10,10,0.4)", border: "1px solid #450a0a" }}>
          <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Orang Terdeteksi", value: persons.length,                              icon: Users },
          { label: "Total Kamera",     value: [...new Set(persons.flatMap(p => p.trail.map(t => t.camera_name)))].length, icon: Camera },
          { label: "Total Penampakan", value: persons.reduce((s, p) => s + p.trail.length, 0), icon: Eye },
        ].map(({ label, value, icon: Icon }, i) => (
          <div key={i} style={{ padding: "18px 20px", borderRadius: 10, background: "rgba(17,17,24,0.6)", border: "1px solid #1F1F2E" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "#0A0A0F", border: "1px solid #1A1A26", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={12} style={{ color: "#71717A" }} />
              </div>
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#FFF", letterSpacing: "-0.04em" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Daftar Orang ── */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <RefreshCw size={20} style={{ color: "#2D2D3F", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>Memuat data tracking...</p>
        </div>
      ) : persons.length === 0 ? (
        <div style={{
          padding: 48, textAlign: "center", borderRadius: 12,
          background: "rgba(17,17,24,0.4)", border: "1px dashed #1F1F2E",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#0A0A0F", border: "1px solid #1A1A26", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ScanFace size={24} style={{ color: "#2D2D3F" }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#FFF", margin: "0 0 8px" }}>Belum ada data tracking</p>
          <p style={{ fontSize: 12, color: "#71717A", margin: "0 0 20px", lineHeight: 1.7 }}>
            Klik <strong style={{ color: "#FFF" }}>Mulai Tracking</strong> untuk menjalankan AI.<br />
            AI akan menganalisis semua rekaman dan mengelompokkan orang yang sama<br />
            lintas kamera berdasarkan kemiripan wajah.
          </p>
          <button onClick={handleStartTracking} disabled={tracking} style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 8,
            background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            <ScanFace size={14} /> Mulai Tracking Sekarang
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#FFF" }}>Hasil Tracking</span>
            <span style={{ fontSize: 11, color: "#3D3D4F" }}>{persons.length} orang teridentifikasi · klik untuk melihat jejak</span>
          </div>
          {persons.map((p, i) => (
            <PersonCard key={p.person_id} person={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
