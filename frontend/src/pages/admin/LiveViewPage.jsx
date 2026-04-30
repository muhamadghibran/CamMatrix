import { useState, useRef, useEffect } from "react";
import {
  Maximize2,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Camera,
  WifiOff,
  Expand,
  Minimize2,
  Clock,
  RefreshCw,
} from "lucide-react";
import Hls from "hls.js";
import { useLanguageStore } from "../../store/languageStore";
import { useCameraStore } from "../../store/cameraStore";
import AnimatedText from "../../components/AnimatedText";
const gridLayouts = [
  { key: "1x1", icon: Maximize2, cols: 1, label: "1×1" },
  { key: "2x2", icon: Grid2X2, cols: 2, label: "2×2" },
  { key: "3x3", icon: Grid3X3, cols: 3, label: "3×3" },
  { key: "4x4", icon: LayoutGrid, cols: 4, label: "4×4" },
];
const statusCfg = {
  live: { color: "#10b981", label: "live", glow: "rgba(16,185,129,0.5)" },
  offline: {
    color: "#6b7280",
    label: "offline",
    glow: "rgba(107,114,128,0.4)",
  },
  recording: {
    color: "#ef4444",
    label: "recording",
    glow: "rgba(239,68,68,0.5)",
  },
};
function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("id-ID", { hour12: false }),
  );
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString("id-ID", { hour12: false })),
      1000,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="font-mono text-[11px]"
      style={{ color: "#06b6d4", letterSpacing: "0.08em" }}
    >
      {time}
    </span>
  );
}
function HlsPlayer({ src }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        enableWorker: true,
        startPosition: -1,
        liveSyncDuration: 2,
        liveMaxLatencyDuration: 8,
        liveDurationInfinity: true,
        maxBufferLength: 20,
        maxMaxBufferLength: 30,
        backBufferLength: 5,
        maxBufferHole: 0.5,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setTimeout(() => {
            hls.loadSource(src);
            hls.startLoad();
          }, 3000);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.play().catch(() => {});
    }
    return () => {
      hlsRef.current?.destroy();
    };
  }, [src]);
  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full"
      style={{ objectFit: "cover", backgroundColor: "#000" }}
      muted
      playsInline
      autoPlay
    />
  );
}
function CameraCell({ cam, t, index }) {
  const [hovered, setHovered] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [entered, setEntered] = useState(false);
  const cellRef = useRef(null);
  const camStatus = cam.status || "offline";
  const s = statusCfg[camStatus] || statusCfg.offline;
  const isOffline = camStatus === "offline";
  const isRecording = camStatus === "recording";
  const isLive = camStatus === "live";
  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 80 + index * 75);
    return () => clearTimeout(timer);
  }, [index]);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cellRef.current
        ?.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };
  return (
    <div
      ref={cellRef}
      className="relative rounded-xl overflow-hidden aspect-video cursor-pointer"
      style={{
        backgroundColor: "#0a0f1e",
        border: `1px solid ${hovered ? `${s.color}40` : "rgba(255,255,255,0.06)"}`,
        boxShadow: hovered
          ? `0 0 0 1px ${s.color}20, 0 8px 32px rgba(0,0,0,0.5)`
          : "0 4px 16px rgba(0,0,0,0.4)",
        opacity: entered ? 1 : 0,
        transform: entered
          ? hovered
            ? "scale(1.012) translateY(-1px)"
            : "scale(1) translateY(0)"
          : "scale(0.95) translateY(12px)",
        transition: entered
          ? "opacity 0.4s ease, transform 0.35s ease, border-color 0.2s ease, box-shadow 0.3s ease"
          : `opacity 0.5s ease ${index * 0.07}s, transform 0.5s ease ${index * 0.07}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background / Video area */}
      {isOffline ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: "#0d1117" }}
        >
          <WifiOff size={24} style={{ color: "#374151", opacity: 0.8 }} />
          <p className="text-xs font-semibold" style={{ color: "#374151" }}>
            {t("liveView.offline")}
          </p>
        </div>
      ) : (
        <>
          {cam.stream_url && <HlsPlayer src={cam.stream_url} />}
          {isRecording && (
            <div
              className="absolute top-3 right-10 flex items-center gap-1.5 px-2 py-1 rounded-md pointer-events-none z-10"
              style={{
                backgroundColor: "rgba(239,68,68,0.85)",
                backdropFilter: "blur(4px)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-blink" />
              <span className="text-[9px] font-bold text-white tracking-widest">REC</span>
            </div>
          )}
        </>
      )}

      {/* TOP LEFT — Status badge */}
      <div
        className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md z-10 pointer-events-none"
        style={{
          backgroundColor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
        }}
      >
        {isLive ? (
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: s.color }}
            />
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ backgroundColor: s.color }}
            />
          </span>
        ) : (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: s.color }}
          />
        )}
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: s.color }}
        >
          {t(`dashboard.status.${s.label}`) || s.label}
        </span>
      </div>

      {/* TOP RIGHT — Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
        className="absolute top-3 right-3 p-1.5 rounded-md z-10"
        style={{
          backgroundColor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          color: "#9ca3af",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "scale(1)" : "scale(0.8)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {isFullscreen ? <Minimize2 size={12} /> : <Expand size={12} />}
      </button>

      {/* BOTTOM GRADIENT OVERLAY — Camera info always inside card */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
          padding: "32px 12px 12px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        {/* Camera name + location */}
        <div style={{ minWidth: 0, flexShrink: 1, marginRight: 8 }}>
          <p
            className="font-semibold text-white truncate"
            style={{ fontSize: 13, lineHeight: 1.3, marginBottom: 2 }}
          >
            {cam.name}
          </p>
          <p
            className="truncate"
            style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.2 }}
          >
            {cam.location}
          </p>
        </div>

        {/* Status pill + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {!isOffline && <LiveClock />}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: isOffline ? "#6b7280" : "#f0fdf4",
              backgroundColor: isOffline ? "rgba(55,65,81,0.8)" : "rgba(16,185,129,0.8)",
              backdropFilter: "blur(4px)",
              padding: "3px 8px",
              borderRadius: 6,
              letterSpacing: "0.05em",
              lineHeight: 1.5,
            }}
          >
            {isOffline ? "OFFLINE" : "LIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
export default function LiveViewPage() {
  const [layout, setLayout] = useState("2x2");
  const { t } = useLanguageStore();
  const { cameras, fetchCameras, fetchStatuses, isLoading } = useCameraStore();
  useEffect(() => {
    fetchCameras();
    const interval = setInterval(() => fetchStatuses(), 15000);
    return () => clearInterval(interval);
  }, [fetchCameras, fetchStatuses]);
  const currentLayout = gridLayouts.find((l) => l.key === layout);
  const cols = currentLayout?.cols || 2;
  const visibleCameras =
    layout === "1x1"
      ? cameras.slice(0, 1)
      : layout === "2x2"
        ? cameras.slice(0, 4)
        : layout === "3x3"
          ? cameras.slice(0, 9)
          : cameras;
  const liveCount = cameras.filter(
    (c) => c.status === "live" || c.status === "recording",
  ).length;
  return (
    <div className="flex flex-col gap-5 h-full relative z-10 w-full">
      <div className="flex items-center justify-between   shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 text-[13px] font-semibold"
            style={{ color: "var(--color-text-base)" }}
          >
            <AnimatedText
              text={t("liveView.showing", {
                visible: visibleCameras.length,
                total: cameras.length,
              })}
              delayOffset={200}
              splitBy="word"
            />
          </div>
          <div
            className="flex items-center gap-2 text-[12px]"
            style={{ color: "var(--color-text-sub)" }}
          >
            <span
              className="w-2 h-2 rounded-full animate-blink"
              style={{ backgroundColor: liveCount > 0 ? "#34d399" : "#4b5563" }}
            />
            <span style={{ color: liveCount > 0 ? "var(--color-text-base)" : "var(--color-text-sub)" }}>
              {liveCount} online
            </span>
          </div>
          <button
            onClick={() => {
              fetchCameras();
            }}
            className="p-1.5 rounded-xl transition-all duration-200"
            style={{
              color: "var(--color-text-sub)",
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-card-border)",
            }}
            title="Refresh status kamera"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        <div
          className="flex items-center p-1 rounded-xl gap-0.5"
          style={{
            backgroundColor: "var(--color-surface-elevated)",
            border: "1px solid var(--color-card-border)",
          }}
        >
          {gridLayouts.map((item) => {
            const isActive = layout === item.key;
            const IconComponent = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setLayout(item.key)}
                title={item.label}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
                style={{
                  color: isActive ? "var(--color-text-base)" : "var(--color-text-sub)",
                  backgroundColor: isActive ? "var(--color-surface)" : "transparent",
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.25)" : "none",
                }}
              >
                <IconComponent size={14} />
              </button>
            );
          })}
        </div>
      </div>
      {cameras.length === 0 && !isLoading && (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4"
          style={{ color: "var(--color-text-sub)" }}
        >
          <Camera size={48} style={{ opacity: 0.3 }} />
          <p className="text-sm font-semibold">Belum ada kamera terdaftar.</p>
          <p className="text-[12px]">
            Tambahkan kamera RTSP terlebih dahulu di menu{" "}
            <strong>Kamera</strong>.
          </p>
        </div>
      )}
      {cameras.length > 0 && (
        <div
          className="grid gap-4 flex-1 pb-4 overflow-y-auto min-h-0 pr-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {visibleCameras.map((cam, index) => (
            <CameraCell
              key={`${layout}-${cam.id}`}
              cam={cam}
              t={t}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
