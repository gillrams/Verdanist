import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, DownloadIcon, Smartphone, Wifi, Thermometer,
  Droplets, Bell, Shield, ChevronDown, Star, Zap, CheckCircle2
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import logoLight from '../assets/Logo_Light_Samping.png';
import logoDark from '../assets/Logo_Dark_samping.png';

// ── Konstanta ──────────────────────────────────────────────────────────────
const APK_VERSION   = '3.0.0';
const APK_SIZE      = '106 MB';
const APK_DATE      = 'Agustus 2025';
// Ganti URL ini dengan link download APK yang sebenarnya (Google Drive, GitHub Release, dsb.)
const APK_URL       = 'https://github.com/gillrams/Verdanist/releases/download/v3.0.0/Verdanist-Live.apk';

const FEATURES = [
  { icon: <Thermometer className="w-5 h-5" />, label: 'Monitor Suhu & RH', desc: 'Pantau kondisi lingkungan secara real-time dari 3 sensor sekaligus' },
  { icon: <Droplets className="w-5 h-5" />, label: 'Kontrol Pompa Misting', desc: 'Nyalakan / matikan pompa manual, otomatis, atau jadwal terjadwal' },
  { icon: <Wifi className="w-5 h-5" />, label: 'Koneksi Live via Wi-Fi', desc: 'Data diperbarui setiap detik langsung dari ESP32 ke cloud Supabase' },
  { icon: <Bell className="w-5 h-5" />, label: 'Notifikasi Push', desc: 'Terima peringatan suhu ekstrem, kelembaban rendah, dan status pompa' },
  { icon: <Shield className="w-5 h-5" />, label: 'Keamanan Akun', desc: 'Login aman dengan Supabase Auth, data kebun terlindungi per akun' },
  { icon: <Zap className="w-5 h-5" />, label: 'AI Assistant', desc: 'Tanyakan rekomendasi perawatan tanaman langsung ke asisten AI' },
];

const CHANGELOG = [
  { version: '3.0.0', date: 'Agustus 2025', notes: ['Offline indicator real-time di dashboard dan grafik', 'Sensor modal kini sembunyikan data lama saat offline', 'Perbaikan badge jumlah sensor aktif', 'Chart gap saat perangkat tidak terhubung', 'Bug fix & performa lebih stabil'] },
  { version: '2.5.0', date: 'Juli 2025', notes: ['Halaman Analitik dengan grafik historis 1j/6j/1h/7h/30h', 'Garis merah offline di grafik analitik', 'Mode timer pompa dengan jadwal mingguan'] },
  { version: '2.0.0', date: 'Juni 2025', notes: ['Multi-farm support', 'Pengaturan ambang batas suhu & RH per perangkat', 'Dark mode & Light mode', 'Dukungan bahasa Indonesia & English'] },
];

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, type: 'spring' as const, stiffness: 100 } }),
};

// ── Komponen ───────────────────────────────────────────────────────────────
export default function Download() {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [openChangelog, setOpenChangelog] = useState<number | null>(0);

  const handleDownload = () => {
    if (APK_URL === '#') return;
    setDownloading(true);
    setTimeout(() => {
      window.open(APK_URL, '_blank');
      setDownloading(false);
    }, 1200);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-y-auto relative">
      {/* Gradient backdrop */}
      <div className="absolute top-0 left-0 right-0 h-[480px] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-5 py-10 relative z-10">

        {/* Nav */}
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold tracking-wide uppercase text-sm">Kembali</span>
          </button>
          <div className="w-10 h-10">
            <ThemeToggle />
          </div>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="flex flex-col items-center text-center mb-10"
        >
          {/* Logo */}
          <div className="mb-6">
            <img src={logoLight} alt="Verdanist" className="h-14 w-auto dark:hidden" />
            <img src={logoDark}  alt="Verdanist" className="h-14 w-auto hidden dark:block" />
          </div>

          {/* Judul */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Download Aplikasi
          </h1>
          <p className="text-muted-foreground text-base max-w-sm">
            Verdanist untuk Android — kontrol kebun pintar kamu dari mana saja.
          </p>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {[`v${APK_VERSION}`, APK_SIZE, 'Android 7+', APK_DATE].map(b => (
              <span key={b} className="px-3 py-1 bg-secondary border border-border rounded-full text-xs font-semibold text-muted-foreground">
                {b}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Download Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 100 }}
          className="bg-gradient-to-br from-primary to-emerald-600 rounded-3xl p-[1.5px] shadow-2xl shadow-primary/20 mb-8"
        >
          <div className="bg-card rounded-[calc(1.5rem-1.5px)] p-7 flex flex-col sm:flex-row items-center gap-6">
            {/* Phone icon */}
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-lg font-black text-foreground">Verdanist APK</span>
                <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-full border border-primary/20">LATEST</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Versi {APK_VERSION} · {APK_SIZE} · Android</p>
              <div className="flex items-center justify-center sm:justify-start gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs text-muted-foreground ml-1.5">Gratis</span>
              </div>
            </div>

            {/* Button */}
            <button
              id="btn-download-apk"
              onClick={handleDownload}
              disabled={downloading || APK_URL === '#'}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                {downloading ? (
                  <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"
                  />
                ) : (
                  <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <DownloadIcon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              {downloading ? 'Membuka...' : 'Download'}
            </button>
          </div>
        </motion.div>

        {/* Info box jika URL belum di-set */}
        {APK_URL === '#' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 mb-8"
          >
            <span className="material-symbols-rounded text-amber-500 text-xl mt-0.5">info</span>
            <div>
              <p className="text-amber-700 dark:text-amber-400 font-bold text-sm">Link Download Belum Tersedia</p>
              <p className="text-amber-600/80 dark:text-amber-400/70 text-xs mt-0.5">
                File APK sedang disiapkan. Hubungi admin untuk mendapatkan tautan unduhan.
              </p>
            </div>
          </motion.div>
        )}

        {/* Cara Install */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-secondary/50 border border-border rounded-3xl p-6 mb-8"
        >
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Cara Install</h2>
          <div className="flex flex-col gap-3">
            {[
              { step: '1', text: 'Klik tombol Download di atas untuk mengunduh file APK' },
              { step: '2', text: 'Buka file APK dari folder Downloads di perangkat kamu' },
              { step: '3', text: 'Izinkan "Install dari sumber tidak dikenal" di pengaturan Android' },
              { step: '4', text: 'Ikuti instruksi instalasi, lalu buka aplikasi dan login' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-black text-primary">{s.step}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Fitur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Fitur Unggulan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Changelog */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-4">Changelog</h2>
          <div className="flex flex-col gap-3">
            {CHANGELOG.map((cl, i) => (
              <div key={cl.version} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenChangelog(openChangelog === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {i === 0 && (
                      <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-full border border-primary/20">TERBARU</span>
                    )}
                    <span className="font-bold text-sm text-foreground">v{cl.version}</span>
                    <span className="text-xs text-muted-foreground">{cl.date}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openChangelog === i ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {openChangelog === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 border-t border-border/50 pt-3 flex flex-col gap-2">
                        {cl.notes.map((n) => (
                          <div key={n} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{n}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground/60 pb-6">
          © 2025 Verdanist · Dibuat dengan ❤️ untuk petani modern
        </div>

      </div>
    </div>
  );
}
