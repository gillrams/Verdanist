import { useState, useEffect } from 'react';
import AuthWebLayout from '../components/layout/AuthWebLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, ChevronRight, Plus, Leaf, MapPin, Wifi, WifiOff,
  ArrowLeft, Building2,
} from "lucide-react";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import logoLight from '../assets/Logo_Light_Samping.png';
import logoDark from '../assets/Logo_Dark_samping.png';

export default function FarmSelection() {
  const [farms, setFarms] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_farms');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_farms');
      return cached && JSON.parse(cached).length > 0 ? false : true;
    } catch (e) {
      return true;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { validateFarmToken, setFarmAccess } = useAuth();

  useEffect(() => {
    async function fetchFarms() {
      try {
        if (farms.length === 0) setLoading(true);
        setError(null);

        // 1. Try fetching from public_farms view first
        const { data, error: queryError } = await supabase
          .from('public_farms')
          .select('*');

        if (queryError) {
          // 2. Fallback to farms table directly if view is missing or inaccessible
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('farms')
            .select('*');

          if (fallbackError) {
            if (farms.length === 0) {
              setError(fallbackError.message || 'Gagal memuat data kebun dari database.');
            }
          } else if (fallbackData) {
            setFarms(fallbackData);
            localStorage.setItem('cached_farms', JSON.stringify(fallbackData));
          }
        } else if (data) {
          setFarms(data);
          localStorage.setItem('cached_farms', JSON.stringify(data));
        }
      } catch (err: any) {
        if (farms.length === 0) {
          setError(err.message || 'Terjadi kesalahan saat memuat kebun.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchFarms();
  }, []);

  const filteredFarms = farms.filter(farm => {
    const name = farm.name || '';
    const location = farm.location || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      location.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelectFarm = async (farm: any) => {
    try {
      const savedTokens = JSON.parse(localStorage.getItem('verdanist_saved_tokens') || '{}');
      const savedToken = savedTokens[farm.id];
      
      if (savedToken) {
        setLoading(true);
        const isValid = await validateFarmToken(farm.id, savedToken);
        if (isValid) {
          setFarmAccess(farm);
          navigate('/login');
          return;
        } else {
          // Token is invalid, remove it
          delete savedTokens[farm.id];
          localStorage.setItem('verdanist_saved_tokens', JSON.stringify(savedTokens));
        }
      }
    } catch (e) {
      console.error("Auto-login check failed:", e);
    } finally {
      setLoading(false);
    }

    navigate('/farms/access', { state: { farm } });
  };

  return (
    <AuthWebLayout>
      <div className="flex-1 flex flex-col h-full bg-background relative overflow-y-auto">
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

      <div className="absolute top-12 right-6 z-10">
        <ThemeToggle className="w-10 h-10 bg-card border border-border shadow-sm rounded-full" />
      </div>

      <div className="px-6 pt-28 pb-6 flex justify-between items-start">
        <div>
          <button onClick={() => navigate('/')} className="p-2 -ml-2 mb-4 text-muted-foreground hover:text-foreground">
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
      </div>

      <div className="px-6 mb-4">
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kebun atau lokasi..."
            className="bg-transparent flex-1 text-foreground outline-none placeholder-muted-foreground/60"
            style={{ fontSize: 15 }}
          />
        </div>
      </div>

      <div className="flex-1 px-6 space-y-3 overflow-y-auto pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
            <p className="text-xs text-muted-foreground font-medium">Memuat data kebun...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4 bg-destructive/5 rounded-2xl border border-destructive/10">
            <p className="text-destructive font-medium text-sm mb-2">{error}</p>
            <button onClick={() => window.location.reload()} className="text-primary text-sm font-medium">Coba Lagi</button>
          </div>
        ) : filteredFarms.map((farm) => (
          <button
            key={farm.id}
            onClick={() => handleSelectFarm(farm)}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform shadow-[var(--shadow-custom)]"
          >
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-ring" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-foreground truncate" style={{ fontWeight: 600, fontSize: 15 }}>{farm.name}</span>
                {farm.status === "online" || !farm.status
                  ? <Wifi className="w-3.5 h-3.5 text-ring flex-shrink-0" />
                  : <WifiOff className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                <MapPin className="w-3 h-3" />
                <span>{farm.location}</span>
              </div>
              <div className="flex gap-3 mt-1.5">
                <span className="text-muted-foreground/80" style={{ fontSize: 12 }}>{(farm.zones && farm.zones.length) || 1} zona</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
          </button>
        ))}

        {!loading && !error && filteredFarms.length === 0 && (
          <div className="text-center py-12">
            <Leaf className="w-10 h-10 text-border mx-auto mb-3" />
            <p className="text-muted-foreground/80" style={{ fontSize: 14 }}>Kebun tidak ditemukan</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 pt-4 bg-gradient-to-t from-background via-background/90 to-transparent">
        <button
          onClick={() => navigate('/farms/apply')}
          className="w-full border border-primary/30 text-primary bg-card rounded-2xl py-4 flex items-center justify-center gap-2 shadow-sm hover:bg-secondary active:scale-[0.98] transition-transform"
          style={{ fontWeight: 600, fontSize: 15 }}
        >
          <Plus className="w-5 h-5" />
          Daftarkan Kebun Baru
        </button>
      </div>
    </div>
    </AuthWebLayout>
  );
}
