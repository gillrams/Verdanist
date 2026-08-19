import { useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Thermometer, Droplets, Zap } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const HOURLY: Record<string, number>[] = [
  { time: "00", suhu: 23, rh: 80, pompa: 0 },
  { time: "02", suhu: 22, rh: 83, pompa: 15 },
  { time: "04", suhu: 21, rh: 85, pompa: 0 },
  { time: "06", suhu: 24, rh: 79, pompa: 20 },
  { time: "08", suhu: 27, rh: 72, pompa: 30 },
  { time: "10", suhu: 30, rh: 64, pompa: 25 },
  { time: "12", suhu: 33, rh: 58, pompa: 0 },
  { time: "14", suhu: 34, rh: 55, pompa: 40 },
  { time: "16", suhu: 31, rh: 62, pompa: 35 },
  { time: "18", suhu: 28, rh: 68, pompa: 0 },
  { time: "20", suhu: 26, rh: 73, pompa: 20 },
  { time: "22", suhu: 24, rh: 77, pompa: 0 },
];

const WEEKLY: Record<string, number | string>[] = [
  { day: "Sen", suhu: 28, rh: 70, pompa: 85 },
  { day: "Sel", suhu: 30, rh: 65, pompa: 120 },
  { day: "Rab", suhu: 27, rh: 72, pompa: 60 },
  { day: "Kam", suhu: 29, rh: 68, pompa: 95 },
  { day: "Jum", suhu: 32, rh: 61, pompa: 140 },
  { day: "Sab", suhu: 28, rh: 71, pompa: 75 },
  { day: "Min", suhu: 26, rh: 76, pompa: 50 },
];

type Period = "1H" | "6H" | "1D" | "7D" | "30D";
type Metric = "suhu" | "rh" | "pompa";

const METRIC_CONFIG: Record<Metric, { color: string; label: string }> = {
  suhu: { color: "var(--color-chart-3)", label: "Suhu (°C)" },
  rh: { color: "var(--color-chart-2)", label: "Kelembaban (%)" },
  pompa: { color: "var(--color-primary)", label: "Pompa (mnt)" },
};

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>("1D");
  const [metric, setMetric] = useState<Metric>("suhu");

  const isWeekly = period === "7D" || period === "30D";
  const chartData = isWeekly ? WEEKLY : HOURLY;
  const xKey = isWeekly ? "day" : "time";

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      <div className="px-6 pt-14 pb-4 flex justify-between items-start">
        <div>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground mb-1">
            Analitik Kebun
          </h1>
          <p style={{ fontSize: 14 }} className="text-muted-foreground">Tren sensor & pemakaian pompa</p>
        </div>
        <ThemeToggle className="w-10 h-10 bg-card border border-border" />
      </div>

      {/* Stat tiles */}
      <div className="px-6 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Rata-rata Suhu", value: "28.4°C", delta: "+1.2°", up: true, icon: <Thermometer className="w-5 h-5 text-chart-3" />, bg: "var(--color-chart-3)" },
            { label: "Rata-rata RH", value: "68%", delta: "-3%", up: false, icon: <Droplets className="w-5 h-5 text-chart-2" />, bg: "var(--color-chart-2)" },
            { label: "Durasi Pompa", value: "3j 25m", delta: "+18m", up: true, icon: <Zap className="w-5 h-5 text-primary" />, bg: "var(--color-secondary)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-3.5 border border-border shadow-sm" style={{ background: s.bg === "var(--color-secondary)" ? "var(--color-secondary)" : s.bg === "var(--color-chart-3)" ? "rgba(245, 158, 11, 0.1)" : "rgba(107, 153, 200, 0.1)" }}>
              <div className="mb-2">{s.icon}</div>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600 }} className="text-foreground">{s.value}</p>
              <p style={{ fontSize: 10 }} className="text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
              <div className={`flex items-center gap-0.5 mt-1.5 ${s.up ? "text-primary" : "text-chart-2"}`}>
                {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span style={{ fontSize: 11, fontWeight: 600 }}>{s.delta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Period filter */}
      <div className="px-6 mb-4">
        <div className="bg-card border border-border shadow-[var(--shadow-custom)] rounded-2xl p-1 flex gap-1">
          {(["1H", "6H", "1D", "7D", "30D"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl transition-all ${period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
              style={{ fontWeight: 600, fontSize: 13 }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Metric selector */}
      <div className="px-6 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {(["suhu", "rh", "pompa"] as Metric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-4 py-2 rounded-full border transition-all whitespace-nowrap flex-shrink-0 ${
              metric === m
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground bg-card shadow-[var(--shadow-custom)]"
            }`}
            style={{ fontWeight: 500, fontSize: 13 }}
          >
            {m === "suhu" ? "🌡️ Suhu" : m === "rh" ? "💧 Kelembaban" : "⚡ Pompa"}
          </button>
        ))}
      </div>

      {/* Main area chart */}
      <div className="px-6 mb-5">
        <div className="bg-card border border-border rounded-3xl p-4 shadow-[var(--shadow-custom)]">
          <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground mb-4">{METRIC_CONFIG[metric].label}</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={METRIC_CONFIG[metric].color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={METRIC_CONFIG[metric].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis key="x" dataKey={xKey} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis key="y" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                key="tip"
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)", fontSize: 12 }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
              />
              <Area
                key={`area-${metric}`}
                type="monotone"
                dataKey={metric}
                stroke={METRIC_CONFIG[metric].color}
                strokeWidth={2.5}
                fill="url(#metricGrad)"
                dot={false}
                activeDot={{ r: 5, fill: METRIC_CONFIG[metric].color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart per zona */}
      <div className="px-6 mb-5">
        <div className="bg-card border border-border rounded-3xl p-4 shadow-[var(--shadow-custom)]">
          <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground mb-4">Pemakaian Pompa per Zona (mnt)</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart
              data={[
                { zona: "Zona A", menit: 65 },
                { zona: "Zona B", menit: 140 },
                { zona: "Zona C", menit: 30 },
                { zona: "Zona D", menit: 88 },
              ]}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis key="x" dataKey="zona" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis key="y" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip key="tip" contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)", fontSize: 12 }} />
              <Bar key="menit-bar" dataKey="menit" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart suhu vs rh */}
      <div className="px-6">
        <div className="bg-card border border-border rounded-3xl p-4 shadow-[var(--shadow-custom)]">
          <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground mb-4">Suhu vs Kelembaban</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis key="x" dataKey={xKey} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis key="y" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                key="tip"
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)", fontSize: 12 }}
              />
              <Legend key="legend" wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} />
              <Line key="suhu-line" type="monotone" dataKey="suhu" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} name="Suhu °C" />
              <Line key="rh-line" type="monotone" dataKey="rh" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} name="RH %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
