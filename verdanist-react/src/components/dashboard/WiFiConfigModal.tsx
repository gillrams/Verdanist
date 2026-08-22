import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, X, RefreshCw, Lock, Unlock, CheckCircle2, AlertCircle, Eye, EyeOff, QrCode, Info, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

interface WiFiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

interface WiFiNetwork {
  ssid: string;
  rssi: number;
  secure: boolean;
}

type ConnectPhase = 'idle' | 'connecting' | 'success' | 'error';

const CONNECT_TIMEOUT = 45; // detik

export default function WiFiConfigModal({ isOpen, onClose, deviceId }: WiFiConfigModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null);
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [connectPhase, setConnectPhase] = useState<ConnectPhase>('idle');
  const [countdown, setCountdown] = useState(CONNECT_TIMEOUT);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [status, setStatus] = useState<{ ssid: string; signal: number; state: string } | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [showQrScanner, setShowQrScanner] = useState(false);

  const stopTimers = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  }, []);

  // Parse QR Code WiFi Format
  const handleQrScan = (result: any) => {
    if (result && result.length > 0) {
      const qrData = result[0].rawValue;
      if (qrData.startsWith('WIFI:')) {
        const ssidMatch = qrData.match(/S:([^;]+)/);
        const passMatch = qrData.match(/P:([^;]+)/);
        
        if (ssidMatch && ssidMatch[1]) {
          const ssid = ssidMatch[1];
          const pass = passMatch ? passMatch[1] : '';
          
          setSelectedNetwork({ ssid, rssi: -50, secure: pass.length > 0 });
          setPassword(pass);
          setShowQrScanner(false);
          setMessage({ text: `Berhasil memindai QR. Siap terhubung ke "${ssid}".`, type: 'success' });
        }
      } else {
        setMessage({ text: 'QR Code tidak valid. Harap scan QR Code WiFi.', type: 'error' });
      }
    }
  };

  // Fetch current WiFi status
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset state
    setShowQrScanner(false);
    setMessage(null);
    setSelectedNetwork(null);
    setPassword('');
    setShowPassword(false);
    setConnectPhase('idle');
    setCountdown(CONNECT_TIMEOUT);
    stopTimers();
    
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('device_settings')
        .select('wifi_ssid, wifi_signal, wifi_status')
        .eq('device_id', deviceId)
        .single();
        
      if (data) {
        setStatus({
          ssid: data.wifi_ssid || 'Tidak diketahui',
          signal: data.wifi_signal || 0,
          state: data.wifi_status || 'disconnected'
        });
      }
    };
    
    fetchStatus();
    
    // Subscribe to realtime updates for scan results
    const channel = supabase.channel(`wifi_updates_${deviceId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'device_settings', filter: `device_id=eq.${deviceId}` }, (payload) => {
        // Handle scan results
        if (payload.new.wifi_scan_results && isScanning) {
          setNetworks(payload.new.wifi_scan_results);
          setIsScanning(false);
          setMessage({ text: 'Berhasil menemukan jaringan WiFi.', type: 'success' });
          supabase.from('device_settings').update({ wifi_scan_results: null }).eq('device_id', deviceId);
        }
        
        // Handle status update
        if (payload.new.wifi_status !== undefined) {
          const newState = payload.new.wifi_status;
          const newSsid = payload.new.wifi_ssid;

          setStatus({
            ssid: newSsid || 'Tidak diketahui',
            signal: payload.new.wifi_signal || 0,
            state: newState || 'disconnected'
          });

          setConnectPhase(prev => {
            if (prev === 'connecting') {
              if (newState === 'error') {
                stopTimers();
                supabase.from('device_settings').update({ wifi_status: 'connected' }).eq('device_id', deviceId);
                return 'error';
              } else if (newState === 'connected' && newSsid === selectedNetwork?.ssid) {
                stopTimers();
                return 'success';
              }
            }
            return prev;
          });
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      stopTimers();
    };
  }, [isOpen, deviceId, isScanning, stopTimers]);

  const handleScan = async () => {
    setIsScanning(true);
    setNetworks([]);
    setMessage({ text: 'Sedang memindai jaringan WiFi terdekat. Tunggu sekitar 5-10 detik...', type: 'info' });
    setSelectedNetwork(null);
    setPassword('');
    
    await supabase.from('device_settings').update({ wifi_command: 'scan' }).eq('device_id', deviceId);
    
    setTimeout(() => {
      setIsScanning((prev) => {
        if (prev) {
          setMessage({ text: 'Waktu pemindaian habis. ESP32 mungkin sedang sibuk atau offline.', type: 'error' });
          return false;
        }
        return prev;
      });
    }, 15000);
  };

  const handleConnect = async () => {
    if (!selectedNetwork) return;
    if (selectedNetwork.secure && !password) {
      setMessage({ text: 'Masukkan password WiFi.', type: 'error' });
      return;
    }

    setConnectPhase('connecting');
    setCountdown(CONNECT_TIMEOUT);
    setMessage(null);
    
    // Mulai countdown
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          stopTimers();
          setConnectPhase('error');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    await supabase.from('device_settings').update({
      wifi_new_ssid: selectedNetwork.ssid,
      wifi_new_password: password,
      wifi_command: 'connect',
      wifi_status: 'connecting'
    }).eq('device_id', deviceId);
  };

  const handleRetry = () => {
    setConnectPhase('idle');
    setCountdown(CONNECT_TIMEOUT);
    setPassword('');
    setSelectedNetwork(null);
    setMessage({ text: 'Silakan pilih jaringan lain atau periksa password Anda.', type: 'info' });
  };

  const getSignalStrength = (rssi: number) => {
    if (rssi > -50) return { label: 'Sangat Baik', color: 'text-green-500', bars: 4 };
    if (rssi > -60) return { label: 'Baik', color: 'text-green-400', bars: 3 };
    if (rssi > -70) return { label: 'Cukup', color: 'text-yellow-500', bars: 2 };
    return { label: 'Lemah', color: 'text-red-500', bars: 1 };
  };

  if (!isOpen) return null;

  // ═══════════════════════════════════════════════
  //  CONNECTING / SUCCESS / ERROR OVERLAY
  // ═══════════════════════════════════════════════
  if (connectPhase !== 'idle') {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-card w-full max-w-sm rounded-[2rem] shadow-2xl border border-border overflow-hidden"
          >
            <div className="p-8 flex flex-col items-center text-center">
              
              {/* CONNECTING PHASE */}
              {connectPhase === 'connecting' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center"
                >
                  {/* Animated Ring */}
                  <div className="relative w-28 h-28 mb-6">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-border" strokeWidth="6" />
                      <motion.circle 
                        cx="60" cy="60" r="54" fill="none" stroke="currentColor" 
                        className="text-primary" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={339.29}
                        strokeDashoffset={339.29 * (1 - countdown / CONNECT_TIMEOUT)}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-primary">{countdown}</span>
                      <span className="text-[10px] text-muted-foreground font-bold tracking-wider">DETIK</span>
                    </div>
                  </div>
                  
                  <Wifi className="w-6 h-6 text-primary animate-pulse mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-2">Menghubungkan...</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                    ESP32 sedang mencoba terhubung ke <strong className="text-foreground">"{selectedNetwork?.ssid}"</strong>. Perangkat akan restart otomatis.
                  </p>
                  
                  {/* Pulsing dots */}
                  <div className="flex gap-1.5 mt-5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SUCCESS PHASE */}
              {connectPhase === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="flex flex-col items-center"
                >
                  {/* Animated Checkmark */}
                  <div className="relative w-28 h-28 mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      className="w-28 h-28 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
                        className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center"
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, delay: 0.6 }}
                        >
                          <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    
                    {/* Sparkle particles */}
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-green-400"
                        style={{ top: '50%', left: '50%' }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{ 
                          x: Math.cos(i * 60 * Math.PI / 180) * 60, 
                          y: Math.sin(i * 60 * Math.PI / 180) * 60,
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0]
                        }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />
                    ))}
                  </div>
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-xl font-bold text-green-600 mb-2"
                  >
                    Berhasil Terhubung!
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-sm text-muted-foreground"
                  >
                    ESP32 kini terhubung ke <strong className="text-foreground">"{selectedNetwork?.ssid}"</strong>
                  </motion.p>
                  
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    onClick={onClose}
                    className="mt-6 bg-green-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-600 transition-all shadow-lg"
                  >
                    Selesai
                  </motion.button>
                </motion.div>
              )}

              {/* ERROR PHASE */}
              {connectPhase === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="flex flex-col items-center"
                >
                  {/* Animated X */}
                  <div className="relative w-28 h-28 mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      className="w-28 h-28 rounded-full bg-red-500/20 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                        className="w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center"
                      >
                        <motion.div
                          initial={{ scale: 0, rotate: 90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 400, delay: 0.5 }}
                        >
                          <XCircle className="w-12 h-12 text-red-500" />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                    
                    {/* Shake effect particles */}
                    <motion.div
                      className="absolute inset-0"
                      animate={{ x: [0, -4, 4, -4, 4, 0] }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                    />
                  </div>
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-xl font-bold text-red-500 mb-2"
                  >
                    Gagal Terhubung
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-sm text-muted-foreground leading-relaxed max-w-[280px]"
                  >
                    {countdown <= 0 
                      ? 'Waktu habis. ESP32 tidak merespon. Pastikan alat menyala dan coba lagi.'
                      : 'Password salah atau jaringan tidak tersedia. Silakan periksa dan coba lagi.'}
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex gap-3 mt-6 w-full"
                  >
                    <button
                      onClick={onClose}
                      className="flex-1 bg-secondary text-foreground font-bold py-3 rounded-xl hover:bg-secondary/80 transition-all border border-border"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={handleRetry}
                      className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                    >
                      Coba Lagi
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // ═══════════════════════════════════════════════
  //  MAIN MODAL (idle state)
  // ═══════════════════════════════════════════════
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-card w-full max-w-md rounded-[2rem] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-border/50 flex justify-between items-center bg-secondary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
                <Wifi className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Pengaturan WiFi</h2>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5 opacity-80">
                  {deviceId === 'ESP32_INDOOR' ? 'Indoor Controller' : 'Outdoor Controller'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
            
            {/* Info Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium mb-1">Ganti Jaringan WiFi</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pilih jaringan dari hasil scan ESP32, atau gunakan fitur <strong className="text-primary">Scan QR</strong> dari HP untuk terhubung otomatis tanpa ketik password.
                </p>
              </div>
            </div>

            {/* Current Status */}
            {status && (
              <div className="bg-secondary/40 rounded-2xl p-4 mb-6 border border-border/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl transition-all group-hover:scale-150"></div>
                
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider mb-3">KONEKSI SAAT INI</p>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.state === 'connected' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {status.state === 'connected' ? <Wifi className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground flex items-center gap-2 text-base">
                        {status.ssid}
                        {status.state === 'connected' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </p>
                      <p className={`text-xs mt-0.5 ${getSignalStrength(status.signal).color} font-medium`}>
                        Sinyal: {status.signal} dBm ({getSignalStrength(status.signal).label})
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`w-1.5 rounded-full transition-all duration-500 ${
                          bar <= getSignalStrength(status.signal).bars 
                            ? (status.state === 'connected' ? 'bg-primary' : 'bg-muted') 
                            : 'bg-border'
                        }`}
                        style={{ height: `${bar * 6 + 4}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message Alert */}
            <AnimatePresence>
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3.5 rounded-xl mb-6 flex items-start gap-3 border shadow-sm ${
                    message.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                    message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-600'
                  }`}
                >
                  {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
                   message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
                   <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />}
                  <p className="text-sm font-medium leading-relaxed">{message.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={handleScan} 
                disabled={isScanning || showQrScanner}
                className="bg-secondary hover:bg-secondary/80 border border-border rounded-xl py-3 flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-primary ${isScanning ? 'animate-spin' : ''}`} />
                <span className="text-xs font-bold text-foreground">Scan ESP32</span>
              </button>

              <button 
                onClick={() => setShowQrScanner(!showQrScanner)} 
                className={`border rounded-xl py-3 flex flex-col items-center justify-center gap-2 transition-all ${showQrScanner ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary hover:bg-secondary/80 border-border text-foreground'}`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-bold">Scan QR HP</span>
              </button>
            </div>

            {/* QR Scanner Area */}
            <AnimatePresence>
              {showQrScanner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-black rounded-2xl overflow-hidden border-2 border-primary/50 relative aspect-square shadow-xl">
                    <Scanner
                      onScan={handleQrScan}
                      onError={(e) => console.log(e)}
                      components={{
                        zoom: true,
                        finder: true
                      }}
                    />
                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                      <p className="bg-black/50 text-white text-xs py-1.5 px-3 rounded-full inline-block backdrop-blur-md border border-white/10">
                        Arahkan kamera ke QR Code WiFi
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Network List */}
            <AnimatePresence>
              {!showQrScanner && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-[10px] text-muted-foreground font-bold tracking-wider mb-3">HASIL SCAN ESP32</p>
                  
                  {networks.length > 0 ? (
                    <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden divide-y divide-border/50 mb-6">
                      {networks.map((net, i) => (
                        <div 
                          key={i}
                          onClick={() => setSelectedNetwork(net)}
                          className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all ${
                            selectedNetwork?.ssid === net.ssid ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-secondary/50 border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {net.secure ? <Lock className={`w-4 h-4 ${selectedNetwork?.ssid === net.ssid ? 'text-primary' : 'text-muted-foreground'}`} /> : <Unlock className={`w-4 h-4 ${selectedNetwork?.ssid === net.ssid ? 'text-primary' : 'text-muted-foreground'}`} />}
                            <div>
                              <p className={`text-sm font-bold ${selectedNetwork?.ssid === net.ssid ? 'text-primary' : 'text-foreground'}`}>{net.ssid}</p>
                              <p className="text-[11px] text-muted-foreground">{getSignalStrength(net.rssi).label} ({net.rssi} dBm)</p>
                            </div>
                          </div>
                          <div className="flex gap-[3px] items-end h-4">
                            {[1, 2, 3].map((bar) => (
                              <div
                                key={bar}
                                className={`w-1 rounded-sm transition-colors ${bar <= getSignalStrength(net.rssi).bars ? (selectedNetwork?.ssid === net.ssid ? 'bg-primary' : 'bg-foreground/50') : 'bg-border'}`}
                                style={{ height: `${bar * 30 + 10}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-secondary/30 rounded-2xl p-8 text-center border border-border/50 border-dashed mb-6">
                      <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center mx-auto mb-3">
                        <Wifi className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1">Belum ada data</p>
                      <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">Klik "Scan ESP32" untuk mencari jaringan atau "Scan QR" jika lewat HP.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Action Area */}
          <AnimatePresence>
            {selectedNetwork && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="border-t border-border/50 bg-secondary/30 p-5 backdrop-blur-xl"
              >
                {selectedNetwork.secure && (
                  <div className="mb-4">
                    <label className="block text-[10px] text-muted-foreground font-bold tracking-wider mb-2">
                      PASSWORD UNTUK "{selectedNetwork.ssid.toUpperCase()}"
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-card border border-border/80 rounded-xl pl-4 pr-12 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all shadow-sm"
                        placeholder="Masukkan password WiFi..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleConnect}
                  disabled={selectedNetwork.secure && !password}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(var(--primary),0.3)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.4)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Wifi className="w-5 h-5" />
                  HUBUNGKAN SEKARANG
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
