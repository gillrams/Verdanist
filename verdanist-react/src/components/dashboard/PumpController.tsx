import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Settings, Timer as TimerIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const PUMP_DURATION = 60; // seconds

interface PumpControllerProps {
  onOpenTimerModal?: () => void;
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
}



export default function PumpController({ onOpenTimerModal, onOpenSettings, onShowAlert, device = 'indoor', mode, setMode, temp, humidity }: PumpControllerProps) {
  const { t } = useLanguage();
  // ... existing logic is kept intact ...
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(PUMP_DURATION);
  const [pumpStartedAt, setPumpStartedAt] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState(27);
  const [humThreshold, setHumThreshold] = useState(65);
  const deviceId = device === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR';
  const isUpdatingRef = useRef(false);

  const handleTogglePump = useCallback(async (forcedState?: boolean) => {
    const newState = forcedState !== undefined ? forcedState : !isPumpOn;
    isUpdatingRef.current = true;
    setIsPumpOn(newState);
    try {
      const updatePayload: any = { pump_active: newState };
      updatePayload.last_sync = new Date().toISOString();
      const { error } = await supabase.from('device_status').update(updatePayload).eq('device_id', deviceId);
      if (error) {
        setIsPumpOn(!newState);
      } else {
        supabase.channel(`status_changes_${deviceId}`).send({
          type: 'broadcast',
          event: 'pump_toggle',
          payload: { pump_active: newState, last_sync: updatePayload.last_sync }
        });
        if (newState) {
          setPumpStartedAt(updatePayload.last_sync);
        } else {
          setPumpStartedAt(null);
          setTimeLeft(PUMP_DURATION);
        }
        await supabase.from('pump_logs').insert({
          zone: device === 'outdoor' ? 'B' : 'A',
          action: newState ? 'PUMP ON' : 'PUMP OFF',
          trigger: forcedState !== undefined ? 'system' : 'manual',
          detail: forcedState !== undefined ? 'Auto-off after 1 minute safety limit' : `Manual toggle by user via Dashboard (${device})`
        });
      }
    } catch (e) {
      setIsPumpOn(!newState);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [isPumpOn, deviceId, device]);

  const handleTogglePumpRef = useRef(handleTogglePump);
  useEffect(() => { handleTogglePumpRef.current = handleTogglePump; }, [handleTogglePump]);

  useEffect(() => {
    fetchInitialState();
    fetchThresholds();
    const statusSub = supabase.channel(`status_changes_${deviceId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_status', filter: `device_id=eq.${deviceId}` }, payload => {
        if (!isUpdatingRef.current) {
          setIsPumpOn(payload.new.pump_active);
          setPumpStartedAt(payload.new.pump_active ? (payload.new.last_sync || null) : null);
          if (!payload.new.pump_active) setTimeLeft(PUMP_DURATION);
        }
      })
      .on('broadcast', { event: 'pump_toggle' }, payload => {
        if (!isUpdatingRef.current) {
          setIsPumpOn(payload.payload.pump_active);
          setPumpStartedAt(payload.payload.pump_active ? payload.payload.last_sync : null);
          if (!payload.payload.pump_active) setTimeLeft(PUMP_DURATION);
        }
      }).subscribe();

    const settingsSub = supabase.channel(`threshold_changes_${deviceId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_settings', filter: `device_id=eq.${deviceId}` }, payload => {
        if (payload.new.temp_threshold != null) setTempThreshold(Number(payload.new.temp_threshold));
        if (payload.new.hum_threshold != null) setHumThreshold(Number(payload.new.hum_threshold));
      }).subscribe();

    return () => { supabase.removeChannel(statusSub); supabase.removeChannel(settingsSub); };
  }, [deviceId]);

  const fetchInitialState = async () => {
    try {
      const { data: statusData } = await supabase.from('device_status').select('pump_active, last_sync').eq('device_id', deviceId).single();
      if (statusData) {
        setIsPumpOn(statusData.pump_active);
        setPumpStartedAt(statusData.pump_active ? (statusData.last_sync || null) : null);
      }
    } catch (e) { } finally { setLoading(false); }
  };

  const fetchThresholds = async () => {
    try {
      const { data } = await supabase.from('device_settings').select('temp_threshold, hum_threshold').eq('device_id', deviceId).single();
      if (data) {
        if (data.temp_threshold != null) setTempThreshold(Number(data.temp_threshold));
        if (data.hum_threshold != null) setHumThreshold(Number(data.hum_threshold));
      }
    } catch (e) { }
  };

  useEffect(() => {
    if (!isPumpOn || !pumpStartedAt) {
      setTimeLeft(PUMP_DURATION);
      return;
    }
    const calcRemaining = () => {
      const elapsed = (Date.now() - new Date(pumpStartedAt).getTime()) / 1000;
      return Math.max(0, Math.ceil(PUMP_DURATION - elapsed));
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
      if (targetMode === 'timer') {
        onShowAlert?.(t('pump.timerInfoTitle'), t('pump.timerInfoMsg'), () => { onOpenTimerModal?.(); }, false, t('pump.openSchedule'), t('dash.cancel'), "info");
        return;
      }
      setMode(targetMode);
      await supabase.from('device_settings').update({ mode: targetMode }).eq('device_id', deviceId);
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
          <span className="material-symbols-rounded text-primary text-[20px] animate-pulse">wifi</span>
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

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
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenTimerModal}
            className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-primary/20"
          >
            <TimerIcon className="w-4 h-4" />
            {t('pump.setTimer')}
          </motion.button>
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
                animate={{ width: `${(timeLeft / 60) * 100}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
