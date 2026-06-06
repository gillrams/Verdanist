import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CloudSun, Code, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function About() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-y-auto px-4 py-8 md:py-16 relative">
      {/* Decorative Top Radial Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Navigation & Theme Toggle */}
        <div className="flex justify-between items-center mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold tracking-wide uppercase text-sm font-sans">Kembali</span>
          </button>
          
          <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm" />
        </div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center md:text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            Tentang Aplikasi
          </div>
          <h1 
            style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 42, fontWeight: 600 }}
            className="text-foreground leading-tight mb-4"
          >
            Verdanist
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-xl">
            Smart Farming Reimagined. Built for the modern agricultural ecosystem, connecting IoT devices with smart analysis.
          </p>
        </motion.div>

        {/* Content Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* Privacy & Location Card */}
          <motion.div 
            variants={itemVariants} 
            className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-custom hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 ring-4 ring-blue-500/5">
                <MapPin className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                Privasi & Geolokasi
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6 text-sm md:text-base">
              Verdanist meminta akses ke data <strong>Geolokasi</strong> perangkat Anda secara eksklusif untuk memberikan informasi cuaca lokal yang akurat untuk kebun pintar Anda secara real-time.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground bg-secondary/40 p-5 rounded-2xl border border-border">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> 
                <span>Kami <strong>TIDAK</strong> menyimpan data lokasi Anda di server mana pun.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> 
                <span>Informasi lokasi diproses secara instan di peramban Anda menggunakan API web standar.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> 
                <span>Anda dapat mencabut izin lokasi kapan saja melalui pengaturan peramban Anda.</span>
              </li>
            </ul>
          </motion.div>

          {/* API & Open Source Card */}
          <motion.div 
            variants={itemVariants} 
            className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-custom hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 ring-4 ring-amber-500/5">
                <CloudSun className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                Integrasi & API Terbuka
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6 text-sm md:text-base">
              Dashboard ini menggunakan API gratis dan open-source yang andal untuk menghadirkan pengalaman demo yang mulus tanpa memerlukan registrasi khusus.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary/40 rounded-2xl p-5 border border-border hover:bg-secondary/60 transition-colors">
                <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                  <span>🌤️</span> Open-Meteo API
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menyediakan data ramalan cuaca real-time dan kelembaban udara sekitar tanpa merekam identitas pengguna.
                </p>
              </div>
              <div className="bg-secondary/40 rounded-2xl p-5 border border-border hover:bg-secondary/60 transition-colors">
                <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                  <span>🗺️</span> Nominatim (OSM)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menyediakan pencarian reverse-geocoding untuk menampilkan nama kota Anda alih-colot koordinat mentah.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Technology Stack Card */}
          <motion.div 
            variants={itemVariants} 
            className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-custom hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 ring-4 ring-purple-500/5">
                <Code className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                Teknologi yang Digunakan
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {['React', 'Vite', 'Tailwind CSS v4', 'Framer Motion', 'TypeScript', 'Supabase'].map(tech => (
                <span 
                  key={tech} 
                  className="px-4 py-2 rounded-xl bg-secondary border border-border text-xs md:text-sm font-semibold hover:bg-secondary/80 hover:-translate-y-0.5 transition-all cursor-default text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>

        </motion.div>

        {/* Footer Text */}
        <motion.div variants={itemVariants} className="text-center mt-12 mb-4 space-y-2">
          <button onClick={() => navigate('/privacy')} className="text-primary/60 hover:text-primary text-xs font-semibold transition-colors underline underline-offset-2">
            Kebijakan Privasi & Ketentuan API
          </button>
          <p className="text-muted-foreground/40 text-xs">© {new Date().getFullYear()} Verdanist Smart Farming. Hak Cipta Dilindungi.</p>
        </motion.div>
      </div>
    </div>
  );
}
