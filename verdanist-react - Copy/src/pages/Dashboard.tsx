import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import DeviceSwitcher from '../components/dashboard/DeviceSwitcher';
import EnvironmentOverview from '../components/dashboard/EnvironmentOverview';
import PumpController from '../components/dashboard/PumpController';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import ActivityLog from '../components/dashboard/ActivityLog';
import { useAuth } from '../contexts/AuthContext';
import TimerModal from '../components/dashboard/TimerModal';
import PumpSettingsModal from '../components/dashboard/PumpSettingsModal';
import AiAssistantModal from '../components/dashboard/AiAssistantModal';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user, logout, currentFarm, clearFarmAccess } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeDevice, setActiveDevice] = useState<'indoor' | 'outdoor'>('indoor');

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    isNotification?: boolean;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'success' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: undefined,
    isNotification: false,
    confirmText: 'Yakin, Pindah',
    cancelText: 'Batal',
    type: 'warning'
  });

  // Lifted state for live sensor data and mode from Supabase
  const [temp, setTemp] = useState(28.0);
  const [humidity, setHumidity] = useState(75);
  const [mode, setMode] = useState<'manual' | 'auto' | 'timer'>('auto');

  const deviceId = activeDevice === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR';

  useEffect(() => {
    // 1. Fetch initial values
    const fetchInitialSensors = async () => {
      try {
        const { data, error } = await supabase
          .from('device_settings')
          .select('temperature, humidity, mode')
          .eq('device_id', deviceId)
          .single();

        if (data) {
          if (data.temperature !== null && data.temperature !== undefined) setTemp(Number(data.temperature));
          if (data.humidity !== null && data.humidity !== undefined) setHumidity(Number(data.humidity));
          if (data.mode) setMode(data.mode);
        }
      } catch (err) {
        console.error('Error fetching initial sensor values:', err);
      }
    };

    fetchInitialSensors();

    // 2. Real-time subscription to device_settings table (Consolidated single connection)
    const settingsSub = supabase
      .channel(`settings_changes_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_settings',
          filter: `device_id=eq.${deviceId}`
        },
        (payload) => {
          console.log('Realtime settings update:', payload.new);
          if (payload.new.temperature !== null && payload.new.temperature !== undefined) {
            setTemp(Number(payload.new.temperature));
          }
          if (payload.new.humidity !== null && payload.new.humidity !== undefined) {
            setHumidity(Number(payload.new.humidity));
          }
          if (payload.new.mode) {
            setMode(payload.new.mode);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSub);
    };
  }, [deviceId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Farmer';

  const renderFormattedMessage = (msg: string) => {
    if (!msg) return null;
    const parts = msg.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-gray-900 dark:text-white">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 lg:space-y-6 animate-fade-in-up">

        {/* Header Greeting */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-green-500/10 text-green-700 dark:text-green-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-green-500/20">
                🟢 Live Data
              </span>
              {currentFarm && (
                <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="material-symbols-rounded text-[12px]">location_on</span>
                  {currentFarm.location}
                </span>
              )}
            </div>
            <h1 className="text-gray-900 dark:text-white text-xl lg:text-2xl font-extrabold leading-tight mt-1">
              {currentFarm ? currentFarm.name : 'Command Center'}
            </h1>
            <p className="text-gray-500 dark:text-white/60 text-xs lg:text-sm mt-0.5 font-bold">
              {greeting()}, {firstName} 👋{' · '}
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="hidden sm:block">
              <DeviceSwitcher device={activeDevice} onChange={setActiveDevice} />
            </div>

            {/* AI Agro-Assistant Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all duration-300 relative group cursor-pointer"
              title="Asisten AI Agronomi"
            >
              {/* Pulsing glow ring around the button */}
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25 group-hover:opacity-40 transition-opacity" />
              <span className="material-symbols-rounded text-lg z-10 animate-pulse">psychology</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/20 transition-all border border-white dark:border-white/10 shadow-sm"
              >
                <span className="material-symbols-rounded">account_circle</span>
              </button>

              {/* Dropdown Menu (Glassmorphism) */}
              {isProfileOpen && (
                <>
                  {/* Backdrop untuk menutup dropdown saat klik di luar */}
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsProfileOpen(false)}></div>

                  <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-[#0A2F1F]/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-white dark:border-white/10 py-2 z-[100] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                      <p className="text-[10px] font-extrabold text-gray-400 dark:text-white/30 uppercase tracking-widest">Akun Saya</p>
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        clearFarmAccess();
                        window.location.href = '/farms';
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-extrabold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors border-b border-gray-100 dark:border-white/5"
                    >
                      <span className="material-symbols-rounded text-base">swap_horiz</span>
                      Ganti Kebun (Switch)
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        window.location.href = '/login';
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-extrabold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-rounded text-base">logout</span>
                      Keluar / Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="sm:hidden flex justify-center mb-4">
          <DeviceSwitcher device={activeDevice} onChange={setActiveDevice} />
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Top Row: Environment (Spans 8) + Pump Control (Spans 4) */}
          <div className="lg:col-span-8 flex flex-col h-full">
            <EnvironmentOverview device={activeDevice} temp={temp} humidity={humidity} />
          </div>

          <div className="lg:col-span-4 flex flex-col h-full">
            <PumpController
              device={activeDevice}
              mode={mode}
              setMode={setMode}
              temp={temp}
              humidity={humidity}
              onOpenTimerModal={() => setIsTimerModalOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onShowAlert={(title, message, onConfirm, isNotification, confirmText, cancelText, type) =>
                setAlertConfig({
                  isOpen: true,
                  title,
                  message,
                  onConfirm,
                  isNotification: isNotification || false,
                  confirmText: confirmText || 'Yakin, Pindah',
                  cancelText: cancelText || 'Batal',
                  type: type || 'warning'
                })
              }
            />
          </div>

          {/* Bottom Row: Chart (Spans 7) + Activity Log (Spans 5) */}
          <div className="lg:col-span-7 flex flex-col min-h-[400px]">
            <AnalyticsChart currentTemp={temp} currentHumidity={humidity} />
          </div>

          <div className="lg:col-span-5 flex flex-col h-[400px]">
            <ActivityLog />
          </div>

        </div>
      </div>

      <TimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        deviceId={activeDevice === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR'}
        currentMode={mode}
        setMode={setMode}
        onShowAlert={(title, message, onConfirm, isNotification, confirmText, cancelText, type) =>
          setAlertConfig({
            isOpen: true,
            title,
            message,
            onConfirm,
            isNotification: isNotification || false,
            confirmText: confirmText || 'OK',
            cancelText: cancelText || 'Batal',
            type: type || 'warning'
          })
        }
      />

      <PumpSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        deviceId={activeDevice === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR'}
      />

      {/* Custom Aesthetic Alert */}
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none transition-all duration-300 ${alertConfig.isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {alertConfig.isOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} />
            <div className="bg-white/90 dark:bg-[#0A2F1F]/90 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-sm p-6 lg:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-white/60 dark:border-white/10 z-10 pointer-events-auto relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${alertConfig.type === 'success'
                  ? 'from-green-400 to-emerald-600'
                  : alertConfig.type === 'info'
                    ? 'from-blue-400 to-indigo-600'
                    : 'from-amber-400 to-red-500'
                }`}></div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alertConfig.type === 'success'
                    ? 'bg-green-500/10 text-green-500'
                    : alertConfig.type === 'info'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                  <span className="material-symbols-rounded">
                    {alertConfig.type === 'success' ? 'check_circle' : alertConfig.type === 'info' ? 'info' : 'warning'}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{alertConfig.title}</h3>
              </div>

              <p className="text-xs font-bold text-gray-500 dark:text-white/70 mb-6 leading-relaxed whitespace-pre-line">
                {renderFormattedMessage(alertConfig.message)}
              </p>

              <div className="flex gap-3">
                {!alertConfig.isNotification && (
                  <button
                    onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                    className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/60 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    {alertConfig.cancelText || 'Batal'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setAlertConfig(prev => ({ ...prev, isOpen: false }));
                    if (alertConfig.onConfirm) {
                      alertConfig.onConfirm();
                    }
                  }}
                  className={`py-3 font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-opacity shadow-md ${alertConfig.isNotification ? 'w-full' : 'flex-1'
                    } ${alertConfig.type === 'success'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/20'
                      : alertConfig.type === 'info'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/20'
                    }`}
                >
                  {alertConfig.confirmText || (alertConfig.isNotification ? 'Tutup' : 'Yakin, Pindah')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        deviceId={activeDevice === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR'}
        onShowAlert={(title, message, onConfirm, isNotification, confirmText, cancelText, type) =>
          setAlertConfig({
            isOpen: true,
            title,
            message,
            onConfirm,
            isNotification: isNotification || false,
            confirmText: confirmText || 'OK',
            cancelText: cancelText || 'Batal',
            type: type || 'warning'
          })
        }
      />
    </AppLayout>
  );
}
