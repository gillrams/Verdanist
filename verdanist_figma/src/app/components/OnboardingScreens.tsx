import { useState } from "react";
import {
  Search, ChevronRight, Plus, Leaf, MapPin, Wifi, WifiOff,
  KeyRound, CheckCircle2, ArrowLeft, Building2,
} from "lucide-react";

interface Farm {
  id: string;
  name: string;
  location: string;
  zones: number;
  status: "online" | "offline";
  members: number;
}

const MOCK_FARMS: Farm[] = [
  { id: "1", name: "Kebun Utama Cikaret", location: "Bogor, Jawa Barat", zones: 4, status: "online", members: 3 },
  { id: "2", name: "Greenhouse Lembang B", location: "Lembang, Bandung", zones: 2, status: "online", members: 5 },
  { id: "3", name: "Ladang Tomat Ciwidey", location: "Ciwidey, Bandung", zones: 3, status: "offline", members: 2 },
  { id: "4", name: "Nursery Sentul", location: "Sentul, Bogor", zones: 6, status: "online", members: 4 },
];

interface SelectFarmProps {
  onSelect: (farm: Farm) => void;
  onRegister: () => void;
  onBack: () => void;
}

export function SelectFarmScreen({ onSelect, onRegister, onBack }: SelectFarmProps) {
  const [query, setQuery] = useState("");

  const filtered = MOCK_FARMS.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="px-6 pt-14 pb-6">
        <button onClick={onBack} className="p-2 -ml-2 mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p style={{ fontSize: 13, fontWeight: 600 }} className="text-ring mb-1">Langkah 1 dari 3</p>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, lineHeight: 1.2 }} className="text-foreground mb-2">
          Pilih Kebunmu
        </h1>
        <p style={{ fontSize: 14 }} className="text-muted-foreground">
          Bergabung dengan kebun yang sudah ada atau daftarkan yang baru.
        </p>
      </div>

      <div className="px-6 mb-4">
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama kebun atau lokasi..."
            className="bg-transparent flex-1 text-foreground outline-none placeholder-muted-foreground/60"
            style={{ fontSize: 15 }}
          />
        </div>
      </div>

      <div className="flex-1 px-6 space-y-3 overflow-y-auto pb-32">
        {filtered.map((farm) => (
          <button
            key={farm.id}
            onClick={() => onSelect(farm)}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform shadow-[var(--shadow-custom)]"
          >
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-ring" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-foreground truncate" style={{ fontWeight: 600, fontSize: 15 }}>{farm.name}</span>
                {farm.status === "online"
                  ? <Wifi className="w-3.5 h-3.5 text-ring flex-shrink-0" />
                  : <WifiOff className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                <MapPin className="w-3 h-3" />
                <span>{farm.location}</span>
              </div>
              <div className="flex gap-3 mt-1.5">
                <span className="text-muted-foreground/80" style={{ fontSize: 12 }}>{farm.zones} zona</span>
                <span className="text-muted-foreground/80" style={{ fontSize: 12 }}>{farm.members} anggota</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Leaf className="w-10 h-10 text-border mx-auto mb-3" />
            <p className="text-muted-foreground/80" style={{ fontSize: 14 }}>Kebun tidak ditemukan</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-4 bg-gradient-to-t from-background to-transparent">
        <button
          onClick={onRegister}
          className="w-full border border-primary/30 text-primary bg-card rounded-2xl py-4 flex items-center justify-center gap-2 shadow-sm"
          style={{ fontWeight: 600, fontSize: 15 }}
        >
          <Plus className="w-5 h-5" />
          Daftarkan Kebun Baru
        </button>
      </div>
    </div>
  );
}

interface EnterTokenProps {
  farmName: string;
  onContinue: () => void;
  onBack: () => void;
}

export function EnterTokenScreen({ farmName, onContinue, onBack }: EnterTokenProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (token.length < 6) { setError("Token minimal 6 karakter"); return; }
    setError("");
    onContinue();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-6">
      <div className="pt-14 pb-6">
        <button onClick={onBack} className="p-2 -ml-2 mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p style={{ fontSize: 13, fontWeight: 600 }} className="text-ring mb-1">Langkah 2 dari 3</p>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground mb-2">
          Masukkan Token
        </h1>
        <p style={{ fontSize: 14 }} className="text-muted-foreground">
          Token akses untuk bergabung ke <span className="text-foreground" style={{ fontWeight: 500 }}>{farmName}</span>
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-[var(--shadow-custom)]">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-8 h-8 text-ring" />
          </div>
          <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Token Akses Kebun</label>
          <input
            value={token}
            onChange={(e) => { setToken(e.target.value); setError(""); }}
            placeholder="Contoh: VRD-2024-ABCDEF"
            className="w-full bg-secondary border border-border rounded-xl px-4 py-4 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 tracking-wider"
            style={{ fontSize: 16 }}
          />
          {error && <p className="text-destructive mt-2" style={{ fontSize: 12 }}>{error}</p>}
          <p className="text-muted-foreground/80 mt-4 text-center" style={{ fontSize: 12 }}>
            Token didapat dari admin kebun. Tanya via WhatsApp jika belum punya.
          </p>
        </div>

        <div className="bg-secondary border border-border rounded-2xl px-4 py-3 flex items-center gap-3 mt-4 shadow-sm">
          <div className="w-8 h-8 bg-ring/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4 text-ring" />
          </div>
          <p style={{ fontSize: 12 }} className="text-muted-foreground">
            Token dienkripsi dan hanya berlaku untuk satu kebun. Jaga kerahasiaannya.
          </p>
        </div>
      </div>

      <div className="pb-10 pt-6">
        <button
          onClick={handleContinue}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          Lanjutkan
        </button>
      </div>
    </div>
  );
}

interface RegisterFarmProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function RegisterFarmScreen({ onSuccess, onBack }: RegisterFarmProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({ name: "", location: "", zones: "2" });

  const handleSubmit = () => {
    if (!form.name || !form.location) return;
    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="flex flex-col min-h-screen bg-background px-6 items-center justify-center">
        <div className="w-20 h-20 bg-ring/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-ring" />
        </div>
        <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground text-center mb-2">
          Kebun Terdaftar!
        </h2>
        <p style={{ fontSize: 14 }} className="text-muted-foreground text-center mb-8 max-w-xs">
          <span className="text-foreground" style={{ fontWeight: 500 }}>{form.name}</span> berhasil didaftarkan. Token akses sudah dikirim ke admin.
        </p>
        <button
          onClick={onSuccess}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          Masuk ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background px-6">
      <div className="pt-14 pb-6">
        <button onClick={onBack} className="p-2 -ml-2 mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p style={{ fontSize: 13, fontWeight: 600 }} className="text-ring mb-1">Daftar Kebun Baru</p>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground mb-2">
          Detail Kebunmu
        </h1>
        <p style={{ fontSize: 14 }} className="text-muted-foreground">Isi informasi dasar kebun untuk memulai monitoring.</p>
      </div>

      <div className="flex-1 space-y-4">
        {[
          { label: "Nama Kebun", key: "name", placeholder: "Contoh: Greenhouse Utama Bogor" },
          { label: "Lokasi", key: "location", placeholder: "Contoh: Ciawi, Bogor, Jawa Barat" },
        ].map((field) => (
          <div key={field.key}>
            <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>{field.label}</label>
            <input
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="w-full bg-card border border-border rounded-xl px-4 py-4 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 shadow-sm"
              style={{ fontSize: 15 }}
            />
          </div>
        ))}

        <div>
          <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Jumlah Zona</label>
          <div className="flex gap-2">
            {["1", "2", "3", "4", "6", "8"].map((n) => (
              <button
                key={n}
                onClick={() => setForm((p) => ({ ...p, zones: n }))}
                className={`flex-1 py-3 rounded-xl border ${
                  form.zones === n
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border"
                }`}
                style={{ fontWeight: 600, fontSize: 14 }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-10 pt-6">
        <button
          onClick={handleSubmit}
          disabled={!form.name || !form.location}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 disabled:opacity-40 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          Daftarkan Kebun
        </button>
      </div>
    </div>
  );
}
