import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoLight from "../../imports/Logo_Light_Tp.png";
import logoDark from "../../imports/Logo_Dark_Tp.png";

interface AuthScreenProps {
  onLoginSuccess: (isAdmin?: boolean) => void;
  onGuestWaiting: () => void;
  onBack: () => void;
  initialTab?: "login" | "register";
}

export function AuthScreen({ onLoginSuccess, onGuestWaiting, onBack, initialTab = "login" }: AuthScreenProps) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = () => {
    if (form.email === "admin@verdanist.id") {
      onLoginSuccess(true);
    } else {
      onLoginSuccess(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-6">
      <div className="pt-14 pb-6">
        <button onClick={onBack} className="p-2 -ml-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <ImageWithFallback
            src={logoLight}
            alt="Verdanist"
            className="block dark:hidden h-7 object-contain object-left"
          />
          <ImageWithFallback
            src={logoDark}
            alt="Verdanist"
            className="hidden dark:block h-7 object-contain object-left"
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-1 flex mb-8 shadow-sm">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 rounded-xl transition-all ${
                tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
            {tab === "login" && (
              <button className="text-[var(--brand-link)] dark:text-primary" style={{ fontSize: 13 }}>Lupa password?</button>
            )}
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
        </div>

        {tab === "login" && (
          <p className="text-muted-foreground/80 text-center mt-6" style={{ fontSize: 12 }}>
            Coba: <span className="text-muted-foreground font-medium">admin@verdanist.id</span> untuk akses Admin
          </p>
        )}
      </div>

      <div className="pb-10 pt-6 space-y-3">
        <button
          onClick={tab === "login" ? handleSubmit : onGuestWaiting}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          {tab === "login" ? "Masuk" : "Daftar Sekarang"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground/60" style={{ fontSize: 12 }}>atau</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-card border border-border text-foreground rounded-2xl py-4 flex items-center justify-center gap-3 shadow-sm hover:bg-secondary active:scale-[0.98] transition-all"
          style={{ fontWeight: 500, fontSize: 15 }}
        >
          <GoogleIcon />
          Lanjut dengan Google
        </button>
      </div>
    </div>
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

interface GuestWaitingProps {
  onBack: () => void;
}

export function GuestWaitingScreen({ onBack }: GuestWaitingProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background px-6 items-center justify-center">
      <button onClick={onBack} className="absolute top-14 left-6 p-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-20 h-20 bg-chart-3/10 rounded-full flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-chart-3" />
      </div>

      <div className="flex items-center gap-2 bg-chart-3/10 border border-chart-3/20 rounded-full px-4 py-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse" />
        <span className="text-chart-3" style={{ fontSize: 13, fontWeight: 600 }}>Menunggu Verifikasi</span>
      </div>

      <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground text-center mb-3">
        Hampir selesai!
      </h2>
      <p style={{ fontSize: 14 }} className="text-muted-foreground text-center mb-8 max-w-xs leading-relaxed">
        Akunmu sedang dalam proses verifikasi oleh admin kebun. Biasanya selesai dalam{" "}
        <span className="text-foreground" style={{ fontWeight: 500 }}>1×24 jam</span>.
      </p>

      <div className="w-full bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm">
        <p className="text-muted-foreground" style={{ fontSize: 13 }}>
          Kamu akan mendapat notifikasi email setelah disetujui.
        </p>
      </div>

      <button className="w-full bg-card border border-border text-foreground rounded-2xl py-4 flex items-center justify-center gap-3 shadow-sm hover:bg-secondary active:scale-[0.98] transition-all"
        style={{ fontWeight: 500, fontSize: 15 }}>
        <MessageCircle className="w-5 h-5 text-chart-1" />
        Chat Admin via WhatsApp
      </button>
    </div>
  );
}
