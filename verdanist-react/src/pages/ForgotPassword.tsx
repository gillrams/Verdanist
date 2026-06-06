import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import logoLight from "../assets/Logo_Light_Samping.png";
import logoDark from "../assets/Logo_Dark_samping.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Silakan masukkan alamat email Anda.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengirim email reset password. Pastikan email terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-background px-6 items-center justify-center relative">
        <div className="absolute top-12 right-6 z-10">
          <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm rounded-full" />
        </div>
        
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        
        <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground text-center mb-3">
          Email Terkirim!
        </h2>
        
        <p className="text-muted-foreground text-center mb-8 max-w-sm text-sm leading-relaxed">
          Kami telah mengirimkan tautan untuk mereset kata sandi ke <span className="text-foreground font-semibold">{email}</span>. Silakan periksa kotak masuk (atau folder spam) Anda.
        </p>
        
        <button
          onClick={() => navigate('/login')}
          className="w-full max-w-xs bg-primary text-primary-foreground rounded-2xl py-4 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          Kembali ke Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background px-6 relative">
      {/* Logo absolut kiri atas */}
      <div className="absolute top-12 left-6 z-10">
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

      {/* ThemeToggle absolut kanan atas */}
      <div className="absolute top-12 right-6 z-10">
        <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm rounded-full" />
      </div>

      <div className="pt-28 pb-6 shrink-0">
        <div className="mb-6">
          <button onClick={() => navigate('/login')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
          <Mail className="w-3.5 h-3.5" />
          Pemulihan Akun
        </div>

        <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600 }} className="text-foreground mb-2">
          Lupa Password?
        </h2>
        <p style={{ fontSize: 14 }} className="text-muted-foreground mb-6 leading-relaxed max-w-sm">
          Jangan khawatir! Masukkan alamat email yang terdaftar, dan kami akan mengirimkan instruksi untuk mereset kata sandi Anda.
        </p>
      </div>

      <div className="flex-1 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Alamat Email (Gmail)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: nama@gmail.com"
              className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm transition-all"
              style={{ fontSize: 15 }}
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-xs text-destructive text-center">{error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center shadow-sm"
              style={{ fontWeight: 600, fontSize: 16 }}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Kirim Link Reset"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
