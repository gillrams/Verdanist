import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  currentMode: 'manual' | 'auto' | 'timer';
  setMode: React.Dispatch<React.SetStateAction<'manual' | 'auto' | 'timer'>>;
  onShowAlert?: (
    title: string,
    message: string,
    onConfirm: () => void,
    isNotification?: boolean,
    confirmText?: string,
    cancelText?: string,
    type?: 'warning' | 'success' | 'info'
  ) => void;
}

interface Schedule {
  id: string;
  start_time: string;
  duration: number;
  days: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function TimerModal({ isOpen, onClose, deviceId, currentMode, setMode, onShowAlert }: TimerModalProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Derivasi zone berdasarkan deviceId
  const zone = deviceId === 'ESP32_OUTDOOR' ? 'B' : 'A';

  // Form State
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState('5');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Senin']);

  useEffect(() => {
    if (isOpen) {
      fetchSchedules();
      
      // Set default waktu dan hari ke saat ini
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
      
      const daysArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const currentDay = daysArray[now.getDay()];
      setSelectedDays([currentDay]);
    }
  }, [isOpen]);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pump_schedules')
      .select('*')
      .eq('zone', zone);
      
    if (!error && data) {
      setSchedules(data);
    }
    setLoading(false);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddSchedule = async () => {
    setLoading(true);

    // 1. Validasi Batas Waktu Penyiraman (Pagi: 05:00-11:00 & Siang/Sore: 12:00-18:00)
    const [shour, smin] = startTime.split(':').map(Number);
    const timeInMinutes = shour * 60 + smin;
    
    const morningStart = 5 * 60;   // 05:00
    const morningEnd = 11 * 60;    // 11:00
    const afternoonStart = 12 * 60; // 12:00
    const afternoonEnd = 18 * 60;   // 18:00
    
    const isMorning = timeInMinutes >= morningStart && timeInMinutes <= morningEnd;
    const isAfternoon = timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd;
    
    if (!isMorning && !isAfternoon) {
      onShowAlert?.(
        "Waktu Di Luar Batas",
        "Jadwal penyiraman hanya boleh diatur pada rentang waktu berikut demi keselamatan tanaman:\n\n☀️ **Pagi**: 05:00 s/d 11:00\n⛅ **Siang/Sore**: 12:00 s/d 18:00\n\nSilakan pilih waktu penyiraman yang sesuai.",
        () => {},
        true,
        "Mengerti",
        "",
        "warning"
      );
      setLoading(false);
      return;
    }

    // Helper untuk cek apakah hari bentrok
    const checkDayOverlap = (daysA: string[], daysBStr: string) => {
      const allDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      const listA = daysA;
      const listB = (!daysBStr || daysBStr.trim() === '' || daysBStr.includes('Setiap Hari')) 
        ? allDays 
        : daysBStr.split(',').map(p => p.trim());
      
      return listA.some(day => listB.includes(day));
    };

    // 2. Cek Jadwal Ganda / Bentrok di Waktu yang Sama
    const duplicate = schedules.find(s => {
      const existingTime = s.start_time.substring(0, 5); // Ambil HH:MM
      if (existingTime !== startTime) return false;
      return checkDayOverlap(selectedDays, s.days);
    });

    if (duplicate) {
      const allDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      const listB = (!duplicate.days || duplicate.days.trim() === '' || duplicate.days.includes('Setiap Hari'))
        ? allDays
        : duplicate.days.split(',').map(p => p.trim());
      const overlappingDays = selectedDays.filter(day => listB.includes(day));
      
      onShowAlert?.(
        "Jadwal Bentrok / Ganda",
        `Jadwal penyiraman pada pukul **${startTime}** sudah terdaftar pada hari:\n• ${overlappingDays.join(', ')}\n\nAnda tidak diperbolehkan membuat dua jadwal penyiraman pada waktu yang bersamaan di hari yang sama.`,
        () => {},
        true,
        "Tutup",
        "",
        "warning"
      );
      setLoading(false);
      return;
    }

    const daysString = selectedDays.join(',');
    
    const { error } = await supabase
      .from('pump_schedules')
      .insert({
        zone: zone,
        start_time: startTime + ':00', // Format ke HH:MM:SS
        duration: parseInt(duration),
        is_active: true,
        days: daysString
      });

    if (!error) {
      fetchSchedules();
      // Reset form
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
      setDuration('5');
      const daysArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const currentDay = daysArray[now.getDay()];
      setSelectedDays([currentDay]);
    } else {
      onShowAlert?.(
        "Gagal Menambah Jadwal",
        "Terjadi kesalahan saat menambahkan jadwal ke database. Pastikan koneksi internet Anda stabil.",
        () => {},
        true,
        "Tutup",
        "",
        "warning"
      );
    }
    setLoading(false);
  };

  const handleDeleteSchedule = async (id: string) => {
    const { error } = await supabase
      .from('pump_schedules')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchSchedules();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('pump_schedules')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchSchedules();
    }
  };

