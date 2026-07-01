import { useState, useEffect, useRef } from "react";
import {
  ScanFace, Play, RefreshCw, Trash2, ChevronRight,
  Camera, Clock, Users, AlertCircle, CheckCircle2, Eye,
  Radio, Video
} from "lucide-react";
import api from "../../utils/api";
import { API_BASE_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";

const BASE = API_BASE_URL;
const token = () => useAuthStore.getState().token || "";

// Deteksi apakah sighting berasal dari live stream (recording_id = null)
// dan apakah timestamp-nya Unix epoch (bukan detik dalam video)
const isLiveSighting = (step) => step.recording_id == null;

const isSeenRecently = (step) => {
  if (!isLiveSighting(step)) return false;
  const lastTs = step.last_timestamp_sec;
  if (!lastTs || lastTs < 1_000_000_000) return false; // bukan unix timestamp
  return (Date.now() / 1000 - lastTs) < 90; // terlihat dalam 90 detik terakhir
};

const fmtTs = (s) => {
  if (!s && s !== 0) return "—";
  // Unix timestamp (detik sejak epoch)
  if (s > 1_000_000_000) {
    const d = new Date(s * 1000);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  // Detik dalam video
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const fmtDate = (s) => {
  if (!s || s < 1_000_000_000) return null;
  const d = new Date(s * 1000);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

/* ── Styles ── */
const styles = `
  @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes livePulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  .fa-card { animation: fadeIn 0.3s ease both; }
`;

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

/* ── Live dot ── */
function LiveDot() {
  return (
    <span style={{
      display: "inline-block",
      width: 6, height: 6, borderRadius: "50%",
      background: "#4ade80",
      animation: "livePulse 1.4s ease-in-out infinite",
      flexShrink: 0,
    }} />
  );
}

/* ── Camera Trail Step ── */
function TrailStep({ step, isLast }) {
  const live      = isLiveSighting(step);
  const seenNow   = isSeenRecently(step);
  const dotColor  = seenNow ? "#4ade80" : live ? "#60a5fa" : "#71717A";
  const borderClr = seenNow ? "rgba(74,222,128,0.3)" : live ? "rgba(96,165,250,0.2)" : "#1F1F2E";

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 12 }}>
        {/* Dot */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: seenNow ? "rgba(74,222,128,0.08)" : "#111118",
          border: `1px solid ${borderClr}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {live
            ? <Radio size={11} style={{ color: dotColor }} />
            : <Video size={11} style={{ color: dotColor }} />
          }
        </div>
        {/* Connector */}
        {!isLast && <div style={{ width: 1, flex: 1, minHeight: 20, background: "#1F1F2E", margin: "4px 0" }} />}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>
            {step.camera_name || `Kamera #${step.camera_id}`}
          </span>
          {/* Badge LIVE / REC */}
          {seenNow ? (
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              padding: "2px 6px", borderRadius: 4,
              background: "rgba(74,222,128,0.12)", color: "#4ade80",
              border: "1px solid rgba(74,222,128,0.25)",
            }}>
              <LiveDot /> LIVE SEKARANG
            </span>
          ) : live ? (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              padding: "2px 6px", borderRadius: 4,
              background: "rgba(96,165,250,0.1)", color: "#60a5fa",
              border: "1px solid rgba(96,165,250,0.2)",
            }}>
              LIVE
            </span>
          ) : (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              padding: "2px 6px", borderRadius: 4,
              background: "#0A0A0F", color: "#3D3D4F",
              border: "1px solid #1A1A26",
            }}>
              REKAMAN
            </span>
          )}
          <span style={{ fontSize: 10, color: "#3D3D4F" }}>Langkah {step.step}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Thumbnail */}
          {step.thumbnail ? (
            <img src={`data:image/jpeg;base64,${step.thumbnail}`}
              alt="" style={{
                width: 44, height: 44, borderRadius: 7, objectFit: "cover",
                border: `1px solid ${seenNow ? "rgba(74,222,128,0.3)" : "#1F1F2E"}`,
                flexShrink: 0,
              }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 7, background: "#0A0A0F",
              border: "1px solid #1A1A26", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <ScanFace size={16} style={{ color: "#2D2D3F" }} />
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#71717A" }}>
              <Clock size={10} />
              {live ? (
                <span>
                  {fmtDate(step.first_timestamp_sec) && (
                    <span style={{ color: "#52525B", marginRight: 4 }}>{fmtDate(step.first_timestamp_sec)}</span>
                  )}
                  {fmtTs(step.first_timestamp_sec)} – {fmtTs(step.last_timestamp_sec)}
                </span>
              ) : (
                <span>{fmtTs(step.first_timestamp_sec)} – {fmtTs(step.last_timestamp_sec)}</span>
              )}
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
function PersonCard({ person, index, now }) {
  const [expanded, setExpanded] = useState(false);
  const cameraNames = [...new Set(person.trail.map(t => t.camera_name || `Kamera ${t.camera_id}`))];

  // Cek apakah orang ini sedang terlihat sekarang (di live stream)
  const currentlyLive = person.trail.some(t => isSeenRecently({ ...t, last_timestamp_sec: t.last_timestamp_sec }));
  const hasLive       = person.trail.some(t => isLiveSighting(t));

  return (
    <div
      className="fa-card"
      style={{
        borderRadius: 10,
        background: currentlyLive ? "rgba(10,20,15,0.9)" : "#111118",
        border: `1px solid ${currentlyLive ? "rgba(74,222,128,0.25)" : "#1A1A26"}`,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: currentlyLive ? "0 0 0 1px rgba(74,222,128,0.1)" : "none",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = currentlyLive ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = currentlyLive ? "rgba(74,222,128,0.25)" : "#1A1A26";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
        onClick={() => setExpanded(v => !v)}>
        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {person.first_thumbnail ? (
            <img src={`data:image/jpeg;base64,${person.first_thumbnail}`}
              alt="" style={{
                width: 48, height: 48, borderRadius: 10, objectFit: "cover",
                border: `1px solid ${currentlyLive ? "rgba(74,222,128,0.3)" : "#1F1F2E"}`,
              }} />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: 10, background: "#0A0A0F",
              border: "1px solid #1A1A26", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ScanFace size={20} style={{ color: "#2D2D3F" }} />
            </div>
          )}
          {/* Live indicator dot on avatar */}
          {currentlyLive && (
            <span style={{
              position: "absolute", bottom: 2, right: 2,
              width: 10, height: 10, borderRadius: "50%",
              background: "#4ade80",
              border: "2px solid #0A0A0F",
              animation: "livePulse 1.4s ease-in-out infinite",
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#FFF" }}>Orang #{index + 1}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3,
              background: "#0A0A0F", border: "1px solid #1A1A26", color: "#3D3D4F",
            }}>ID {person.person_id}</span>
            {/* Badge status */}
            {currentlyLive && (
              <span style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                padding: "2px 6px", borderRadius: 4,
                background: "rgba(74,222,128,0.12)", color: "#4ade80",
                border: "1px solid rgba(74,222,128,0.25)",
              }}>
                <LiveDot /> LIVE
              </span>
            )}
            {!currentlyLive && hasLive && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                padding: "2px 6px", borderRadius: 4,
                background: "rgba(96,165,250,0.08)", color: "#60a5fa",
                border: "1px solid rgba(96,165,250,0.18)",
              }}>
                PERNAH LIVE
              </span>
            )}
          </div>

          {/* Camera trail summary */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            {cameraNames.map((cam, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{
                  fontSize: 10, color: "#71717A", padding: "1px 6px", borderRadius: 4,
                  background: "#0A0A0F", border: "1px solid #1A1A26",
                }}>
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
          <ChevronRight size={14} style={{
            color: "#3D3D4F",
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 0.2s",
          }} />
        </div>
      </div>

      {/* Trail Detail */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1A1A26" }}>
          <p style={{ fontSize: 11, color: "#3D3D4F", margin: "12px 0 16px" }}>
            Perjalanan orang ini terdeteksi di{" "}
            <strong style={{ color: "#71717A" }}>{person.trail.length}</strong> penampakan berbeda
            {hasLive && (
              <span style={{ color: "#60a5fa" }}> · termasuk live stream</span>
            )}
          </p>
          {person.trail.map((step, i) => (
            <TrailStep key={i} step={step} isLast={i === person.trail.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Live Stats Bar ── */
function LiveStatsBar({ persons }) {
  const liveNow    = persons.filter(p => p.trail.some(t => isSeenRecently(t)));
  const totalCams  = [...new Set(persons.flatMap(p => p.trail.map(t => t.camera_name)))].length;
  const totalSight = persons.reduce((s, p) => s + p.trail.length, 0);
  const liveSight  = persons.reduce((s, p) => s + p.trail.filter(t => isLiveSighting(t)).length, 0);

  const stats = [
    { label: "Orang Terdeteksi",  value: persons.length,  icon: Users,  live: false },
    { label: "Sedang Live",       value: liveNow.length,  icon: Radio,  live: true  },
    { label: "Total Kamera",      value: totalCams,        icon: Camera, live: false },
    { label: "Total Penampakan",  value: totalSight,       icon: Eye,    live: false },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {stats.map(({ label, value, icon: Icon, live }, i) => (
        <div key={i} style={{
          padding: "16px 18px", borderRadius: 10,
          background: live && value > 0 ? "rgba(10,20,15,0.8)" : "rgba(17,17,24,0.6)",
          border: `1px solid ${live && value > 0 ? "rgba(74,222,128,0.2)" : "#1F1F2E"}`,
          transition: "border-color 0.3s",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: live && value > 0 ? "#4ade80" : "#71717A",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>{label}</span>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: live && value > 0 ? "rgba(74,222,128,0.1)" : "#0A0A0F",
              border: `1px solid ${live && value > 0 ? "rgba(74,222,128,0.2)" : "#1A1A26"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={11} style={{ color: live && value > 0 ? "#4ade80" : "#71717A" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em",
              color: live && value > 0 ? "#4ade80" : "#FFF",
            }}>{value}</span>
            {live && value > 0 && <LiveDot />}
          </div>
        </div>
      ))}
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
  const [now,         setNow]         = useState(Date.now());
  const [lastRefresh, setLastRefresh] = useState(null);
  const pollRef      = useRef(null);
  const autoRefRef   = useRef(null);

  const headers = { Authorization: `Bearer ${token()}` };

  const fetchPersons = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${BASE}/ai/persons`, { headers });
      if (res.ok) {
        setPersons(await res.json());
        setLastRefresh(new Date());
      }
    } catch (e) { /* silent */ }
    finally { if (!silent) setLoading(false); }
  };

  // Refresh now-clock setiap 15 detik agar badge "LIVE SEKARANG" akurat
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh data setiap 15 detik (silent)
  useEffect(() => {
    fetchPersons();
    autoRefRef.current = setInterval(() => fetchPersons(true), 15_000);
    return () => {
      clearInterval(autoRefRef.current);
      clearInterval(pollRef.current);
    };
  }, []);

  // ── Polling status sesi tracking ──
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

  // ── Mulai tracking rekaman ──
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

  // Orang yang sedang live — tampilkan di atas
  const livePersons  = persons.filter(p => p.trail.some(t => isSeenRecently(t)));
  const otherPersons = persons.filter(p => !p.trail.some(t => isSeenRecently(t)));
  const sortedPersons = [...livePersons, ...otherPersons];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{styles}</style>

      {/* ── Header + Actions ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#FFF", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Tracking Lintas Kamera
          </h2>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>
            AI mendeteksi orang yang sama di berbagai kamera dan membangun jejak perjalanannya
            {lastRefresh && (
              <span style={{ color: "#3D3D4F", marginLeft: 8 }}>
                · diperbarui {lastRefresh.toLocaleTimeString("id-ID")}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Refresh manual */}
          <button onClick={() => fetchPersons()} title="Refresh" style={{
            width: 34, height: 34, borderRadius: 8, background: "transparent",
            border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#2D2D3F"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#71717A"; e.currentTarget.style.borderColor = "#1F1F2E"; }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>

          {/* Auto-refresh indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 12px", borderRadius: 8,
            background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)",
            fontSize: 11, fontWeight: 600, color: "#4ade80",
          }}>
            <LiveDot /> Auto-refresh 15s
          </div>

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
              : <><ScanFace size={13} /> Analisis Rekaman</>}
          </button>
        </div>
      </div>

      {/* ── Info: real-time tracking berjalan otomatis ── */}
      <div style={{
        padding: "12px 16px", borderRadius: 10,
        background: "rgba(10,18,30,0.7)", border: "1px solid rgba(96,165,250,0.2)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Radio size={14} style={{ color: "#60a5fa", flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "#71717A", margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: "#93c5fd" }}>Tracking live stream aktif otomatis</strong>{" "}
          — saat AI Detection dinyalakan di halaman Live View, setiap wajah yang terdeteksi
          langsung dicocokkan dan dicatat di sini secara real-time. Data diperbarui setiap 15 detik.
        </p>
      </div>

      {/* ── Status Sesi Tracking Rekaman ── */}
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
                ? `Analisis rekaman selesai — ${sessionInfo.persons_found} orang teridentifikasi`
                : sessionInfo.status === "failed"
                ? `Analisis gagal: ${sessionInfo.error_msg || "error tidak diketahui"}`
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

      {/* ── Live Stats ── */}
      <LiveStatsBar persons={persons} />

      {/* ── Daftar Orang ── */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <RefreshCw size={20} style={{ color: "#2D2D3F", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>Memuat data tracking...</p>
        </div>
      ) : sortedPersons.length === 0 ? (
        <div style={{
          padding: 48, textAlign: "center", borderRadius: 12,
          background: "rgba(17,17,24,0.4)", border: "1px dashed #1F1F2E",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: "#0A0A0F",
            border: "1px solid #1A1A26", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px",
          }}>
            <ScanFace size={24} style={{ color: "#2D2D3F" }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#FFF", margin: "0 0 8px" }}>Belum ada data tracking</p>
          <p style={{ fontSize: 12, color: "#71717A", margin: "0 0 20px", lineHeight: 1.7 }}>
            Aktifkan <strong style={{ color: "#FFF" }}>AI Detection</strong> di halaman Live View agar wajah dari
            live stream otomatis dicocokkan dan muncul di sini.<br />
            Atau, klik <strong style={{ color: "#FFF" }}>Analisis Rekaman</strong> untuk memproses video yang sudah tersimpan.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleStartTracking} disabled={tracking} style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 8,
              background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              <ScanFace size={14} /> Analisis Rekaman
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#FFF" }}>Hasil Tracking</span>
            <span style={{ fontSize: 11, color: "#3D3D4F" }}>
              {sortedPersons.length} orang · {livePersons.length > 0 && (
                <span style={{ color: "#4ade80" }}>{livePersons.length} live sekarang · </span>
              )}
              klik untuk melihat jejak
            </span>
          </div>

          {/* Live section header */}
          {livePersons.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
            }}>
              <LiveDot />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: "0.04em" }}>
                TERDETEKSI SEKARANG ({livePersons.length})
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(74,222,128,0.15)" }} />
            </div>
          )}

          {livePersons.map((p, i) => (
            <PersonCard key={p.person_id} person={p} index={i} now={now} />
          ))}

          {/* Divider antara live dan lainnya */}
          {livePersons.length > 0 && otherPersons.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#3D3D4F", letterSpacing: "0.04em" }}>
                RIWAYAT ({otherPersons.length})
              </span>
              <div style={{ flex: 1, height: 1, background: "#1A1A26" }} />
            </div>
          )}

          {otherPersons.map((p, i) => (
            <PersonCard key={p.person_id} person={p} index={livePersons.length + i} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
