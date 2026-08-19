import { useState } from "react";
import {
  PlayCircle, StopCircle, Thermometer, Droplets, AlertTriangle,
  Download, Search, ChevronDown, Filter,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface LogEntry {
  id: string;
  type: "pump_on" | "pump_off" | "alert_temp" | "alert_rh" | "sensor";
  title: string;
  detail: string;
  zone: string;
  operator: string;
  timestamp: string;
  date: string;
}

const LOGS: LogEntry[] = [
  { id: "1", type: "pump_on", title: "Pompa Drip dinyalakan", detail: "Durasi 30 mnt · Flow 2.4 L/mnt", zone: "Zona A", operator: "admin", timestamp: "10:32", date: "Hari ini" },
  { id: "2", type: "alert_temp", title: "Suhu melebihi batas 32°C", detail: "Suhu tercatat 33.1°C · Alert otomatis", zone: "Outdoor", operator: "sistem", timestamp: "09:15", date: "Hari ini" },
  { id: "3", type: "pump_off", title: "Pompa Sprinkler dimatikan", detail: "Total berjalan 18 mnt", zone: "Zona B", operator: "rizki", timestamp: "08:44", date: "Hari ini" },
  { id: "4", type: "sensor", title: "Data sensor diperbarui", detail: "Suhu 27.2°C · RH 72% · CO₂ 408 ppm", zone: "Indoor", operator: "sistem", timestamp: "08:00", date: "Hari ini" },
  { id: "5", type: "pump_on", title: "Pompa Fogging dinyalakan", detail: "Durasi 10 mnt · Mode otomatis", zone: "Zona C", operator: "sistem", timestamp: "07:30", date: "Hari ini" },
  { id: "6", type: "alert_rh", title: "Kelembaban di bawah 55%", detail: "RH tercatat 53% · Pompa fogging aktif", zone: "Zona C", operator: "sistem", timestamp: "07:28", date: "Hari ini" },
  { id: "7", type: "pump_off", title: "Pompa Drip dimatikan", detail: "Total berjalan 45 mnt", zone: "Zona A", operator: "budi", timestamp: "18:30", date: "Kemarin" },
  { id: "8", type: "pump_on", title: "Pompa Drip dinyalakan", detail: "Durasi 45 mnt · Flow 2.4 L/mnt", zone: "Zona A", operator: "budi", timestamp: "17:45", date: "Kemarin" },
  { id: "9", type: "alert_temp", title: "Suhu melebihi batas 32°C", detail: "Suhu tercatat 34.5°C · Puncak siang", zone: "Outdoor", operator: "sistem", timestamp: "13:20", date: "Kemarin" },
  { id: "10", type: "pump_on", title: "Pompa Sprinkler dinyalakan", detail: "Durasi 20 mnt · Manual", zone: "Zona B", operator: "admin", timestamp: "10:00", date: "Kemarin" },
];

type FilterType = "semua" | "pump_on" | "pump_off" | "alert" | "sensor";

const LOG_ICONS: Record<LogEntry["type"], React.ReactNode> = {
  pump_on: <PlayCircle className="w-4 h-4 text-primary" />,
  pump_off: <StopCircle className="w-4 h-4 text-muted-foreground" />,
  alert_temp: <Thermometer className="w-4 h-4 text-chart-3" />,
  alert_rh: <Droplets className="w-4 h-4 text-chart-2" />,
  sensor: <AlertTriangle className="w-4 h-4 text-muted-foreground/60" />,
};

const LOG_BG: Record<LogEntry["type"], string> = {
  pump_on: "var(--color-secondary)",
  pump_off: "var(--color-secondary)",
  alert_temp: "rgba(245, 158, 11, 0.1)",
  alert_rh: "rgba(107, 153, 200, 0.1)",
  sensor: "var(--color-card)",
};

export function LogsScreen() {
  const [filter, setFilter] = useState<FilterType>("semua");
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);

  const filtered = LOGS.filter((log) => {
    const matchFilter =
      filter === "semua" ||
      (filter === "pump_on" && log.type === "pump_on") ||
      (filter === "pump_off" && log.type === "pump_off") ||
      (filter === "alert" && (log.type === "alert_temp" || log.type === "alert_rh")) ||
      (filter === "sensor" && log.type === "sensor");
    const matchSearch =
      !search ||
      log.title.toLowerCase().includes(search.toLowerCase()) ||
      log.zone.toLowerCase().includes(search.toLowerCase()) ||
      log.operator.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const grouped = filtered.reduce<Record<string, LogEntry[]>>((acc, log) => {
    acc[log.date] = [...(acc[log.date] || []), log];
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground">
              Riwayat Aktivitas
            </h1>
            <p style={{ fontSize: 14 }} className="text-muted-foreground">{LOGS.length} aktivitas tercatat</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="w-10 h-10 bg-card border border-border" />
          </div>
        </div>
        <div className="flex items-center justify-end mt-2">
          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="bg-card border border-border rounded-xl px-3 py-2 flex items-center gap-1.5 text-primary shadow-[var(--shadow-custom)]"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <Download className="w-4 h-4" />
              Ekspor
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-2xl py-2 min-w-[140px] z-10 shadow-2xl">
                {["CSV", "Excel", "PDF"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setShowExport(false)}
                    className="w-full text-left px-4 py-2.5 text-foreground hover:bg-secondary transition-colors"
                    style={{ fontSize: 14 }}
                  >
                    {fmt === "CSV" ? "📄" : fmt === "Excel" ? "📊" : "📕"} Ekspor {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 mb-3">
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktivitas, zona, atau operator..."
            className="bg-transparent flex-1 text-foreground outline-none placeholder-muted-foreground/60"
            style={{ fontSize: 14 }}
          />
        </div>
      </div>

      <div className="px-6 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: "semua", label: "Semua" },
          { id: "pump_on", label: "💧 Nyala" },
          { id: "pump_off", label: "⏹ Mati" },
          { id: "alert", label: "⚠️ Alert" },
          { id: "sensor", label: "📡 Sensor" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as FilterType)}
            className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${
              filter === f.id
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-card border-border text-muted-foreground shadow-sm"
            }`}
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-6 space-y-6">
        {Object.entries(grouped).map(([date, entries]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: 12, fontWeight: 600 }} className="text-muted-foreground/80 uppercase tracking-wide">{date}</span>
              <div className="flex-1 h-px bg-border" />
              <span style={{ fontSize: 11 }} className="text-muted-foreground/60">{entries.length} aktivitas</span>
            </div>
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-[var(--shadow-custom)]">
              {entries.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: LOG_BG[log.type] }}
                  >
                    {LOG_ICONS[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 600 }} className="text-foreground">{log.title}</p>
                    <p style={{ fontSize: 11 }} className="text-muted-foreground mt-0.5">{log.detail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5" style={{ fontSize: 10 }}>{log.zone}</span>
                      <span style={{ fontSize: 11 }} className="text-muted-foreground/60">{log.operator}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 11 }} className="text-muted-foreground flex-shrink-0 mt-0.5">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Filter className="w-10 h-10 text-border mx-auto mb-3" />
            <p className="text-muted-foreground/80" style={{ fontSize: 14 }}>Tidak ada aktivitas ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}