  const validateSchedules = (schedulesList: Schedule[]) => {
    const activeSchedules = schedulesList.filter(s => s.is_active);
    const dayCounts: Record<string, number> = {
      'Senin': 0,
      'Selasa': 0,
      'Rabu': 0,
      'Kamis': 0,
      'Jumat': 0,
      'Sabtu': 0,
      'Minggu': 0,
    };

    activeSchedules.forEach(s => {
      if (!s.days || s.days.trim() === '' || s.days.includes('Setiap Hari')) {
        DAYS_OF_WEEK.forEach(d => {
          dayCounts[d]++;
        });
      } else {
        const parts = s.days.split(',').map(p => p.trim());
        parts.forEach(p => {
          if (dayCounts[p] !== undefined) {
            dayCounts[p]++;
          }
        });
      }
    });

    const invalidDays = DAYS_OF_WEEK.filter(d => dayCounts[d] < 2);
    return {
      isValid: invalidDays.length === 0,
      invalidDays,
      dayCounts
    };
  };

  const handleClose = async () => {
    // If we are currently in timer mode, verify if schedules are still valid
    if (currentMode === 'timer') {
      const { isValid } = validateSchedules(schedules);
      if (!isValid) {
        // Revert to 'auto' mode
        setLoading(true);
        const { error } = await supabase
          .from('device_settings')
          .update({ mode: 'auto' })
          .eq('device_id', deviceId);

        if (!error) {
          setMode('auto');
          onShowAlert?.(
            "Mode Timer Dinonaktifkan",
            "Karena jadwal penyiraman aktif Anda tidak lagi memenuhi syarat minimal 2 jadwal aktif per hari, mode Timer dinonaktifkan secara otomatis. Sistem dialihkan ke mode Auto demi keamanan.",
            () => {},
            true,
            "Mengerti",
            "",
            "warning"
          );
        }
        setLoading(false);
      }
    }
    onClose();
  };

  const handleSaveAndApply = async () => {
    const { isValid, invalidDays, dayCounts } = validateSchedules(schedules);

    if (!isValid) {
      const errorMsg = `Untuk mengaktifkan mode Timer, setiap hari (Senin s/d Minggu) wajib memiliki minimal 2 jadwal aktif.\n\nHari-hari berikut belum memenuhi syarat:\n${invalidDays.map(d => `• ${d} (${dayCounts[d]} jadwal aktif)`).join('\n')}\n\nSilakan tambahkan jadwal penyiraman untuk hari-hari tersebut.`;
      
      onShowAlert?.(
        "Jadwal Kurang / Belum Sesuai",
        errorMsg,
        () => {},
        true, // isNotification
        "Mengerti", // confirmText
        "", // cancelText
        "warning" // type
      );
      return;
    }
    
    setLoading(true);
    const { error } = await supabase
      .from('device_settings')
      .update({ mode: 'timer' })
      .eq('device_id', deviceId);
      
    if (!error) {
      setMode('timer');
      onShowAlert?.(
        "Mode Timer Berhasil Diaktifkan",
        "Penyimpanan jadwal berhasil disimpan. Pompa akan menyala otomatis sesuai dengan jadwal aktif yang telah Anda buat.",
        () => {},
        true, // isNotification
        "Selesai", // confirmText
        "", // cancelText
        "success" // type
      );
      onClose();
    } else {
      onShowAlert?.(
        "Gagal Mengaktifkan Mode",
        "Terjadi kesalahan saat memperbarui database. Silakan coba lagi.",
        () => {},
        true,
        "Tutup",
        "",
        "warning"
      );
    }
    setLoading(false);
  };

