import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import LogoLightTp from '../assets/Logo_Light_Tp.png';

export default function FarmAccess() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { validateFarmToken, setFarmAccess } = useAuth();

  const farm = location.state?.farm;

  if (!farm) {
    navigate('/farms');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const isValid = await validateFarmToken(farm.id, token);
      if (isValid) {
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

  return (
    <>
      {/* ✅ Floating logo - Anchored directly to viewport window, completely outside main layout */}
      <div className="fixed top-0 left-0 z-[99999] p-6 pointer-events-none">
        <img
          src={LogoLightTp}
          alt="Verdanist Logo"
          className="w-40 md:w-48 h-auto object-contain block pointer-events-auto cursor-pointer active:scale-95 transition-transform"
          onClick={() => navigate('/')}
        />
      </div>

      {/* Main Page Layout Container */}
      <main className="min-h-screen w-full relative bg-[#E8F4FA] dark:bg-gray-950 flex flex-col items-center justify-center p-6 pt-32 pb-12 overflow-x-hidden transition-colors">
        
        {/* Floating Bright Decorative Orbs in background */}
        <motion.div
          animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-green-300/20 dark:bg-emerald-500/5 rounded-full blur-[85px] z-0 pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] bg-teal-200/25 dark:bg-teal-500/10 rounded-full blur-[95px] z-0 pointer-events-none"
        />

        {/* Premium Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
          className="relative z-10 max-w-md w-full bg-white/75 dark:bg-gray-900/60 backdrop-blur-3xl rounded-[36px] p-8 border border-white dark:border-white/5 shadow-[0_24px_70px_rgba(10,47,31,0.06)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
        >
          {/* Animated Visual Header */}
          <div className="flex justify-center mb-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-md animate-pulse pointer-events-none"></div>
            <div className="relative w-16 h-16 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-2xl flex items-center justify-center text-white shadow-[0_10px_25px_rgba(16,185,129,0.3)] border border-white/20">
              <span className="material-symbols-rounded text-3xl">vpn_key</span>
            </div>
          </div>
          
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#0A2F1F] dark:text-white tracking-tight mb-2 text-center">
            Akses Kebun
          </h1>
          <p className="text-xs text-gray-500 dark:text-white/40 mb-2 text-center font-bold uppercase tracking-wider">
            Greenhouse Authorization
          </p>
          
          <div className="bg-[#E8F4FA]/50 dark:bg-white/5 border border-emerald-100 dark:border-white/5 p-4 rounded-2xl mb-6 text-center shadow-sm">
            <p className="font-extrabold text-[#0A2F1F] dark:text-white text-base leading-tight">{farm.name}</p>
            <p className="text-xs text-gray-500 dark:text-white/50 font-bold mt-1.5 flex items-center justify-center gap-1">
              <span className="material-symbols-rounded text-xs text-emerald-500">location_on</span>
              {farm.location}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-white/30 mb-2 ml-1 block">Token Akses</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                  <span className="material-symbols-rounded text-xl">token</span>
                </span>
                <input
                  type="text"
                  required
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-4 text-[#0A2F1F] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold shadow-sm"
                  placeholder="Masukkan token kebun"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/15 rounded-xl text-center text-xs text-red-600 dark:text-red-400 font-extrabold">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-extrabold py-4 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex justify-center items-center h-[58px] text-base border border-emerald-400/30 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Masuk Command Center'}
            </button>
          </form>
          
          <div className="mt-6 text-center pt-4 border-t border-gray-150 dark:border-white/5">
            <button
              onClick={() => navigate('/farms')}
              className="text-xs font-extrabold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/60 transition cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </motion.div>
      </main>
    </>
  );
}
