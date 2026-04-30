import {
  Bell, Shield, Database, Cpu, Globe, Save, CheckCircle2,
  Languages, HardDrive, Lock, RefreshCw, Info
} from "lucide-react";
import { useState } from "react";
import { useLanguageStore } from "../../store/languageStore";

/* ── Toggle ── */
function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      position: "relative", width: 42, height: 24, borderRadius: 99,
      border: "none", cursor: "pointer", padding: 3,
      display: "inline-flex", alignItems: "center",
      background: checked ? "#FFFFFF" : "#1F1F2E",
      transition: "background 0.2s", flexShrink: 0
    }}>
      <span style={{
        display: "block", width: 18, height: 18, borderRadius: "50%",
        background: checked ? "#0A0A0F" : "#3D3D4F",
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 0.2s, background 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)"
      }} />
    </button>
  );
}

/* ── Select ── */
function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: "8px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
      outline: "none", cursor: "pointer", minWidth: 180,
      background: "#0A0A0F", border: "1px solid #1F1F2E", color: "#FFFFFF",
      appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
      paddingRight: 32
    }}
    onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
    onBlur={e => e.currentTarget.style.borderColor = "#1F1F2E"}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ── Section Card ── */
function SectionCard({ icon: Icon, title, desc, children, index = 0 }) {
  return (
    <div style={{
      borderRadius: 12, overflow: "hidden",
      background: "rgba(17,17,24,0.7)", border: "1px solid #1F1F2E",
      backdropFilter: "blur(12px)",
      animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 70}ms both`
    }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid #1F1F2E", background: "#0A0A0F" }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "#111118", border: "1px solid #1F1F2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} style={{ color: "#71717A" }} />
        </div>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", margin: 0 }}>{title}</h2>
          {desc && <p style={{ fontSize: 11, color: "#71717A", margin: 0 }}>{desc}</p>}
        </div>
      </div>
      <div style={{ padding: "0 20px" }}>{children}</div>
    </div>
  );
}

/* ── Setting Row ── */
function SettingRow({ label, desc, children, last = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 0", borderBottom: last ? "none" : "1px solid #131320", gap: 20
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: "#71717A", margin: "3px 0 0", lineHeight: 1.5 }}>{desc}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

/* ── Notification Item ── */
function NotifRow({ label, desc, checked, onChange, last }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: last ? "none" : "1px solid #131320", gap: 20
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: "#71717A", margin: "3px 0 0" }}>{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ── Main Page ── */
export default function SettingsPage() {
  const { language, setLanguage } = useLanguageStore();
  const [saved, setSaved]               = useState(false);
  const [saving, setSaving]             = useState(false);
  const [notifFace, setNotifFace]       = useState(true);
  const [notifCamera, setNotifCamera]   = useState(true);
  const [notifStorage, setNotifStorage] = useState(false);
  const [aiDevice, setAiDevice]         = useState("auto");
  const [aiFrameRate, setAiFrameRate]   = useState("balanced");
  const [aiConfidence, setAiConfidence] = useState("balanced");
  const [recChunk, setRecChunk]         = useState("30min");
  const [autoDelete, setAutoDelete]     = useState(true);
  const [retention, setRetention]       = useState("30d");
  const [twoFA, setTwoFA]               = useState(false);
  const [sessionDur, setSessionDur]     = useState("8hr");

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0 }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, animation: "fadeUp 0.4s ease both", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", margin: "0 0 4px", letterSpacing: "-0.03em" }}>Pengaturan Sistem</h1>
          <p style={{ fontSize: 13, color: "#71717A", margin: 0 }}>Konfigurasi sistem VMS secara menyeluruh</p>
        </div>
        <button onClick={handleSave} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
          borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
          background: saved ? "#1F1F2E" : "#FFFFFF",
          color: saved ? "#71717A" : "#0A0A0F",
          transition: "all 0.25s", flexShrink: 0
        }}>
          {saving
            ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Menyimpan...</>
            : saved
              ? <><CheckCircle2 size={14} /> Tersimpan</>
              : <><Save size={14} /> Simpan Pengaturan</>
          }
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 12, alignItems: "start" }}>

        {/* ── Bahasa ── */}
        <SectionCard icon={Languages} title="Bahasa" desc="Preferensi tampilan antarmuka" index={0}>
          <SettingRow label="Bahasa Antarmuka" desc="Pilih bahasa yang digunakan di seluruh aplikasi" last>
            <Sel value={language} onChange={setLanguage} options={[
              { value: "id", label: "🇮🇩  Indonesia" },
              { value: "en", label: "🇺🇸  English" },
            ]} />
          </SettingRow>
        </SectionCard>

        {/* ── Notifikasi ── */}
        <SectionCard icon={Bell} title="Notifikasi" desc="Konfigurasi peringatan sistem" index={1}>
          <NotifRow label="Peringatan Deteksi Wajah"  desc="Beritahu ketika wajah terdeteksi atau cocok"    checked={notifFace}    onChange={setNotifFace}    />
          <NotifRow label="Peringatan Kamera Mati"     desc="Beritahu ketika kamera tidak dapat dijangkau"  checked={notifCamera}  onChange={setNotifCamera}  />
          <NotifRow label="Peringatan Penyimpanan"     desc="Beritahu ketika penyimpanan mencapai 80%"       checked={notifStorage} onChange={setNotifStorage} last />
        </SectionCard>

        {/* ── Mesin AI ── */}
        <SectionCard icon={Cpu} title="Mesin AI" desc="Parameter inferensi deteksi wajah" index={2}>
          <SettingRow label="Perangkat AI" desc="Perangkat keras pemrosesan untuk deteksi wajah">
            <Sel value={aiDevice} onChange={setAiDevice} options={[
              { value: "auto",  label: "Otomatis (Disarankan)" },
              { value: "gpu",   label: "GPU (CUDA / NVIDIA)"   },
              { value: "cpu",   label: "CPU"                   },
            ]} />
          </SettingRow>
          <SettingRow label="Laju Sampel Frame" desc="Frame per detik untuk diproses AI">
            <Sel value={aiFrameRate} onChange={setAiFrameRate} options={[
              { value: "low",      label: "2 FPS (Hemat)"   },
              { value: "balanced", label: "5 FPS (Seimbang)" },
              { value: "high",     label: "15 FPS (Penuh)"  },
            ]} />
          </SettingRow>
          <SettingRow label="Kepercayaan Deteksi" desc="Ambang batas kepercayaan minimum untuk pencocokan wajah" last>
            <Sel value={aiConfidence} onChange={setAiConfidence} options={[
              { value: "low",      label: "60% (Longgar)"    },
              { value: "balanced", label: "75% (Seimbang)"   },
              { value: "strict",   label: "90% (Ketat)"      },
            ]} />
          </SettingRow>
        </SectionCard>

        {/* ── Rekaman ── */}
        <SectionCard icon={Database} title="Rekaman" desc="Manajemen penyimpanan dan retensi video" index={3}>
          <SettingRow label="Durasi Segmen" desc="Durasi maksimum per file rekaman">
            <Sel value={recChunk} onChange={setRecChunk} options={[
              { value: "10min", label: "10 menit" },
              { value: "30min", label: "30 menit" },
              { value: "60min", label: "60 menit" },
            ]} />
          </SettingRow>
          <NotifRow label="Hapus Otomatis" desc="Hapus rekaman lama secara otomatis" checked={autoDelete} onChange={setAutoDelete} />
          {autoDelete && (
            <SettingRow label="Retensi Data" desc="Hapus rekaman setelah periode ini" last>
              <Sel value={retention} onChange={setRetention} options={[
                { value: "7d",  label: "7 hari"  },
                { value: "14d", label: "14 hari" },
                { value: "30d", label: "30 hari" },
                { value: "90d", label: "90 hari" },
              ]} />
            </SettingRow>
          )}
          {!autoDelete && (
            <div style={{ padding: "14px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <Info size={13} style={{ color: "#3D3D4F", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#3D3D4F", margin: 0 }}>Rekaman akan disimpan selamanya hingga dihapus manual.</p>
            </div>
          )}
        </SectionCard>

        {/* ── Keamanan ── */}
        <SectionCard icon={Shield} title="Keamanan" desc="Autentikasi dan manajemen sesi" index={4}>
          <NotifRow label="Autentikasi Dua Faktor" desc="Wajibkan 2FA untuk semua akun admin" checked={twoFA} onChange={setTwoFA} />
          <SettingRow label="Durasi Sesi" desc="Waktu otomatis logout setelah tidak aktif" last>
            <Sel value={sessionDur} onChange={setSessionDur} options={[
              { value: "2hr",   label: "2 jam"    },
              { value: "8hr",   label: "8 jam"    },
              { value: "24hr",  label: "24 jam"   },
              { value: "never", label: "Tidak pernah" },
            ]} />
          </SettingRow>
        </SectionCard>

        {/* ── Save footer ── */}
        <div style={{ padding: "20px", borderRadius: 12, background: "rgba(17,17,24,0.6)", border: "1px solid #1F1F2E", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, gridColumn: "1 / -1" }}>
          <p style={{ fontSize: 12, color: "#3D3D4F", margin: 0 }}>
            Perubahan disimpan secara lokal dan diterapkan segera setelah disimpan.
          </p>
          <button onClick={handleSave} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
            borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
            background: saved ? "#1F1F2E" : "#FFFFFF",
            color: saved ? "#71717A" : "#0A0A0F",
            transition: "all 0.25s", flexShrink: 0
          }}>
            {saving
              ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Menyimpan...</>
              : saved ? <><CheckCircle2 size={13} /> Tersimpan</> : <><Save size={13} /> Simpan</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
