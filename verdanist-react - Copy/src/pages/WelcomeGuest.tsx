import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function WelcomeGuest() {
  const { user, currentFarm, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If the user's role is updated to non-guest (admin or farmer), automatically redirect to dashboard
    if (user && user.role !== 'guest') {
      console.log('[WelcomeGuest] User is not a guest, redirecting to /dashboard. Role:', user.role);
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleWhatsAppChat = () => {
    const phoneNumber = '085817619891';
    const name = user?.displayName || 'User';
    const farmName = currentFarm?.name || 'Persada Farm Bogor';
    const message = `Halo Admin Verdanist, saya ${name} baru saja mendaftar. Saya ingin mengajukan akun saya agar disetujui menjadi Farmer di ${farmName}. Terima kasih!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#E8F8EE] via-[#F2FAF4] to-[#E0F4E8] dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 p-6 font-sans">
      
      {/* Floating Bright Decorative Orbs */}
      <motion.div 
        animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-green-300/25 dark:bg-emerald-500/10 rounded-full blur-[80px] z-0 pointer-events-none"
      />
      <motion.div 
        animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] bg-teal-200/30 dark:bg-teal-500/15 rounded-full blur-[100px] z-0 pointer-events-none"
      />

      {/* Premium Glassmorphic Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
        className="relative z-10 max-w-[440px] w-full bg-white/75 dark:bg-gray-900/70 backdrop-blur-2xl rounded-[36px] p-8 lg:p-10 border border-white dark:border-white/5 shadow-[0_24px_70px_rgba(10,47,31,0.08)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.4)] text-center"
      >
        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-full text-[11px] font-extrabold text-amber-700 dark:text-amber-400 tracking-wider uppercase mb-6 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Menunggu Verifikasi
        </div>

        {/* Animated Locking Visual */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-md animate-pulse pointer-events-none"></div>
          <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-3xl flex items-center justify-center text-white shadow-[0_12px_30px_rgba(16,185,129,0.3)] border border-white/20">
            <span className="material-symbols-rounded text-4xl animate-bounce" style={{ animationDuration: '3s' }}>lock</span>
          </div>
        </div>

        {/* Title & Copy */}
        <h1 className="text-2xl lg:text-3xl font-extrabold text-[#0A2F1F] dark:text-white tracking-tight mb-3">
          Akses Akun Terbatas
        </h1>
        
        <p className="text-sm text-[#0A2F1F]/70 dark:text-white/70 leading-relaxed mb-6">
          Halo <span className="font-extrabold text-[#0D5C3A] dark:text-emerald-400">{user?.displayName || 'User'}</span>, selamat datang di Verdanist! 🌱 
          <br /><br />
          Akun Anda saat ini memiliki peran sebagai <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-md font-bold text-xs uppercase tracking-wider">Guest (Tamu)</span>. 
          Untuk dapat mengelola dan memantau Smart Greenhouse di <span className="font-extrabold text-gray-900 dark:text-white">{currentFarm?.name || 'Persada Farm Bogor'}</span>, Anda memerlukan persetujuan akses aktif dari Admin.
        </p>

        {/* Next Steps Section */}
        <div className="bg-emerald-50/60 dark:bg-emerald-500/5 p-5 rounded-2xl mb-8 border border-emerald-100/80 dark:border-emerald-500/10 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-rounded text-emerald-600 dark:text-emerald-400 text-lg">info</span>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-extrabold uppercase tracking-wider">Langkah Selanjutnya</p>
          </div>
          <p className="text-xs text-gray-600 dark:text-white/60 leading-relaxed">
            Silakan hubungi Administrator melalui tombol WhatsApp di bawah. Kami telah menyediakan template pesan otomatis agar Admin dapat segera memproses dan mengaktifkan peran akun Anda menjadi <span className="font-extrabold text-emerald-700 dark:text-emerald-400">Farmer (Petani)</span>.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleWhatsAppChat}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-extrabold rounded-2xl hover:from-emerald-600 hover:to-green-600 transition-all flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer text-base border border-emerald-400/30"
        >
          <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99 0-3.951-.5-5.688-1.448l-6.405 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.89-5.452 0-9.887 4.434-9.887 9.889 0 2.221.629 3.958 1.702 5.493l-.974 3.565 3.659-.944zm9.906-4.867c-.255-.127-1.513-.748-1.748-.832-.234-.085-.404-.127-.574.128-.17.255-.659.832-.808.995-.149.17-.298.191-.553.063-.255-.127-1.077-.397-2.051-1.267-.758-.677-1.269-1.512-1.418-1.768-.149-.255-.016-.393.111-.519.115-.113.255-.3.383-.447.127-.148.17-.255.255-.425.085-.17.043-.319-.021-.447-.064-.128-.574-1.383-.787-1.893-.207-.5-.435-.425-.574-.431-.133-.006-.287-.007-.442-.007-.154 0-.404.058-.617.287-.213.228-.808.787-.808 1.919 0 1.132.824 2.222.937 2.375.113.153 1.622 2.478 3.93 3.473.548.237 1.036.378 1.39.492.551.175 1.052.15 1.448.092.441-.064 1.513-.617 1.726-1.213.213-.595.213-1.105.149-1.213-.064-.106-.234-.148-.489-.275z"/>
          </svg>
          Hubungi Admin (WhatsApp)
        </button>

        <button
          onClick={() => window.location.reload()}
          className="w-full mt-3 py-3 bg-white dark:bg-white/5 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm border border-emerald-100 dark:border-emerald-500/20"
        >
          <span className="material-symbols-rounded text-lg">refresh</span>
          Cek Status Persetujuan
        </button>

        {/* Switch Account / Logout */}
        <div className="mt-8">
          <button
            onClick={async () => {
              await logout();
              window.location.href = '/login';
            }}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-[#0A2F1F]/40 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <span className="material-symbols-rounded text-lg">logout</span>
            Keluar / Log Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
