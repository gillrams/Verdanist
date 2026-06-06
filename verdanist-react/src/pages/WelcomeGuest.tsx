import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCcw, Lock, Info } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function WelcomeGuest() {
  const { user, currentFarm, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'guest') {
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
    <div className="flex flex-col min-h-screen bg-background px-6 pt-16 pb-10 justify-center relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm" />
      </div>
      <div className="bg-card border border-border rounded-3xl p-8 shadow-[var(--shadow-custom)] text-center relative overflow-hidden">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[11px] font-extrabold text-amber-500 tracking-wider uppercase mb-8 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Menunggu Verifikasi
        </div>

        <div className="flex justify-center mb-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-primary/10 rounded-full blur-md animate-pulse pointer-events-none"></div>
          <div className="relative w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center text-primary border border-primary/20">
            <Lock className="w-8 h-8" />
          </div>
        </div>

        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600 }} className="text-foreground mb-3">
          Akses Akun Terbatas
        </h1>
        
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Halo <span className="font-extrabold text-foreground">{user?.displayName || 'User'}</span>, selamat datang di Verdanist! 🌱 
          <br /><br />
          Akun Anda saat ini memiliki peran sebagai <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">Guest</span>. 
          Untuk dapat mengelola Smart Greenhouse di <span className="font-extrabold text-foreground">{currentFarm?.name || 'Persada Farm Bogor'}</span>, Anda memerlukan persetujuan akses dari Admin.
        </p>

        <div className="bg-secondary/50 p-4 rounded-2xl mb-8 border border-border text-left">
          <div className="flex items-center gap-2 mb-2">
            <Info className="text-primary w-4 h-4" />
            <p className="text-xs text-primary font-extrabold uppercase tracking-wider">Langkah Selanjutnya</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Silakan hubungi Administrator melalui tombol WhatsApp di bawah agar Admin dapat segera memproses dan mengaktifkan peran akun Anda menjadi <span className="font-extrabold text-primary">Farmer</span>.
          </p>
        </div>

        <button
          onClick={handleWhatsAppChat}
          className="w-full py-4 bg-[#25D366] text-white font-extrabold rounded-2xl hover:bg-[#1EBE5D] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] cursor-pointer"
          style={{ fontSize: 15 }}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99 0-3.951-.5-5.688-1.448l-6.405 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.89-5.452 0-9.887 4.434-9.887 9.889 0 2.221.629 3.958 1.702 5.493l-.974 3.565 3.659-.944zm9.906-4.867c-.255-.127-1.513-.748-1.748-.832-.234-.085-.404-.127-.574.128-.17.255-.659.832-.808.995-.149.17-.298.191-.553.063-.255-.127-1.077-.397-2.051-1.267-.758-.677-1.269-1.512-1.418-1.768-.149-.255-.016-.393.111-.519.115-.113.255-.3.383-.447.127-.148.17-.255.255-.425.085-.17.043-.319-.021-.447-.064-.128-.574-1.383-.787-1.893-.207-.5-.435-.425-.574-.431-.133-.006-.287-.007-.442-.007-.154 0-.404.058-.617.287-.213.228-.808.787-.808 1.919 0 1.132.824 2.222.937 2.375.113.153 1.622 2.478 3.93 3.473.548.237 1.036.378 1.39.492.551.175 1.052.15 1.448.092.441-.064 1.513-.617 1.726-1.213.213-.595.213-1.105.149-1.213-.064-.106-.234-.148-.489-.275z"/>
          </svg>
          Hubungi Admin (WhatsApp)
        </button>

        <button
          onClick={() => window.location.reload()}
          className="w-full mt-3 py-4 bg-secondary text-foreground font-extrabold rounded-2xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2 cursor-pointer border border-border"
          style={{ fontSize: 14 }}
        >
          <RefreshCcw className="w-4 h-4" />
          Cek Status Persetujuan
        </button>

        <div className="mt-8">
          <button
            onClick={async () => {
              await logout();
              window.location.href = '/login';
            }}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar / Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
