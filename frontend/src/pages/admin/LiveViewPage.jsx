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
      className="relative rounded-2xl overflow-hidden aspect-video group cursor-pointer"
      style={{
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${hovered ? `${s.color}55` : "var(--color-card-border)"}`,
        boxShadow: hovered
          ? `0 0 0 1px ${s.color}30, 0 10px 40px ${s.color}20`
          : "0 2px 8px rgba(0,0,0,0.12)",
        opacity: entered ? 1 : 0,
        transform: entered
          ? hovered
            ? "scale(1.015) translateY(-2px)"
            : "scale(1) translateY(0)"
          : "scale(0.94) translateY(18px)",
        transition: entered
          ? "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.35s ease"
          : `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.075}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.075}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: isOffline
            ? "var(--color-surface-elevated)"
            : "#02030d",
        }}
      >
        {isOffline ? (
          <div
            className="text-center space-y-2 transition-all duration-500"
            style={{ opacity: hovered ? 0.7 : 0.4 }}
          >
            <WifiOff
              size={28}
              className="mx-auto"
              style={{ color: "var(--color-text-sub)" }}
            />
            <p
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-sub)" }}
            >
              {t("liveView.offline")}
            </p>
            <p
              className="text-[10px]"
              style={{ color: "var(--color-text-sub)" }}
            >
              {cam.rtsp_url}
            </p>
          </div>
        ) : (
          <>
            {cam.stream_url && <HlsPlayer src={cam.stream_url} />}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
              }}
            />
            <div
              className="absolute left-0 right-0 h-px animate-scan pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${s.color}50 30%, ${s.color} 50%, ${s.color}50 70%, transparent 100%)`,
                opacity: 0.15,
              }}
            />
            {["tl", "tr", "bl", "br"].map((pos) => (
              <div
                key={pos}
                className="absolute pointer-events-none transition-all duration-400"
                style={{
                  width: 18,
                  height: 18,
                  top: pos.startsWith("t") ? 8 : "auto",
                  bottom: pos.startsWith("b") ? 8 : "auto",
                  left: pos.endsWith("l") ? 8 : "auto",
                  right: pos.endsWith("r") ? 8 : "auto",
                  borderTop: pos.startsWith("t")
                    ? `2px solid ${s.color}`
                    : "none",
                  borderBottom: pos.startsWith("b")
                    ? `2px solid ${s.color}`
                    : "none",
                  borderLeft: pos.endsWith("l")
                    ? `2px solid ${s.color}`
                    : "none",
                  borderRight: pos.endsWith("r")
                    ? `2px solid ${s.color}`
                    : "none",
                  opacity: hovered ? 0.85 : 0,
                  transform: hovered
                    ? "scale(1)"
                    : pos === "tl"
                      ? "translate(-4px,-4px)"
                      : pos === "tr"
                        ? "translate(4px,-4px)"
                        : pos === "bl"
                          ? "translate(-4px,4px)"
                          : "translate(4px,4px)",
                  transition:
                    "opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            ))}
            {isRecording && (
              <div
                className="absolute top-2.5 right-12 flex items-center gap-1.5 px-2.5 py-1 rounded-lg pointer-events-none"
                style={{
                  backgroundColor: "rgba(239,68,68,0.18)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-blink" />
                <span className="text-[9px] font-bold text-red-400 tracking-widest">
                  REC
                </span>
              </div>
            )}
          </>
        )}
        <div
          className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-300 pointer-events-none z-10"
          style={{
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(10px)",
            border: hovered
              ? `1px solid ${s.color}40`
              : "1px solid transparent",
          }}
        >
          {isLive ? (
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                style={{ backgroundColor: s.color }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: s.color }}
              />
            </span>
          ) : (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
          )}
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: s.color }}
          >
            {t(`dashboard.status.${s.label}`) || s.label}
          </span>
        </div>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          className="absolute top-2 right-2 p-1.5 rounded-lg z-10"
          style={{
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(10px)",
            color: hovered ? "#fff" : "#94a3b8",
            opacity: hovered ? 1 : 0,
            transform: hovered
              ? "scale(1) translateY(0)"
              : "scale(0.85) translateY(-4px)",
            transition:
              "opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Expand size={13} />}
        </button>
        {!isOffline && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md pointer-events-none z-10"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              opacity: hovered ? 1 : 0.5,
              transition: "opacity 0.3s ease",
            }}
          >
            <Clock size={9} style={{ color: s.color }} />
            <LiveClock />
          </div>
        )}
      </div>
        {/* Modern Overlay Bottom Bar */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16 flex items-end justify-between z-10 pointer-events-none">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/95 via-black/50 to-transparent -z-10" />
          
          <div className="relative z-10 flex flex-col justify-end">
            <p className="text-[14px] font-bold text-white drop-shadow-lg leading-none tracking-wide mb-1">
              {cam.name}
            </p>
            <p className="text-[11px] text-gray-300 font-medium drop-shadow-md leading-none">
              {cam.location}
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2">
            <span
              className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg leading-none"
              style={{
                color: "#fff",
                backgroundColor: isOffline ? "rgba(107,114,128,0.7)" : "rgba(16,185,129,0.85)",
                boxShadow: isOffline ? "0 2px 8px rgba(107,114,128,0.4)" : "0 2px 10px rgba(16,185,129,0.5)",
                backdropFilter: "blur(6px)",
              }}
            >
              {isOffline ? "OFFLINE" : "WebRTC"}
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
          <span
            className="flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0"
            style={{
              color: "#fff",
              backgroundColor: "#10b981",
              boxShadow: "0 2px 10px rgba(16,185,129,0.4)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-blink" />
            {liveCount} LIVE
          </span>
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
          className="flex items-center gap-1 p-1.5 rounded-2xl"
          style={{
            backgroundColor: "var(--color-surface)",
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
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200"
                style={{
                  ...(isActive
                    ? {
                        background: "linear-gradient(135deg,#06b6d4,#00ffff)",
                        color: "#fff",
                        boxShadow: "0 2px 12px rgba(6,182,212,0.45)",
                      }
                    : { color: "var(--color-text-sub)" }),
                }}
              >
                <IconComponent size={14} />
                <span>{item.label}</span>
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
