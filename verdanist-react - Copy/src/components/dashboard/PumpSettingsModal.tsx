import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PumpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

export default function PumpSettingsModal({ isOpen, onClose, deviceId }: PumpSettingsModalProps) {
  // Local state for settings (In real app, fetch from database)
  const [timeout, setTimeoutVal] = useState('1');
  const [flowRate, setFlowRate] = useState('100');
  const [ssid, setSsid] = useState('Verdanist_Grow');
  const [password, setPassword] = useState('********');
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call or Supabase update
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    onClose();
    alert('Pengaturan berhasil disimpan!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-0 pointer-events-none">
          
          {/* Modal Content - Floating Glass Bubble */}
          <motion.div 
            className="bg-white/85 dark:bg-[#0A2F1F]/85 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-md p-6 lg:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/60 dark:border-white/10 z-10 overflow-hidden relative pointer-events-auto"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-rounded text-green-500">settings</span>
                Pump Settings
              </h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-rounded text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              
              {/* Section 1: Safety */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-rounded text-red-500 text-lg">verified_user</span>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 dark:text-white/70">Safety & Limit</h4>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40 block mb-1">Max Timeout (Menit)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="10"
                    value={timeout}
                    onChange={(e) => setTimeoutVal(e.target.value)}
                    className="w-full bg-white dark:bg-[#05150E] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                  />
                  <p className="text-[9px] text-gray-400 dark:text-white/30 mt-1">*Pompa otomatis mati jika menyentuh batas ini.</p>
                </div>
              </div>

              {/* Section 2: Calibration */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-rounded text-blue-500 text-lg">colorize</span>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 dark:text-white/70">Kalibrasi Debit</h4>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40 block mb-1">Debit Air (ml / detik)</label>
                  <input 
                    type="number" 
                    value={flowRate}
                    onChange={(e) => setFlowRate(e.target.value)}
                    className="w-full bg-white dark:bg-[#05150E] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* Section 3: WiFi */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-rounded text-amber-500 text-lg">wifi</span>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 dark:text-white/70">Konfigurasi WiFi Alat</h4>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40 block mb-1">SSID (Nama WiFi)</label>
                    <input 
                      type="text" 
                      value={ssid}
                      onChange={(e) => setSsid(e.target.value)}
                      className="w-full bg-white dark:bg-[#05150E] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-white/40 block mb-1">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white dark:bg-[#05150E] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white font-extrabold text-xs py-3 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xs py-3 rounded-xl transition-colors shadow-md shadow-green-500/20"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
