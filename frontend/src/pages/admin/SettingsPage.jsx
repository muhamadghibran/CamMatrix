import {
  Bell,
  Shield,
  Database,
  Cpu,
  Globe,
  Save,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLanguageStore } from "../../store/languageStore";

/* ─── Keyframe injection ────────────────────────────────────────── */
const ANIM_CSS = `
@keyframes cfg-float {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-18px); }
}
@keyframes cfg-gear-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes cfg-gear-spin-rev {
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
}
@keyframes cfg-orbit-0 {
  from { transform: rotate(0deg)   translateX(110px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
}
@keyframes cfg-orbit-1 {
  from { transform: rotate(72deg)  translateX(110px) rotate(-72deg); }
  to   { transform: rotate(432deg) translateX(110px) rotate(-432deg); }
}
@keyframes cfg-orbit-2 {
  from { transform: rotate(144deg) translateX(110px) rotate(-144deg); }
  to   { transform: rotate(504deg) translateX(110px) rotate(-504deg); }
}
@keyframes cfg-orbit-3 {
  from { transform: rotate(216deg) translateX(110px) rotate(-216deg); }
  to   { transform: rotate(576deg) translateX(110px) rotate(-576deg); }
}
@keyframes cfg-orbit-4 {
  from { transform: rotate(288deg) translateX(110px) rotate(-288deg); }
  to   { transform: rotate(648deg) translateX(110px) rotate(-648deg); }
}
@keyframes cfg-pulse-ring {
  0%   { transform: scale(0.85); opacity: 0.5; }
  50%  { transform: scale(1.05); opacity: 0.15; }
  100% { transform: scale(0.85); opacity: 0.5; }
}
@keyframes cfg-dash-spin {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -200; }
}
`;

function InjectStyle() {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "cfg-anim-style";
    el.textContent = ANIM_CSS;
    if (!document.getElementById("cfg-anim-style")) {
      document.head.appendChild(el);
    }
    return () => {
      const existing = document.getElementById("cfg-anim-style");
      if (existing) existing.remove();
    };
  }, []);
  return null;
}

/* ─── Settings Illustration ─────────────────────────────────────── */
const ORBIT_ICONS = [
  { Icon: Globe,    color: "#94a3b8", bg: "rgba(148,163,184,0.1)", anim: "cfg-orbit-0" },
  { Icon: Bell,     color: "#94a3b8", bg: "rgba(148,163,184,0.1)", anim: "cfg-orbit-1" },
  { Icon: Cpu,      color: "#94a3b8", bg: "rgba(148,163,184,0.1)", anim: "cfg-orbit-2" },
  { Icon: Database, color: "#94a3b8", bg: "rgba(148,163,184,0.1)", anim: "cfg-orbit-3" },
  { Icon: Shield,   color: "#94a3b8", bg: "rgba(148,163,184,0.1)", anim: "cfg-orbit-4" },
];

function SettingsIllustration() {
  return (
    <div
      style={{
        position: "relative",
        width: 300,
        height: 300,
        flexShrink: 0,
        animation: "cfg-float 6s ease-in-out infinite",
      }}
    >
      {/* SVG orbit ring (dashed) */}
      <svg
        width="300"
        height="300"
        style={{ position: "absolute", top: 0, left: 0, opacity: 0.12 }}
      >
        <circle
          cx="150"
          cy="150"
          r="110"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="6 6"
          style={{ animation: "cfg-dash-spin 20s linear infinite" }}
        />
      </svg>

      {/* Pulse rings */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 88,
          height: 88,
          marginLeft: -44,
          marginTop: -44,
          borderRadius: "50%",
          border: "1px solid rgba(148,163,184,0.3)",
          animation: "cfg-pulse-ring 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 120,
          height: 120,
          marginLeft: -60,
          marginTop: -60,
          borderRadius: "50%",
          border: "1px solid rgba(148,163,184,0.15)",
          animation: "cfg-pulse-ring 3s ease-in-out 1s infinite",
        }}
      />

      {/* Central gear */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 72,
          height: 72,
          marginLeft: -36,
          marginTop: -36,
          borderRadius: "50%",
          backgroundColor: "var(--color-surface-elevated)",
          border: "1px solid var(--color-card-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Settings
          size={32}
          style={{
            color: "var(--color-text-sub)",
            animation: "cfg-gear-spin 12s linear infinite",
          }}
        />
      </div>

      {/* Inner small gear */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 30,
          height: 30,
          marginLeft: 18,
          marginTop: 18,
          borderRadius: "50%",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-card-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.6,
        }}
      >
        <Settings
          size={14}
          style={{
            color: "var(--color-text-sub)",
            animation: "cfg-gear-spin-rev 8s linear infinite",
          }}
        />
      </div>

      {/* Orbiting icons */}
      {ORBIT_ICONS.map(({ Icon, color, bg, anim }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 0,
            height: 0,
            animation: `${anim} ${14 + i * 2}s linear infinite`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              marginLeft: -18,
              marginTop: -18,
              borderRadius: "50%",
              backgroundColor: bg,
              border: "1px solid var(--color-card-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <Icon size={15} style={{ color }} />
          </div>
        </div>
      ))}

      {/* Label below */}
      <div
        style={{
          position: "absolute",
          bottom: -40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 11,
          color: "var(--color-text-sub)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          opacity: 0.5,
        }}
      >
        System Configuration
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────── */
function SectionCard({ icon: Icon, title, children }) {
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-card-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          borderBottom: "1px solid var(--color-card-border)",
          backgroundColor: "var(--color-surface-elevated)",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-surface)",
            flexShrink: 0,
          }}
        >
          <Icon size={14} style={{ color: "var(--color-text-sub)" }} />
        </div>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-base)", margin: 0 }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: "0 20px" }}>{children}</div>
    </div>
  );
}

