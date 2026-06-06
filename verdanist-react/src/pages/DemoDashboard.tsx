import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '../components/LoginModal';
import SensorChart from '../components/SensorChart';
import AIAssistantWidget from '../components/AIAssistantWidget';
import SmartRoutinesWidget from '../components/SmartRoutinesWidget';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';

// --- Types ---
interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  locationName: string;
}

// --- Weather Code Mapper ---
function getWeatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Cerah' };
  if (code <= 2) return { emoji: '🌤️', label: 'Cerah Berawan' };
  if (code <= 3) return { emoji: '☁️', label: 'Berawan' };
  if (code <= 48) return { emoji: '🌫️', label: 'Kabut' };
  if (code <= 57) return { emoji: '🌦️', label: 'Gerimis' };
  if (code <= 67) return { emoji: '🌧️', label: 'Hujan' };
  if (code <= 77) return { emoji: '❄️', label: 'Salju' };
  if (code <= 82) return { emoji: '🌦️', label: 'Hujan Showers' };
  return { emoji: '⛈️', label: 'Badai Petir' };
}

// --- Mock Sensor Data ---
const mockSensors = [
  { id: 'soil', icon: '🌱', label: 'Kelembaban Tanah', value: '68', unit: '%', bgClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400', status: 'Optimal' },
  { id: 'light', icon: '💡', label: 'Intensitas Cahaya', value: '12.400', unit: 'lux', bgClass: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400', status: 'Baik' },
  { id: 'ph', icon: '🧪', label: 'pH Tanah', value: '6.5', unit: 'pH', bgClass: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400', status: 'Ideal' },
];

const mockZones = [
  { id: 'pump', icon: '💧', label: 'Pompa Air', sub: 'Irigasi Utama', activeColor: 'var(--color-primary)', activeBg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-400' },
  { id: 'mist', icon: '🌫️', label: 'Sistem Mist', sub: 'Kontrol Kelembaban', activeColor: '#06b6d4', activeBg: 'bg-cyan-500/15 border-cyan-500/35 text-cyan-600 dark:text-cyan-400' },
  { id: 'fan', icon: '🌀', label: 'Kipas Ventilasi', sub: 'Sirkulasi Udara', activeColor: '#6366f1', activeBg: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-600 dark:text-indigo-400' },
];

export default function DemoDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>({ pump: false, mist: false, fan: false });
  const [showModal, setShowModal] = useState(false);
  const [pendingDevice, setPendingDevice] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Listen to global dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Watch for html class updates to sync chart theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather via geolocation + Open-Meteo
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, locName: string) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`
        );
        const data = await res.json();
        const currentHour = new Date().getHours();
        setWeather({
          temperature: Math.round(data.current_weather.temperature),
          humidity: data.hourly.relativehumidity_2m[currentHour] ?? 70,
          weatherCode: data.current_weather.weathercode,
          locationName: locName,
        });
      } catch {
        setWeather({ temperature: 29, humidity: 72, weatherCode: 1, locationName: locName });
      } finally {
        setWeatherLoading(false);
      }
    };

    const getLocationName = async (lat: number, lon: number): Promise<string> => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        return data.address?.city || data.address?.town || data.address?.county || 'Lokasi Anda';
      } catch {
        return 'Lokasi Anda';
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const locName = await getLocationName(latitude, longitude);
          fetchWeather(latitude, longitude, locName);
        },
        () => { fetchWeather(-6.2088, 106.8456, 'Jakarta'); },
        { timeout: 8000 }
      );
    } else {
      fetchWeather(-6.2088, 106.8456, 'Jakarta');
    }
  }, []);

  const handleDeviceToggle = (id: string) => {
    setPendingDevice(id);
    // 1. Optimistically turn the toggle ON for tactile feedback
    setDeviceStates(prev => ({ ...prev, [id]: true }));
    // 2. Show the modal simultaneously
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    // 3. Revert the toggle back to OFF smoothly after modal starts closing
    if (pendingDevice) {
      setTimeout(() => {
        setDeviceStates(prev => ({ ...prev, [pendingDevice]: false }));
        setPendingDevice('');
      }, 300);
    }
  };

  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode) : null;
  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, type: 'spring' as const, stiffness: 100 }
    }),
  };

  return (
    <>
      {/* Page background */}
      <div className="min-h-[100dvh] w-full overflow-y-auto bg-background transition-colors duration-500 relative">

        {/* Top decorative header image */}
        <div
          className="w-full h-[360px] absolute top-0 left-0 z-0 bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: 'url(/images/header_bg.png)', opacity: isDarkMode ? 0.2 : 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-transparent transition-colors duration-500" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent transition-colors duration-500" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-16 pt-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start justify-between mb-8 lg:mb-10"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/10 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-primary/25 shadow-sm">
                  🟢 Mode Demo
                </span>
              </div>
              <h1 
                style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 32, fontWeight: 600 }}
                className="text-foreground leading-tight mt-1"
              >
                {greeting()}, {user?.displayName || 'Tamu'} 👋
              </h1>
              <p className="text-muted-foreground text-sm mt-1 font-medium">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric' })}
                {' · '}
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle className="w-11 h-11 lg:w-12 lg:h-12 bg-card border border-border shadow-sm" />
              
              {/* Login/Logout Button */}
              <button 
                onClick={async () => {
                  if (user) {
                    await logout();
                    navigate('/');
                  } else {
                    navigate('/login');
                  }
                }}
                className={`w-11 h-11 lg:w-12 lg:h-12 rounded-full backdrop-blur-md flex items-center justify-center shadow-sm border transition-colors cursor-pointer ${
                  user 
                    ? "bg-card border-border text-muted-foreground hover:text-destructive" 
                    : "bg-primary border-primary text-primary-foreground hover:opacity-90"
                }`}
                title={user ? "Keluar" : "Masuk"}
              >
                {user ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-x-8">
            
            {/* Left Column: Weather + Sensors + Charts */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* AI Assistant Widget */}
              <AIAssistantWidget 
                temperature={weather?.temperature} 
                humidity={weather?.humidity} 
              />

              {/* Weather Card - Glassmorphism & Overlapping */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.01, y: -2, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                className="rounded-[28px] p-6 shadow-custom border border-border relative overflow-hidden backdrop-blur-xl bg-card/65"
              >
                <div className="relative z-10">
                  {weatherLoading ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-secondary animate-pulse" />
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="h-4 w-40 rounded-full bg-secondary animate-pulse" />
                        <div className="h-3 w-28 rounded-full bg-secondary animate-pulse" />
                      </div>
                    </div>
                  ) : weather && weatherInfo ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-card shadow-sm border border-border flex items-center justify-center text-3xl lg:text-4xl">
                          {weatherInfo.emoji}
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs lg:text-sm font-semibold flex items-center gap-1 mb-0.5">
                            📍 {weather.locationName}
                          </p>
                          <p className="text-foreground text-[34px] lg:text-[42px] font-extrabold leading-none tracking-tight">{weather.temperature}°C</p>
                          <p className="text-muted-foreground text-sm lg:text-base mt-0.5 lg:mt-1 font-medium">{weatherInfo.label}</p>
                        </div>
                      </div>
                      <div className="text-right bg-secondary border border-border rounded-2xl px-5 py-3.5 shadow-sm">
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-0.5">Kelembaban</p>
                        <p className="text-primary text-[22px] lg:text-[28px] font-extrabold leading-none">{weather.humidity}%</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>

              {/* Sensor Cards */}
              <div>
                <h2 className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest mb-3 px-1">Pembacaan Sensor</h2>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {mockSensors.map((sensor, i) => (
                    <motion.div
                      key={sensor.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ scale: 1.05, y: -4, transition: { type: 'spring', stiffness: 400, damping: 12 } }}
                      className={`rounded-2xl p-4 flex flex-col gap-1 border shadow-sm cursor-default transition-colors ${sensor.bgClass}`}
                    >
                      <span className="text-2xl lg:text-3xl mb-1">{sensor.icon}</span>
                      <p className="text-xl lg:text-2xl font-extrabold">
                        {sensor.value}
                        <span className="text-xs font-semibold ml-0.5 opacity-80">{sensor.unit}</span>
                      </p>
                      <p className="opacity-80 font-medium text-[11px] lg:text-xs leading-tight">{sensor.label}</p>
                      <span className="text-[10px] lg:text-xs mt-1 font-bold">{sensor.status}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Data Visualization (Chart) */}
              <div className="mt-2">
                <SensorChart isDarkMode={isDarkMode} />
              </div>
            </div>

            {/* Right Column: Device Controls */}
            <div className="lg:col-span-5 flex flex-col">
              <h2 className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest mb-3 px-1">Kontrol Perangkat</h2>
              <div className="flex flex-col gap-3">
                {mockZones.map((device, i) => {
                  const isOn = deviceStates[device.id];
                  
                  return (
                    <motion.div
                      key={device.id}
                      custom={i + 3}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => handleDeviceToggle(device.id)}
                      whileHover={{ scale: 1.02, y: -1, transition: { type: 'spring', stiffness: 400, damping: 12 } }}
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-2xl p-4 lg:p-5 flex items-center justify-between border shadow-sm transition-all duration-300 cursor-pointer ${
                        isOn ? device.activeBg : "bg-card border-border text-foreground hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div
                          className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-xl lg:text-2xl transition-colors ${
                            isOn ? "bg-card shadow-sm text-foreground" : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {device.icon}
                        </div>
                        <div>
                          <p className="font-bold text-sm lg:text-base text-foreground">{device.label}</p>
                          <p className="text-muted-foreground text-xs lg:text-sm">{device.sub}</p>
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        className={`relative w-12 h-6 lg:w-14 lg:h-7 rounded-full transition-colors duration-300 border ${
                          isOn ? "bg-primary border-primary" : "bg-switch-background border-border"
                        }`}
                      >
                        <div
                          className={`absolute top-[2px] left-[2px] w-4 h-4 lg:w-5 lg:h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                            isOn ? "translate-x-[22px] lg:translate-x-[26px]" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Smart Routines */}
              <SmartRoutinesWidget onToggle={handleDeviceToggle} />

              {/* Demo Notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 lg:mt-8 rounded-2xl p-5 border border-amber-500/20 text-center bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm"
              >
                <p className="text-sm lg:text-base font-bold flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                  Mode Demo Aktif
                </p>
                <p className="text-xs lg:text-sm mt-1.5 opacity-90 leading-relaxed">
                  Sentuh sakelar untuk menguji kontrol. Silakan masuk ke akun Anda untuk menghubungkan & mengontrol perangkat keras ESP32 secara langsung.
                </p>
              </motion.div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showModal && (
          <LoginModal
            deviceName={mockZones.find(d => d.id === pendingDevice)?.label ?? 'Perangkat'}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}
