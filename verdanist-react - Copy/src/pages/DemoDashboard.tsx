import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '../components/LoginModal';
import SensorChart from '../components/SensorChart';
import AIAssistantWidget from '../components/AIAssistantWidget';
import SmartRoutinesWidget from '../components/SmartRoutinesWidget';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- Types ---
interface WeatherData {
  temperature: number;
  humidity: number;
  weatherCode: number;
  locationName: string;
}

// --- Weather Code Mapper ---
function getWeatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Clear Sky' };
  if (code <= 2) return { emoji: '🌤️', label: 'Partly Cloudy' };
  if (code <= 3) return { emoji: '☁️', label: 'Overcast' };
  if (code <= 48) return { emoji: '🌫️', label: 'Foggy' };
  if (code <= 57) return { emoji: '🌦️', label: 'Drizzle' };
  if (code <= 67) return { emoji: '🌧️', label: 'Rain' };
  if (code <= 77) return { emoji: '❄️', label: 'Snow' };
  if (code <= 82) return { emoji: '🌦️', label: 'Showers' };
  return { emoji: '⛈️', label: 'Thunderstorm' };
}

// --- Mock Sensor Data ---
const mockSensors = [
  { id: 'soil', icon: '🌱', label: 'Soil Moisture', value: '68', unit: '%', bg: '#E8F8EE', accent: '#16a34a', status: 'Optimal' },
  { id: 'light', icon: '💡', label: 'Light Intensity', value: '12,400', unit: 'lux', bg: '#FFFBEA', accent: '#d97706', status: 'Good' },
  { id: 'ph', icon: '🧪', label: 'Soil pH', value: '6.5', unit: 'pH', bg: '#F3F0FF', accent: '#7c3aed', status: 'Ideal' },
];

const mockZones = [
  { id: 'pump', icon: '💧', label: 'Water Pump', sub: 'Main Irrigation', activeColor: '#22c55e', activeBg: '#f0fdf4' },
  { id: 'mist', icon: '🌫️', label: 'Mist System', sub: 'Humidity Control', activeColor: '#06b6d4', activeBg: '#ecfeff' },
  { id: 'fan', icon: '🌀', label: 'Ventilation Fan', sub: 'Air Circulation', activeColor: '#6366f1', activeBg: '#eef2ff' },
];

