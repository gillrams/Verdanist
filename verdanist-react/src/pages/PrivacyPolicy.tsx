import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Server, Eye, Lock, Trash2, Bell, Database, Globe, FileText } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';

interface SectionProps {
  icon: React.ReactNode;
  iconBg: string;
  iconRing: string;
  title: string;
  children: React.ReactNode;
}

function PolicySection({ icon, iconBg, iconRing, title, children }: SectionProps) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } }}
      className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-custom hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center ring-4 ${iconRing}`}>
          {icon}
        </div>
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Fredoka', sans-serif" }}>
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-y-auto px-4 py-8 md:py-16 relative">
      {/* Decorative Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">

        {/* Navigation */}
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold tracking-wide uppercase text-sm">Kembali</span>
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
            <FileText className="w-3.5 h-3.5" />
            Dokumen Resmi
          </div>
          <h1
            style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 36, fontWeight: 600 }}
            className="text-foreground leading-tight mb-4"
          >
            Kebijakan Privasi &<br />Ketentuan API
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl text-sm md:text-base">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >

          {/* 1. Pendahuluan */}
          <PolicySection
            icon={<Shield className="w-6 h-6 text-emerald-500" />}
            iconBg="bg-emerald-500/10"
            iconRing="ring-emerald-500/5"
            title="1. Pendahuluan"
          >
            <div className="text-muted-foreground leading-relaxed text-sm md:text-base space-y-3">
              <p>
                Verdanist ("Kami") berkomitmen untuk melindungi privasi seluruh pengguna ("Anda") yang menggunakan aplikasi Verdanist Smart Farming. Kebijakan ini menjelaskan secara transparan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda.
              </p>
              <p>
                Dengan menggunakan layanan Verdanist, Anda menyetujui praktik-praktik yang dijelaskan dalam kebijakan ini. Jika Anda tidak setuju, mohon untuk menghentikan penggunaan layanan kami.
              </p>
            </div>
          </PolicySection>

          {/* 2. Data yang Dikumpulkan */}
          <PolicySection
            icon={<Database className="w-6 h-6 text-blue-500" />}
            iconBg="bg-blue-500/10"
            iconRing="ring-blue-500/5"
            title="2. Data yang Dikumpulkan"
          >
            <div className="space-y-4">
              <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                <h3 className="font-bold text-foreground text-sm mb-3">A. Data Akun</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <BulletItem>Nama lengkap (dari akun Google atau input manual)</BulletItem>
                  <BulletItem>Alamat email (digunakan untuk autentikasi)</BulletItem>
                  <BulletItem>Foto profil (disimpan di Supabase Storage)</BulletItem>
                  <BulletItem>Peran pengguna (Admin / Farmer / Guest)</BulletItem>
                </ul>
              </div>
              <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                <h3 className="font-bold text-foreground text-sm mb-3">B. Data Perangkat IoT</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <BulletItem>Data sensor: suhu, kelembaban udara, kelembaban tanah</BulletItem>
                  <BulletItem>Status perangkat: konektivitas, status pompa, waktu operasi</BulletItem>
                  <BulletItem>Pengaturan ambang batas (threshold) yang Anda konfigurasi</BulletItem>
                </ul>
              </div>
              <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                <h3 className="font-bold text-foreground text-sm mb-3">C. Data Geolokasi</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <BulletItem>Koordinat GPS perangkat Anda (latitude & longitude)</BulletItem>
                  <BulletItem>Data ini <strong>HANYA</strong> digunakan untuk menampilkan prakiraan cuaca lokal</BulletItem>
                  <BulletItem>Data lokasi <strong>TIDAK</strong> disimpan di server kami</BulletItem>
                  <BulletItem>Anda dapat mencabut izin lokasi kapan saja melalui pengaturan browser</BulletItem>
                </ul>
              </div>
            </div>
          </PolicySection>

          {/* 3. Penggunaan Data */}
          <PolicySection
            icon={<Eye className="w-6 h-6 text-violet-500" />}
            iconBg="bg-violet-500/10"
            iconRing="ring-violet-500/5"
            title="3. Penggunaan Data"
          >
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="mb-4">Kami menggunakan data Anda secara eksklusif untuk keperluan berikut:</p>
              <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                <ul className="space-y-2">
                  <BulletItem>Menampilkan dashboard monitoring kebun secara real-time</BulletItem>
                  <BulletItem>Mengirimkan notifikasi terkait kondisi kebun (suhu ekstrem, pompa aktif)</BulletItem>
                  <BulletItem>Menyediakan analitik dan riwayat data sensor</BulletItem>
                  <BulletItem>Otentikasi dan otorisasi akses ke kebun yang terdaftar</BulletItem>
                  <BulletItem>Menampilkan prakiraan cuaca lokal menggunakan koordinat GPS Anda</BulletItem>
                </ul>
              </div>
              <p className="mt-4 font-semibold text-foreground">
                Kami <span className="text-destructive">TIDAK</span> menggunakan data Anda untuk:
              </p>
              <div className="bg-destructive/5 p-5 rounded-2xl border border-destructive/10 mt-3">
                <ul className="space-y-2">
                  <BulletItem>Menjual atau menyewakan informasi kepada pihak ketiga</BulletItem>
                  <BulletItem>Menampilkan iklan bertarget</BulletItem>
                  <BulletItem>Pelacakan atau profiling pengguna</BulletItem>
                  <BulletItem>Tujuan apa pun di luar operasional aplikasi Verdanist</BulletItem>
                </ul>
              </div>
            </div>
          </PolicySection>

          {/* 4. Keamanan Data */}
          <PolicySection
            icon={<Lock className="w-6 h-6 text-amber-500" />}
            iconBg="bg-amber-500/10"
            iconRing="ring-amber-500/5"
            title="4. Keamanan Data"
          >
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>Kami menerapkan langkah-langkah keamanan tingkat industri untuk melindungi data Anda:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-secondary/40 p-4 rounded-2xl border border-border">
                  <h4 className="font-bold text-foreground text-xs mb-2">🔐 Enkripsi</h4>
                  <p className="text-xs">Semua komunikasi dienkripsi menggunakan TLS/SSL (HTTPS). Data sensitif disimpan dengan enkripsi AES-256.</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-2xl border border-border">
                  <h4 className="font-bold text-foreground text-xs mb-2">🛡️ Row Level Security</h4>
                  <p className="text-xs">Database menggunakan RLS (Row Level Security) Supabase sehingga setiap pengguna hanya dapat mengakses datanya sendiri.</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-2xl border border-border">
                  <h4 className="font-bold text-foreground text-xs mb-2">🔑 OAuth 2.0</h4>
                  <p className="text-xs">Autentikasi menggunakan protokol OAuth 2.0 melalui Google Sign-In. Kami tidak menyimpan password Anda.</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-2xl border border-border">
                  <h4 className="font-bold text-foreground text-xs mb-2">📦 Isolasi Storage</h4>
                  <p className="text-xs">File yang diunggah (foto profil) disimpan di bucket terpisah dengan kebijakan akses ketat per pengguna.</p>
                </div>
              </div>
            </div>
          </PolicySection>

          {/* 5. Hak Penghapusan Data */}
          <PolicySection
            icon={<Trash2 className="w-6 h-6 text-red-500" />}
            iconBg="bg-red-500/10"
            iconRing="ring-red-500/5"
            title="5. Hak Penghapusan Data"
          >
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>Anda memiliki hak penuh atas data pribadi Anda:</p>
              <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                <ul className="space-y-2">
                  <BulletItem><strong>Hak Akses:</strong> Anda berhak mengetahui data apa saja yang kami simpan tentang Anda.</BulletItem>
                  <BulletItem><strong>Hak Koreksi:</strong> Anda dapat memperbarui nama, foto profil, dan pengaturan akun kapan saja melalui halaman Settings.</BulletItem>
                  <BulletItem><strong>Hak Hapus:</strong> Anda dapat meminta penghapusan seluruh data Anda dengan menghubungi admin melalui WhatsApp.</BulletItem>
                  <BulletItem><strong>Hak Portabilitas:</strong> Anda berhak meminta salinan data Anda dalam format yang dapat dibaca mesin.</BulletItem>
                </ul>
              </div>
            </div>
          </PolicySection>

          {/* 6. Notifikasi Push */}
          <PolicySection
            icon={<Bell className="w-6 h-6 text-cyan-500" />}
            iconBg="bg-cyan-500/10"
            iconRing="ring-cyan-500/5"
            title="6. Kebijakan Notifikasi Push"
          >
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>Aplikasi Verdanist menggunakan teknologi Web Push Notification untuk mengirimkan pemberitahuan penting:</p>
              <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                <ul className="space-y-2">
                  <BulletItem>Notifikasi hanya dikirim untuk kondisi kritis: suhu melebihi ambang batas, perubahan status pompa air</BulletItem>
                  <BulletItem>Anda dapat mengaktifkan/menonaktifkan setiap jenis notifikasi secara individual di halaman Settings</BulletItem>
                  <BulletItem>Token push notification disimpan dengan aman dan dihapus otomatis saat Anda menonaktifkan notifikasi</BulletItem>
                  <BulletItem>Kami menerapkan sistem <strong>cooldown 10 menit</strong> untuk mencegah spam notifikasi</BulletItem>
                </ul>
              </div>
            </div>
          </PolicySection>

          {/* 7. Ketentuan API */}
          <PolicySection
            icon={<Server className="w-6 h-6 text-orange-500" />}
            iconBg="bg-orange-500/10"
            iconRing="ring-orange-500/5"
            title="7. Ketentuan Penggunaan API"
          >
            <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
              <p>Verdanist menggunakan layanan API pihak ketiga berikut untuk mendukung fungsionalitas aplikasi:</p>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                  <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                    <span>🌤️</span> Open-Meteo API
                  </h3>
                  <ul className="text-xs space-y-1.5">
                    <BulletItem>Menyediakan data prakiraan cuaca real-time (suhu, kelembaban, kecepatan angin)</BulletItem>
                    <BulletItem>API gratis dan open-source, tidak memerlukan API key</BulletItem>
                    <BulletItem>Data cuaca diambil berdasarkan koordinat GPS yang Anda berikan</BulletItem>
                    <BulletItem>Lisensi: CC BY 4.0 — <a href="https://open-meteo.com" target="_blank" rel="noopener" className="text-primary underline">open-meteo.com</a></BulletItem>
                  </ul>
                </div>

                <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                  <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                    <span>🗺️</span> Nominatim API (OpenStreetMap)
                  </h3>
                  <ul className="text-xs space-y-1.5">
                    <BulletItem>Digunakan untuk reverse-geocoding (mengubah koordinat menjadi nama lokasi)</BulletItem>
                    <BulletItem>Tidak menyimpan atau melacak permintaan pengguna</BulletItem>
                    <BulletItem>Penggunaan sesuai dengan Usage Policy OpenStreetMap Foundation</BulletItem>
                    <BulletItem>Lisensi: ODbL — <a href="https://nominatim.org" target="_blank" rel="noopener" className="text-primary underline">nominatim.org</a></BulletItem>
                  </ul>
                </div>

                <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                  <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                    <span>🔑</span> Supabase (Backend-as-a-Service)
                  </h3>
                  <ul className="text-xs space-y-1.5">
                    <BulletItem>Menyediakan database PostgreSQL, autentikasi, dan penyimpanan file</BulletItem>
                    <BulletItem>Server berlokasi di region Asia Tenggara (Singapore)</BulletItem>
                    <BulletItem>Keamanan menggunakan Row Level Security (RLS) dan JWT token</BulletItem>
                    <BulletItem>Kebijakan: <a href="https://supabase.com/privacy" target="_blank" rel="noopener" className="text-primary underline">supabase.com/privacy</a></BulletItem>
                  </ul>
                </div>

                <div className="bg-secondary/40 p-5 rounded-2xl border border-border">
                  <h3 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                    <span>🤖</span> Google Gemini API
                  </h3>
                  <ul className="text-xs space-y-1.5">
                    <BulletItem>Digunakan untuk fitur AI Assistant (analisis dan rekomendasi pertanian)</BulletItem>
                    <BulletItem>Data sensor yang dikirim ke API tidak disimpan oleh Google untuk pelatihan model</BulletItem>
                    <BulletItem>Penggunaan sesuai dengan Google Cloud Terms of Service</BulletItem>
                    <BulletItem>Kebijakan: <a href="https://ai.google.dev/terms" target="_blank" rel="noopener" className="text-primary underline">ai.google.dev/terms</a></BulletItem>
                  </ul>
                </div>
              </div>
            </div>
          </PolicySection>

          {/* 8. Kontak */}
          <PolicySection
            icon={<Globe className="w-6 h-6 text-teal-500" />}
            iconBg="bg-teal-500/10"
            iconRing="ring-teal-500/5"
            title="8. Kontak & Pertanyaan"
          >
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>Jika Anda memiliki pertanyaan, keluhan, atau permintaan terkait kebijakan privasi ini, silakan hubungi kami melalui:</p>
              <div className="bg-secondary/40 p-5 rounded-2xl border border-border space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📱</span>
                  <div>
                    <p className="text-foreground font-semibold text-sm">WhatsApp</p>
                    <a href="https://wa.me/6285817619891" target="_blank" rel="noopener" className="text-primary underline text-xs">+62 858-1761-9891</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📧</span>
                  <div>
                    <p className="text-foreground font-semibold text-sm">Email</p>
                    <p className="text-xs">admin@verdanist.id</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-4">
                Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan material akan diinformasikan melalui notifikasi dalam aplikasi. Penggunaan berkelanjutan setelah pembaruan dianggap sebagai persetujuan Anda terhadap perubahan tersebut.
              </p>
            </div>
          </PolicySection>

        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.5 } }}
          className="text-center mt-12 mb-4"
        >
          <p className="text-muted-foreground/40 text-xs">© {new Date().getFullYear()} Verdanist Smart Farming. Hak Cipta Dilindungi.</p>
        </motion.div>
      </div>
    </div>
  );
}
