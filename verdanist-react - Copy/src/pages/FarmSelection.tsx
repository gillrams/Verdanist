import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import LogoLightTp from '../assets/Logo_Light_Tp.png';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchFarms() {
      try {
        if (farms.length === 0) {
          setLoading(true);
        } else {
          setIsUpdating(true);
        }
        setError(null);

        // 1. Try fetching from public_farms view first
        const { data, error: queryError } = await supabase
          .from('public_farms')
          .select('*');

        if (queryError) {
          console.warn('public_farms view not accessible or missing, trying farms table...', queryError);

          // 2. Fallback to farms table directly if view is missing or inaccessible
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('farms')
            .select('*');

          if (fallbackError) {
            console.error('Fallback query to farms table failed:', fallbackError);
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
        console.error('Exception fetching farms:', err);
        if (farms.length === 0) {
          setError(err.message || 'Terjadi kesalahan saat memuat kebun.');
        }
      } finally {
        setLoading(false);
        setIsUpdating(false);
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

  const handleSelectFarm = (farm: any) => {
    navigate('/farms/access', { state: { farm } });
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
          animate={{ y: [0, 30, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-green-300/20 dark:bg-emerald-500/5 rounded-full blur-[100px] z-0 pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, -40, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[15%] right-[5%] w-[450px] h-[450px] bg-teal-200/25 dark:bg-teal-500/10 rounded-full blur-[120px] z-0 pointer-events-none"
        />

        {/* Premium Split glassmorphism layout card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.25 }}
          className="relative z-10 max-w-4xl w-full bg-white/75 dark:bg-gray-900/60 backdrop-blur-3xl rounded-[40px] border border-white dark:border-white/5 shadow-[0_30px_80px_rgba(10,47,31,0.06)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row"
        >
          {/* LEFT SIDE: Premium Info Panel */}
          <div className="bg-gradient-to-br from-[#0D5C3A] via-[#107A4C] to-[#15803D] text-white p-8 md:p-10 flex flex-col justify-between md:w-[40%] relative overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
            {/* Visual element orbs inside left card */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Back Button */}
              <button 
                onClick={() => navigate('/')} 
                className="mb-8 text-white/80 hover:text-white transition-colors flex items-center gap-2 bg-white/15 hover:bg-white/20 rounded-full px-4 py-2 text-xs font-bold shadow-sm backdrop-blur-md cursor-pointer"
              >
                <span className="material-symbols-rounded text-sm">arrow_back</span>
                Kembali
              </button>

              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-md mb-6 animate-pulse">
                <span className="material-symbols-rounded text-3xl">agriculture</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-4">
                IoT Command Center
              </h2>
              <p className="text-sm text-white/80 leading-relaxed font-semibold">
                Pilih atau daftarkan kebun Anda untuk mulai memantau suhu, kelembaban, serta mengotomatisasi penyiraman secara real-time.
              </p>
            </div>

            {/* Farm Counter / Live indicator */}
            <div className="relative z-10 mt-12 pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">Kebun Aktif</p>
                <p className="text-3xl font-black mt-1 flex items-baseline gap-1.5">
                  {farms.length}
                  <span className="text-xs text-emerald-200 font-bold">kebun</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/15 border border-white/10 rounded-full text-[10px] font-bold text-emerald-100 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                Live Database
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Interactive Farm Selection Panel */}
          <div className="p-8 md:p-10 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-[#0A2F1F] dark:text-white tracking-tight">
                    Pilih Kebun Anda
                  </h1>
                  <p className="text-xs text-[#0A2F1F]/60 dark:text-white/50 font-extrabold uppercase tracking-wider mt-1">
                    Select active node
                  </p>
                </div>
                {isUpdating && (
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider rounded-md animate-pulse">
                    Refreshing
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative mb-6 group">
                <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari nama kebun atau lokasi..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/80 dark:bg-white/5 text-[#0A2F1F] dark:text-white placeholder-gray-400 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold shadow-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Interactive Scrollable List */}
              <div className="space-y-3 max-h-72 overflow-y-auto mb-6 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
                    <p className="text-xs text-gray-400 dark:text-white/40 font-bold uppercase tracking-wider">Menghubungkan ke server...</p>
                  </div>
                ) : error ? (
                  <div className="p-6 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/15 rounded-2xl text-center">
                    <span className="material-symbols-rounded text-red-500 text-3xl mb-2 animate-bounce">warning</span>
                    <p className="text-xs text-red-700 dark:text-red-400 font-extrabold mb-3">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/35 text-red-700 dark:text-red-300 rounded-xl text-xs font-black transition cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : filteredFarms.length > 0 ? (
                  filteredFarms.map((farm) => (
                    <motion.button
                      whileHover={{ scale: 1.015, x: 2 }}
                      whileTap={{ scale: 0.985 }}
                      key={farm.id}
                      onClick={() => handleSelectFarm(farm)}
                      className="w-full p-4 rounded-2xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all text-left border border-gray-100 dark:border-white/5 hover:border-emerald-300 dark:hover:border-emerald-500/30 flex justify-between items-center shadow-sm cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-green-500/5 dark:from-emerald-500/20 dark:to-emerald-500/5 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/10 group-hover:scale-105 transition-transform">
                          <span className="material-symbols-rounded text-lg">house_siding</span>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-[#0A2F1F] dark:text-white text-base leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {farm.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-white/50 font-bold mt-1 flex items-center gap-1">
                            <span className="material-symbols-rounded text-xs text-emerald-500">location_on</span>
                            {farm.location}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/10 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent transition-all">
                        <span className="material-symbols-rounded text-lg">chevron_right</span>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="text-center py-10 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <span className="material-symbols-rounded text-gray-400 dark:text-white/30 text-4xl mb-2">find_in_page</span>
                    <p className="text-xs text-gray-500 dark:text-white/40 font-bold">Kebun tidak ditemukan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Panel: New Farm Registration */}
            <div className="border-t border-gray-150 dark:border-white/5 pt-5 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider">Pendaftaran</p>
                <p className="text-xs font-semibold text-gray-500 dark:text-white/60 mt-0.5">Kebun Anda belum terdaftar?</p>
              </div>
              <button
                onClick={() => navigate('/farms/apply')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 border border-emerald-500/50 cursor-pointer"
              >
                <span className="material-symbols-rounded text-sm">add_circle</span>
                Daftar Kebun
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