function SettingRow({ label, desc, children, noBorder = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 0",
        borderBottom: noBorder ? "none" : "1px solid var(--color-card-border)",
        gap: 16,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-base)", margin: 0 }}>
          {label}
        </p>
        {desc && (
          <p style={{ fontSize: 12, color: "var(--color-text-sub)", margin: "3px 0 0" }}>
            {desc}
          </p>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        width: 42,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        padding: 3,
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: checked ? "#4b5563" : "var(--color-surface-elevated)",
        outline: "1px solid var(--color-card-border)",
        transition: "background-color 0.2s",
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: checked ? "#e5e7eb" : "#6b7280",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.2s, background-color 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

function StyledSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        outline: "none",
        cursor: "pointer",
        minWidth: 160,
        backgroundColor: "var(--color-surface-elevated)",
        border: "1px solid var(--color-card-border)",
        color: "var(--color-text-base)",
      }}
    >
      {children}
    </select>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguageStore();
  const [saved, setSaved]             = useState(false);
  const [notifFace, setNotifFace]     = useState(true);
  const [notifCamera, setNotifCamera] = useState(true);
  const [notifStorage, setNotifStorage] = useState(false);
  const [aiDevice, setAiDevice]       = useState("auto");
  const [aiFrameRate, setAiFrameRate] = useState("balanced");
  const [aiConfidence, setAiConfidence] = useState("balanced");
  const [recChunk, setRecChunk]       = useState("30min");
  const [autoDelete, setAutoDelete]   = useState(true);
  const [retention, setRetention]     = useState("30d");
  const [twoFA, setTwoFA]             = useState(false);
  const [sessionDur, setSessionDur]   = useState("8hr");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <InjectStyle />

      {/* Two-column layout: settings left, illustration right */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 60,
          width: "100%",
          paddingBottom: 40,
        }}
      >
        {/* ── LEFT: Settings content ── */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 620 }}>

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-base)", margin: 0 }}>
              {t("settings.title")}
            </h1>
            <p style={{ fontSize: 13, color: "var(--color-text-sub)", margin: "6px 0 0" }}>
              {t("settings.subtitle")}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Language */}
            <SectionCard icon={Globe} title={t("settings.sections.language")}>
              <SettingRow label={t("settings.language.label")} desc={t("settings.language.desc")} noBorder>
                <StyledSelect value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="id">🇮🇩 Indonesia</option>
                  <option value="en">🇺🇸 English (US)</option>
                  <option value="zh">🇨🇳 中文 (简体)</option>
                </StyledSelect>
              </SettingRow>
            </SectionCard>

            {/* Notifications */}
            <SectionCard icon={Bell} title={t("settings.sections.notifications")}>
              <SettingRow label={t("settings.notifications.faceAlert")} desc={t("settings.notifications.faceAlertDesc")}>
                <Toggle checked={notifFace} onChange={setNotifFace} />
              </SettingRow>
              <SettingRow label={t("settings.notifications.cameraAlert")} desc={t("settings.notifications.cameraAlertDesc")}>
                <Toggle checked={notifCamera} onChange={setNotifCamera} />
              </SettingRow>
              <SettingRow label={t("settings.notifications.storageWarn")} desc={t("settings.notifications.storageWarnDesc")} noBorder>
                <Toggle checked={notifStorage} onChange={setNotifStorage} />
              </SettingRow>
            </SectionCard>

            {/* AI Engine */}
            <SectionCard icon={Cpu} title={t("settings.sections.aiEngine")}>
              <SettingRow label={t("settings.aiEngine.device")} desc={t("settings.aiEngine.deviceDesc")}>
                <StyledSelect value={aiDevice} onChange={(e) => setAiDevice(e.target.value)}>
                  <option value="auto">{t("settings.aiEngine.deviceOptions.auto")}</option>
                  <option value="cpu">{t("settings.aiEngine.deviceOptions.cpu")}</option>
                  <option value="cuda">{t("settings.aiEngine.deviceOptions.cuda")}</option>
                </StyledSelect>
              </SettingRow>
              <SettingRow label={t("settings.aiEngine.frameRate")} desc={t("settings.aiEngine.frameRateDesc")}>
                <StyledSelect value={aiFrameRate} onChange={(e) => setAiFrameRate(e.target.value)}>
                  <option value="low">{t("settings.aiEngine.fpsOptions.low")}</option>
                  <option value="balanced">{t("settings.aiEngine.fpsOptions.balanced")}</option>
                  <option value="high">{t("settings.aiEngine.fpsOptions.high")}</option>
                  <option value="max">{t("settings.aiEngine.fpsOptions.max")}</option>
                </StyledSelect>
              </SettingRow>
              <SettingRow label={t("settings.aiEngine.confidence")} desc={t("settings.aiEngine.confidenceDesc")} noBorder>
                <StyledSelect value={aiConfidence} onChange={(e) => setAiConfidence(e.target.value)}>
                  <option value="relaxed">{t("settings.aiEngine.confOptions.relaxed")}</option>
                  <option value="balanced">{t("settings.aiEngine.confOptions.balanced")}</option>
                  <option value="strict">{t("settings.aiEngine.confOptions.strict")}</option>
                </StyledSelect>
              </SettingRow>
            </SectionCard>

            {/* Recording */}
            <SectionCard icon={Database} title={t("settings.sections.recording")}>
              <SettingRow label={t("settings.recordingSection.chunk")} desc={t("settings.recordingSection.chunkDesc")}>
                <StyledSelect value={recChunk} onChange={(e) => setRecChunk(e.target.value)}>
                  <option value="15min">{t("settings.recordingSection.chunkOptions.15min")}</option>
                  <option value="30min">{t("settings.recordingSection.chunkOptions.30min")}</option>
                  <option value="1hr">{t("settings.recordingSection.chunkOptions.1hr")}</option>
                </StyledSelect>
              </SettingRow>
              <SettingRow label={t("settings.recordingSection.autoDelete")} desc={t("settings.recordingSection.autoDeleteDesc")}>
                <Toggle checked={autoDelete} onChange={setAutoDelete} />
              </SettingRow>
              <SettingRow label={t("settings.recordingSection.retention")} desc={t("settings.recordingSection.retentionDesc")} noBorder>
                <StyledSelect value={retention} onChange={(e) => setRetention(e.target.value)}>
                  <option value="7d">{t("settings.recordingSection.retentionOptions.7d")}</option>
                  <option value="14d">{t("settings.recordingSection.retentionOptions.14d")}</option>
                  <option value="30d">{t("settings.recordingSection.retentionOptions.30d")}</option>
                  <option value="90d">{t("settings.recordingSection.retentionOptions.90d")}</option>
                </StyledSelect>
              </SettingRow>
            </SectionCard>

            {/* Security */}
            <SectionCard icon={Shield} title={t("settings.sections.security")}>
              <SettingRow label={t("settings.security.twoFA")} desc={t("settings.security.twoFADesc")}>
                <Toggle checked={twoFA} onChange={setTwoFA} />
              </SettingRow>
              <SettingRow label={t("settings.security.session")} desc={t("settings.security.sessionDesc")} noBorder>
                <StyledSelect value={sessionDur} onChange={(e) => setSessionDur(e.target.value)}>
                  <option value="30min">{t("settings.security.sessionOptions.30min")}</option>
                  <option value="1hr">{t("settings.security.sessionOptions.1hr")}</option>
                  <option value="8hr">{t("settings.security.sessionOptions.8hr")}</option>
                  <option value="24hr">{t("settings.security.sessionOptions.24hr")}</option>
                </StyledSelect>
              </SettingRow>
            </SectionCard>

            {/* Save */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSave}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  color: saved ? "#d1fae5" : "var(--color-text-base)",
                  backgroundColor: saved ? "#065f46" : "var(--color-surface-elevated)",
                  outline: `1px solid ${saved ? "#10b981" : "var(--color-card-border)"}`,
                  transition: "background-color 0.2s, outline-color 0.2s",
                }}
              >
                {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
                {saved ? "Tersimpan!" : t("settings.saveChanges")}
              </button>
            </div>

          </div>
        </div>

        {/* ── RIGHT: Animated illustration ── */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 120,
            width: 300,
          }}
        >
          <SettingsIllustration />
        </div>

      </div>
    </>
  );
}
