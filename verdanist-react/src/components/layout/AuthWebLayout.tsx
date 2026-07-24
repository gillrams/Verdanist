import React from 'react';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import logoLight from '../../assets/Logo_Light_Samping.png';
import logoDark from '../../assets/Logo_Dark_samping.png';
import { Download, Smartphone, Leaf } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface AuthWebLayoutProps {
  children: React.ReactNode;
}

export default function AuthWebLayout({ children }: AuthWebLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* Kolom Kiri: Main Content - Menjaga tampilan asli mobile layout */}
      <div className="w-full md:w-1/2 lg:w-[480px] xl:w-[500px] flex flex-col shrink-0 relative border-r border-border/40 shadow-[var(--shadow-custom)] z-50 bg-background h-[100dvh] overflow-hidden">
        {children}
      </div>

      {/* Kolom Kanan: Banner Promosi Khusus Desktop */}
      {!Capacitor.isNativePlatform() && (
        <div className="hidden md:flex flex-1 bg-secondary/30 relative items-center justify-center p-12 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-chart-1/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative z-10 max-w-xl text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-background shadow-xl rounded-[1.25rem] flex items-center justify-center mb-8 border border-border/50">
              <ImageWithFallback
                src={logoLight}
                alt="Verdanist Icon"
                className="w-12 h-12 object-contain block dark:hidden"
              />
              <ImageWithFallback
                src={logoDark}
                alt="Verdanist Icon"
                className="w-12 h-12 object-contain hidden dark:block"
              />
            </div>

            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, lineHeight: 1.2 }} className="text-4xl text-foreground mb-5">
              Kelola Kebun dari Genggamanmu
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-lg mx-auto">
              Dapatkan pengalaman memantau suhu, kelembaban, dan mengontrol perangkat IoT ESP32 yang lebih mulus dengan aplikasi Android Verdanist.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs mb-8">
              {[
                { icon: <Smartphone className="w-4 h-4" />, text: 'Monitoring real-time dari HP' },
                { icon: <Leaf className="w-4 h-4" />, text: 'Kontrol pompa & jadwal otomatis' },
                { icon: <Download className="w-4 h-4" />, text: 'Gratis, langsung pasang di Android' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-muted-foreground text-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <a
            href="/verdanist.apk"
            download="verdanist.apk"
              className="w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-2xl px-6 py-4 flex items-center justify-center gap-3 font-semibold shadow-lg hover:-translate-y-1 active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <div className="text-left flex flex-col">
                <span className="text-[10px] uppercase tracking-wider opacity-80 leading-tight mb-0.5">Unduh Aplikasi Android</span>
                <span className="text-base leading-none">Download APK Verdanist</span>
              </div>
            </a>
            <p className="text-xs text-muted-foreground/60 mt-3">Tersedia untuk Android 8.0+</p>
          </div>
        </div>
      )}
    </div>
  );
}