  const renderDaysBadge = (daysStr: string) => {
    if (!daysStr || daysStr.trim() === '') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
          Setiap Hari
        </span>
      );
    }

    const selectedList = daysStr.split(',').map(d => d.trim());
    
    // Check if it has all 7 days
    const hasAllDays = DAYS_OF_WEEK.every(d => selectedList.includes(d));
    if (hasAllDays) {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
          Setiap Hari
        </span>
      );
    }

    // Check if weekdays only (Senin, Selasa, Rabu, Kamis, Jumat)
    const weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const isWeekdaysOnly = selectedList.length === 5 && weekdays.every(d => selectedList.includes(d));
    if (isWeekdaysOnly) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Senin - Jumat
        </span>
      );
    }

    // Check if weekends only (Sabtu, Minggu)
    const weekends = ['Sabtu', 'Minggu'];
    const isWeekendsOnly = selectedList.length === 2 && weekends.every(d => selectedList.includes(d));
    if (isWeekendsOnly) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Sabtu - Minggu
        </span>
      );
    }

    // Render sorted list of individual day badges
    const sortedList = [...selectedList].sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));

    return (
      <div className="flex flex-wrap gap-1 max-w-[260px]">
        {sortedList.map(day => {
          const short = day.substring(0, 3);
          return (
            <span 
              key={day} 
              className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase"
            >
              {short}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-0 pointer-events-none">
          
          {/* Modal Content - Floating Glass Bubble */}
          <motion.div 
            className="bg-white/80 dark:bg-[#0A2F1F]/80 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 lg:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/60 dark:border-white/10 z-10 relative pointer-events-auto"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-rounded text-green-500">schedule</span>
                Timer Schedule
              </h3>
              <button 
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-rounded text-sm">close</span>
              </button>
            </div>

            {/* Form Tambah */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-white/5">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3">Tambah Jadwal</h4>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40 block mb-1">Jam Mulai</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-[#05150E] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40 block mb-1">Durasi (Menit)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="5"
                    value={duration}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setDuration('');
                        return;
                      }
                      const num = parseInt(val);
                      if (num >= 0 && num <= 5) {
                        setDuration(val);
                      }
                    }}
                    className="w-full bg-white dark:bg-[#05150E] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40 block mb-1">Hari Aktif</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        selectedDays.includes(day)
                           ? 'bg-green-500 text-white border-green-400 shadow-md shadow-green-500/20'
                          : 'bg-white dark:bg-[#05150E] text-gray-500 dark:text-white/50 border-gray-200 dark:border-white/10 hover:border-green-500'
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddSchedule}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition-colors shadow-md shadow-green-500/20"
              >
                {loading ? 'Menyimpan...' : 'Tambahkan Jadwal'}
              </button>
            </div>

            {/* List Jadwal */}
            <div className="max-h-[200px] overflow-y-auto pr-2 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">Jadwal Aktif</h4>
              
              {schedules.length === 0 && !loading && (
                <div className="text-center py-4 text-xs font-bold text-gray-400 dark:text-white/30">
                  Belum ada jadwal yang diset.
                </div>
              )}

              {schedules.map((schedule, idx) => (
                <div key={idx} className="bg-white dark:bg-[#05150E]/60 border border-gray-100 dark:border-white/10 rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white">{schedule.start_time.substring(0, 5)}</span>
                      <span className="text-xs font-bold text-gray-500 dark:text-white/50">({schedule.duration} min)</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {renderDaysBadge(schedule.days)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleActive(schedule.id, schedule.is_active)}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors ${schedule.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-white/10'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${schedule.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    >
                      <span className="material-symbols-rounded text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tombol Simpan & Aktifkan */}
            <div className="mt-6">
              <button
                onClick={handleSaveAndApply}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-br from-green-400 to-emerald-600 text-white hover:opacity-90 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-md shadow-green-500/20"
              >
                {loading ? 'Memproses...' : (currentMode === 'timer' ? 'Simpan Perubahan' : 'Simpan & Aktifkan Timer')}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
