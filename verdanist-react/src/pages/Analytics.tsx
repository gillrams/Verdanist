import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Thermometer, Droplets, Zap } from "lucide-react";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

const generateMockData = (period: Period) => {
  const points = period === '1H' ? 12 : period === '6H' ? 12 : period === '1D' ? 12 : period === '7D' ? 7 : 30;
  const data = [];
  const now = new Date();
  
  // Base values for smooth curves
  let currentTemp = 24 + Math.random() * 5;
  let currentRh = 65 + Math.random() * 15;

  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now.getTime());
    if (period === '1H') d.setMinutes(d.getMinutes() - i * 5);
    else if (period === '6H') d.setMinutes(d.getMinutes() - i * 30);
    else if (period === '1D') d.setHours(d.getHours() - i * 2);
    else if (period === '7D') d.setDate(d.getDate() - i);
    else if (period === '30D') d.setDate(d.getDate() - i);

    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()];

    let label: string;
    if (period === '30D') label = `${dd}/${mm}`;
    else if (period === '7D') label = `${dayName} ${dd}`;
    else label = `${h}:${m}`;

    // Add some random walk for realism
    currentTemp += (Math.random() - 0.5) * 2;
    currentRh += (Math.random() - 0.5) * 4;
    
    // Constrain
    if (currentTemp < 20) currentTemp = 20;
    if (currentTemp > 35) currentTemp = 35;
    if (currentRh < 40) currentRh = 40;
    if (currentRh > 90) currentRh = 90;

    const basePompa = Math.random() > 0.8 ? Math.floor(Math.random() * 15) : 0;

    data.push({
      time: label,
      suhu: parseFloat(currentTemp.toFixed(1)),
      rh: Math.floor(currentRh),
      pompa: basePompa,
      timestamp: d.getTime()
    });
  }
  return data;
};

type Period = "1H" | "6H" | "1D" | "7D" | "30D";
type Metric = "suhu" | "rh" | "pompa";

const METRIC_CONFIG: Record<Metric, { color: string; labelKey: any }> = {
  suhu: { color: "var(--color-chart-3)", labelKey: "analytics.tempC" },
  rh: { color: "var(--color-chart-2)", labelKey: "analytics.kelembaban" },
  pompa: { color: "var(--color-primary)", labelKey: "analytics.pumpChart" },
};

