import { useState, useEffect } from 'react';
import React from 'react';
import { Cloud, CloudRain, Sun, CloudSun, CloudDrizzle, CloudSnow, CloudLightning } from 'lucide-react';

const LAT = -6.5968;
const LON = 106.7988;

export interface WeatherData {
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

export function getWeatherInfo(code: number, isDay: boolean) {
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

export function useWeather() {
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
        visibility: 10,
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
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { weather, loading, error, lastUpdated, fetchWeather };
}
