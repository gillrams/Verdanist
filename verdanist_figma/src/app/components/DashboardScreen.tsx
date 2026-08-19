import { useState } from "react";
import {
  Thermometer, Droplets, Sun, Wind, Bell, ChevronRight,
  Droplet, Timer, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { ThemeToggle } from "./ThemeToggle";

const TEMP_DATA = [
  { time: "00", suhu: 24 },
  { time: "03", suhu: 22 },
  { time: "06", suhu: 23 },
  { time: "09", suhu: 27 },
  { time: "12", suhu: 31 },
  { time: "15", suhu: 33 },
  { time: "18", suhu: 29 },
  { time: "21", suhu: 26 },
  { time: "Kini", suhu: 28.5 },
];

interface Pump {
  id: string;
  name: string;
  zone: string;
  on: boolean;
  lastRun: string;
  duration?: string;
}

interface DashboardProps {
  isAdmin: boolean;
  farmName: string;
}

function IOSToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative flex-shrink-0 w-12 h-[26px] rounded-full transition-colors duration-300 ${on ? "bg-primary" : "bg-switch-background"}`}
      aria-pressed={on}
    >
      <div
        className={`absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${on ? "translate-x-[22px]" : "translate-x-0"}`}
      />
    </button>
  );
}

export function DashboardScreen({ isAdmin, farmName }: DashboardProps) {
  const [zone, setZone] = useState<"indoor" | "outdoor">("indoor");
  const [pumps, setPumps] = useState<Pump[]>([
    { id: "1", name: "Pompa Drip Utama", zone: "Zona A", on: false, lastRun: "2 jam lalu" },
    { id: "2", name: "Pompa Sprinkler", zone: "Zona B", on: true, lastRun: "Sedang berjalan", duration: "18 mnt" },
    { id: "3", name: "Pompa Fogging", zone: "Zona C", on: false, lastRun: "Kemarin, 14:30" },
  ]);

  const sensor = zone === "indoor"
    ? { suhu: 28.5, rh: 68, tanah: 45, cahaya: 8200, co2: 412 }
    : { suhu: 31.2, rh: 61, tanah: 38, cahaya: 62000, co2: 415 };

  const togglePump = (id: string) => {
    setPumps((ps) =>
      ps.map((p) =>
        p.id === id
          ? { ...p, on: !p.on, lastRun: !p.on ? "Sedang berjalan" : "Baru saja" }
          : p
      )
    );
  };

  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Pagi" : hour < 15 ? "Siang" : hour < 18 ? "Sore" : "Malam";

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p style={{ fontSize: 13 }} className="text-muted-foreground">{greeting} · {farmName}</p>
            <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, fontWeight: 600 }} className="text-foreground">
              {isAdmin ? "Dashboard Admin 🌿" : "Kebunmu hari ini 🌿"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="w-10 h-10 bg-card border border-border" />
            <div className="relative">
              <button className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-ring rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero sensor card */}
      <div className="px-6 mb-4">
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-[var(--shadow-custom)]">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ring animate-pulse" />
              <span className="text-ring" style={{ fontSize: 12, fontWeight: 600 }}>LIVE</span>
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>· 30 detik lalu</span>
            </div>
            <div className="bg-muted rounded-xl p-0.5 flex">
              {(["indoor", "outdoor"] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setZone(z)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    zone === z ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  {z === "indoor" ? "Dalam" : "Luar"}
                </button>
              ))}
            </div>
          </div>

          {/* Big numbers */}
          <div className="flex items-end gap-6 px-5 pb-5">
            <div>
              <div className="flex items-start gap-1">
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 72, fontWeight: 600, lineHeight: 1 }} className="text-foreground">
                  {sensor.suhu}
                </span>
                <span className="text-muted-foreground mt-4" style={{ fontSize: 22, fontWeight: 500 }}>°C</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Thermometer className="w-3.5 h-3.5 text-ring" />
                <span style={{ fontSize: 12 }} className="text-muted-foreground">Suhu Udara</span>
                <TrendingUp className="w-3 h-3 text-ring" />
                {sensor.suhu > 28 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                    ⚠ Panas
                  </span>
                )}
              </div>
            </div>
            <div className="pb-1">
              <div className="flex items-start gap-1">
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 48, fontWeight: 600, lineHeight: 1 }} className="text-muted-foreground">
                  {sensor.rh}
                </span>
                <span className="text-muted-foreground/60 mt-3" style={{ fontSize: 18, fontWeight: 500 }}>%</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Droplets className="w-3.5 h-3.5 text-chart-2" />
                <span style={{ fontSize: 12 }} className="text-muted-foreground">Kelembaban</span>
                <TrendingDown className="w-3 h-3 text-chart-2 ml-1" />
              </div>
            </div>
          </div>

          {/* Sensor pills */}
          <div className="flex gap-2 px-5 pb-5 overflow-x-auto no-scrollbar">
            {[
              { label: "Tanah", value: `${sensor.tanah}%`, icon: <Droplet className="w-3.5 h-3.5 text-chart-4" /> },
              { label: "Cahaya", value: `${(sensor.cahaya / 1000).toFixed(1)}k lux`, icon: <Sun className="w-3.5 h-3.5 text-chart-3" /> },
              { label: "CO₂", value: `${sensor.co2} ppm`, icon: <Wind className="w-3.5 h-3.5 text-muted-foreground" /> },
            ].map((s) => (
              <div key={s.label} className="flex-shrink-0 bg-secondary border border-border rounded-xl px-3 py-2 flex items-center gap-2">
                {s.icon}
                <div>
                  <p style={{ fontSize: 10 }} className="text-muted-foreground">{s.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }} className="text-foreground">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini chart */}
      <div className="px-6 mb-4">
        <div className="bg-card border border-border rounded-3xl p-4 shadow-[var(--shadow-custom)]">
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground">Grafik Suhu 24 Jam</span>
            <button className="text-primary flex items-center gap-1" style={{ fontSize: 12 }}>
              Lihat semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={TEMP_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="suhuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis key="x" dataKey="time" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis key="y" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[18, 36]} />
              <Tooltip
                key="tip"
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)", fontSize: 12 }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
              />
              <Area key="suhu-area" type="monotone" dataKey="suhu" stroke="var(--primary)" strokeWidth={2} fill="url(#suhuGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pump section */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontWeight: 600, fontSize: 16 }} className="text-foreground">Kontrol Pompa</h2>
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>
            {pumps.filter((p) => p.on).length} aktif
          </span>
        </div>
        <div className="space-y-3">
          {pumps.map((pump) => (
            <div
              key={pump.id}
              className={`bg-card border rounded-2xl p-4 flex items-center gap-3.5 transition-all shadow-[var(--shadow-custom)] ${
                pump.on ? "border-primary/30" : "border-border"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                pump.on ? "bg-primary/10" : "bg-secondary"
              }`}>
                <Droplets className={`w-5 h-5 ${pump.on ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground truncate">{pump.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ fontSize: 11 }} className="text-muted-foreground">{pump.zone}</span>
                  {pump.on ? (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600 }} className="text-primary">Aktif</span>
                      {pump.duration && (
                        <>
                          <Timer className="w-3 h-3 text-primary" />
                          <span style={{ fontSize: 11 }} className="text-primary">{pump.duration}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: 11 }} className="text-muted-foreground">{pump.lastRun}</span>
                  )}
                </div>
              </div>
              <IOSToggle on={pump.on} onToggle={() => togglePump(pump.id)} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent logs */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontWeight: 600, fontSize: 16 }} className="text-foreground">Log Terbaru</h2>
          <button className="text-primary flex items-center gap-1" style={{ fontSize: 13 }}>
            Semua <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border shadow-[var(--shadow-custom)]">
          {[
            { icon: <Droplets className="w-4 h-4 text-primary" />, text: "Pompa Drip dinyalakan", sub: "Zona B · admin · 10:32", bg: "var(--color-secondary)" },
            { icon: <Thermometer className="w-4 h-4 text-chart-3" />, text: "Suhu melebihi 32°C", sub: "Alert otomatis · Outdoor · 09:15", bg: "var(--color-chart-3)" },
            { icon: <Wind className="w-4 h-4 text-muted-foreground" />, text: "Pompa Sprinkler dimatikan", sub: "Zona A · rizki · 08:44", bg: "var(--color-secondary)" },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: log.bg === "var(--color-chart-3)" ? "rgba(245, 158, 11, 0.1)" : log.bg }}>
                {log.icon}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500 }} className="text-foreground">{log.text}</p>
                <p style={{ fontSize: 11 }} className="text-muted-foreground">{log.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
