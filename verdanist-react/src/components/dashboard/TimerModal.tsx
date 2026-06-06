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
  const [morningTime, setMorningTime] = useState('08:00');
  const [afternoonTime, setAfternoonTime] = useState('16:00');
  const [duration, setDuration] = useState('5');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Senin']);

  useEffect(() => {
    if (isOpen) {
      fetchSchedules();
      
      // Set default waktu dan hari ke default
      setMorningTime('08:00');
      setAfternoonTime('16:00');
      
      const now = new Date();
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

    // Helper to check boundaries
    const checkTime = (timeStr: string, type: 'morning' | 'afternoon') => {
      const [h, m] = timeStr.split(':').map(Number);
      const mins = h * 60 + m;
      if (type === 'morning') return mins >= 5 * 60 && mins <= 11 * 60;
      return mins >= 12 * 60 && mins <= 18 * 60;
    };

    if (!checkTime(morningTime, 'morning')) {
      onShowAlert?.("Waktu Pagi Tidak Valid", "Jadwal Pagi harus berada di antara jam 05:00 s/d 11:00.", () => {}, true, "Mengerti", "", "warning");
      setLoading(false);
      return;
    }
    if (!checkTime(afternoonTime, 'afternoon')) {
      onShowAlert?.("Waktu Sore Tidak Valid", "Jadwal Siang/Sore harus berada di antara jam 12:00 s/d 18:00.", () => {}, true, "Mengerti", "", "warning");
      setLoading(false);
      return;
    }

    const checkDayOverlap = (daysA: string[], daysBStr: string) => {
      const allDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      const listA = daysA;
      const listB = (!daysBStr || daysBStr.trim() === '' || daysBStr.includes('Setiap Hari')) ? allDays : daysBStr.split(',').map(p => p.trim());
      return listA.some(day => listB.includes(day));
    };

    // Cek duplikat
    const timesToCheck = [morningTime, afternoonTime];
    for (const t of timesToCheck) {
      const duplicate = schedules.find(s => s.start_time.substring(0, 5) === t && checkDayOverlap(selectedDays, s.days));
      if (duplicate) {
        onShowAlert?.("Jadwal Bentrok", `Jadwal pada pukul **${t}** sudah terdaftar pada hari yang dipilih. Silakan hapus jadwal lama terlebih dahulu jika ingin mengganti.`, () => {}, true, "Tutup", "", "warning");
        setLoading(false);
        return;
      }
    }

    const daysString = selectedDays.join(',');
    
    // Insert both schedules
    const insertData = [
      { zone, start_time: morningTime + ':00', duration: parseInt(duration), is_active: true, days: daysString },
      { zone, start_time: afternoonTime + ':00', duration: parseInt(duration), is_active: true, days: daysString }
    ];

    const { error } = await supabase.from('pump_schedules').insert(insertData);

    if (!error) {
      fetchSchedules();
      setMorningTime('08:00');
      setAfternoonTime('16:00');
      setDuration('5');
      const now = new Date();
      const daysArray = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      setSelectedDays([daysArray[now.getDay()]]);
    } else {
      onShowAlert?.("Gagal Menambah", "Terjadi kesalahan database.", () => {}, true, "Tutup", "", "warning");
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
              className="bg-secondary text-muted-foreground border border-border text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase"
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
            className="bg-card/90 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 lg:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-border z-10 relative pointer-events-auto"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <span className="material-symbols-rounded text-green-500">schedule</span>
                Jadwal Timer
              </h3>
              <button 
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors"
              >
                <span className="material-symbols-rounded text-sm">close</span>
              </button>
            </div>

            {/* Form Tambah */}
            <div className="bg-muted/50 rounded-2xl p-4 mb-6 border border-border/50">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Tambah Jadwal</h4>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs font-extrabold uppercase text-muted-foreground block mb-1">☀️ Jam Pagi</label>
                  <input 
                    type="time" 
                    lang="en-GB"
                    value={morningTime}
                    onChange={(e) => setMorningTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold uppercase text-muted-foreground block mb-1">⛅ Jam Sore</label>
                  <input 
                    type="time" 
                    lang="en-GB"
                    value={afternoonTime}
                    onChange={(e) => setAfternoonTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs font-extrabold uppercase text-muted-foreground block mb-1">Durasi (Menit)</label>
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
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs font-extrabold uppercase text-muted-foreground block mb-1">Hari Aktif</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        selectedDays.includes(day)
                           ? 'bg-green-500 text-white border-green-400 shadow-md shadow-green-500/20'
                          : 'bg-secondary/80 text-foreground/80 border-border hover:border-green-500 hover:text-foreground'
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
            <div className="max-h-[250px] overflow-y-auto pr-2 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Jadwal Aktif</h4>
              
              {schedules.length === 0 && !loading && (
                <div className="text-center py-4 text-xs font-bold text-muted-foreground/60">
                  Belum ada jadwal yang diset.
                </div>
              )}

              {schedules.map((schedule, idx) => (
                <div key={idx} className="bg-card border border-border border border-border rounded-xl p-3 flex justify-between items-center shadow-sm">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-foreground">{schedule.start_time.substring(0, 5)}</span>
                      <span className="text-xs font-bold text-muted-foreground">({schedule.duration} min)</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {renderDaysBadge(schedule.days)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleActive(schedule.id, schedule.is_active)}
                      className={`w-10 h-6 rounded-full p-0.5 transition-colors ${schedule.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-white/10'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${schedule.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="w-8 h-8 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
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