export default function Analytics() {
  const { t, lang } = useLanguage();
  const [period, setPeriod] = useState<Period>("1H");
  const [metric, setMetric] = useState<Metric>("suhu");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived stats
  const temps = data.map(d => d.suhu).filter((v): v is number => v !== null && v !== undefined);
  const humids = data.map(d => d.rh).filter((v): v is number => v !== null && v !== undefined);
  const avgTemp = temps.length ? parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)) : 0;
  const avgHum = humids.length ? Math.round(humids.reduce((a, b) => a + b, 0) / humids.length) : 0;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const hoursMap: Record<Period, number> = { '1H': 1, '6H': 6, '1D': 24, '7D': 168, '30D': 720 };
    const hours = hoursMap[period];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: rows, error } = await supabase
      .from('sensor_readings')
      .select('type, value, recorded_at, device_id')
      .gte('recorded_at', since)
      .eq('device_id', 'ESP32_INDOOR') // Default indoor for now
      .order('recorded_at', { ascending: false }) // Fetch newest first
      .limit(period === '30D' ? 15000 : period === '7D' ? 5000 : 1000);

    if (error || !rows || rows.length === 0) {
      setData(generateMockData(period));
    } else {
      const grouped: Record<number, { time: string, suhuSum: number, suhuCount: number, rhSum: number, rhCount: number, pompa: number, timestamp: number }> = {};

      let roundFactor = 60 * 1000;
      let points = 12;
      
      if (period === '1H') { roundFactor = 5 * 60 * 1000; points = 12; }
      else if (period === '6H') { roundFactor = 30 * 60 * 1000; points = 12; }
      else if (period === '1D') { roundFactor = 2 * 60 * 60 * 1000; points = 12; }
      else if (period === '7D') { roundFactor = 24 * 60 * 60 * 1000; points = 7; }
      else if (period === '30D') { roundFactor = 24 * 60 * 60 * 1000; points = 30; }

      // PRE-FILL BUCKETS so the chart always has a full axis
      const nowTime = Date.now();
      const currentRounded = Math.floor(nowTime / roundFactor) * roundFactor;
      
      for (let i = points - 1; i >= 0; i--) {
        const bucketTime = currentRounded - (i * roundFactor);
        const rd = new Date(bucketTime);
        const h = rd.getHours().toString().padStart(2, '0');
        const m = rd.getMinutes().toString().padStart(2, '0');
        const dd = rd.getDate().toString().padStart(2, '0');
        const mm = (rd.getMonth() + 1).toString().padStart(2, '0');
        const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][rd.getDay()];

        let label: string;
        if (period === '30D') label = `${dd}/${mm}`;
        else if (period === '7D') label = `${dayName} ${dd}`;
        else label = `${h}:${m}`;
        
        grouped[bucketTime] = { time: label, suhuSum: 0, suhuCount: 0, rhSum: 0, rhCount: 0, pompa: 0, timestamp: bucketTime };
      }

      rows.forEach(r => {
        const d = new Date(r.recorded_at);
        const bucketTime = Math.floor(d.getTime() / roundFactor) * roundFactor;

        if (grouped[bucketTime]) {
          const numericVal = Number(r.value);
          if (r.type === 'temperature') { grouped[bucketTime].suhuSum += numericVal; grouped[bucketTime].suhuCount++; }
          else if (r.type === 'humidity' || r.type === 'soil_moisture') { grouped[bucketTime].rhSum += numericVal; grouped[bucketTime].rhCount++; }
          else if (r.type === 'pump') { grouped[bucketTime].pompa += numericVal; }
        }
      });

      const formatted = Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp).map(g => ({
        time: g.time,
        suhu: g.suhuCount > 0 ? parseFloat((g.suhuSum / g.suhuCount).toFixed(1)) : null,
        rh: g.rhCount > 0 ? Math.round(g.rhSum / g.rhCount) : null,
        pompa: g.pompa
      }));
      const hasEnoughData = formatted.filter(d => d.suhu !== null || d.rh !== null).length >= 2;
      if (hasEnoughData) setData(formatted);
      else setData(generateMockData(period));
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const xKey = "time";

  return (
    <>
      <div className="flex flex-col min-h-[100dvh] bg-background pb-28">
        <div className="px-6 pt-14 pb-4 flex justify-between items-start">
          <div>
            <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground mb-1">
              {t('nav.analytics')}
            </h1>
            <p style={{ fontSize: 14 }} className="text-muted-foreground">{t('analytics.title')}</p>
          </div>
          <ThemeToggle className="w-10 h-10 bg-card border border-border" />
        </div>

        {/* Stat tiles */}
        <div className="px-6 mb-5">
          <div className="grid grid-cols-3 gap-3">
            {[ 
              { label: t('analytics.avgTemp'), value: `${avgTemp}°C`, delta: "+1.2°", up: true, icon: <Thermometer className="w-5 h-5 text-chart-3" />, bg: "var(--color-chart-3)" },
              { label: t('analytics.avgRH'), value: `${avgHum}%`, delta: "-3%", up: false, icon: <Droplets className="w-5 h-5 text-chart-2" />, bg: "var(--color-chart-2)" },
              { label: t('analytics.pumpDuration'), value: (() => { const total = data.reduce((s, d) => s + (d.pompa || 0), 0); const h = Math.floor(total / 60); const m = total % 60; return `${h > 0 ? h + 'h ' : ''}${m}m`; })(), delta: "+18m", up: true, icon: <Zap className="w-5 h-5 text-primary" />, bg: "var(--color-secondary)" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-3.5 border border-border shadow-sm" style={{ background: s.bg === "var(--color-secondary)" ? "var(--color-secondary)" : s.bg === "var(--color-chart-3)" ? "rgba(245, 158, 11, 0.1)" : "rgba(107, 153, 200, 0.1)" }}>
                <div className="mb-2">{s.icon}</div>
                <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, fontWeight: 600 }} className="text-foreground">{s.value}</p>
                <p style={{ fontSize: 10 }} className="text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                <div className={`flex items-center gap-0.5 ${s.up ? "text-primary" : "text-chart-2"}`}>
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
            {([
              { key: "1H" as Period, label: t('analytics.1h') },
              { key: "6H" as Period, label: t('analytics.6h') },
              { key: "1D" as Period, label: t('analytics.1d') },
              { key: "7D" as Period, label: t('analytics.7d') },
              { key: "30D" as Period, label: t('analytics.30d') },
            ]).map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`flex-1 py-2 rounded-xl transition-all ${period === p.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
                style={{ fontWeight: 600, fontSize: 11 }}
              >
                {p.label}
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
              {m === "suhu" ? `🌡️ ${t('analytics.suhu')}` : m === "rh" ? `💧 ${t('analytics.kelembaban')}` : `⚡ ${t('analytics.pompa')}`}
            </button>
          ))}
        </div>

        {/* Main area chart */}
        <div className="px-6 mb-5">
          <div className="bg-card border border-border rounded-3xl p-4 shadow-[var(--shadow-custom)]">
            <div className="flex justify-between items-center mb-4">
              <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground">{t(METRIC_CONFIG[metric].labelKey)}</p>
              {loading && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={METRIC_CONFIG[metric].color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={METRIC_CONFIG[metric].color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis key="x" dataKey={xKey} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={15} />
                <YAxis key="y" domain={['auto', 'auto']} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  key="tip"
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)", fontSize: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  labelStyle={{ color: "var(--color-muted-foreground)", fontWeight: 'bold', marginBottom: 4 }}
                  formatter={(value: any) => {
                    const unit = metric === 'suhu' ? '°C' : metric === 'rh' ? '%' : (lang === 'id' ? ' mnt' : ' min');
                    return [`${value}${unit}`, t(METRIC_CONFIG[metric].labelKey)];
                  }}
                  labelFormatter={(label) => lang === 'en' ? label : `Pukul ${label}`}
                />
                <Area
                  key={`area-${metric}`}
                  type="monotone"
                  dataKey={metric}
                  connectNulls={true}
                  stroke={METRIC_CONFIG[metric].color}
                  strokeWidth={2.5}
                  fill="url(#metricGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: METRIC_CONFIG[metric].color, stroke: "var(--color-card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </>
  );
}
