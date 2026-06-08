import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, KeyRound, ScanLine } from "lucide-react";
import QRScannerModal from '../components/ui/QRScannerModal';
import { supabase } from '../lib/supabase';
import AuthWebLayout from '../components/layout/AuthWebLayout';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import logoLight from "../assets/Logo_Light_Samping.png";
import logoDark from "../assets/Logo_Dark_samping.png";

export default function FarmAccess() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { validateFarmToken, setFarmAccess } = useAuth();

  const [farm, setFarm] = useState<any>(location.state?.farm || null);
  const [isInitializing, setIsInitializing] = useState(!location.state?.farm);

  useEffect(() => {
    const initMagicLink = async () => {
      const searchParams = new URLSearchParams(location.search);
      const urlFarmId = searchParams.get('farmId');
      const urlToken = searchParams.get('token');

      if (urlFarmId && urlToken) {
        setToken(urlToken);
        setLoading(true);
        
        try {
          const { data, error } = await supabase
            .from('farms')
            .select('*')
            .eq('id', urlFarmId)
            .single();
            
          if (error || !data) {
             setError("Kebun dari link tidak ditemukan.");
             setIsInitializing(false);
             setLoading(false);
             return;
          }
          
          setFarm(data);
          setIsInitializing(false);
          
          const isValid = await validateFarmToken(data.id, urlToken);
          if (isValid) {
            const savedTokens = JSON.parse(localStorage.getItem('verdanist_saved_tokens') || '{}');
            savedTokens[data.id] = urlToken;
            localStorage.setItem('verdanist_saved_tokens', JSON.stringify(savedTokens));
            
            setFarmAccess(data);
            navigate('/login');
          } else {
            setError("Token dari link tidak valid.");
            setLoading(false);
          }
        } catch (err) {
          setError("Gagal memproses link.");
          setIsInitializing(false);
          setLoading(false);
        }
      } else if (!farm) {
        navigate('/farms');
      } else {
        setIsInitializing(false);
      }
    };
    
    initMagicLink();
  }, [location.search, navigate, validateFarmToken, setFarmAccess, farm]);

  if (isInitializing || (!farm && !error)) {
    return (
      <AuthWebLayout>
        <div className="flex flex-col h-full bg-background items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-muted-foreground font-medium">Menyiapkan akses...</p>
        </div>
      </AuthWebLayout>
    );
  }

  const handleSubmit = async (e?: React.FormEvent, tokenToSubmit: string = token) => {
    if (e) e.preventDefault();
    if (tokenToSubmit.length < 6) { 
      setError("Token minimal 6 karakter"); 
      return; 
    }
    
    setLoading(true);
    setError('');
    
    try {
      const isValid = await validateFarmToken(farm.id, tokenToSubmit);
      if (isValid) {
        const savedTokens = JSON.parse(localStorage.getItem('verdanist_saved_tokens') || '{}');
        savedTokens[farm.id] = tokenToSubmit;
        localStorage.setItem('verdanist_saved_tokens', JSON.stringify(savedTokens));

        setFarmAccess(farm);
        navigate('/login');
      } else {
        setError('Token salah atau tidak valid.');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Gagal memverifikasi token.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (scannedToken: string) => {
    setIsScannerOpen(false);
    setToken(scannedToken);
    handleSubmit(undefined, scannedToken);
  };

  return (
    <AuthWebLayout>
      <div className="flex-1 flex flex-col h-full bg-background px-6 relative overflow-y-auto">
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

        <div className="pt-28 pb-6">
          <button onClick={() => navigate('/farms')} className="p-2 -ml-2 mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p style={{ fontSize: 13, fontWeight: 600 }} className="text-ring mb-1">Langkah 2 dari 3</p>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground mb-2">
            Masukkan Token
          </h1>
          <p style={{ fontSize: 14 }} className="text-muted-foreground">
            Token akses untuk bergabung ke <span className="text-foreground" style={{ fontWeight: 500 }}>{farm.name}</span>
          </p>
        </div>

      <div className="flex-1 flex flex-col justify-center">
        <form onSubmit={(e) => handleSubmit(e)} className="bg-card border border-border rounded-3xl p-6 shadow-[var(--shadow-custom)]">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-8 h-8 text-ring" />
          </div>
          <label className="block text-muted-foreground mb-2" style={{ fontSize: 13 }}>Token Akses Kebun</label>
          <div className="relative">
            <input
              type="password"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(""); }}
              placeholder="Contoh: VRD-2024-ABCDEF"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-4 pr-12 text-foreground outline-none placeholder-muted-foreground/60 focus:border-primary/50 tracking-wider"
              style={{ fontSize: 16 }}
              required
            />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors bg-background rounded-lg border border-border shadow-sm"
              title="Scan QR Code"
            >
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
          {error && <p className="text-destructive mt-2" style={{ fontSize: 12 }}>{error}</p>}
          <p className="text-muted-foreground/80 mt-4 text-center" style={{ fontSize: 12 }}>
            Token didapat dari admin kebun. Tanya via WhatsApp jika belum punya.
          </p>
        </form>

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
          onClick={() => handleSubmit()}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center"
          style={{ fontWeight: 600, fontSize: 16 }}
        >
          {loading ? (
             <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
          ) : "Lanjutkan"}
        </button>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
      </div>
    </AuthWebLayout>
  );
}
