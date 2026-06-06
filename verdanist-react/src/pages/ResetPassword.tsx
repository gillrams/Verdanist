import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import logoLight from "../assets/Logo_Light_Samping.png";
import logoDark from "../assets/Logo_Dark_samping.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Periksa apakah URL memiliki parameter hash dari Supabase
  const hash = location.hash;
  const isRecoveryMode = hash.includes('type=recovery') || hash.includes('access_token=');

  useEffect(() => {
    // Jika tidak ada hash token, mungkin pengguna membuka halaman ini secara manual
    if (!isRecoveryMode && !success) {
      setError('Tautan reset password tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.');
    }
  }, [isRecoveryMode, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setError('Kata sandi harus terdiri dari minimal 8 karakter.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengubah kata sandi. Tautan mungkin sudah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-background px-6 items-center justify-center relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm" />
        </div>
        
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        
        <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground text-center mb-3">
          Sandi Diperbarui!
        </h2>
        
        <p className="text-muted-foreground text-center mb-8 max-w-sm text-sm leading-relaxed">
          Kata sandi akun Anda berhasil diubah. Sekarang Anda dapat masuk menggunakan kata sandi yang baru.
        </p>
        
        <button
          onClick={() => navigate('/login')}
          className="w-full max-w-xs bg-primary text-primary-foreground rounded-2xl py-4 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          Masuk Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background px-6">
      <div className="pt-14 pb-6">
        <div className="flex justify-end items-start mb-6">
          <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm" />
        </div>

        <div className="mb-8">
          <ImageWithFallback
            src={logoLight}
            alt="Verdanist"
            className="block dark:hidden h-12 object-contain object-left"
          />
          <ImageWithFallback
            src={logoDark}
            alt="Verdanist"
            className="hidden dark:block h-12 object-contain object-left"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
          <KeyRound className="w-3.5 h-3.5" />
          Kata Sandi Baru
        </div>

        <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600 }} className="text-foreground mb-2">
          Buat Kata Sandi Baru
        </h2>
        <p style={{ fontSize: 14 }} className="text-muted-foreground mb-6 leading-relaxed max-w-sm">
          Silakan masukkan kata sandi baru Anda. Pastikan kombinasi huruf dan angka agar lebih aman.
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {!isRecoveryMode ? (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="mt-2 px-4 py-2 bg-background border border-border rounded-xl text-foreground text-sm font-semibold shadow-sm"
            >
              Minta Tautan Baru
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-card border border-border rounded-xl px-4 py-4 pr-12 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm transition-all"
                  style={{ fontSize: 15 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Konfirmasi Kata Sandi</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi"
                  className="w-full bg-card border border-border rounded-xl px-4 py-4 pr-12 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm transition-all"
                  style={{ fontSize: 15 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground"
                >
                  {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-xs text-destructive text-center">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-4 disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center shadow-sm"
                style={{ fontWeight: 600, fontSize: 16 }}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Simpan Kata Sandi"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
