import React, { createContext, useContext, useState, useCallback } from 'react';

export type Lang = 'id' | 'en';

const translations = {
  // ─── Navigation ───
  'nav.overview': { id: 'Overview', en: 'Overview' },
  'nav.analytics': { id: 'Analitik', en: 'Analytics' },
  'nav.history': { id: 'Riwayat', en: 'History' },
  'nav.settings': { id: 'Pengaturan', en: 'Settings' },
  'nav.admin': { id: 'Admin Control', en: 'Admin Control' },
  'nav.logout': { id: 'Keluar', en: 'Logout' },

  // ─── Bottom Nav ───
  'bnav.home': { id: 'Beranda', en: 'Home' },
  'bnav.chart': { id: 'Grafik', en: 'Charts' },
  'bnav.history': { id: 'Riwayat', en: 'History' },
  'bnav.settings': { id: 'Atur', en: 'Settings' },
  'bnav.admin': { id: 'Admin', en: 'Admin' },

  // ─── Dashboard ───
  'dash.greeting.morning': { id: 'Pagi', en: 'Morning' },
  'dash.greeting.afternoon': { id: 'Siang', en: 'Afternoon' },
  'dash.greeting.evening': { id: 'Sore', en: 'Evening' },
  'dash.greeting.night': { id: 'Malam', en: 'Night' },
  'dash.live': { id: 'LIVE', en: 'LIVE' },
  'dash.realtime': { id: 'Realtime', en: 'Realtime' },
  'dash.indoor': { id: 'Dalam', en: 'Indoor' },
  'dash.outdoor': { id: 'Luar', en: 'Outdoor' },
  'dash.airTemp': { id: 'Suhu Udara', en: 'Air Temp' },
  'dash.humidity': { id: 'Kelembaban', en: 'Humidity' },
  'dash.hot': { id: '⚠ Panas', en: '⚠ Hot' },
  'dash.wind': { id: 'Angin', en: 'Wind' },
  'dash.rain': { id: 'Hujan', en: 'Rain' },
  'dash.loadingWeather': { id: 'Memuat cuaca...', en: 'Loading weather...' },
  'dash.tempChart': { id: 'Grafik Suhu', en: 'Temperature Chart' },
  'dash.humChart': { id: 'Grafik Kelembaban', en: 'Humidity Chart' },
  'dash.soilChart': { id: 'Grafik Kelembaban Tanah', en: 'Soil Moisture Chart' },
  'dash.pumpControl': { id: 'Kontrol Pompa', en: 'Pump Control' },
  'dash.active': { id: 'aktif', en: 'active' },
  'dash.neverRun': { id: 'Belum pernah', en: 'Never' },
  'dash.tempC': { id: 'Suhu (°C)', en: 'Temp (°C)' },
  'dash.humPercent': { id: 'Kelembaban (%)', en: 'Humidity (%)' },
  'dash.soilPercent': { id: 'Tanah (%)', en: 'Soil (%)' },
  'dash.cancel': { id: 'Batal', en: 'Cancel' },

  // ─── Pump Controller ───
  'pump.indoor': { id: 'Kontrol Pompa Dalam', en: 'Indoor Pump Control' },
  'pump.outdoor': { id: 'Kontrol Pompa Luar', en: 'Outdoor Pump Control' },
  'pump.zoneA': { id: 'ZONE A • OVERHEAD', en: 'ZONE A • OVERHEAD' },
  'pump.zoneB': { id: 'ZONE B • OVERHEAD', en: 'ZONE B • OVERHEAD' },
  'pump.manual': { id: 'Manual', en: 'Manual' },
  'pump.auto': { id: 'Auto', en: 'Auto' },
  'pump.timer': { id: 'Timer', en: 'Timer' },
  'pump.setTimer': { id: 'ATUR JADWAL', en: 'SET SCHEDULE' },
  'pump.ctrlSensor': { id: 'DIKONTROL SENSOR', en: 'SENSOR CONTROLLED' },
  'pump.ctrlTimer': { id: 'DIKONTROL JADWAL', en: 'TIMER CONTROLLED' },
  'pump.turnOff': { id: 'MATIKAN POMPA', en: 'TURN PUMP OFF' },
  'pump.turnOn': { id: 'NYALAKAN POMPA', en: 'TURN PUMP ON' },
  'pump.safetyTimeout': { id: 'Safety Timeout', en: 'Safety Timeout' },
  'pump.warnTitle': { id: 'Matikan Pompa Dulu!', en: 'Turn Off Pump First!' },
  'pump.warnMsg': { id: 'Pompa masih dalam keadaan menyala. Silakan matikan pompa terlebih dahulu sebelum berpindah dari mode Manual demi keamanan.', en: 'The pump is still running. Please turn it off before switching from Manual mode for safety reasons.' },
  'pump.timerInfoTitle': { id: 'Informasi Timer', en: 'Timer Info' },
  'pump.timerInfoMsg': { id: 'Mode Timer akan mengaktifkan pompa secara otomatis berdasarkan jadwal.\n\nSyarat: Anda harus menyetel minimal 2 jadwal aktif per hari untuk SELURUH HARI (Senin s/d Minggu).\n\nApakah Anda ingin membuka menu atur jadwal sekarang?', en: 'Timer Mode will turn the pump on automatically based on schedule.\n\nCondition: You must set at least 2 active schedules per day for EVERY DAY (Mon-Sun).\n\nDo you want to open the schedule menu now?' },
  'pump.openSchedule': { id: 'Buka Jadwal', en: 'Open Schedule' },
  'pump.modeWarnTitle': { id: 'Peringatan Mode', en: 'Mode Warning' },
  'pump.modeWarnMsg': { id: 'Sistem akan mematikan otomatisasi sensor. Penyiraman mandiri sepenuhnya tanggung jawab Anda.', en: 'The system will turn off sensor automation. Manual watering is entirely your responsibility.' },
  'pump.sureSwitch': { id: 'Yakin, Pindah', en: 'Sure, Switch' },

  // ─── Admin ───
  'admin.panel': { id: 'Panel Admin', en: 'Admin Panel' },
  'admin.control': { id: 'Kontrol Pusat', en: 'Central Control' },
  'admin.activeFarms': { id: 'Kebun Aktif', en: 'Active Farms' },
  'admin.activeUsers': { id: 'Pengguna Aktif', en: 'Active Users' },
  'admin.pendingGuests': { id: 'Tamu Menunggu', en: 'Pending Guests' },
  'admin.systemStatus': { id: 'Sistem', en: 'System' },
  'admin.safe': { id: 'Aman', en: 'Safe' },
  'admin.tabFarms': { id: 'Kebun', en: 'Farms' },
  'admin.tabUsers': { id: 'Pengguna', en: 'Users' },
  'admin.tabSystem': { id: 'Sistem', en: 'System' },
  'admin.loading': { id: 'Memuat data...', en: 'Loading data...' },
  'admin.registeredFarms': { id: 'kebun terdaftar', en: 'registered farms' },
  'admin.activeStatus': { id: 'Aktif', en: 'Active' },
  'admin.pendingStatus': { id: 'Menunggu', en: 'Pending' },
  'admin.approveBtn': { id: 'Setujui', en: 'Approve' },
  'admin.deleteBtn': { id: 'Hapus', en: 'Delete' },
  'admin.registeredBtn': { id: 'Terdaftar', en: 'Registered' },
  'admin.usersCount': { id: 'pengguna', en: 'users' },
  'admin.guest': { id: 'Tamu', en: 'Guest' },
  'admin.makeFarmer': { id: 'Jadikan Petani', en: 'Make Farmer' },
  'admin.changeTo': { id: 'Ubah ke', en: 'Change to' },
  'admin.infraStatus': { id: 'Status infrastruktur', en: 'Infrastructure status' },
  'admin.refresh': { id: 'Refresh', en: 'Refresh' },
  'admin.sysRunning': { id: 'Semua sistem berjalan', en: 'All systems operational' },
  'admin.sysNormal': { id: 'Sistem normal', en: 'Normal system' },
  'admin.globalLimits': { id: 'Batas Global', en: 'Global Limits' },
  'admin.maxTemp': { id: 'Batas Suhu Maks', en: 'Max Temp Limit' },
  'admin.maxHum': { id: 'Batas Kelembaban Maks', en: 'Max Hum Limit' },
  'admin.saveSys': { id: 'Simpan Sistem', en: 'Save System' },
  'admin.saved': { id: 'Tersimpan', en: 'Saved' },
  'admin.confirmDelete': { id: 'Hapus kebun ini?', en: 'Delete this farm?' },

  // ─── Analytics ───
  'analytics.title': { id: 'Tren sensor & pemakaian pompa', en: 'Sensor trends & pump usage' },
  'analytics.avgTemp': { id: 'Rata-rata Suhu', en: 'Avg Temperature' },
  'analytics.avgRH': { id: 'Rata-rata RH', en: 'Avg Humidity' },
  'analytics.pumpDuration': { id: 'Durasi Pompa', en: 'Pump Duration' },
  'analytics.tempC': { id: 'Suhu (°C)', en: 'Temp (°C)' },
  'analytics.suhu': { id: 'Suhu', en: 'Temperature' },
  'analytics.kelembaban': { id: 'Kelembaban', en: 'Humidity' },
  'analytics.pompa': { id: 'Pompa', en: 'Pump' },
  'analytics.tempVsRH': { id: 'Suhu vs Kelembaban', en: 'Temp vs Humidity' },
  'analytics.pumpChart': { id: 'Durasi Pompa (menit)', en: 'Pump Duration (min)' },
  'analytics.1h': { id: '1 Jam', en: '1 Hour' },
  'analytics.6h': { id: '6 Jam', en: '6 Hours' },
  'analytics.1d': { id: '1 Hari', en: '1 Day' },
  'analytics.7d': { id: '7 Hari', en: '7 Days' },
  'analytics.30d': { id: '30 Hari', en: '30 Days' },

  // ─── Logs / History ───
  'logs.title': { id: 'Riwayat Aktivitas', en: 'Activity History' },
  'logs.records': { id: 'catatan aktivitas & sensor', en: 'activity & sensor records' },
  'logs.export': { id: 'Ekspor', en: 'Export' },
  'logs.exportPDF': { id: 'Ekspor PDF', en: 'Export PDF' },
  'logs.exportCSV': { id: 'Ekspor CSV', en: 'Export CSV' },
  'logs.searchPlaceholder': { id: 'Cari aktivitas, zona, atau operator...', en: 'Search activity, zone, or operator...' },
  'logs.all': { id: 'Semua', en: 'All' },
  'logs.pump': { id: '💧 Pompa', en: '💧 Pump' },
  'logs.temp': { id: '🌡️ Suhu', en: '🌡️ Temp' },
  'logs.hum': { id: '💦 Kelembaban', en: '💦 Humidity' },
  'logs.loading': { id: 'Memuat riwayat...', en: 'Loading history...' },
  'logs.noData': { id: 'Tidak ada aktivitas ditemukan', en: 'No records found' },
  'logs.today': { id: 'Hari ini', en: 'Today' },
  'logs.yesterday': { id: 'Kemarin', en: 'Yesterday' },
  'logs.pumpOn': { id: 'Pompa Dinyalakan', en: 'Pump Turned On' },
  'logs.pumpOff': { id: 'Pompa Dimatikan', en: 'Pump Turned Off' },
  'logs.tempRecorded': { id: 'Suhu Tercatat', en: 'Temperature Recorded' },
  'logs.rhRecorded': { id: 'Kelembaban (RH) Tercatat', en: 'Humidity (RH) Recorded' },
  'logs.soilRecorded': { id: 'Kelembaban Tanah Tercatat', en: 'Soil Moisture Recorded' },
  'logs.sensorReading': { id: 'Pencatatan Sensor', en: 'Sensor Reading' },
  'logs.zone': { id: 'Zona', en: 'Zone' },
  'logs.system': { id: 'Sistem', en: 'System' },
  'logs.count': { id: 'catatan', en: 'records' },
  'logs.printedOn': { id: 'Dicetak pada', en: 'Printed on' },
  'logs.excelTitle': { id: 'PERSADA FARM - RIWAYAT AKTIVITAS DAN SENSOR', en: 'PERSADA FARM - ACTIVITY AND SENSOR HISTORY' },
  'logs.colDate': { id: 'Tanggal', en: 'Date' },
  'logs.colTime': { id: 'Waktu', en: 'Time' },
  'logs.colZone': { id: 'Zona', en: 'Zone' },
  'logs.colActivity': { id: 'Aktivitas / Tipe', en: 'Activity / Type' },
  'logs.colDetail': { id: 'Detail / Nilai', en: 'Detail / Value' },

  // ─── Settings ───
  'settings.title': { id: 'Pengaturan', en: 'Settings' },
  'settings.subtitle': { id: 'Kelola akun & preferensi kebunmu', en: 'Manage your account & farm preferences' },
  'settings.activeFarm': { id: 'Kebun Aktif', en: 'Active Farm' },
  'settings.connected': { id: 'Terhubung', en: 'Connected' },
  'settings.changeFarm': { id: 'Ganti Kebun', en: 'Change Farm' },
  'settings.changeFarmSub': { id: 'Hubungkan ke kebun lain', en: 'Connect to another farm' },
  'settings.accessToken': { id: 'Token Akses', en: 'Access Token' },
  'settings.sensorLimits': { id: 'Batas Sensor', en: 'Sensor Limits' },
  'settings.tempMax': { id: 'Suhu Maks', en: 'Max Temp' },
  'settings.tempMin': { id: 'Suhu Min', en: 'Min Temp' },
  'settings.humMin': { id: 'Kelembaban Min', en: 'Min Humidity' },
  'settings.notifications': { id: 'Notifikasi', en: 'Notifications' },
  'settings.alertTemp': { id: 'Alert Suhu Ekstrem', en: 'Extreme Temp Alert' },
  'settings.alertTempSub': { id: 'Notif saat suhu di luar batas', en: 'Notify when temp is out of range' },
  'settings.alertHum': { id: 'Alert Kelembaban', en: 'Humidity Alert' },
  'settings.alertHumSub': { id: 'Notif saat RH terlalu rendah', en: 'Notify when RH is too low' },
  'settings.pumpStatus': { id: 'Status Pompa', en: 'Pump Status' },
  'settings.pumpStatusSub': { id: 'Notif pompa ON/OFF', en: 'Notify pump ON/OFF' },
  'settings.appearance': { id: 'Tampilan', en: 'Appearance' },
  'settings.theme': { id: 'Tema Aplikasi', en: 'App Theme' },
  'settings.themeSub': { id: 'Ubah ke mode gelap / terang', en: 'Switch to dark / light mode' },
  'settings.sensorConn': { id: 'Koneksi Sensor', en: 'Sensor Connection' },
  'settings.updateInterval': { id: 'Interval Update', en: 'Update Interval' },
  'settings.every30s': { id: 'Setiap 30 detik', en: 'Every 30 seconds' },
  'settings.logoutBtn': { id: 'Keluar dari Akun', en: 'Logout' },
  'settings.user': { id: 'Pengguna', en: 'User' },
  'settings.guest': { id: 'Tamu', en: 'Guest' },
  'settings.enterNewName': { id: 'Masukkan nama baru:', en: 'Enter new name:' },
  'settings.failName': { id: 'Gagal memperbarui nama: ', en: 'Failed to update name: ' },
  'settings.failPhoto': { id: 'Gagal memperbarui foto: ', en: 'Failed to update photo: ' },
  'settings.language': { id: 'Bahasa', en: 'Language' },
  'settings.langSub': { id: 'Indonesia / English', en: 'Indonesian / English' },

  // ─── Common ───
  'common.active': { id: 'Aktif', en: 'Active' },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved === 'en' || saved === 'id') ? saved : 'id';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'id' ? 'en' : 'id');
  }, [lang, setLang]);

  const t = useCallback((key: TranslationKey): string => {
    const entry = translations[key];
    return entry ? entry[lang] : key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
