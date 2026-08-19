import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import TimerModal from './TimerModal';

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

const PUMP_DURATION = 60; // seconds

export default function PumpController({ onOpenTimerModal, onOpenSettings, onShowAlert, device = 'indoor', mode, setMode, temp, humidity }: PumpControllerProps) {
  const [isPumpOn, setIsPumpOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(PUMP_DURATION);

  // Store the server-side timestamp when pump was started
  const [pumpStartedAt, setPumpStartedAt] = useState<string | null>(null);

  // Thresholds dari Supabase (di-set oleh AI atau Settings)
  // Default: 27°C / 65% — akan di-override oleh nilai dari device_settings
  const [tempThreshold, setTempThreshold] = useState(27);
  const [humThreshold, setHumThreshold] = useState(65);

  const deviceId = device === 'outdoor' ? 'ESP32_OUTDOOR' : 'ESP32_INDOOR';

  // Ref to track in-flight pump update so realtime doesn't interfere
  const isUpdatingRef = useRef(false);

  const handleTogglePump = useCallback(async (forcedState?: boolean) => {
    const newState = forcedState !== undefined ? forcedState : !isPumpOn;

    isUpdatingRef.current = true;
    setIsPumpOn(newState); // Optimistic UI

    try {
      const updatePayload: any = { pump_active: newState };
      // Use last_sync to store the pump start time (column already exists)
      updatePayload.last_sync = new Date().toISOString();

      const { error } = await supabase
        .from('device_status')
        .update(updatePayload)
        .eq('device_id', deviceId);

      if (error) {
        console.error('[PumpController] Error updating pump_active:', error);
        setIsPumpOn(!newState); // Revert on error
      } else {
        // Broadcast the update instantly to all other clients listening to this channel
        supabase.channel(`status_changes_${deviceId}`).send({
          type: 'broadcast',
          event: 'pump_toggle',
          payload: {
            pump_active: newState,
            last_sync: updatePayload.last_sync
          }
        });

        if (newState) {
          setPumpStartedAt(updatePayload.last_sync);
        } else {
          setPumpStartedAt(null);
          setTimeLeft(PUMP_DURATION);
        }

        // Log the pump action
        const { error: logError } = await supabase.from('pump_logs').insert({
          zone: device === 'outdoor' ? 'B' : 'A',
          action: newState ? 'PUMP ON' : 'PUMP OFF',
          trigger: forcedState !== undefined ? 'system' : 'manual',
          detail: forcedState !== undefined
            ? 'Auto-off after 1 minute safety limit'
            : `Manual toggle by user via Dashboard (${device})`
        });
        if (logError) console.error('[PumpController] Error inserting pump log:', logError);
      }
    } catch (e) {
      console.error('[PumpController] Exception during pump toggle:', e);
      setIsPumpOn(!newState);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [isPumpOn, deviceId, device]);

  // Keep a ref that always points to the latest handleTogglePump
  const handleTogglePumpRef = useRef(handleTogglePump);
  useEffect(() => {
    handleTogglePumpRef.current = handleTogglePump;
  }, [handleTogglePump]);

  useEffect(() => {
    fetchInitialState();
    fetchThresholds();

    // Realtime: device_status (pump on/off)
    const statusSub = supabase
      .channel(`status_changes_${deviceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'device_status',
        filter: `device_id=eq.${deviceId}`
      }, payload => {
        if (!isUpdatingRef.current) {
          console.log('[PumpController] Realtime pump update:', payload.new.pump_active, 'last_sync:', payload.new.last_sync);
          setIsPumpOn(payload.new.pump_active);
          setPumpStartedAt(payload.new.pump_active ? (payload.new.last_sync || null) : null);
          if (!payload.new.pump_active) {
            setTimeLeft(PUMP_DURATION);
          }
        }
      })
      .on('broadcast', { event: 'pump_toggle' }, payload => {
        if (!isUpdatingRef.current) {
          console.log('[PumpController] Broadcast pump update:', payload.payload);
          setIsPumpOn(payload.payload.pump_active);
          setPumpStartedAt(payload.payload.pump_active ? payload.payload.last_sync : null);
          if (!payload.payload.pump_active) {
            setTimeLeft(PUMP_DURATION);
          }
        }
      })
      .subscribe();

    // Realtime: device_settings (threshold dari AI/Settings)
    const settingsSub = supabase
      .channel(`threshold_changes_${deviceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'device_settings',
        filter: `device_id=eq.${deviceId}`
      }, payload => {
        if (payload.new.temp_threshold != null) {
          console.log('[PumpController] Threshold update → temp:', payload.new.temp_threshold, 'hum:', payload.new.hum_threshold);
          setTempThreshold(Number(payload.new.temp_threshold));
        }
        if (payload.new.hum_threshold != null) {
          setHumThreshold(Number(payload.new.hum_threshold));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(statusSub);
      supabase.removeChannel(settingsSub);
    };
  }, [deviceId]);

  const fetchInitialState = async () => {
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('device_status')
        .select('pump_active, last_sync')
        .eq('device_id', deviceId)
        .single();

      if (statusError) {
        console.warn('[PumpController] Could not fetch device_status:', statusError.message);
      } else if (statusData) {
        setIsPumpOn(statusData.pump_active);
        setPumpStartedAt(statusData.pump_active ? (statusData.last_sync || null) : null);
      }
    } catch (e) {
      console.error('[PumpController] fetchInitialState exception:', e);
    } finally {
      setLoading(false);
    }
  };

  // Ambil threshold dari device_settings (diset oleh AI / Settings page)
  const fetchThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from('device_settings')
        .select('temp_threshold, hum_threshold')
        .eq('device_id', deviceId)
        .single();

      if (!error && data) {
        if (data.temp_threshold != null) setTempThreshold(Number(data.temp_threshold));
        if (data.hum_threshold != null) setHumThreshold(Number(data.hum_threshold));
        console.log('[PumpController] Thresholds loaded → temp:', data.temp_threshold, 'hum:', data.hum_threshold);
      }
    } catch (e) {
      console.error('[PumpController] fetchThresholds exception:', e);
    }
  };

  // Synchronized countdown timer based on shared pump_started_at timestamp
  useEffect(() => {
    if (!isPumpOn || !pumpStartedAt) {
      setTimeLeft(PUMP_DURATION);
      return;
    }

    // Calculate remaining time from shared timestamp
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
        handleTogglePumpRef.current(false); // Auto turn off
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isPumpOn, pumpStartedAt]);

  useEffect(() => {
    if (mode === 'auto' && device === 'indoor' && temp !== undefined && humidity !== undefined) {

      // Pompa NYALA jika suhu >= threshold ATAU humidity <= threshold
      if (!isPumpOn && (temp >= tempThreshold || humidity <= humThreshold)) {
        console.log(`[PumpController] Auto ON → Temp:${temp}≥${tempThreshold} atau Hum:${humidity}≤${humThreshold}`);
        handleTogglePumpRef.current(true);
      }

      // Pompa MATI jika kondisi sudah optimal (suhu & kelembapan berada di batas normal)
      else if (isPumpOn && temp < tempThreshold && humidity > humThreshold) {
        console.log(`[PumpController] Auto OFF → Temp:${temp}<${tempThreshold} dan Hum:${humidity}>${humThreshold}`);
        handleTogglePumpRef.current(false);
      }
    }
  }, [mode, device, temp, humidity, isPumpOn, tempThreshold, humThreshold]);

  const handleModeChange = async (newMode: 'manual' | 'auto' | 'timer') => {
    if (newMode === mode) return;

    // ATURAN BARU: Jika dari mode manual dan pompa masih menyala, wajib matikan dulu!
    if (mode === 'manual' && isPumpOn) {
      onShowAlert?.(
        "Matikan Pompa Dulu!",
        "Pompa masih dalam keadaan menyala. Silakan matikan pompa terlebih dahulu sebelum berpindah dari mode Manual demi keamanan.",
        () => { },
        true, // isNotification
        "Mengerti", // confirmText
        "", // cancelText
        "warning" // type
      );
      return;
    }

    // Fungsi pembantu untuk memproses perpindahan mode
    const proceedToMode = async (targetMode: 'manual' | 'auto' | 'timer') => {
      if (targetMode === 'timer') {
        // Prompt to open schedules modal and explain rules
        onShowAlert?.(
          "Informasi Timer",
          "Mode Timer akan mengaktifkan pompa secara otomatis berdasarkan jadwal.\n\nSyarat: Anda harus menyetel minimal 2 jadwal aktif per hari untuk SELURUH HARI (Senin s/d Minggu).\n\nApakah Anda ingin membuka menu atur jadwal sekarang?",
          () => {
            onOpenTimerModal?.();
          },
          false, // isNotification (shows Batal and confirm buttons)
          "Buka Jadwal", // confirmText
          "Batal", // cancelText
          "info" // type
        );
        return; // Exit and keep current mode in UI until they save successfully in TimerModal
      }

      // Non‑timer modes
      setMode(targetMode);
      await supabase.from('device_settings').update({ mode: targetMode }).eq('device_id', deviceId);
    };

    // Jika dari mode Auto pindah ke manual/timer, minta konfirmasi dulu
    if (mode === 'auto' && (newMode === 'manual' || newMode === 'timer')) {
      onShowAlert?.(
        "Peringatan Mode",
        "Sistem akan mematikan otomatisasi sensor. Penyiraman mandiri sepenuhnya tanggung jawab Anda.",
        async () => {
          await proceedToMode(newMode); // Lanjut ke proceedToMode setelah konfirmasi
        },
        false, // isNotification
        "Yakin, Pindah", // confirmText
        "Batal", // cancelText
        "warning" // type
      );
      return; // Berhenti di sini, tunggu konfirmasi
    }

    // Jika bukan dari Auto, langsung proses
    proceedToMode(newMode);
  };

  return (
    <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-[2rem] p-4 sm:p-5 lg:p-6 flex flex-col relative shadow-[0_8px_32px_0_rgba(34,197,94,0.1)] border border-white/60 dark:border-white/10 h-full">

      {/* Header */}
      <div className="flex justify-between items-start mb-4 lg:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            {device === 'outdoor' ? 'Outdoor' : 'Indoor'} Pump Control
            <span className="material-symbols-rounded text-green-500 text-[14px] sm:text-[16px] animate-pulse">wifi</span>
          </h3>
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-white/50 mt-0.5 uppercase tracking-widest">Zone A • Overhead</p>
        </div>
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/50 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-white/60 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/20 transition-all border border-white/40 shadow-sm"
        >
          <span className="material-symbols-rounded text-sm sm:text-base">settings</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 sm:gap-6">
        {/* 3 Way Mode Switch */}
        <div className="bg-gray-100/50 dark:bg-white/5 rounded-[1rem] p-1 flex shadow-inner border border-white/20">
          <button
            onClick={() => handleModeChange('manual')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-[0.85rem] text-[11px] sm:text-[13px] font-bold transition-all ${mode === 'manual' ? 'bg-white dark:bg-[#1A4531] text-green-600 dark:text-green-400 shadow-md border border-white/60 dark:border-transparent' : 'text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white'}`}
          >
            Manual
          </button>
          <button
            onClick={() => handleModeChange('auto')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-[0.85rem] text-[11px] sm:text-[13px] font-bold transition-all ${mode === 'auto' ? 'bg-white dark:bg-[#1A4531] text-green-600 dark:text-green-400 shadow-md border border-white/60 dark:border-transparent' : 'text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white'}`}
          >
            Auto
          </button>
          <button
            onClick={() => handleModeChange('timer')}
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-[0.85rem] text-[11px] sm:text-[13px] font-bold transition-all ${mode === 'timer' ? 'bg-white dark:bg-[#1A4531] text-green-600 dark:text-green-400 shadow-md border border-white/60 dark:border-transparent' : 'text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white'}`}
          >
            Timer
          </button>
        </div>

        {/* Timer Schedule Button (Visible only in Timer Mode) */}
        {mode === 'timer' && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenTimerModal}
            className="w-full py-2.5 bg-green-500/10 dark:bg-green-500/20 hover:bg-green-500/20 dark:hover:bg-green-500/30 text-green-600 dark:text-green-400 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-green-500/20"
          >
            <span className="material-symbols-rounded text-sm">schedule</span>
            MANAGE SCHEDULES
          </motion.button>
        )}

        {/* Large Pump Toggle Button */}
        <motion.button
          whileTap={(mode !== 'auto' && mode !== 'timer') ? { scale: 0.95 } : {}}
          onClick={() => handleTogglePump()}
          disabled={loading || mode === 'auto' || mode === 'timer'}
          className={`w-full py-4 sm:py-6 rounded-2xl font-extrabold text-[13px] sm:text-sm tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 border ${(mode === 'auto' || mode === 'timer')
              ? 'bg-gray-300 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-white/20 cursor-not-allowed shadow-none'
              : isPumpOn
                ? 'bg-red-500 hover:bg-red-600 border-red-400 text-white shadow-[0_10px_30px_rgba(239,68,68,0.4)]'
                : 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-300 text-white hover:opacity-90 shadow-[0_10px_40px_rgba(34,197,94,0.4)]'
            }`}
        >
          <span className="material-symbols-rounded text-xl sm:text-2xl">
            {mode === 'auto' ? 'smart_toy' : mode === 'timer' ? 'schedule' : (isPumpOn ? 'power_off' : 'power')}
          </span>
          {mode === 'auto' ? 'CONTROLLED BY SENSOR' : mode === 'timer' ? 'CONTROLLED BY SCHEDULE' : (isPumpOn ? 'TURN OFF PUMP' : 'TURN ON PUMP')}
        </motion.button>

        {/* Timer Animation */}
        {isPumpOn && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1 text-xs font-bold text-gray-500 dark:text-white/60">
              <span className="flex items-center gap-1">
                <span className="material-symbols-rounded text-sm text-red-500 animate-pulse">hourglass_empty</span>
                Safety Timeout
              </span>
              <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-pink-500"
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