export default function Dashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>({ pump: false, mist: false, fan: false });
  const [showModal, setShowModal] = useState(false);
  const [pendingDevice, setPendingDevice] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        return data.address?.city || data.address?.town || data.address?.county || 'Your Location';
      } catch {
        return 'Your Location';
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
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, type: 'spring', stiffness: 100 }
    }),
  };

  return (
    <>
      <div className={isDarkMode ? 'dark' : ''}>
        {/* Page background */}
        <div className="min-h-[100dvh] w-full overflow-y-auto bg-[#F2FAF4] dark:bg-[#05150E] transition-colors duration-500">

        {/* Top decorative header image */}
        <div
          className="w-full h-[360px] absolute top-0 left-0 z-0 bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: 'url(/images/header_bg.png)', opacity: isDarkMode ? 0.3 : 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 dark:from-black/80 via-white/20 dark:via-black/40 to-transparent transition-colors duration-500" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#F2FAF4] dark:from-[#05150E] via-[#F2FAF4]/90 dark:via-[#05150E]/90 to-transparent transition-colors duration-500" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pb-12 pt-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start justify-between mb-8 lg:mb-10"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/60 dark:bg-black/30 backdrop-blur-sm text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/50 dark:border-white/10 shadow-sm transition-colors">
                  🟢 Demo Mode
                </span>
              </div>
              <h1 className="text-[#0A2F1F] dark:text-white/90 text-[28px] lg:text-[36px] font-extrabold leading-tight mt-1 transition-colors" style={{ textShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.5)' : '0 2px 10px rgba(255,255,255,0.9), 0 0 20px rgba(255,255,255,0.8)' }}>
                {greeting()}, {user?.displayName || 'Guest'} 👋
              </h1>
              <p className="text-[#0A2F1F]/90 dark:text-white/70 text-sm lg:text-base mt-0.5 font-bold transition-colors" style={{ textShadow: isDarkMode ? 'none' : '0 1px 8px rgba(255,255,255,0.9)' }}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {' · '}
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/50 dark:border-white/10 text-[#0A2F1F]/70 dark:text-yellow-400 hover:text-green-600 transition-colors"
                title="Toggle Dark Mode"
              >
                <span className="material-symbols-rounded text-xl lg:text-2xl">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
              </motion.button>
              
              {/* Avatar / Profile / Logout Button */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (user) {
                    await logout();
                    navigate('/');
                  } else {
                    navigate('/login');
                  }
                }}
                className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full backdrop-blur-md flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] border transition-colors cursor-pointer ${
                  user 
                    ? "bg-white/80 dark:bg-black/50 border-white/60 dark:border-white/10 text-[#0A2F1F]/70 dark:text-white/80 hover:text-red-500" 
                    : "bg-green-600/10 dark:bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-600 hover:text-white dark:hover:bg-green-500 dark:hover:text-white"
                }`}
                title={user ? "Log Out" : "Log In"}
              >
                <span className="material-symbols-rounded text-2xl lg:text-3xl">
                  {user ? 'logout' : 'login'}
                </span>
              </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-x-12">
            
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
                whileHover={{ scale: 1.02, y: -4, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
                className="rounded-[28px] p-5 lg:p-7 shadow-lg border border-white/50 dark:border-white/10 relative overflow-hidden backdrop-blur-xl"
                style={{ 
                  background: isDarkMode ? 'linear-gradient(135deg, rgba(10,47,31,0.6) 0%, rgba(10,47,31,0.3) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
                  WebkitBackdropFilter: 'blur(24px)'
                }}
              >
                {/* Glossy highlight inside card */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-white/40 dark:from-white/5 dark:to-transparent pointer-events-none" />
                
                <div className="relative z-10">
                  {weatherLoading ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/40 dark:bg-white/10 animate-pulse" />
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="h-4 w-40 rounded-full bg-white/40 dark:bg-white/10 animate-pulse" />
                        <div className="h-3 w-28 rounded-full bg-white/40 dark:bg-white/10 animate-pulse" />
                        <div className="h-3 w-20 rounded-full bg-white/40 dark:bg-white/10 animate-pulse" />
                      </div>
                    </div>
                  ) : weather && weatherInfo ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white/60 dark:bg-[#0A2F1F]/80 shadow-sm border border-white/50 dark:border-white/10 flex items-center justify-center text-3xl lg:text-4xl">
                          {weatherInfo.emoji}
                        </div>
                        <div>
                          <p className="text-[#0A2F1F]/60 dark:text-white/60 text-xs lg:text-sm font-semibold flex items-center gap-1 mb-0.5">
                            📍 {weather.locationName}
                          </p>
                          <p className="text-[#0A2F1F] dark:text-white/90 text-[34px] lg:text-[42px] font-extrabold leading-none tracking-tight">{weather.temperature}°C</p>
                          <p className="text-[#0A2F1F]/70 dark:text-white/70 text-sm lg:text-base mt-0.5 lg:mt-1 font-medium">{weatherInfo.label}</p>
                        </div>
                      </div>
                      <div className="text-right bg-white/50 dark:bg-black/30 rounded-[20px] px-4 py-3 lg:px-6 lg:py-4 border border-white/40 dark:border-white/5 shadow-sm">
                        <p className="text-[#0A2F1F]/50 dark:text-white/50 text-[11px] lg:text-xs font-bold uppercase tracking-wider mb-0.5">Humidity</p>
                        <p className="text-green-700 dark:text-green-400 text-[22px] lg:text-[28px] font-extrabold leading-none">{weather.humidity}%</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>

              {/* Sensor Cards */}
              <div>
                <h2 className="text-gray-400 dark:text-gray-500 text-xs lg:text-sm font-bold uppercase tracking-widest mb-3 lg:mb-4 px-1">Sensor Readings</h2>
                <div className="grid grid-cols-3 gap-3 lg:gap-4">
                  {mockSensors.map((sensor, i) => (
                    <motion.div
                      key={sensor.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ scale: 1.08, y: -5, transition: { type: 'spring', stiffness: 400, damping: 12 } }}
                      className="rounded-2xl p-3 lg:p-4 flex flex-col gap-1 border border-white/50 dark:border-white/5 shadow-sm cursor-default transition-colors"
                      style={{ background: isDarkMode ? '#0A2F1F' : sensor.bg }}
                    >
                      <span className="text-2xl lg:text-3xl lg:mb-1">{sensor.icon}</span>
                      <p className="text-xl lg:text-2xl font-extrabold text-[#0A2F1F] dark:text-white/90">
                        {sensor.value}
                        <span className="text-xs lg:text-sm font-semibold ml-0.5 text-gray-500 dark:text-gray-400">{sensor.unit}</span>
                      </p>
                      <p className="text-[#0A2F1F]/60 dark:text-white/60 font-medium text-[11px] lg:text-xs leading-tight">{sensor.label}</p>
                      <span className="text-[10px] lg:text-xs mt-1 font-bold" style={{ color: sensor.accent }}>{sensor.status}</span>
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
              <h2 className="text-gray-400 dark:text-gray-500 text-xs lg:text-sm font-bold uppercase tracking-widest mb-3 lg:mb-4 px-1">Device Controls</h2>
              <div className="flex flex-col gap-3 lg:gap-4">
                {mockZones.map((device, i) => {
                  const isOn = deviceStates[device.id];
                  const bgNormal = isDarkMode ? '#0A2F1F' : '#ffffff';
                  const bgActive = isDarkMode ? device.activeColor + '20' : device.activeBg;
                  const borderNormal = isDarkMode ? '#1e293b' : '#e5e7eb';
                  const borderActive = isDarkMode ? device.activeColor + '40' : device.activeColor + '40';
                  const iconBgNormal = isDarkMode ? '#1e293b' : '#f3f4f6';
                  
                  return (
                    <motion.div
                      key={device.id}
                      custom={i + 3}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => handleDeviceToggle(device.id)}
                      whileHover={{ scale: 1.03, y: -2, transition: { type: 'spring', stiffness: 400, damping: 12 } }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-2xl p-4 lg:p-5 flex items-center justify-between border shadow-sm transition-colors duration-300 cursor-pointer"
                      style={{
                        background: isOn ? bgActive : bgNormal,
                        borderColor: isOn ? borderActive : borderNormal,
                      }}
                    >
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div
                          className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-xl lg:text-2xl transition-colors"
                          style={{ background: isOn ? device.activeColor + '30' : iconBgNormal }}
                        >
                          {device.icon}
                        </div>
                        <div>
                          <p className="text-[#0A2F1F] dark:text-white/90 font-bold text-sm lg:text-base">{device.label}</p>
                          <p className="text-gray-400 dark:text-gray-500 text-xs lg:text-sm">{device.sub}</p>
                        </div>
                      </div>
                      {/* Toggle */}
                      <button
                        className="relative w-14 h-7 lg:w-16 lg:h-8 rounded-full transition-all duration-300 focus:outline-none border cursor-pointer pointer-events-none shrink-0"
                        style={{
                          background: isOn ? device.activeColor : (isDarkMode ? '#334155' : '#e5e7eb'),
                          borderColor: isOn ? device.activeColor : (isDarkMode ? '#475569' : '#d1d5db'),
                        }}
                      >
                        <span
                          className="absolute top-0.5 lg:top-1 w-6 h-6 lg:w-6 lg:h-6 rounded-full bg-white shadow-md transition-all duration-300"
                          style={{ left: isOn ? 'calc(100% - 1.75rem)' : '2px' }}
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
                className="mt-6 lg:mt-8 rounded-2xl p-4 lg:p-5 border border-amber-200 dark:border-amber-900/50 text-center bg-amber-50 dark:bg-amber-900/10"
              >
                <p className="text-amber-600 dark:text-amber-500 text-sm lg:text-base font-bold">🔒 You're in Demo Mode</p>
                <p className="text-amber-500/70 dark:text-amber-500/60 text-xs lg:text-sm mt-1">Toggle any device to unlock real controls</p>
              </motion.div>
            </div>
            
          </div>
        </div>
      </div>
      </div>

      {/* Login Modal */}
      <AnimatePresence>
        {showModal && (
          <LoginModal
            deviceName={mockZones.find(d => d.id === pendingDevice)?.label ?? 'Device'}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}
