import React, { useState, useEffect } from 'react';
import AuthWebLayout from '../components/layout/AuthWebLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import logoLight from "../assets/Logo_Light_Samping.png";
import logoDark from "../assets/Logo_Dark_samping.png";
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function Login({ initialTab = "login" }: { initialTab?: "login" | "register" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentFarm, user } = useAuth();

  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [showPass, setShowPass] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'email' | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (!currentFarm) {
      navigate('/farms');
    } else if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentFarm, user, navigate]);

  const handleOAuthLogin = async (provider: 'google') => {
    setLoadingProvider(provider);
    try {
      await login(provider);
    } catch (error) {
      console.error(error);
      setLoadingProvider(null);
    }
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.email || !form.password) return;

    // For admin shortcut based on Figma logic
    if (form.email === "admin@verdanist.id" && form.password === "admin") {
      // If we have a special handling, but we just use Supabase auth anyway
    }

    setLoadingProvider('email');
    try {
      if (tab === 'register') {
        await login('email', form.email, form.password, true, form.name);
        alert('Registrasi berhasil. Silakan cek email Anda atau login.');
        setTab('login');
        setLoadingProvider(null);
      } else {
        await login('email', form.email, form.password);
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Authentication failed. Please check your credentials.');
      setLoadingProvider(null);
    }
  };

  return (
    <AuthWebLayout>
      <div className="flex-1 flex flex-col h-full px-6 overflow-y-auto relative">
        {/* Logo absolut kiri atas */}
        <div className="absolute top-6 left-6 md:top-12 md:left-6 z-10">
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
        <div className="absolute top-6 right-6 md:top-12 md:right-6 z-10">
          <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm rounded-full" />
        </div>

        <div className="pt-20 md:pt-28 pb-6 shrink-0">
          <div className="mb-6">
            <button onClick={() => navigate('/')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-1 flex mb-8 shadow-sm">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 rounded-xl transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                style={{ fontWeight: 600, fontSize: 14 }}
              >
                {t === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600 }} className="text-foreground mb-1">
            {tab === "login" ? "Selamat datang!" : "Buat akun baru"}
          </h2>
          <p style={{ fontSize: 14 }} className="text-muted-foreground mb-6">
            {tab === "login" ? "Masuk untuk pantau kebunmu." : "Daftar dan mulai monitoring kebunmu."}
          </p>
        </div>

        <div className="flex-1 space-y-4">
          {tab === "register" && (
            <div>
              <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Nama Lengkap</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ahmad Rizkiawan"
                className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm"
                style={{ fontSize: 15 }}
              />
            </div>
          )}

          <div>
            <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="kamu@email.com"
              type="email"
              className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm"
              style={{ fontSize: 15 }}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-muted-foreground" style={{ fontSize: 13 }}>Password</label>
            </div>
            <div className="relative">
              <input
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minimal 8 karakter"
                type={showPass ? "text" : "password"}
                className="w-full bg-card border border-border rounded-xl px-4 py-4 pr-12 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm"
                style={{ fontSize: 15 }}
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {tab === "login" && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-primary hover:text-primary/80 transition-colors text-sm font-semibold"
                >
                  Lupa Password?
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pb-10 pt-6 space-y-3 shrink-0 mt-auto">
          <button
            onClick={() => handleEmailAuth()}
            disabled={loadingProvider !== null}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center"
            style={{ fontWeight: 600, fontSize: 16 }}
          >
            {loadingProvider === 'email' ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              tab === "login" ? "Masuk" : "Daftar Sekarang"
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground/60" style={{ fontSize: 12 }}>atau</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={loadingProvider !== null}
            className="w-full bg-card border border-border text-foreground rounded-2xl py-4 flex items-center justify-center gap-3 shadow-sm hover:bg-secondary active:scale-[0.98] transition-all disabled:opacity-70"
            style={{ fontWeight: 500, fontSize: 15 }}
          >
            {loadingProvider === 'google' ? (
              <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin"></div>
            ) : (
              <>
                <GoogleIcon />
                Lanjut dengan Google
              </>
            )}
          </button>
        </div>
      </div>
    </AuthWebLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path d="M18.17 10.23c0-.68-.06-1.34-.17-1.97H10v3.73h4.58c-.2 1.04-.79 1.92-1.68 2.51v2.09h2.72c1.59-1.46 2.51-3.62 2.51-6.36z" fill="#4285F4" />
      <path d="M10 18.5c2.3 0 4.22-.76 5.63-2.07l-2.72-2.09c-.76.51-1.72.81-2.91.81-2.24 0-4.13-1.51-4.81-3.55H2.38v2.16C3.78 16.56 6.71 18.5 10 18.5z" fill="#34A853" />
      <path d="M5.19 11.6c-.17-.51-.27-1.06-.27-1.6s.1-1.09.27-1.6V6.24H2.38C1.86 7.27 1.5 8.61 1.5 10s.36 2.73.88 3.76l2.81-2.16z" fill="#FBBC04" />
      <path d="M10 5.85c1.26 0 2.39.43 3.28 1.28l2.46-2.46C14.22 3.3 12.3 2.5 10 2.5 6.71 2.5 3.78 4.44 2.38 7.24l2.81 2.16C5.87 7.36 7.76 5.85 10 5.85z" fill="#EA4335" />
    </svg>
  );
}
