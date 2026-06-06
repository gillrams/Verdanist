import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSun, CloudDrizzle, CloudSnow, CloudLightning, Wind, Droplets, Gauge, Sunrise, Sunset, MapPin, RefreshCw } from 'lucide-react';

// Persada Farm Bogor coordinates
const LAT = -6.5968;
const LON = 106.7988;

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  feelsLike: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  precipitation: number;
  cloudCover: number;
  sunrise: string;
  sunset: string;
  isDay: boolean;
}

// WMO weather codes to descriptions & icons
function getWeatherInfo(code: number, isDay: boolean) {
  const map: Record<number, { desc: string; icon: React.ReactNode; bg: string }> = {
    0: { desc: 'Cerah', icon: isDay ? <Sun className="w-8 h-8 text-amber-400" /> : <span className="text-3xl">🌙</span>, bg: isDay ? 'from-amber-400/20 to-orange-400/10' : 'from-indigo-500/20 to-purple-500/10' },
    1: { desc: 'Sebagian Cerah', icon: <CloudSun className="w-8 h-8 text-amber-400" />, bg: 'from-amber-400/15 to-sky-400/10' },
    2: { desc: 'Berawan Sebagian', icon: <CloudSun className="w-8 h-8 text-sky-400" />, bg: 'from-sky-400/15 to-gray-400/10' },
    3: { desc: 'Mendung', icon: <Cloud className="w-8 h-8 text-gray-400" />, bg: 'from-gray-400/15 to-slate-400/10' },
    45: { desc: 'Berkabut', icon: <Cloud className="w-8 h-8 text-gray-300" />, bg: 'from-gray-300/15 to-slate-300/10' },
    48: { desc: 'Kabut Tebal', icon: <Cloud className="w-8 h-8 text-gray-300" />, bg: 'from-gray-300/15 to-slate-300/10' },
    51: { desc: 'Gerimis Ringan', icon: <CloudDrizzle className="w-8 h-8 text-sky-400" />, bg: 'from-sky-400/15 to-blue-400/10' },
    53: { desc: 'Gerimis', icon: <CloudDrizzle className="w-8 h-8 text-sky-500" />, bg: 'from-sky-500/15 to-blue-500/10' },
    55: { desc: 'Gerimis Lebat', icon: <CloudDrizzle className="w-8 h-8 text-sky-600" />, bg: 'from-sky-600/15 to-blue-600/10' },
    61: { desc: 'Hujan Ringan', icon: <CloudRain className="w-8 h-8 text-blue-400" />, bg: 'from-blue-400/15 to-cyan-400/10' },
    63: { desc: 'Hujan Sedang', icon: <CloudRain className="w-8 h-8 text-blue-500" />, bg: 'from-blue-500/15 to-cyan-500/10' },
    65: { desc: 'Hujan Lebat', icon: <CloudRain className="w-8 h-8 text-blue-600" />, bg: 'from-blue-600/15 to-cyan-600/10' },
    71: { desc: 'Salju Ringan', icon: <CloudSnow className="w-8 h-8 text-blue-200" />, bg: 'from-blue-200/15 to-indigo-200/10' },
    80: { desc: 'Hujan Lokal', icon: <CloudRain className="w-8 h-8 text-blue-400" />, bg: 'from-blue-400/15 to-cyan-400/10' },
    81: { desc: 'Hujan Lokal Sedang', icon: <CloudRain className="w-8 h-8 text-blue-500" />, bg: 'from-blue-500/20 to-cyan-500/10' },
    82: { desc: 'Hujan Lokal Lebat', icon: <CloudRain className="w-8 h-8 text-blue-600" />, bg: 'from-blue-600/20 to-cyan-600/10' },
    95: { desc: 'Badai Petir', icon: <CloudLightning className="w-8 h-8 text-yellow-500" />, bg: 'from-yellow-500/15 to-orange-500/10' },
    96: { desc: 'Badai + Hujan Es', icon: <CloudLightning className="w-8 h-8 text-yellow-600" />, bg: 'from-yellow-600/15 to-red-500/10' },
    99: { desc: 'Badai Petir Hebat', icon: <CloudLightning className="w-8 h-8 text-red-500" />, bg: 'from-red-500/15 to-orange-600/10' },
  };
  return map[code] || { desc: 'Tidak Diketahui', icon: <Cloud className="w-8 h-8 text-gray-400" />, bg: 'from-gray-400/15 to-slate-400/10' };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,is_day&daily=sunrise,sunset,uv_index_max&timezone=Asia%2FJakarta&forecast_days=1`
      );
      if (!res.ok) throw new Error('Gagal mengambil data cuaca');
      const data = await res.json();
      const c = data.current;
      const d = data.daily;

      setWeather({
        temperature: c.temperature_2m,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        weatherCode: c.weather_code,
        feelsLike: c.apparent_temperature,
        pressure: c.pressure_msl,
        visibility: 10, // Open-Meteo free doesn't provide visibility, estimate
        uvIndex: d.uv_index_max?.[0] ?? 0,
        precipitation: c.precipitation,
        cloudCover: c.cloud_cover,
        sunrise: d.sunrise?.[0] ?? '',
        sunset: d.sunset?.[0] ?? '',
        isDay: c.is_day === 1,
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Gagal memuat cuaca');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !weather) {
    return (
      <div className="bg-card border border-border rounded-3xl p-5 shadow-[var(--shadow-custom)]">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-14 h-14 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted rounded-lg" />
            <div className="h-3 w-32 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="bg-card border border-border rounded-3xl p-5 shadow-[var(--shadow-custom)]">
        <div className="text-center py-4">
          <Cloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={fetchWeather} className="mt-2 text-xs text-primary font-semibold">Coba Lagi</button>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const info = getWeatherInfo(weather.weatherCode, weather.isDay);
  const sunriseTime = weather.sunrise ? new Date(weather.sunrise).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const sunsetTime = weather.sunset ? new Date(weather.sunset).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-[var(--shadow-custom)]">
      {/* Main weather header */}
      <div className={`bg-gradient-to-br ${info.bg} px-5 pt-4 pb-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>Persada Farm, Bogor</span>
          </div>
          <button
            onClick={fetchWeather}
            disabled={loading}
            className="w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-start gap-1">
              <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 48, fontWeight: 600, lineHeight: 1 }} className="text-foreground">
                {weather.temperature.toFixed(1)}
              </span>
              <span className="text-muted-foreground mt-2" style={{ fontSize: 18, fontWeight: 500 }}>°C</span>
            </div>
            <p className="text-foreground font-semibold mt-1" style={{ fontSize: 14 }}>{info.desc}</p>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>
              Terasa seperti {weather.feelsLike.toFixed(1)}°C
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {info.icon}
            {lastUpdated && (
              <span className="text-muted-foreground" style={{ fontSize: 9 }}>
                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Weather detail pills */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Kelembaban', value: `${weather.humidity}%`, icon: <Droplets className="w-3.5 h-3.5 text-blue-400" /> },
            { label: 'Angin', value: `${weather.windSpeed.toFixed(1)} km/j`, icon: <Wind className="w-3.5 h-3.5 text-teal-400" /> },
            { label: 'UV Index', value: weather.uvIndex.toFixed(1), icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
            { label: 'Tekanan', value: `${weather.pressure.toFixed(0)} hPa`, icon: <Gauge className="w-3.5 h-3.5 text-purple-400" /> },
            { label: 'Curah Hujan', value: `${weather.precipitation} mm`, icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" /> },
            { label: 'Awan', value: `${weather.cloudCover}%`, icon: <Cloud className="w-3.5 h-3.5 text-gray-400" /> },
          ].map(item => (
            <div key={item.label} className="bg-secondary/50 border border-border/50 rounded-xl px-2.5 py-2 flex items-center gap-2">
              {item.icon}
              <div>
                <p style={{ fontSize: 9 }} className="text-muted-foreground leading-tight">{item.label}</p>
                <p style={{ fontSize: 12, fontWeight: 600 }} className="text-foreground leading-tight">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sunrise/Sunset */}
        <div className="flex items-center justify-center gap-6 mt-3 py-2 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Sunrise className="w-4 h-4 text-amber-400" />
            <div>
              <p style={{ fontSize: 9 }} className="text-muted-foreground">Terbit</p>
              <p style={{ fontSize: 12, fontWeight: 600 }} className="text-foreground">{sunriseTime}</p>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-1.5">
            <Sunset className="w-4 h-4 text-orange-400" />
            <div>
              <p style={{ fontSize: 9 }} className="text-muted-foreground">Terbenam</p>
              <p style={{ fontSize: 12, fontWeight: 600 }} className="text-foreground">{sunsetTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
