import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wifi, ShieldCheck, Cpu, ArrowRight, Download } from "lucide-react";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";
import { SplashScreen } from "../components/layout/SplashScreen";
import logoLight from "../assets/Logo_Light_Samping.png";
import logoDark from "../assets/Logo_Dark_samping.png";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import AuthWebLayout from '../components/layout/AuthWebLayout';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, currentFarm } = useAuth();
  const [showSplash, setShowSplash] = React.useState(() => {
    return !sessionStorage.getItem('splash_shown');
  });

  useEffect(() => {
    if (user && currentFarm && !showSplash) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, currentFarm, navigate, showSplash]);

  if (showSplash) {
    return (
      <SplashScreen onComplete={() => {
        setShowSplash(false);
        sessionStorage.setItem('splash_shown', 'true');
      }} />
    );
  }

  return (
    <AuthWebLayout>
      <div className="flex-1 flex flex-col h-full px-6 pb-6 pt-16 overflow-y-auto relative">
        <div className="absolute top-12 left-6 z-10">
          <ImageWithFallback
            src={logoLight}
            alt="Verdanist"
            className="block dark:hidden h-10 object-contain object-left"
          />
          <ImageWithFallback
            src={logoDark}
            alt="Verdanist"
            className="hidden dark:block h-10 object-contain object-left"
          />
        </div>

        <div className="absolute top-12 right-6 z-10">
          <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm rounded-full" />
        </div>

        <div className="flex-1 flex flex-col justify-center min-h-[400px]">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6 w-fit mt-12">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-xs font-semibold">Smart Greenhouse IoT</span>
          </div>

          <h1
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, lineHeight: 1.2 }}
            className="text-foreground text-[42px] mb-4"
          >
            Sahabat Kebun<br />
            <span className="text-primary">Pintarmu</span>
          </h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
            Pantau suhu, kelembaban, dan otomasi pompa dari mana saja. 
            Dirancang untuk hasil panen yang lebih maksimal.
          </p>

          <div className="flex flex-col gap-3 mb-8">
            {[
              { icon: <Wifi className="w-4 h-4" />, label: "Monitoring Real-time" },
              { icon: <ShieldCheck className="w-4 h-4" />, label: "Token Keamanan" },
              { icon: <Cpu className="w-4 h-4" />, label: "Terhubung ESP32" },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-3 text-foreground/80">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  {feature.icon}
                </div>
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mt-auto shrink-0 pb-6 pt-4">
          <button
            onClick={() => navigate('/farms')}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-[var(--shadow-custom)]"
            style={{ fontWeight: 600, fontSize: 16 }}
          >
            Mulai Sekarang
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/demo')}
            className="w-full bg-card border border-border text-foreground rounded-2xl py-4 flex items-center justify-center shadow-sm hover:bg-secondary active:scale-[0.98] transition-all"
            style={{ fontWeight: 600, fontSize: 16 }}
          >
            Lihat Demo
          </button>

          {/* Tombol download APK — hanya tampil di mobile, di desktop sudah ada di panel kanan */}
          <div className="md:hidden pt-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted-foreground/60 text-xs">Punya Android?</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <a
              href="#download-apk"
              className="w-full border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 active:scale-[0.98] transition-all rounded-2xl py-3.5 flex items-center justify-center gap-2.5"
              style={{ fontWeight: 600, fontSize: 15 }}
            >
              <Download className="w-5 h-5" />
              Download Aplikasi Android
            </a>
            <p className="text-center text-xs text-muted-foreground/50 mt-2">Gratis · APK langsung · Android 8.0+</p>
          </div>
        </div>
      </div>
    </AuthWebLayout>
  );
}
