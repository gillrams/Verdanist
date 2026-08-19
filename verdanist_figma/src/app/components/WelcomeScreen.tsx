import { Wifi, ShieldCheck, Cpu } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoLight from "../../imports/Logo_Light_Tp.png";
import logoDark from "../../imports/Logo_Dark_Tp.png";

interface WelcomeScreenProps {
  onStart: () => void;
  onLogin: () => void;
}

export function WelcomeScreen({ onStart, onLogin }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background px-6 pt-16 pb-10">
      <div className="mb-12">
        <ImageWithFallback
          src={logoLight}
          alt="Verdanist"
          className="block dark:hidden h-9 object-contain object-left"
        />
        <ImageWithFallback
          src={logoDark}
          alt="Verdanist"
          className="hidden dark:block h-9 object-contain object-left"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <GreenhouseIllustration />

        <div className="mt-10 text-center">
          <h1
            style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 36, fontWeight: 600, lineHeight: 1.2 }}
            className="text-foreground mb-3"
          >
            Sahabat Kebun<br />
            <span className="text-primary">Pintarmu</span>
          </h1>
          <p style={{ fontSize: 15 }} className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Pantau suhu, kelembaban, dan pompa kebunmu secara real-time dari mana saja.
          </p>
        </div>

        <div className="flex gap-2 mt-8 flex-wrap justify-center">
          {[
            { icon: <Wifi className="w-3 h-3" />, label: "Live Sensor" },
            { icon: <ShieldCheck className="w-3 h-3" />, label: "Token Aman" },
            { icon: <Cpu className="w-3 h-3" />, label: "ESP32 Connected" },
          ].map((chip) => (
            <div
              key={chip.label}
              className="flex items-center gap-1.5 bg-muted border border-[var(--chip-border)] rounded-full px-3 py-1.5"
            >
              <span className="text-primary">{chip.icon}</span>
              <span style={{ fontSize: 12 }} className="text-foreground/70">{chip.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 mt-8">
        <button
          onClick={onStart}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 flex items-center justify-center active:scale-95 transition-transform"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          Mulai Sekarang
        </button>
        <button
          onClick={onLogin}
          className="w-full bg-transparent text-muted-foreground rounded-2xl py-4 flex items-center justify-center"
          style={{ fontSize: 15 }}
        >
          Sudah punya akun?&nbsp;
          <span className="text-[var(--brand-link)] dark:text-primary" style={{ fontWeight: 600 }}>Masuk</span>
        </button>
      </div>

      <p style={{ fontSize: 11 }} className="text-center text-muted-foreground/80 mt-4">
        Dengan melanjutkan, kamu menyetujui{" "}
        <span className="text-muted-foreground underline">Kebijakan Privasi</span> &{" "}
        <span className="text-muted-foreground underline">Ketentuan API</span>
      </p>
    </div>
  );
}

function GreenhouseIllustration() {
  return (
    <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="165" width="220" height="8" rx="4" fill="var(--color-secondary)" />
      <rect x="50" y="80" width="160" height="90" rx="8" fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M45 80 L130 30 L215 80" stroke="var(--color-ring)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M55 80 L130 35 L205 80" fill="var(--color-ring)" fillOpacity="0.06" />
      <rect x="107" y="120" width="46" height="50" rx="6" fill="var(--color-secondary)" stroke="var(--color-border)" strokeWidth="1" />
      <circle cx="148" cy="145" r="2.5" fill="var(--color-ring)" />
      <rect x="60" y="95" width="36" height="28" rx="4" fill="var(--color-ring)" fillOpacity="0.08" stroke="var(--color-border)" strokeWidth="1" />
      <rect x="164" y="95" width="36" height="28" rx="4" fill="var(--color-ring)" fillOpacity="0.08" stroke="var(--color-border)" strokeWidth="1" />
      <rect x="75" y="108" width="6" height="12" rx="2" fill="var(--color-border)" />
      <ellipse cx="78" cy="106" rx="8" ry="6" fill="var(--color-chart-1)" />
      <ellipse cx="74" cy="104" rx="5" ry="4" fill="var(--color-chart-2)" />
      <rect x="179" y="108" width="6" height="12" rx="2" fill="var(--color-border)" />
      <ellipse cx="182" cy="106" rx="8" ry="6" fill="var(--color-chart-1)" />
      <ellipse cx="186" cy="104" rx="5" ry="4" fill="var(--color-chart-2)" />
      <rect x="118" y="42" width="24" height="16" rx="4" fill="var(--color-card)" stroke="var(--color-ring)" strokeWidth="1.5" />
      <circle cx="130" cy="50" r="3" fill="var(--color-ring)" />
      <path d="M138 46 Q143 50 138 54" stroke="var(--color-ring)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M141 43 Q148 50 141 57" stroke="var(--color-ring)" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
      <path d="M28 165 Q24 150 28 140 Q32 150 28 165" fill="var(--color-chart-1)" opacity="0.8" />
      <path d="M35 165 Q30 145 35 132 Q40 145 35 165" fill="var(--color-chart-2)" opacity="0.8" />
      <path d="M222 165 Q226 150 222 140 Q218 150 222 165" fill="var(--color-chart-1)" opacity="0.8" />
      <path d="M230 165 Q234 148 230 135 Q226 148 230 165" fill="var(--color-chart-2)" opacity="0.8" />
    </svg>
  );
}
