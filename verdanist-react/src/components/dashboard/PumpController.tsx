import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Settings, Timer as TimerIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Removed global PUMP_DURATION

interface PumpControllerProps {
  onOpenTimerModal?: (tab?: 'schedule' | 'interval') => void;
  onOpenSettings?: () => void;
  onShowAlert?: (
    title: string,
    message: string,
    onConfirm: () => void,
    isNotification?: boolean,
    confirmText?: string,
    cancelText?: string,
    type?: 'warning' | 'success' | 'info'
  ) => void;
  device?: 'indoor' | 'outdoor';
  mode: 'manual' | 'auto' | 'timer';
  setMode: React.Dispatch<React.SetStateAction<'manual' | 'auto' | 'timer'>>;
  temp?: number;
  humidity?: number;
  isDeviceOnline?: boolean;
}



export default function PumpController({ onOpenTimerModal, onOpenSettings, onShowAlert, device = 'indoor', mode, setMode, temp, humidity, isDeviceOnline = true }: PumpControllerProps) {
  const { t } = useLanguage();
  // ... existing logic is kept intact ...
  const deviceId = device === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR';
  const [isPumpOn, setIsPumpOn] = useState(() => {
    return sessionStorage.getItem(`verdanist_pump_on_${deviceId}`) === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [pumpDuration, setPumpDuration] = useState(() => {
    const saved = localStorage.getItem(`verdanist_pump_timeout_${device === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR'}`);
    return saved ? parseInt(saved, 10) : 30;
  });
  const [timeLeft, setTimeLeft] = useState(pumpDuration);
  const [pumpStartedAt, setPumpStartedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem(`verdanist_pump_start_${device === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR'}`);
    return saved ? parseInt(saved, 10) : null;
  });
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [tempThreshold, setTempThreshold] = useState(27);
  const [humThreshold, setHumThreshold] = useState(65);
  const [timerType, setTimerType] = useState<'schedule' | 'interval'>('schedule');
  const [intervalMins, setIntervalMins] = useState(30);
  const [intervalDur, setIntervalDur] = useState(2);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState<number>(0);
  const [activeSchedules, setActiveSchedules] = useState<any[]>([]);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const isUpdatingRef = useRef(false);

  const handleTogglePump = useCallback(async (forcedState?: boolean) => {
    if (!isDeviceOnline && forcedState === undefined) {
      onShowAlert?.(
        'Perangkat Offline',
        'ESP32 saat ini sedang offline. Perintah akan disimpan, tetapi perangkat mungkin tidak langsung merespon sampai kembali terhubung ke jaringan.',
        () => {},
        false,
        'Mengerti',
        '',
        'warning'
      );
    }
    
    // Haptics feedback
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {}
    }

    const newState = forcedState !== undefined ? forcedState : !isPumpOn;
    isUpdatingRef.current = true;
    setIsPumpOn(newState);
    sessionStorage.setItem(`verdanist_pump_on_${deviceId}`, newState.toString());
    try {
      const updatePayload: any = { pump_active: newState };
      updatePayload.last_sync = new Date().toISOString();
      const { error } = await supabase.from('device_status').update(updatePayload).eq('device_id', deviceId);
      if (error) {
        setIsPumpOn(!newState);
        sessionStorage.setItem(`verdanist_pump_on_${deviceId}`, (!newState).toString());
      } else {
        supabase.channel(`status_changes_${deviceId}`).send({
          type: 'broadcast',
          event: 'pump_toggle',
          payload: { pump_active: newState, last_sync: updatePayload.last_sync }
        });
        if (newState) {
          const now = Date.now();
          localStorage.setItem(`verdanist_pump_start_${deviceId}`, now.toString());
          setPumpStartedAt(now);
        } else {
          localStorage.removeItem(`verdanist_pump_start_${deviceId}`);
          setPumpStartedAt(null);
          setTimeLeft(pumpDuration);
          setLastSyncTime(new Date(updatePayload.last_sync).getTime());
        }
        await supabase.from('pump_logs').insert({
          zone: device === 'outdoor' ? 'B' : 'A',
          action: newState ? 'PUMP ON' : 'PUMP OFF',
          trigger: forcedState !== undefined ? 'system' : 'manual',
          detail: forcedState !== undefined ? `Auto-off after safety limit (${pumpDuration}s)` : `Manual toggle by user via Dashboard (${device})`
        });
      }
    } catch (e) {
      setIsPumpOn(!newState);
      sessionStorage.setItem(`verdanist_pump_on_${deviceId}`, (!newState).toString());
    } finally {
      isUpdatingRef.current = false;
    }
  }, [isPumpOn, deviceId, device]);

  const handleTogglePumpRef = useRef(handleTogglePump);
  useEffect(() => { handleTogglePumpRef.current = handleTogglePump; }, [handleTogglePump]);

  useEffect(() => {
    fetchInitialState();
    fetchThresholds();
    fetchSchedules();
    const statusSub = supabase.channel(`status_changes_${deviceId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_status', filter: `device_id=eq.${deviceId}` }, payload => {
        if (!isUpdatingRef.current) {
          setIsPumpOn(payload.new.pump_active);
          sessionStorage.setItem(`verdanist_pump_on_${deviceId}`, payload.new.pump_active.toString());
          if (!payload.new.pump_active) {
            localStorage.removeItem(`verdanist_pump_start_${deviceId}`);
            setPumpStartedAt(null);
            setTimeLeft(pumpDuration);
          } else if (!pumpStartedAt) {
            // Only set if we don't have a local start time
            const serverTime = payload.new.last_sync ? new Date(payload.new.last_sync).getTime() : Date.now();
            setPumpStartedAt(serverTime);
          }
          if (payload.new.last_sync) {
            setLastSyncTime(new Date(payload.new.last_sync).getTime());
          } else {
            setLastSyncTime(Date.now());
          }
        }
      })
      .on('broadcast', { event: 'pump_toggle' }, payload => {
        if (!isUpdatingRef.current) {
          setIsPumpOn(payload.payload.pump_active);
          sessionStorage.setItem(`verdanist_pump_on_${deviceId}`, payload.payload.pump_active.toString());
          if (!payload.payload.pump_active) {
            localStorage.removeItem(`verdanist_pump_start_${deviceId}`);
            setPumpStartedAt(null);
            setTimeLeft(pumpDuration);
          } else if (!pumpStartedAt) {
            const serverTime = payload.payload.last_sync ? new Date(payload.payload.last_sync).getTime() : Date.now();
            setPumpStartedAt(serverTime);
          }
          if (payload.payload.last_sync) {
            setLastSyncTime(new Date(payload.payload.last_sync).getTime());
          } else {
            setLastSyncTime(Date.now());
          }
        }
      }).subscribe();

    const settingsSub = supabase.channel(`threshold_changes_${deviceId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_settings', filter: `device_id=eq.${deviceId}` }, payload => {
        if (payload.new.temp_threshold != null) setTempThreshold(Number(payload.new.temp_threshold));
        if (payload.new.hum_threshold != null) setHumThreshold(Number(payload.new.hum_threshold));
        if (payload.new.timer_type != null) setTimerType(payload.new.timer_type);
        if (payload.new.interval_minutes != null) setIntervalMins(Number(payload.new.interval_minutes));
        if (payload.new.interval_duration != null) setIntervalDur(Number(payload.new.interval_duration));
      }).subscribe();

    const scheduleSub = supabase.channel(`schedules_changes_${deviceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pump_schedules', filter: `zone=eq.${deviceId === 'ESP32_OUTDOOR' ? 'B' : 'A'}` }, () => {
        fetchSchedules();
      }).subscribe();

    return () => { supabase.removeChannel(statusSub); supabase.removeChannel(settingsSub); supabase.removeChannel(scheduleSub); };
  }, [deviceId]);

  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e.detail.deviceId === deviceId) {
        const saved = localStorage.getItem(`verdanist_pump_timeout_${deviceId}`);
        if (saved) {
          const newDur = parseInt(saved, 10);
          setPumpDuration(newDur);
          if (!isPumpOn) setTimeLeft(newDur);
        }
      }
    };
    window.addEventListener('verdanist_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('verdanist_settings_updated', handleSettingsUpdated);
  }, [deviceId, isPumpOn]);

  const fetchInitialState = async () => {
    try {
      const { data: statusData } = await supabase.from('device_status').select('pump_active, last_sync').eq('device_id', deviceId).single();
      if (statusData) {
        setIsPumpOn(statusData.pump_active);
        sessionStorage.setItem(`verdanist_pump_on_${deviceId}`, statusData.pump_active.toString());
        if (!statusData.pump_active) {
           localStorage.removeItem(`verdanist_pump_start_${deviceId}`);
           setPumpStartedAt(null);
        } else {
           const localStart = localStorage.getItem(`verdanist_pump_start_${deviceId}`);
           if (localStart) {
             setPumpStartedAt(parseInt(localStart, 10));
           } else {
             setPumpStartedAt(statusData.last_sync ? new Date(statusData.last_sync).getTime() : Date.now());
           }
        }
        if (statusData.last_sync) {
          setLastSyncTime(new Date(statusData.last_sync).getTime());
        } else {
          setLastSyncTime(Date.now());
        }
      }
    } catch (e) { } finally { setLoading(false); }
  };

  const fetchThresholds = async () => {
    try {
      const { data } = await supabase.from('device_settings').select('temp_threshold, hum_threshold, timer_type, interval_minutes, interval_duration').eq('device_id', deviceId).single();
      if (data) {
        if (data.temp_threshold != null) setTempThreshold(Number(data.temp_threshold));
        if (data.hum_threshold != null) setHumThreshold(Number(data.hum_threshold));
        if (data.timer_type != null) setTimerType(data.timer_type);
        if (data.interval_minutes != null) setIntervalMins(Number(data.interval_minutes));
        if (data.interval_duration != null) setIntervalDur(Number(data.interval_duration));
      }
    } catch (e) { }
  };

  const fetchSchedules = async () => {
    try {
      const zone = deviceId === 'ESP32_OUTDOOR' ? 'B' : 'A';
      const { data } = await supabase.from('pump_schedules').select('*').eq('zone', zone).eq('is_active', true);
      if (data) setActiveSchedules(data);
    } catch (e) { }
  };

  useEffect(() => {
    if (!isPumpOn || !pumpStartedAt) {
      if (!isPumpOn) {
        setTimeLeft(pumpDuration);
      }
      return;
    }
    const calcRemaining = () => {
      const elapsed = (Date.now() - pumpStartedAt) / 1000;
      return Math.max(0, Math.ceil(pumpDuration - elapsed));
    };
    setTimeLeft(calcRemaining());
    const timer = setInterval(() => {
      const remaining = calcRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleTogglePumpRef.current(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPumpOn, pumpStartedAt]);

  // Interval Countdown Logic
  useEffect(() => {
    if (mode !== 'timer' || timerType !== 'interval' || isPumpOn || !lastSyncTime) {
      setIntervalTimeLeft(0);
      return;
    }

    const calcIntervalRemaining = () => {
      const nextRunTime = lastSyncTime + (intervalMins * 60 * 1000);
      const remaining = (nextRunTime - Date.now()) / 1000;
      return Math.max(0, Math.ceil(remaining));
    };

    setIntervalTimeLeft(calcIntervalRemaining());
    
    const intervalTimer = setInterval(() => {
      const remaining = calcIntervalRemaining();
      setIntervalTimeLeft(remaining);
      
      // Note: If we want the web to trigger the pump when it hits 0, we can do it here.
      // But it only works if the dashboard is open.
      if (remaining <= 0) {
        handleTogglePumpRef.current(true);
      }
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [mode, timerType, isPumpOn, lastSyncTime, intervalMins]);

  useEffect(() => {
    if (!loading && mode === 'auto' && device === 'indoor' && temp !== undefined && humidity !== undefined) {
      if (!isPumpOn && (temp >= tempThreshold || humidity <= humThreshold)) {
        handleTogglePumpRef.current(true);
      } else if (isPumpOn && temp < tempThreshold && humidity > humThreshold) {
        handleTogglePumpRef.current(false);
      }
    }
  }, [mode, device, temp, humidity, isPumpOn, tempThreshold, humThreshold]);

  const handleModeChange = async (newMode: 'manual' | 'auto' | 'timer') => {
    if (newMode === mode) return;
    if (mode === 'manual' && isPumpOn) {
      onShowAlert?.(t('pump.warnTitle'), t('pump.warnMsg'), () => { }, true, "OK", "", "warning");
      return;
    }
    const proceedToMode = async (targetMode: 'manual' | 'auto' | 'timer') => {
      setMode(targetMode);
      await supabase.from('device_settings').update({ mode: targetMode }).eq('device_id', deviceId);
      
      if (targetMode === 'timer') {
        setShowTimerPicker(true);
      }
    };
    if (mode === 'auto' && (newMode === 'manual' || newMode === 'timer')) {
      onShowAlert?.(
        t('pump.modeWarnTitle'), 
        t('pump.modeWarnMsg'), 
        () => { 
          setTimeout(() => {
            proceedToMode(newMode); 
          }, 300);
        }, 
        false, 
        t('pump.sureSwitch'), 
        t('dash.cancel'), 
        "warning"
      );
      return;
    }
    proceedToMode(newMode);
  };

  return (
    <div className="bg-card rounded-[2rem] p-5 sm:p-6 flex flex-col relative shadow-[var(--shadow-custom)] border border-border h-full">

      {/* Timer Mode Picker Overlay */}
      <AnimatePresence>
        {showTimerPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 rounded-[2rem] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-card w-full max-w-xs rounded-3xl p-5 shadow-2xl border border-border"
            >
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4 text-center">Pilih Mode Timer</p>
              
              {/* Option: Interval */}
              <button
                onClick={() => { setShowTimerPicker(false); onOpenTimerModal?.('interval'); }}
                className="w-full mb-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-2xl p-4 flex items-center gap-4 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground">Interval Berulang</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Pompa menyala setiap X menit/jam</p>
                </div>
              </button>

              {/* Option: Schedule */}
              <button
                onClick={() => { setShowTimerPicker(false); onOpenTimerModal?.('schedule'); }}
                className="w-full bg-muted/80 hover:bg-muted border border-border rounded-2xl p-4 flex items-center gap-4 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-border transition-colors">
                  <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground">Waktu Tertentu</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Atur jadwal pagi & sore setiap hari</p>
                </div>
              </button>

              <button
                onClick={() => setShowTimerPicker(false)}
                className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Batal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            {device === 'outdoor' ? t('pump.outdoor') : t('pump.indoor')}
          </h3>
          <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
            {device === 'outdoor' ? t('pump.zoneB') : t('pump.zoneA')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`material-symbols-rounded text-[20px] ${isDeviceOnline ? 'text-primary animate-pulse' : 'text-destructive'}`}>
            {isDeviceOnline ? 'wifi' : 'wifi_off'}
          </span>
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isDeviceOnline && (
        <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 border border-destructive/20">
          <span className="material-symbols-rounded text-sm">warning</span>
          Pompa mungkin tidak merespon karena perangkat offline.
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* 3 Way Mode Switch - iOS segmented style */}
        <div className="bg-secondary/50 rounded-2xl p-1.5 flex shadow-inner border border-border/50">
          <button
            onClick={() => handleModeChange('manual')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all ${mode === 'manual' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('pump.manual')}
          </button>
          <button
            onClick={() => handleModeChange('auto')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all ${mode === 'auto' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('pump.auto')}
          </button>
          <button
            onClick={() => handleModeChange('timer')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all ${mode === 'timer' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('pump.timer')}
          </button>
        </div>

        {/* Timer Schedule Button (Visible only in Timer Mode) */}
        {mode === 'timer' && (
          <div className="flex flex-col gap-2">
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowTimerPicker(true)}
              className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-primary/20"
            >
              <TimerIcon className="w-4 h-4" />
              {t('pump.setTimer')}
            </motion.button>
            {timerType === 'interval' ? (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary/50">
                   {!isPumpOn && intervalTimeLeft > 0 && (
                     <motion.div 
                       className="h-full bg-primary"
                       initial={{ width: '100%' }}
                       animate={{ width: `${(intervalTimeLeft / (intervalMins * 60)) * 100}%` }}
                       transition={{ ease: "linear", duration: 1 }}
                     />
                   )}
                </div>
                
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 mt-1">Mode Interval Aktif</p>
                <p className="text-sm font-extrabold text-foreground">Setiap {intervalMins >= 60 && intervalMins % 60 === 0 ? `${intervalMins / 60} Jam` : `${intervalMins} Menit`}</p>
                
                {!isPumpOn && intervalTimeLeft > 0 ? (
                  <p className="text-xs font-extrabold text-primary mt-1 flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-rounded text-[14px] animate-pulse">timer</span>
                    Nyala dalam: {Math.floor(intervalTimeLeft / 60).toString().padStart(2, '0')}:{(intervalTimeLeft % 60).toString().padStart(2, '0')}
                  </p>
                ) : (
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Durasi {intervalDur} detik/siklus</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm"
              >
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Mode Jadwal Aktif</p>
                {activeSchedules.length > 0 ? (
                  <>
                    <p className="text-sm font-extrabold text-foreground">{activeSchedules.length} Jadwal Menyala</p>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                      {activeSchedules.slice(0, 2).map(s => `${s.start_time.substring(0, 5)} (${s.duration}d)`).join(', ')}
                      {activeSchedules.length > 2 && ', ...'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-destructive mt-1">Belum ada jadwal yang diset</p>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Large Pump Toggle Button */}
        <motion.button
          whileTap={(mode !== 'auto' && mode !== 'timer') ? { scale: 0.96 } : {}}
          onClick={() => handleTogglePump()}
          disabled={loading || mode === 'auto' || mode === 'timer'}
          className={`w-full py-5 rounded-[1.25rem] font-extrabold text-[14px] tracking-wide shadow-lg transition-all flex items-center justify-center gap-3 border ${
            (mode === 'auto' || mode === 'timer')
              ? 'bg-muted border-border text-muted-foreground cursor-not-allowed shadow-none'
              : isPumpOn
                ? 'bg-destructive hover:bg-destructive/90 border-destructive text-destructive-foreground shadow-destructive/20'
                : 'bg-primary border-primary text-primary-foreground hover:opacity-90 shadow-primary/30'
          }`}
        >
          <span className="material-symbols-rounded text-2xl">
            {mode === 'auto' ? 'smart_toy' : mode === 'timer' ? 'schedule' : (isPumpOn ? 'power_off' : 'power')}
          </span>
          {mode === 'auto' ? t('pump.ctrlSensor') : mode === 'timer' ? t('pump.ctrlTimer') : (isPumpOn ? t('pump.turnOff') : t('pump.turnOn'))}
        </motion.button>

        {/* Timer Animation */}
        {isPumpOn && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1 text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1 text-destructive">
                <span className="material-symbols-rounded text-sm animate-pulse">hourglass_empty</span>
                {t('pump.safetyTimeout')}
              </span>
              <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-destructive"
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / pumpDuration) * 100}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
