import React, { useState } from 'react';
import AuthWebLayout from '../components/layout/AuthWebLayout';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import logoLight from "../assets/Logo_Light_Samping.png";
import logoDark from "../assets/Logo_Dark_samping.png";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ArrowLeft } from "lucide-react";

export default function FarmApplication() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [wa, setWa] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name || !email || !wa) return;

    const message = `Halo, saya ${name}.%0AEmail: ${email}%0ANo. WA: ${wa}%0A%0ASaya mau daftar kebun, berapa biayanya?`;
    window.open(`https://wa.me/6285817619891?text=${message}`, '_blank');
    navigate('/farms');
  };

  return (
    <AuthWebLayout>
      <div className="flex-1 flex flex-col h-full bg-background px-6 relative overflow-y-auto">
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

        <div className="pt-28 pb-6 flex flex-col flex-1">
          <div className="mb-6">
            <button onClick={() => navigate('/farms')} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600 }} className="text-ring mb-1">Pendaftaran Baru</p>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground mb-2">
            Daftar Kebun
          </h1>
          <p style={{ fontSize: 14 }} className="text-muted-foreground mb-6">
            Isi data diri kamu. Kami akan mengarahkan ke WhatsApp admin untuk proses selanjutnya.
          </p>

          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Nama Lengkap</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm"
                style={{ fontSize: 15 }}
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Alamat Email (Gmail)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: budi@gmail.com"
                className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm"
                style={{ fontSize: 15 }}
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Nomor WhatsApp</label>
              <input
                type="tel"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm"
                style={{ fontSize: 15 }}
              />
            </div>
          </div>

          <div className="pt-6 shrink-0 pb-10">
            <button
              onClick={() => handleSubmit()}
              disabled={!name || !email || !wa}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 disabled:opacity-40 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center"
              style={{ fontWeight: 600, fontSize: 16 }}
            >
              Hubungi Admin via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </AuthWebLayout>
  );
}
