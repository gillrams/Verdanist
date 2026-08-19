import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../components/layout/AppLayout';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DataPoint {
  time: string;
  temp: number | null;
  humidity: number | null;
}

type TimeRange = '1H' | '6H' | '24H' | '7D';
type ActiveMetric = 'both' | 'temp' | 'humidity';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;

  const temp = payload.find(p => p.dataKey === 'temp');
  const hum = payload.find(p => p.dataKey === 'humidity');

  return (
    <div className="bg-white/80 dark:bg-[#0A2F1F]/90 backdrop-blur-2xl rounded-2xl px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-white/60 dark:border-white/10 min-w-[140px]">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">{label}</p>
      {temp && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🌡️</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{temp.value.toFixed(1)}°C</span>
        </div>
      )}
      {hum && (
        <div className="flex items-center gap-2">
          <span className="text-base">💧</span>
          <span className="text-sm font-extrabold text-blue-500 dark:text-blue-400">{Math.round(hum.value)}%</span>
        </div>
      )}
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, unit, icon, color, trend, trendDir,
}: {
  label: string; value: number | null; unit: string; icon: string;
  color: string; trend?: number | null; trendDir?: 'up' | 'down' | 'flat';
}) => (
  <div className="bg-white/50 dark:bg-white/5 rounded-2xl p-3 sm:p-4 border border-white/60 dark:border-white/10 min-w-0 overflow-hidden">
    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
      <span className={`material-symbols-rounded text-lg sm:text-xl ${color}`}>{icon}</span>
      {trend !== null && trend !== undefined && (
        <span className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${trendDir === 'up' ? 'bg-red-100 dark:bg-red-500/10 text-red-500' :
            trendDir === 'down' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-500' :
              'bg-gray-100 dark:bg-white/5 text-gray-400'
          }`}>
          {trendDir === 'up' ? '▲' : trendDir === 'down' ? '▼' : '—'} {Math.abs(trend ?? 0).toFixed(1)}
        </span>
      )}
    </div>
    <p className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white truncate">
      {value !== null && value !== undefined ? (unit === '%' ? Math.round(value).toString() : value.toFixed(1)) : '—'}
      <span className="text-xs sm:text-sm font-bold text-gray-400 dark:text-white/40 ml-0.5 sm:ml-1">{unit}</span>
    </p>
    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest text-gray-400 dark:text-white/40 mt-1 truncate">{label}</p>
  </div>
);

// ─── Generate placeholder data ────────────────────────────────────────────────
const generateFallbackData = (points: number, device: 'all' | 'indoor' | 'outdoor'): DataPoint[] => {
  const now = new Date();
  const intervalMs = (points <= 12 ? 60 : points <= 24 ? 360 : 1440) * 60 * 1000;
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now.getTime() - (points - 1 - i) * intervalMs);
    const h = t.getHours().toString().padStart(2, '0');
    const m = t.getMinutes().toString().padStart(2, '0');
    const label = points > 24
      ? `${['Min', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][t.getDay()]} ${h}:${m}`
      : `${h}:${m}`;

    // Simulate differences between indoor and outdoor
    let tempBase = 26;
    let humBase = 68;

    if (device === 'indoor') {
      tempBase = 24; // Cooler and more stable
      humBase = 75;  // More humid
    } else if (device === 'outdoor') {
      tempBase = 29; // Hotter
      humBase = 60;  // Drier
    }

    return {
      time: label,
      temp: parseFloat((tempBase + Math.sin(i * 0.5) * 2 + Math.random() * 1).toFixed(1)),
      humidity: Math.round(humBase + Math.cos(i * 0.4) * 8 + Math.random() * 3),
    };
  });
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [range, setRange] = useState<TimeRange>('6H');
  const [metric, setMetric] = useState<ActiveMetric>('both');
  const [activeDevice, setActiveDevice] = useState<'all' | 'indoor' | 'outdoor'>('indoor'); // Default to indoor
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Force metric to 'humidity' (acting as soil moisture) when outdoor is selected
  useEffect(() => {
    if (activeDevice === 'outdoor') {
      setMetric('humidity');
    } else if (activeDevice === 'indoor' && metric === 'humidity') {
      setMetric('both');
    }
  }, [activeDevice]);

  // Derived stats
  const temps = data.map(d => d.temp).filter((v): v is number => v !== null);
  const humids = data.map(d => d.humidity).filter((v): v is number => v !== null);
  const latestTemp = temps.at(-1) ?? null;
  const latestHum = humids.at(-1) ?? null;
  const minTemp = temps.length ? Math.min(...temps) : null;
  const maxTemp = temps.length ? Math.max(...temps) : null;
  const avgTemp = temps.length ? parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)) : null;
  const minHum = humids.length ? Math.min(...humids) : null;
  const maxHum = humids.length ? Math.max(...humids) : null;
  const avgHum = humids.length ? Math.round(humids.reduce((a, b) => a + b, 0) / humids.length) : null;

  const prevTemp = temps.at(-2) ?? null;
  const tempTrend = latestTemp !== null && prevTemp !== null ? latestTemp - prevTemp : null;
  const tempTrendDir: 'up' | 'down' | 'flat' | undefined =
    tempTrend === null ? undefined : tempTrend > 0 ? 'up' : tempTrend < 0 ? 'down' : 'flat';

  const prevHum = humids.at(-2) ?? null;
  const humTrend = latestHum !== null && prevHum !== null ? latestHum - prevHum : null;
  const humTrendDir: 'up' | 'down' | 'flat' | undefined =
    humTrend === null ? undefined : humTrend > 0 ? 'up' : humTrend < 0 ? 'down' : 'flat';

  const fetchData = useCallback(async () => {
    setLoading(true);
    const hoursMap: Record<TimeRange, number> = { '1H': 1, '6H': 6, '24H': 24, '7D': 168 };
    const hours = hoursMap[range];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('sensor_readings')
      .select('type, value, recorded_at, device_id')
      .gte('recorded_at', since);

    if (activeDevice !== 'all') {
      const dbDeviceId = activeDevice === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR';
      query = query.eq('device_id', dbDeviceId);
    }

    const { data: rows, error } = await query
      .order('recorded_at', { ascending: true })
      .limit(1000);

    if (error || !rows || rows.length === 0) {
      if (error) {
        console.error('Error fetching sensor readings:', error);
      }
      // Fallback ke data simulasi jika DB kosong / error
      const fallbackPoints = range === '1H' ? 12 : range === '6H' ? 18 : range === '24H' ? 24 : 28;
      setData(generateFallbackData(fallbackPoints, activeDevice));
    } else {
      const grouped: Record<string, { time: string, temp: number | null, humidity: number | null }> = {};

      rows.forEach(r => {
        const d = new Date(r.recorded_at);
        // Round to nearest minute to align readings logged at slightly different times
        d.setSeconds(0);
        d.setMilliseconds(0);
        const timeKey = d.toISOString();

        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        const label = range === '7D'
          ? `${['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()]} ${h}:${m}`
          : `${h}:${m}`;

        if (!grouped[timeKey]) {
          grouped[timeKey] = { time: label, temp: null, humidity: null };
        }

        const numericVal = Number(r.value);
        if (r.type === 'temperature') {
          grouped[timeKey].temp = numericVal;
        } else if (r.type === 'humidity' || r.type === 'soil_moisture') {
          grouped[timeKey].humidity = numericVal;
        }
      });

      const formatted = Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));
      setData(formatted);
    }
    setLastUpdated(new Date());
    setLoading(false);
  }, [range, activeDevice]);

  useEffect(() => { fetchData(); }, [fetchData, activeDevice]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const ranges: TimeRange[] = ['1H', '6H', '24H', '7D'];
  const metrics: { key: ActiveMetric; label: string }[] = [
    { key: 'both', label: 'Keduanya' },
    { key: 'temp', label: '🌡️ Suhu' },
    { key: 'humidity', label: '💧 Kelembaban' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-green-600 dark:text-green-400">
                Sensor Aktif
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-xs font-bold text-gray-400 dark:text-white/40 mt-0.5 uppercase tracking-widest">
              Tren Suhu & Kelembaban · {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Memuat...'}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="group relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-300 overflow-hidden
              bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5
              border border-emerald-500/20 dark:border-emerald-400/15
              text-emerald-700 dark:text-emerald-300
              hover:from-emerald-500/20 hover:to-teal-500/20 dark:hover:from-emerald-500/15 dark:hover:to-teal-500/15
              hover:border-emerald-500/40 dark:hover:border-emerald-400/30
              hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]
              active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {/* Glow bg on hover */}
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/0 to-teal-400/0 group-hover:from-emerald-400/10 group-hover:to-teal-400/10 transition-all duration-500" />
            {/* Pulse ring when loading */}
            {loading && (
              <span className="absolute inset-0 rounded-2xl animate-ping bg-emerald-400/10 pointer-events-none" />
            )}
            <span className="relative flex items-center gap-2">
              <span
                className={`material-symbols-rounded text-base transition-transform duration-500 ease-out ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`}
              >
                refresh
              </span>
              <span className="hidden sm:inline">{loading ? 'Memuat...' : 'Refresh'}</span>
            </span>
          </button>
        </div>

        {/* ── Metric Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {activeDevice !== 'outdoor' && (
            <>
              <StatCard label="Suhu Sekarang" value={latestTemp} unit="°C" icon="thermometer" color="text-emerald-500" trend={tempTrend} trendDir={tempTrendDir} />
              <StatCard label="Kelembaban" value={latestHum} unit="%" icon="water_drop" color="text-blue-400" trend={humTrend} trendDir={humTrendDir} />
              <StatCard label="Rata-rata Suhu" value={avgTemp} unit="°C" icon="avg_pace" color="text-amber-500" />
              <StatCard label="Rata-rata Hum" value={avgHum} unit="%" icon="humidity_percentage" color="text-sky-400" />
            </>
          )}
          {activeDevice === 'outdoor' && (
            <>
              <StatCard label="Kel. Tanah" value={latestHum} unit="%" icon="potted_plant" color="text-emerald-500" trend={humTrend} trendDir={humTrendDir} />
              <StatCard label="Kel. Tanah Avg" value={avgHum} unit="%" icon="humidity_percentage" color="text-emerald-400" />
              <div className="hidden lg:block bg-white/10 dark:bg-white/2 rounded-2xl p-4 min-w-0 border border-dashed border-white/20 text-xs font-bold text-gray-400">
                Outdoor hanya memantau kelembaban tanah.
              </div>
              <div className="hidden lg:block bg-white/10 dark:bg-white/2 rounded-2xl p-4 min-w-0 border border-dashed border-white/20 text-xs font-bold text-gray-400">
                Sesuai konfigurasi hardware.
              </div>
            </>
          )}
        </div>

        {/* ── Min / Max quick stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {activeDevice !== 'outdoor' && (
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/60 dark:border-white/10 flex gap-3 sm:gap-4">
              <div className="flex-1 text-center min-w-0">
                <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest text-gray-400 dark:text-white/30 mb-1">Min Suhu</p>
                <p className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">{minTemp !== null ? minTemp.toFixed(1) : '—'}<span className="text-xs text-gray-400 ml-1">°C</span></p>
              </div>
              <div className="w-px bg-gray-200 dark:bg-white/10 flex-shrink-0"></div>
              <div className="flex-1 text-center min-w-0">
                <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest text-gray-400 dark:text-white/30 mb-1">Max Suhu</p>
                <p className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">{maxTemp !== null ? maxTemp.toFixed(1) : '—'}<span className="text-xs text-gray-400 ml-1">°C</span></p>
              </div>
            </div>
          )}
          <div className={`${activeDevice === 'outdoor' ? 'sm:col-span-2' : ''} bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/60 dark:border-white/10 flex gap-3 sm:gap-4`}>
            <div className="flex-1 text-center min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest text-gray-400 dark:text-white/30 mb-1">Min {activeDevice === 'outdoor' ? 'Kel. Tanah' : 'Hum'}</p>
              <p className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">{minHum !== null ? Math.round(minHum) : '—'}<span className="text-xs text-gray-400 ml-1">%</span></p>
            </div>
            <div className="w-px bg-gray-200 dark:bg-white/10 flex-shrink-0"></div>
            <div className="flex-1 text-center min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest text-gray-400 dark:text-white/30 mb-1">Max {activeDevice === 'outdoor' ? 'Kel. Tanah' : 'Hum'}</p>
              <p className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">{maxHum !== null ? Math.round(maxHum) : '—'}<span className="text-xs text-gray-400 ml-1">%</span></p>
            </div>
          </div>
        </div>

        {/* ── Main Chart Card ── */}
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-[2rem] p-5 lg:p-6 border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(34,197,94,0.08)]">
          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            {/* Metric Tab Switcher */}
            <div className="flex flex-wrap gap-2 items-center">
              {activeDevice !== 'outdoor' && (
                <div className="bg-gray-100/60 dark:bg-white/5 rounded-xl p-1 flex gap-1 border border-white/20">
                  {metrics.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMetric(m.key)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${metric === m.key
                          ? 'bg-white dark:bg-[#1A4531] text-green-600 dark:text-green-400 shadow-sm'
                          : 'text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white'
                        }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              {activeDevice === 'outdoor' && (
                <div className="bg-gray-100/60 dark:bg-white/5 rounded-xl p-1 flex gap-1 border border-white/20">
                  <button className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-white dark:bg-[#1A4531] text-emerald-600 dark:text-emerald-400 shadow-sm">
                    🌱 Kelembaban Tanah
                  </button>
                </div>
              )}

              {/* Device Switcher (Indoor / Outdoor) */}
              <div className="bg-gray-100/60 dark:bg-white/5 rounded-xl p-1 flex gap-1 border border-white/20">
                {[
                  { key: 'indoor', label: '🏠 Indoor' },
                  { key: 'outdoor', label: '🌳 Outdoor' }
                ].map(d => (
                  <button
                    key={d.key}
                    onClick={() => setActiveDevice(d.key as 'indoor' | 'outdoor')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${activeDevice === d.key
                        ? 'bg-white dark:bg-[#1A4531] text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white'
                      }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range Pills */}
            <div className="flex items-center gap-1.5">
              {ranges.map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all ${range === r
                      ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                      : 'bg-white/60 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 border border-white/60 dark:border-white/10'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${range}-${metric}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-[300px] lg:h-[380px] w-full relative"
            >
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-gray-400 dark:text-white/40">Memuat data sensor...</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      {/* Temp gradient with glow */}
                      <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                        <stop offset="70%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      {/* Humidity gradient */}
                      <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="70%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      {/* Glow filter for stroke */}
                      <filter id="glowTemp">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <filter id="glowHum">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.08)" />

                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 700 }}
                      dy={10}
                      interval="preserveStartEnd"
                    />

                    {/* Left Y-Axis: Temp */}
                    {(metric === 'both' || metric === 'temp') && (
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#10b981', fontWeight: 700 }}
                        domain={[15, 40]}
                        tickFormatter={v => `${v.toFixed(1)}°`}
                        width={32}
                      />
                    )}

                    {/* Right Y-Axis: Humidity */}
                    {(metric === 'both' || metric === 'humidity') && (
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#3b82f6', fontWeight: 700 }}
                        domain={[30, 100]}
                        tickFormatter={v => `${Math.round(v)}%`}
                        width={32}
                      />
                    )}

                    <Tooltip content={<CustomTooltip />} />

                    {/* Reference lines — ideal range */}
                    {(metric === 'both' || metric === 'temp') && (
                      <>
                        <ReferenceLine yAxisId="left" y={27} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5}
                          label={{ value: '27°C Ideal', fill: '#10b981', fontSize: 9, fontWeight: 700, position: 'insideTopLeft' }} />
                        <ReferenceLine yAxisId="left" y={32} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4}
                          label={{ value: '32°C Batas', fill: '#f59e0b', fontSize: 9, fontWeight: 700, position: 'insideTopLeft' }} />
                      </>
                    )}
                    {(metric === 'both' || metric === 'humidity') && (
                      <ReferenceLine yAxisId="right" y={70} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.5}
                        label={{ value: '70% Ideal', fill: '#3b82f6', fontSize: 9, fontWeight: 700, position: 'insideTopRight' }} />
                    )}

                    {/* Temp Area */}
                    {(metric === 'both' || metric === 'temp') && (
                      <Area
                        yAxisId="left"
                        type="monotoneX"
                        dataKey="temp"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#gradTemp)"
                        filter="url(#glowTemp)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981', filter: 'url(#glowTemp)' }}
                        animationDuration={600}
                        connectNulls
                      />
                    )}

                    {/* Humidity Area */}
                    {(metric === 'both' || metric === 'humidity') && (
                      <Area
                        yAxisId="right"
                        type="monotoneX"
                        dataKey="humidity"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#gradHum)"
                        filter="url(#glowHum)"
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6', filter: 'url(#glowHum)' }}
                        animationDuration={600}
                        connectNulls
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            {activeDevice !== 'outdoor' && (metric === 'both' || metric === 'temp') && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50"></div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-white/50">Suhu (°C)</span>
              </div>
            )}
            {(metric === 'both' || metric === 'humidity') && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50"></div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-white/50">
                  {activeDevice === 'outdoor' ? 'Kelembaban Tanah (%)' : 'Kelembaban Udara (%)'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-6 h-px border-t-2 border-dashed border-emerald-500/50"></div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-white/30">Batas Ideal</span>
            </div>
          </div>
        </div>

        {/* ── Insight Footer ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: 'thermostat',
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10',
              title: 'Kondisi Suhu',
              value: avgTemp !== null
                ? avgTemp < 27 ? '🧊 Sedikit Dingin' : avgTemp < 32 ? '✅ Optimal' : '🔥 Terlalu Panas'
                : '—',
            },
            {
              icon: 'water_drop',
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
              title: 'Kondisi Lembab',
              value: avgHum !== null
                ? avgHum < 55 ? '🏜️ Terlalu Kering' : avgHum < 80 ? '✅ Optimal' : '🌧️ Terlalu Lembab'
                : '—',
            },
            {
              icon: 'psychology',
              color: 'text-violet-400',
              bg: 'bg-violet-500/10',
              title: 'Rekomendasi',
              value: (avgTemp !== null && avgTemp > 30) ? '💧 Siram sekarang!'
                : (avgHum !== null && avgHum < 60) ? '⬆️ Naikkan kelembaban'
                  : '✅ Kondisi baik',
            },
          ].map(card => (
            <div key={card.title} className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-4 border border-white/60 dark:border-white/10 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                <span className={`material-symbols-rounded text-lg ${card.color}`}>{card.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-white/30">{card.title}</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
