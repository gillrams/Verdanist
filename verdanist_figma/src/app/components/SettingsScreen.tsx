import { useState } from "react";
import {
  Building2, Thermometer, Droplets, Bell, ChevronRight,
  LogOut, Wifi, Key, Camera, Sliders, Sun,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface SettingsScreenProps {
  onLogout: () => void;
  isAdmin: boolean;
}

export function SettingsScreen({ onLogout, isAdmin }: SettingsScreenProps) {
  const [notifTemp, setNotifTemp] = useState(true);
  const [notifRH, setNotifRH] = useState(true);
  const [notifPump, setNotifPump] = useState(false);
  const [tempMax, setTempMax] = useState(32);
  const [tempMin, setTempMin] = useState(18);
  const [rhMin, setRhMin] = useState(50);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      <div className="px-6 pt-14 pb-6 flex items-start justify-between">
        <div>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground">
            Pengaturan
          </h1>
          <p style={{ fontSize: 14 }} className="text-muted-foreground">Kelola akun & preferensi kebunmu</p>
        </div>
        <ThemeToggle className="w-10 h-10 bg-card border border-border" />
      </div>

      {/* Profile */}
      <div className="px-6 mb-5">
        <div className="bg-card border border-border shadow-sm rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/80 flex items-center justify-center">
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600 }} className="text-primary-foreground">
                  {isAdmin ? "A" : "R"}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center">
                <Camera className="w-3 h-3 text-ring" />
              </div>
            </div>
            <div className="flex-1">
              <p style={{ fontWeight: 600, fontSize: 16 }} className="text-foreground">
                {isAdmin ? "Administrator" : "Rizki Ananda"}
              </p>
              <p style={{ fontSize: 13 }} className="text-muted-foreground">
                {isAdmin ? "admin@verdanist.id" : "rizki@email.com"}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-ring" />
                <span style={{ fontSize: 11, fontWeight: 600 }} className="text-ring">
                  {isAdmin ? "Admin" : "Operator"}
                </span>
              </div>
            </div>
            <button className="text-muted-foreground/60 hover:text-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <SectionHeader icon={<Building2 className="w-4 h-4 text-ring" />} title="Kebun Aktif" />
      <div className="px-6 mb-5">
        <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden divide-y divide-border">
          <SettingsRow label="Kebun Utama Cikaret" sub="4 zona · Bogor" suffix={<span className="text-ring" style={{ fontSize: 12, fontWeight: 600 }}>Aktif</span>} />
          <SettingsRow label="Ganti Kebun" sub="Hubungkan ke kebun lain" />
          <SettingsRow label="Token Akses" sub="VRD-2024-●●●●●●" icon={<Key className="w-4 h-4 text-ring" />} />
        </div>
      </div>

      <SectionHeader icon={<Sliders className="w-4 h-4 text-ring" />} title="Batas Sensor" />
      <div className="px-6 mb-5">
        <div className="bg-card border border-border shadow-sm rounded-2xl p-4 space-y-5">
          <SliderRow label="Suhu Maks" icon={<Thermometer className="w-4 h-4 text-chart-3" />} value={tempMax} min={25} max={40} unit="°C" onChange={setTempMax} color="var(--color-chart-3)" />
          <SliderRow label="Suhu Min" icon={<Thermometer className="w-4 h-4 text-chart-2" />} value={tempMin} min={10} max={25} unit="°C" onChange={setTempMin} color="var(--color-chart-2)" />
          <SliderRow label="Kelembaban Min" icon={<Droplets className="w-4 h-4 text-chart-2" />} value={rhMin} min={30} max={70} unit="%" onChange={setRhMin} color="var(--color-chart-2)" />
        </div>
      </div>

      <SectionHeader icon={<Bell className="w-4 h-4 text-ring" />} title="Notifikasi" />
      <div className="px-6 mb-5">
        <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden divide-y divide-border">
          <ToggleRow label="Alert Suhu Ekstrem" sub="Notif saat suhu di luar batas" value={notifTemp} onChange={setNotifTemp} />
          <ToggleRow label="Alert Kelembaban" sub="Notif saat RH terlalu rendah" value={notifRH} onChange={setNotifRH} />
          <ToggleRow label="Status Pompa" sub="Notif pompa ON/OFF" value={notifPump} onChange={setNotifPump} />
        </div>
      </div>

      <SectionHeader icon={<Sun className="w-4 h-4 text-ring" />} title="Tampilan" />
      <div className="px-6 mb-5">
        <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden flex items-center justify-between px-4 py-3.5">
          <div>
            <p style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">Tema Aplikasi</p>
            <p style={{ fontSize: 12 }} className="text-muted-foreground mt-0.5">Ubah ke mode gelap / terang</p>
          </div>
          <ThemeToggle className="scale-90" />
        </div>
      </div>

      <SectionHeader icon={<Wifi className="w-4 h-4 text-ring" />} title="Koneksi Sensor" />
      <div className="px-6 mb-5">
        <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden divide-y divide-border">
          <SettingsRow label="ESP32 Gateway" sub="Terhubung · 192.168.1.20" suffix={<div className="w-2 h-2 rounded-full bg-ring" />} />
          <SettingsRow label="Interval Update" sub="Setiap 30 detik" />
          <SettingsRow label="API Endpoint" sub="api.verdanist.id/v2" />
        </div>
      </div>

      <div className="px-6 mb-4">
        <button
          onClick={onLogout}
          className="w-full bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-destructive/20 active:scale-[0.98] transition-all shadow-sm"
          style={{ fontWeight: 600, fontSize: 15 }}
        >
          <LogOut className="w-5 h-5" />
          Keluar dari Akun
        </button>
      </div>
      <p style={{ fontSize: 11 }} className="text-center text-muted-foreground/40 mb-6">Verdanist v2.4.1 · Build 2026.05</p>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-6 mb-2">
      {icon}
      <span style={{ fontSize: 12, fontWeight: 700 }} className="text-muted-foreground/80 uppercase tracking-wider">{title}</span>
    </div>
  );
}

function SettingsRow({ label, sub, suffix, icon }: { label: string; sub?: string; suffix?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
      {icon && (
        <div className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
      )}
      <div className="flex-1">
        <p style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">{label}</p>
        {sub && <p style={{ fontSize: 12 }} className="text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {suffix ?? <ChevronRight className="w-4 h-4 text-muted-foreground/60" />}
    </div>
  );
}

function ToggleRow({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
      <div className="flex-1">
        <p style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">{label}</p>
        <p style={{ fontSize: 12 }} className="text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${value ? "bg-primary" : "bg-border"}`}
      >
        <div className={`w-5 h-5 bg-card rounded-full shadow-md transition-all ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function SliderRow({ label, icon, value, min, max, unit, onChange, color }: {
  label: string; icon: React.ReactNode; value: number; min: number; max: number; unit: string; onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span style={{ fontSize: 13, fontWeight: 500 }} className="text-foreground">{label}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, var(--color-border) ${((value - min) / (max - min)) * 100}%, var(--color-border) 100%)`
        }}
      />
    </div>
  );
}
