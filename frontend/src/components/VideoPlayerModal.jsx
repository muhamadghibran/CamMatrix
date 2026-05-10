import { X, Download, Play, Pause, Volume2, VolumeX, Maximize2, ScanFace, User, Clock, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";

/* Placeholder face detection results - ready for AI integration */
const mockFaceResults = [
  { id: 1, label: "Orang #1", confidence: 0.94, time: "00:03", known: false },
  { id: 2, label: "Orang #2", confidence: 0.87, time: "00:11", known: false },
  { id: 3, label: "Orang #3", confidence: 0.91, time: "00:22", known: false },
];

function FaceDetectionPanel({ isAnalyzing }) {
  return (
    <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", background: "#0A0A0F", borderLeft: "1px solid #1F1F2E" }}>
      {/* Panel header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #1F1F2E", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ScanFace size={13} style={{ color: "#71717A" }} />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>Analitik Wajah</p>
          <p style={{ fontSize: 10, color: "#71717A", margin: 0 }}>AI Face Detection</p>
        </div>
        {isAnalyzing && (
          <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", border: "1px solid #1F1F2E", color: "#71717A", letterSpacing: "0.06em" }}>
            MENUNGGU AI
          </span>
        )}
      </div>

      {/* Status banner */}
      <div style={{ margin: 12, padding: "10px 12px", borderRadius: 8, background: "#111118", border: "1px solid #1F1F2E" }}>
        <p style={{ fontSize: 11, color: "#71717A", margin: "0 0 4px", fontWeight: 600 }}>Status Integrasi AI</p>
        <p style={{ fontSize: 11, color: "#3D3D4F", margin: 0, lineHeight: 1.5 }}>
          Modul deteksi wajah siap diintegrasikan. Hubungkan endpoint AI untuk hasil real-time.
        </p>
      </div>

      {/* Face results list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#71717A", letterSpacing: "0.07em", textTransform: "uppercase", margin: "8px 0 8px" }}>
          Deteksi ({mockFaceResults.length})
        </p>
        {mockFaceResults.map((face, i) => (
          <div key={face.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "#111118", border: "1px solid #1A1A26", marginBottom: 6, opacity: 0.5 }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: "#0A0A0F", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <User size={14} style={{ color: "#3D3D4F" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#71717A", margin: "0 0 2px" }}>{face.label}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 99, background: "#1F1F2E" }}>
                  <div style={{ width: `${face.confidence * 100}%`, height: "100%", borderRadius: 99, background: "#2D2D3F" }} />
                </div>
                <span style={{ fontSize: 10, color: "#3D3D4F", fontFamily: "monospace" }}>{Math.round(face.confidence * 100)}%</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: "#3D3D4F", fontFamily: "monospace", flexShrink: 0 }}>{face.time}</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#2D2D3F", textAlign: "center", marginTop: 12 }}>
          Hasil akan muncul setelah AI aktif
        </p>
      </div>
    </div>
  );
}

export default function VideoPlayerModal({ rec, onClose, onDownload }) {
  const videoRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [muted, setMuted]       = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCT]    = useState(0);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause(); else v.play();
    setPlaying(!playing);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(Math.floor(s % 60)).padStart(2,"0")}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.9)", backdropFilter: "blur(16px)", padding: 24 }}
      onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 1000, borderRadius: 14, overflow: "hidden", background: "#0D0D14", border: "1px solid #1F1F2E", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", margin: "0 0 2px" }}>{rec.camera}</p>
            <p style={{ fontSize: 11, color: "#71717A", margin: 0, fontFamily: "monospace" }}>{rec.date} · {rec.start} – {rec.end} · {rec.size}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => onDownload(rec)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 7, background: "#FFFFFF", color: "#0A0A0F", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <Download size={13} /> Unduh
            </button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 7, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.color = "#FFF"} onMouseLeave={e => e.currentTarget.style.color = "#71717A"}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content: Video + Analytics */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Video area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#000" }}>
            {/* Video */}
            <div style={{ position: "relative", aspectRatio: "16/9", background: "#050508", cursor: "pointer" }} onClick={togglePlay}>
              {rec.video_url ? (
                <video ref={videoRef} src={rec.video_url} muted={muted} style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  onTimeUpdate={e => { setCT(e.target.currentTime); setProgress(e.target.currentTime / e.target.duration * 100); }}
                  onLoadedMetadata={e => setDuration(e.target.duration)}
                  onEnded={() => setPlaying(false)} />
              ) : (
                /* Placeholder when no video URL yet */
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Play size={24} style={{ color: "#71717A" }} />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "#71717A", fontWeight: 600, margin: "0 0 4px" }}>Video siap diputar</p>
                    <p style={{ fontSize: 11, color: "#3D3D4F", margin: 0 }}>Hubungkan endpoint video dari backend</p>
                  </div>
                </div>
              )}
              {/* Play/pause overlay */}
              {!rec.video_url && null}
            </div>

            {/* Controls */}
            <div style={{ padding: "12px 16px", background: "#0A0A0F", borderTop: "1px solid #1F1F2E" }}>
              {/* Progress bar */}
              <div style={{ height: 3, borderRadius: 99, background: "#1F1F2E", marginBottom: 12, cursor: "pointer", position: "relative" }}
                onClick={e => {
                  if (!videoRef.current || !duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  videoRef.current.currentTime = pct * duration;
                }}>
                <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: "#FFFFFF", transition: "width 0.1s" }} />
              </div>
              {/* Control buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={togglePlay} style={{ width: 32, height: 32, borderRadius: 7, background: "#1F1F2E", border: "none", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={() => setMuted(m => !m)} style={{ width: 32, height: 32, borderRadius: 7, background: "transparent", border: "1px solid #1F1F2E", color: "#71717A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#71717A", marginLeft: 4 }}>
                  {fmt(currentTime)} / {fmt(duration || 0)}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "#3D3D4F", padding: "3px 8px", borderRadius: 5, background: "#111118", border: "1px solid #1A1A26" }}>{rec.duration}</span>
              </div>
            </div>
          </div>

          {/* Face Analytics Panel */}
          <FaceDetectionPanel isAnalyzing={playing} />
        </div>
      </div>
    </div>
  );
}
