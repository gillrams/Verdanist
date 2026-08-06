import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Thermometer, Droplets, Sun, Wind, Bell, Droplet, TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import TimerModal from '../components/dashboard/TimerModal';
import PumpSettingsModal from '../components/dashboard/PumpSettingsModal';
import AiAssistantModal from '../components/dashboard/AiAssistantModal';
import PumpController from '../components/dashboard/PumpController';
import AlertModal from '../components/ui/AlertModal';
import { useWeather, getWeatherInfo } from '../hooks/useWeather';
import logoLight from '../assets/Logo_Light_Samping.png';
import logoDark from '../assets/Logo_Dark_samping.png';
import NotificationModal from '../components/dashboard/NotificationModal';
import ActivityLog from '../components/dashboard/ActivityLog';
import { getNotifPrefs, sendNotification } from '../utils/notifications';

const formatLastSeen = (dateString: string | null) => {
  if (!dateString) return 'Belum pernah';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeString = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `Hari ini, ${timeString}`;
  } else if (isYesterday) {
    return `Kemarin, ${timeString}`;
  } else {
    return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${timeString}`;
  }
};

const MAX_CHART_POINTS = 30;
const CHART_INTERVAL_MS = 60_000; // Record a chart point every 1 minute

type ChartPoint = { time: string; suhu: number | null; humidity: number | null };


export default function Dashboard() {
  const { currentFarm } = useAuth();
  const { weather } = useWeather();
  const { t, lang } = useLanguage();
  const [zone, setZone] = useState<"indoor" | "outdoor">("indoor");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live chart data (sliding window, max 30 points)
  const [indoorChartData, setIndoorChartData] = useState<ChartPoint[]>([]);
  const [outdoorChartData, setOutdoorChartData] = useState<ChartPoint[]>([]);

  const [indoorSensor, setIndoorSensor] = useState<{ temp: number | null; hum: number | null; mode: 'manual' | 'auto' | 'timer'; lastSeen: string | null }>({ temp: null, hum: null, mode: 'auto', lastSeen: null });
  const [outdoorSensor, setOutdoorSensor] = useState<{ temp: number | null; hum: number | null; mode: 'manual' | 'auto' | 'timer'; lastSeen: string | null }>({ temp: null, hum: null, mode: 'auto', lastSeen: null });
  const [deviceOnline, setDeviceOnline] = useState({ indoor: false, outdoor: false });
  const lastSeenRef = useRef<{ indoor: string | null; outdoor: string | null }>({ indoor: null, outdoor: null });

  const [indoorPump, setIndoorPump] = useState({ on: false, lastRun: t('dash.neverRun') });
  const [outdoorPump, setOutdoorPump] = useState({ on: false, lastRun: t('dash.neverRun') });
  const [loading, setLoading] = useState(true);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timerModalTab, setTimerModalTab] = useState<'schedule' | 'interval'>('schedule');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalDevice, setModalDevice] = useState<'indoor' | 'outdoor'>('indoor');

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isNotification: boolean;
    confirmText: string;
    cancelText: string;
    type: 'warning' | 'success' | 'info';
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => { },
    isNotification: false, confirmText: 'OK', cancelText: lang === 'id' ? 'Batal' : 'Cancel', type: 'info'
  });

  const handleShowAlert = (title: string, message: string, onConfirm?: () => void, isNotification = false, confirmText = 'OK', cancelText = t('dash.cancel'), type: 'warning' | 'success' | 'info' = 'warning') => {
    setAlertState({ isOpen: true, title, message, onConfirm: onConfirm || (() => { }), isNotification, confirmText, cancelText, type });
  };

  useEffect(() => {
    const fetchInitial = async () => {
      const { data: sData } = await supabase.from('device_settings').select('*').in('device_id', ['ESP32_INDOOR', 'ESP32_OUTDOOR']);
      if (sData) {
        const now = Date.now();
        let initIndoorOnline = false;
        let initOutdoorOnline = false;
        
        sData.forEach(d => {
          if (d.device_id === 'ESP32_INDOOR') {
            lastSeenRef.current.indoor = d.last_seen ?? null;
            setIndoorSensor(p => ({ ...p, temp: d.temperature ?? null, hum: d.humidity ?? null, mode: d.mode || p.mode, lastSeen: d.last_seen ?? null }));
            if (d.last_seen) initIndoorOnline = (now - new Date(d.last_seen).getTime()) < 15000;
          }
          if (d.device_id === 'ESP32_OUTDOOR') {
            lastSeenRef.current.outdoor = d.last_seen ?? null;
            setOutdoorSensor(p => ({ ...p, temp: d.temperature ?? null, hum: d.humidity ?? null, mode: d.mode || p.mode, lastSeen: d.last_seen ?? null }));
            if (d.last_seen) initOutdoorOnline = (now - new Date(d.last_seen).getTime()) < 15000;
          }
        });
        
        setDeviceOnline({ indoor: initIndoorOnline, outdoor: initOutdoorOnline });
      }
      const { data: pData } = await supabase.from('device_status').select('*').in('device_id', ['ESP32_INDOOR', 'ESP32_OUTDOOR']);
      if (pData) {
        pData.forEach(d => {
          if (d.device_id === 'ESP32_INDOOR') setIndoorPump(p => ({ ...p, on: d.pump_active || false }));
          if (d.device_id === 'ESP32_OUTDOOR') setOutdoorPump(p => ({ ...p, on: d.pump_active || false }));
        });
      }
      // Seed chart with initial data point
      const initTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (sData) {
        const indoorRow = sData.find((d: any) => d.device_id === 'ESP32_INDOOR');
        const outdoorRow = sData.find((d: any) => d.device_id === 'ESP32_OUTDOOR');
        if (indoorRow) {
          setIndoorChartData([{ time: initTime, suhu: indoorRow.temperature ?? null, humidity: indoorRow.humidity ?? null }]);
        }
        if (outdoorRow) {
          setOutdoorChartData([{ time: initTime, suhu: outdoorRow.temperature ?? null, humidity: outdoorRow.humidity ?? null }]);
        }
      }
      setLoading(false);
    };
    fetchInitial();

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Read lastSeen from ref (always up-to-date, no nested setState issues)
      const indoorLS = lastSeenRef.current.indoor;
      const outdoorLS = lastSeenRef.current.outdoor;
      const newIndoor = indoorLS ? (now.getTime() - new Date(indoorLS).getTime()) < 15000 : false;
      const newOutdoor = outdoorLS ? (now.getTime() - new Date(outdoorLS).getTime()) < 15000 : false;

      setDeviceOnline(prev => {
        if (newIndoor !== prev.indoor || newOutdoor !== prev.outdoor) {
          return { indoor: newIndoor, outdoor: newOutdoor };
        }
        return prev;
      });
    }, 5000);

    const sub = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_settings' }, payload => {
        const prefs = getNotifPrefs();
        const checkAndNotifySensors = (prev: any, devName: string) => {
          const newTemp = payload.new.temperature ?? prev.temp;
          const newHum = payload.new.humidity ?? prev.hum;
          const tempThresh = payload.new.temp_threshold ?? 32;
          const humThresh = payload.new.hum_threshold ?? 50;

          if (prefs.notifTemp && newTemp > tempThresh && newTemp > prev.temp) {
            sendNotification(`temp_${payload.new.device_id}`, `🌡️ Suhu Ekstrem (${devName})`, { body: `Suhu mencapai ${newTemp.toFixed(1)}°C (Melebihi batas ${tempThresh}°C)` });
          }
          if (prefs.notifRH && newHum < humThresh && newHum < prev.hum) {
            sendNotification(`rh_${payload.new.device_id}`, `💧 Kelembaban Rendah (${devName})`, { body: `Kelembaban turun ke ${newHum.toFixed(1)}% (Di bawah batas ${humThresh}%)` });
          }
          
          // Update ref so the timer picks it up immediately
          const newLastSeen = payload.new.last_seen ?? prev.lastSeen;
          if (payload.new.device_id === 'ESP32_INDOOR') lastSeenRef.current.indoor = newLastSeen;
          if (payload.new.device_id === 'ESP32_OUTDOOR') lastSeenRef.current.outdoor = newLastSeen;
          return { ...prev, temp: newTemp, hum: newHum, mode: payload.new.mode ?? prev.mode, lastSeen: newLastSeen };
        };

        if (payload.new.device_id === 'ESP32_INDOOR') {
          setIndoorSensor(p => checkAndNotifySensors(p, 'Indoor'));
        } else if (payload.new.device_id === 'ESP32_OUTDOOR') {
          setOutdoorSensor(p => checkAndNotifySensors(p, 'Outdoor'));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_status' }, payload => {
        const prefs = getNotifPrefs();
        const checkAndNotifyPump = (prev: any, devName: string) => {
          const pumpActive = payload.new.pump_active ?? false;
          
          if (prefs.notifPump && pumpActive !== prev.on) {
            if (pumpActive) {
              sendNotification(`pump_${payload.new.device_id}`, `≡ƒÆª Pompa Menyala`, { body: `Pompa misting ${devName} sedang aktif.`, requireInteraction: false }, true);
            } else {
              sendNotification(`pump_${payload.new.device_id}`, `ΓÅ╣∩╕Å Pompa Berhenti`, { body: `Pompa misting ${devName} dimatikan.`, requireInteraction: false }, true);
            }
          }

          return { ...prev, on: pumpActive };
        };

        if (payload.new.device_id === 'ESP32_INDOOR') {
          setIndoorPump(p => checkAndNotifyPump(p, 'Indoor'));
        } else if (payload.new.device_id === 'ESP32_OUTDOOR') {
          setOutdoorPump(p => checkAndNotifyPump(p, 'Outdoor'));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
      clearInterval(timer);
    };
  }, []);

  // Record chart data every 1 minute from latest sensor readings
  const indoorSensorRef = useRef(indoorSensor);
  const outdoorSensorRef = useRef(outdoorSensor);
  const deviceOnlineRef = useRef(deviceOnline);
  useEffect(() => { indoorSensorRef.current = indoorSensor; }, [indoorSensor]);
  useEffect(() => { outdoorSensorRef.current = outdoorSensor; }, [outdoorSensor]);
  useEffect(() => { deviceOnlineRef.current = deviceOnline; }, [deviceOnline]);

  useEffect(() => {
    const chartTimer = setInterval(() => {
      const timeLabel = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      
      const iSensor = indoorSensorRef.current;
      if (deviceOnlineRef.current.indoor && (iSensor.temp !== null || iSensor.hum !== null)) {
        setIndoorChartData(prev => {
          const next = [...prev, { time: timeLabel, suhu: iSensor.temp, humidity: iSensor.hum }];
          return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next;
        });
      }

      const oSensor = outdoorSensorRef.current;
      if (deviceOnlineRef.current.outdoor && (oSensor.temp !== null || oSensor.hum !== null)) {
        setOutdoorChartData(prev => {
          const next = [...prev, { time: timeLabel, suhu: oSensor.temp, humidity: oSensor.hum }];
          return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next;
        });
      }
    }, CHART_INTERVAL_MS);

    return () => clearInterval(chartTimer);
  }, []);

  // Count sensors that have actual data from DHT11
  const connectedSensorsCount = [deviceOnline.indoor, deviceOnline.outdoor].filter(Boolean).length;
  // Is current zone sensor connected?
  const currentSensorConnected = zone === 'indoor' ? deviceOnline.indoor : deviceOnline.outdoor;

  const sensorData = zone === "indoor"
    ? { suhu: currentSensorConnected ? indoorSensor.temp : null, rh: currentSensorConnected ? indoorSensor.hum : null, tanah: 45, cahaya: 8200, co2: 412 }
    : { suhu: currentSensorConnected ? outdoorSensor.temp : null, rh: currentSensorConnected ? outdoorSensor.hum : null, tanah: 38, cahaya: 62000, co2: 415 };

  const hour = new Date().getHours();
  const greeting = hour < 11 ? t('dash.greeting.morning') : hour < 15 ? t('dash.greeting.afternoon') : hour < 18 ? t('dash.greeting.evening') : t('dash.greeting.night');

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 lg:pb-6 lg:pt-6 w-full">
      
      {/* Top Brand Bar - logo hanya tampil di mobile, desktop pakai sidebar */}
      <div className="px-6 pt-10 lg:pt-0 pb-4 flex items-center justify-between">
        <div className="lg:hidden">
          <img src={logoLight} alt="Verdanist Logo" className="h-12 w-auto object-contain dark:hidden" />
          <img src={logoDark} alt="Verdanist Logo" className="h-12 w-auto object-contain hidden dark:block" />
        </div>
        {/* Di desktop, tampilkan judul kebun aktif sebagai ganti logo */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-foreground font-bold" style={{ fontSize: 20 }}>
            {currentFarm?.name || 'Dashboard'}
          </span>
        </div>
        <span className="text-muted-foreground/80 font-medium tracking-wide" style={{ fontSize: 13 }}>
          {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
        </span>
      </div>

      {/* Main Action Header */}
      <div className="px-6 pb-4">
        <div className="flex items-start justify-between mb-0 gap-4">
          <div className="flex flex-col gap-2.5">
            <div>
              <p style={{ fontSize: 13 }} className="text-muted-foreground mb-1.5">
                {greeting} · {currentFarm?.name || 'Persada Farm Bogor'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {weather && (
                  <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/10 px-2 py-0.5 rounded-md w-fit">
                    <div className="scale-[0.45] -mx-2 flex items-center justify-center h-4">
                      {getWeatherInfo(weather.weatherCode, weather.isDay).icon}
                    </div>
                    <span className="text-primary" style={{ fontSize: 11, fontWeight: 600 }}>
                      {getWeatherInfo(weather.weatherCode, weather.isDay).desc}, {weather.temperature.toFixed(0)}°C
                    </span>
                  </div>
                )}
                {/* Sensor Connection Badge */}
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md w-fit border transition-all ${
                  connectedSensorsCount === 2
                    ? 'bg-green-500/10 border-green-500/20'
                    : connectedSensorsCount === 1
                      ? 'bg-yellow-500/10 border-yellow-500/20'
                      : 'bg-muted/60 border-border'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    connectedSensorsCount === 2 ? 'bg-green-500 animate-pulse'
                    : connectedSensorsCount === 1 ? 'bg-yellow-500 animate-pulse'
                    : 'bg-muted-foreground/40'
                  }`} />
                  <span className={`${
                    connectedSensorsCount === 2 ? 'text-green-600 dark:text-green-400'
                    : connectedSensorsCount === 1 ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-muted-foreground'
                  }`} style={{ fontSize: 11, fontWeight: 600 }}>
                    {connectedSensorsCount}/2 Sensor
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0">
            <button onClick={() => setIsAiModalOpen(true)} className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-pulse shadow-sm border border-primary/20">
              <span className="material-symbols-rounded text-[18px]">psychology</span>
            </button>
            <ThemeToggle className="w-9 h-9 bg-card border border-border" />
            <div className="relative">
              <button 
                onClick={() => setIsNotifModalOpen(true)}
                className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              </button>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-ring rounded-full border-2 border-background animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid wrapper for desktop layout */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Hero sensor card */}
        <div className="lg:col-span-7 order-1 w-full flex flex-col gap-3">
            {!currentSensorConnected && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-rounded text-destructive text-xl">wifi_off</span>
                </div>
                <div>
                  <h4 className="text-destructive font-bold text-sm">Perangkat Offline</h4>
                  <p className="text-destructive/80 text-xs mt-0.5">Tidak ada koneksi dari ESP32 {zone === 'indoor' ? 'Indoor' : 'Outdoor'}. Terakhir aktif: {zone === 'indoor' ? formatLastSeen(indoorSensor.lastSeen) : formatLastSeen(outdoorSensor.lastSeen)}</p>
                </div>
              </div>
            )}
            <div className={`border border-border rounded-3xl overflow-hidden shadow-[var(--shadow-custom)] transition-colors duration-500 ${
              !currentSensorConnected ? 'bg-card grayscale-[30%]' :
              sensorData.suhu !== null && sensorData.suhu > 30 ? 'bg-gradient-to-br from-orange-500/10 to-red-500/5' :
              sensorData.suhu !== null && sensorData.suhu < 24 ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5' :
              'bg-card'
            }`}>
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${currentSensorConnected ? 'bg-ring animate-pulse' : 'bg-destructive'}`} />
                  <span className={currentSensorConnected ? 'text-ring' : 'text-destructive'} style={{ fontSize: 12, fontWeight: 600 }}>
                    {currentSensorConnected ? 'LIVE' : 'OFFLINE'}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                    · {currentSensorConnected ? t('dash.realtime') : 'No Sensor Data'}
                  </span>
                </div>
                <div className="bg-muted rounded-xl p-0.5 flex">
                  {(["indoor", "outdoor"] as const).map((z) => (
                    <button
                      key={z}
                      onClick={() => setZone(z)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${zone === z ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      {z === "indoor" ? t('dash.indoor') : t('dash.outdoor')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Big numbers */}
              <div className="flex items-end gap-6 px-5 pb-5">
                <div>
                  <div className="flex items-start gap-1">
                    <span
                      style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 64, fontWeight: 600, lineHeight: 1 }}
                      className={sensorData.suhu !== null ? 'text-foreground' : 'text-muted-foreground/25'}
                    >
                      {sensorData.suhu !== null ? sensorData.suhu.toFixed(1) : '--'}
                    </span>
                    <span
                      className={`mt-4 ${sensorData.suhu !== null ? 'text-muted-foreground' : 'text-muted-foreground/20'}`}
                      style={{ fontSize: 22, fontWeight: 500 }}
                    >°C</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Thermometer className={`w-3.5 h-3.5 ${sensorData.suhu !== null ? 'text-ring' : 'text-muted-foreground/30'}`} />
                    <span style={{ fontSize: 12 }} className="text-muted-foreground">{t('dash.airTemp')}</span>
                    {sensorData.suhu !== null && <TrendingUp className="w-3 h-3 text-ring" />}
                    {sensorData.suhu !== null && sensorData.suhu > 28 && currentSensorConnected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                        {t('dash.hot')}
                      </span>
                    )}
                    {!currentSensorConnected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive">
                        Offline
                      </span>
                    )}
                  </div>
                </div>
                <div className="pb-1">
                  <div className="flex items-start gap-1">
                    <span
                      style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 48, fontWeight: 600, lineHeight: 1 }}
                      className={sensorData.rh !== null ? 'text-muted-foreground' : 'text-muted-foreground/25'}
                    >
                      {sensorData.rh !== null ? sensorData.rh.toFixed(1) : '--'}
                    </span>
                    <span
                      className={`mt-3 ${sensorData.rh !== null ? 'text-muted-foreground/60' : 'text-muted-foreground/20'}`}
                      style={{ fontSize: 18, fontWeight: 500 }}
                    >%</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Droplets className={`w-3.5 h-3.5 ${sensorData.rh !== null ? 'text-chart-2' : 'text-muted-foreground/30'}`} />
                    <span style={{ fontSize: 12 }} className="text-muted-foreground">{t('dash.humidity')}</span>
                    {sensorData.rh !== null && <TrendingDown className="w-3 h-3 text-chart-2 ml-1" />}
                  </div>
                </div>
              </div>

              {/* Weather / Sensor pills */}
              <div className="flex gap-2 px-5 pb-5 overflow-x-auto no-scrollbar">
                {weather ? [
                  { label: t('dash.wind'), value: `${weather.windSpeed.toFixed(1)} km/${lang === 'id' ? 'j' : 'h'}`, icon: <Wind className="w-3.5 h-3.5 text-teal-400" /> },
                  { label: "UV Index", value: weather.uvIndex.toFixed(1), icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
                  { label: t('dash.rain'), value: `${weather.precipitation} mm`, icon: <Droplet className="w-3.5 h-3.5 text-sky-400" /> },
                ].map((s) => (
                  <div key={s.label} className="flex-shrink-0 bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 flex items-center gap-2">
                    <div className="w-5 h-5 flex items-center justify-center">{s.icon}</div>
                    <div>
                      <p style={{ fontSize: 10 }} className="text-muted-foreground">{s.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600 }} className="text-foreground">{s.value}</p>
                    </div>
                  </div>
                )) : (
                  <div className="w-full flex items-center justify-center py-2">
                    <span className="text-xs text-muted-foreground animate-pulse">{t('dash.loadingWeather')}</span>
                  </div>
                )}
              </div>
            </div>
        </div>

          {/* Charts separated — live data, updates every 1 min, max 30 points */}
          <div className="lg:col-span-7 order-3 grid grid-cols-1 gap-3 lg:gap-4">
            {/* Suhu Chart */}
            <div className="bg-card border border-border rounded-3xl p-4 shadow-[var(--shadow-custom)]">
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground">
                  {t('dash.tempChart')}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: 11 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-ring animate-pulse inline-block" />
                  Live · 1 min
                </span>
              </div>
              {currentSensorConnected && (zone === 'indoor' ? indoorChartData : outdoorChartData).length > 1 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={zone === 'indoor' ? indoorChartData : outdoorChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="suhuGradMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)", fontSize: 12 }}
                      labelStyle={{ color: "var(--color-muted-foreground)" }}
                    />
                    <Area type="monotone" dataKey="suhu" name={t('dash.tempC')} stroke="var(--primary)" strokeWidth={2} fill="url(#suhuGradMobile)" dot={false} animationDuration={500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[120px] text-muted-foreground">
                  <span className="material-symbols-rounded text-2xl mb-1">{currentSensorConnected ? 'show_chart' : 'sensors_off'}</span>
                  <span style={{ fontSize: 12 }}>{currentSensorConnected ? 'Mengumpulkan data grafik...' : 'Tidak ada data sensor'}</span>
                  <span style={{ fontSize: 10 }} className="text-muted-foreground/60 mt-0.5">{currentSensorConnected ? 'Titik baru setiap 1 menit' : 'Perangkat sedang offline'}</span>
                </div>
              )}
            </div>

            {/* Kelembaban Chart */}
            <div className="bg-card border border-border rounded-3xl p-4 shadow-[var(--shadow-custom)]">
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground">
                  {t('dash.humChart')}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: 11 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-2 animate-pulse inline-block" />
                  Live · 1 min
                </span>
              </div>
              {currentSensorConnected && (zone === 'indoor' ? indoorChartData : outdoorChartData).length > 1 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={zone === 'indoor' ? indoorChartData : outdoorChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="humGradMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[30, 100]} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)", fontSize: 12 }}
                      labelStyle={{ color: "var(--color-muted-foreground)" }}
                    />
                    <Area type="monotone" dataKey="humidity" name={t('dash.humPercent')} stroke="#3b82f6" strokeWidth={2} fill="url(#humGradMobile)" dot={false} animationDuration={500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[120px] text-muted-foreground">
                  <span className="material-symbols-rounded text-2xl mb-1">{currentSensorConnected ? 'show_chart' : 'sensors_off'}</span>
                  <span style={{ fontSize: 12 }}>{currentSensorConnected ? 'Mengumpulkan data grafik...' : 'Tidak ada data sensor'}</span>
                  <span style={{ fontSize: 10 }} className="text-muted-foreground/60 mt-0.5">{currentSensorConnected ? 'Titik baru setiap 1 menit' : 'Perangkat sedang offline'}</span>
                </div>
              )}
            </div>
          </div>

        {/* Right Column */}
        <div className="lg:col-span-5 lg:row-span-2 order-2 flex flex-col gap-4 lg:gap-6">
          
          {/* Pump section */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 style={{ fontWeight: 600, fontSize: 16 }} className="text-foreground">{t('dash.pumpControl')}</h2>
              <span className="text-muted-foreground" style={{ fontSize: 13 }}>
                {zone === 'indoor' ? (indoorPump.on ? `1 ${t('dash.active')}` : `0 ${t('dash.active')}`) : (outdoorPump.on ? `1 ${t('dash.active')}` : `0 ${t('dash.active')}`)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="bg-card rounded-[2rem] p-5 flex items-center justify-center h-[280px] border border-border shadow-sm">
                   <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : (
                zone === 'indoor' ? (
                  <PumpController
                    key="indoor"
                    device="indoor"
                    isDeviceOnline={deviceOnline.indoor}
                    mode={indoorSensor.mode}
                    setMode={(m) => setIndoorSensor(p => ({ ...p, mode: m as any }))}
                    temp={deviceOnline.indoor ? (indoorSensor.temp ?? undefined) : undefined}
                    humidity={deviceOnline.indoor ? (indoorSensor.hum ?? undefined) : undefined}
                    onOpenSettings={() => { setModalDevice('indoor'); setIsSettingsModalOpen(true); }}
                    onOpenTimerModal={(tab = 'schedule') => { setModalDevice('indoor'); setTimerModalTab(tab); setIsTimerModalOpen(true); }}
                    onShowAlert={handleShowAlert}
                  />
                ) : (
                  <PumpController
                    key="outdoor"
                    device="outdoor"
                    isDeviceOnline={deviceOnline.outdoor}
                    mode={outdoorSensor.mode}
                    setMode={(m) => setOutdoorSensor(p => ({ ...p, mode: m as any }))}
                    temp={deviceOnline.outdoor ? (outdoorSensor.temp ?? undefined) : undefined}
                    humidity={deviceOnline.outdoor ? (outdoorSensor.hum ?? undefined) : undefined}
                    onOpenSettings={() => { setModalDevice('outdoor'); setIsSettingsModalOpen(true); }}
                    onOpenTimerModal={(tab = 'schedule') => { setModalDevice('outdoor'); setTimerModalTab(tab); setIsTimerModalOpen(true); }}
                    onShowAlert={handleShowAlert}
                  />
                )
              )}
            </div>
          </div>

          {/* Activity Log Desktop Only */}
          <div className="hidden lg:block h-[400px]">
            <ActivityLog />
          </div>

        </div>
      </div>

      {/* Modals */}
      <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} deviceId={zone === 'indoor' ? 'ESP32_INDOOR' : 'ESP32_OUTDOOR'} onShowAlert={handleShowAlert} />
      <NotificationModal isOpen={isNotifModalOpen} onClose={() => setIsNotifModalOpen(false)} />
      <PumpSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} deviceId={modalDevice === 'indoor' ? 'ESP32_INDOOR' : 'ESP32_OUTDOOR'} onShowAlert={handleShowAlert} />
      <TimerModal isOpen={isTimerModalOpen} onClose={() => setIsTimerModalOpen(false)} deviceId={modalDevice === 'indoor' ? 'ESP32_INDOOR' : 'ESP32_OUTDOOR'} currentMode="timer" setMode={() => { }} onShowAlert={handleShowAlert} initialTab={timerModalTab} />
      <AlertModal {...alertState} onClose={() => setAlertState(p => ({ ...p, isOpen: false }))} />

    </div>
  );
}
