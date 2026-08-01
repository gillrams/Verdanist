import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ScanMode = 'identify' | 'disease' | 'care';
type ScanStep = 'select-mode' | 'capture' | 'analyzing' | 'result';

interface PlantScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCAN_MODES = [
  {
    id: 'identify' as ScanMode,
    icon: 'search',
    title: 'Identifikasi Tanaman',
    subtitle: 'Apa nama tanaman ini?',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    prompt: `Kamu adalah ahli botani dan hortikultura profesional. Identifikasi tanaman pada gambar ini dengan detail:
1. **Nama Umum** (bahasa Indonesia) dan **Nama Latin** (ilmiah)
2. **Famili/Keluarga** tanaman
3. **Asal usul** tanaman (negara/wilayah)
4. **Ciri-ciri khas** yang membedakan tanaman ini
5. **Fakta menarik** tentang tanaman ini

Berikan informasi dengan gaya yang ramah dan mudah dipahami. Gunakan emoji yang relevan.`,
  },
  {
    id: 'disease' as ScanMode,
    icon: 'coronavirus',
    title: 'Deteksi Penyakit',
    subtitle: 'Apakah tanaman ini sakit?',
    color: 'from-rose-500 to-red-600',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
    textColor: 'text-rose-600 dark:text-rose-400',
    prompt: `Kamu adalah ahli fitopatologi (penyakit tanaman) profesional. Analisis gambar tanaman ini untuk mendeteksi penyakit atau masalah:
1. **Status Kesehatan**: Sehat / Tanda Awal Masalah / Terinfeksi / Kritis
2. **Diagnosis**: Jika ada masalah, sebutkan nama penyakit/hama yang terdeteksi
3. **Gejala**: Jelaskan gejala yang terlihat pada gambar
4. **Penyebab**: Apa yang mungkin menyebabkan masalah ini (jamur, bakteri, virus, hama, nutrisi, dll)
5. **Solusi**: Langkah-langkah penanganan yang harus dilakukan
6. **Pencegahan**: Tips agar masalah tidak terulang

Jika tanaman terlihat sehat, tetap berikan apresiasi dan tips menjaga kesehatannya. Gunakan emoji yang relevan.`,
  },
  {
    id: 'care' as ScanMode,
    icon: 'spa',
    title: 'Cek Perawatan',
    subtitle: 'Apa yang perlu dilakukan?',
    color: 'from-sky-500 to-blue-600',
    bgColor: 'bg-sky-500/10 border-sky-500/20',
    textColor: 'text-sky-600 dark:text-sky-400',
    prompt: `Kamu adalah ahli perawatan tanaman profesional. Berdasarkan gambar tanaman ini, berikan panduan perawatan lengkap:
1. **Penyiraman**: Seberapa sering dan berapa banyak air yang dibutuhkan
2. **Pencahayaan**: Kebutuhan sinar matahari (langsung/tidak langsung/teduh)
3. **Suhu & Kelembaban**: Rentang suhu dan kelembaban ideal
4. **Pemupukan**: Jenis pupuk dan jadwal pemupukan yang tepat
5. **Media Tanam**: Jenis tanah atau media tanam yang cocok
6. **Pemangkasan**: Kapan dan bagaimana pemangkasan dilakukan
7. **Masalah Umum**: Hal-hal yang perlu diwaspadai

Berikan tips praktis yang mudah diikuti oleh pemula. Gunakan emoji yang relevan.`,
  },
];

// Simple markdown-to-HTML for AI result display
function SimpleMarkdown({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc pl-4 space-y-1">$1</ul>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="text-[13px] leading-relaxed text-foreground/90 prose-strong:text-foreground prose-strong:font-bold"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function PlantScannerModal({ isOpen, onClose }: PlantScannerModalProps) {
  const [step, setStep] = useState<ScanStep>('select-mode');
  const [selectedMode, setSelectedMode] = useState<ScanMode | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('select-mode');
    setSelectedMode(null);
    setCapturedImage(null);
    setResult('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300);
  };

  const handleModeSelect = (mode: ScanMode) => {
    setSelectedMode(mode);
    setStep('capture');
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Full = event.target?.result as string;
      const base64Data = base64Full.split(',')[1];
      setCapturedImage(base64Full);
      analyzeImage(base64Data, file.type);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const analyzeImage = async (base64Data: string, mimeType: string) => {
    setStep('analyzing');

    // Menggunakan API Key Groq dari environment variable
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const modeConfig = SCAN_MODES.find(m => m.id === selectedMode);

    if (!apiKey) {
      setResult('API Key Groq tidak ditemukan. Pastikan VITE_GROQ_API_KEY sudah diatur di Vercel atau .env.');
      setStep('result');
      return;
    }

    if (!modeConfig) {
      setResult('Gagal memuat konfigurasi mode.');
      setStep('result');
      return;
    }

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.6-27b',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: modeConfig.prompt },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
                ]
              }
            ],
            temperature: 0.7,
            max_tokens: 1024,
          })
        }
      );

      const data = await response.json();

      if (data.choices?.[0]?.message?.content) {
        setResult(data.choices[0].message.content);
      } else if (data.error) {
        if (data.error.code === 429 || data.error.message?.toLowerCase().includes('quota') || data.error.message?.toLowerCase().includes('limit')) {
          setResult('Ups! AI sedang kelelahan karena terlalu banyak request (Batas Kuota Tercapai). Silakan tunggu sekitar 1 menit dan coba lagi ya! ⏳');
        } else {
          setResult(`Waduh, ada kendala dari AI: ${data.error.message}`);
        }
      } else {
        setResult('Hmm, AI tidak bisa menganalisis gambar ini. Coba foto dari sudut yang lebih jelas ya!');
      }
    } catch {
      setResult('Gagal terhubung ke server AI. Periksa koneksi internet kamu ya!');
    }

    setStep('result');
  };

  const currentMode = SCAN_MODES.find(m => m.id === selectedMode);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative bg-gradient-to-b from-white/95 to-white/90 dark:from-[#071a12]/95 dark:to-[#040f0a]/95 backdrop-blur-3xl rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.5)] border border-border/50 z-10 max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                {step !== 'select-mode' && (
                  <button
                    onClick={() => {
                      if (step === 'capture') { setStep('select-mode'); setSelectedMode(null); }
                      else if (step === 'result') { setStep('capture'); setCapturedImage(null); setResult(''); }
                    }}
                    className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-rounded text-lg text-foreground/70">arrow_back</span>
                  </button>
                )}
                <div>
                  <h2 className="text-foreground font-bold text-[17px] leading-tight flex items-center gap-2">
                    <span className="material-symbols-rounded text-emerald-500 text-xl">eco</span>
                    {step === 'select-mode' ? 'Plant Scanner' : currentMode?.title}
                  </h2>
                  <p className="text-muted-foreground text-[11px] font-medium mt-0.5">
                    {step === 'select-mode' && 'Pilih mode scanning'}
                    {step === 'capture' && 'Ambil foto atau pilih dari galeri'}
                    {step === 'analyzing' && 'AI sedang menganalisis...'}
                    {step === 'result' && 'Hasil analisis'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-rounded text-lg text-foreground/70">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-none">
              <AnimatePresence mode="wait">

                {/* Step 1: Mode Selection */}
                {step === 'select-mode' && (
                  <motion.div
                    key="select-mode"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-3 pt-2"
                  >
                    {SCAN_MODES.map((mode, i) => (
                      <motion.button
                        key={mode.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                        onClick={() => handleModeSelect(mode.id)}
                        className="relative w-full overflow-hidden p-4 rounded-[1.25rem] bg-white dark:bg-white/5 border border-border/60 hover:border-transparent shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 cursor-pointer text-left group active:scale-[0.98]"
                      >
                        {/* Decorative gradient background that fades in on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-[0.08] transition-opacity duration-300`} />
                        
                        {/* Decorative blur circle on the right */}
                        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${mode.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />

                        <div className="relative z-10 flex items-center gap-4">
                          {/* Icon Container */}
                          <div className="relative shrink-0">
                            <div className={`w-[3.25rem] h-[3.25rem] rounded-[1rem] bg-gradient-to-br ${mode.color} flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-black/30 group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 z-10 relative`}>
                              <span className="material-symbols-rounded text-white text-[26px] drop-shadow-sm">{mode.icon}</span>
                            </div>
                            {/* Pulsing ring behind icon on hover */}
                            <div className={`absolute inset-0 rounded-[1rem] bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-30 scale-100 group-hover:scale-110 transition-all duration-300`} />
                          </div>

                          {/* Text content */}
                          <div className="flex-1 min-w-0 py-1">
                            <h3 className={`font-bold text-[15px] ${mode.textColor} group-hover:text-foreground transition-colors duration-300 tracking-tight`}>
                              {mode.title}
                            </h3>
                            <p className="text-muted-foreground/80 dark:text-white/50 text-[12px] font-medium mt-0.5 leading-snug">
                              {mode.subtitle}
                            </p>
                          </div>

                          {/* Arrow */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-secondary/80 group-hover:bg-gradient-to-br ${mode.color} transition-colors duration-300 shrink-0 shadow-sm border border-border/50 group-hover:border-transparent`}>
                            <span className="material-symbols-rounded text-muted-foreground group-hover:text-white transition-colors text-[18px]">arrow_forward</span>
                          </div>
                        </div>
                      </motion.button>
                    ))}

                    {/* Powered by badge */}
                    <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
                      <span className="material-symbols-rounded text-amber-500 text-[14px]">auto_awesome</span>
                      <span className="text-muted-foreground/50 text-[10px] font-semibold tracking-wide">Powered by Gemini AI</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Capture */}
                {step === 'capture' && (
                  <motion.div
                    key="capture"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="pt-2"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageCapture}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      ref={cameraInputRef}
                      onChange={handleImageCapture}
                    />

                    {/* Camera Area */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/20 to-teal-900/30 dark:from-emerald-900/40 dark:to-teal-900/50 border border-emerald-500/20 aspect-[4/3] flex flex-col items-center justify-center gap-4">
                      {/* Decorative corners */}
                      <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-emerald-400/50 rounded-tl-lg" />
                      <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-emerald-400/50 rounded-tr-lg" />
                      <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-emerald-400/50 rounded-bl-lg" />
                      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-emerald-400/50 rounded-br-lg" />

                      {/* Center icon */}
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${currentMode?.color} flex items-center justify-center shadow-xl`}>
                        <span className="material-symbols-rounded text-white text-3xl">photo_camera</span>
                      </div>
                      <div className="text-center px-6">
                        <p className="text-foreground/80 font-semibold text-[13px]">Arahkan kamera ke tanaman</p>
                        <p className="text-muted-foreground text-[11px] mt-1">Pastikan foto jelas dan pencahayaan cukup</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className={`flex-1 py-3.5 rounded-xl bg-gradient-to-br ${currentMode?.color} text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.97] transition-all cursor-pointer`}
                      >
                        <span className="material-symbols-rounded text-lg">photo_camera</span>
                        Ambil Foto
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-3.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/50 text-foreground font-bold text-[13px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <span className="material-symbols-rounded text-lg">image</span>
                        Dari Galeri
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Analyzing */}
                {step === 'analyzing' && (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-12 gap-5"
                  >
                    {/* Captured image preview */}
                    {capturedImage && (
                      <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-lg">
                        <img src={capturedImage} alt="Scanning" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Scanning animation */}
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${currentMode?.color} flex items-center justify-center shadow-lg`}>
                        <span className="material-symbols-rounded text-white text-2xl animate-pulse">{currentMode?.icon}</span>
                      </div>
                      <div className={`absolute -inset-2 rounded-full border-2 border-emerald-400/40 animate-ping`} style={{ animationDuration: '1.5s' }} />
                      <div className={`absolute -inset-4 rounded-full border border-emerald-400/20 animate-ping`} style={{ animationDuration: '2s' }} />
                    </div>

                    <div className="text-center">
                      <p className="text-foreground font-bold text-[15px]">Sedang Menganalisis...</p>
                      <p className="text-muted-foreground text-[11px] mt-1">AI sedang mempelajari gambar tanaman kamu</p>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${currentMode?.color}`}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Result */}
                {step === 'result' && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="pt-2 space-y-4"
                  >
                    {/* Image + Mode badge */}
                    <div className="relative">
                      {capturedImage && (
                        <div className="w-full rounded-2xl overflow-hidden border border-border/50 shadow-md max-h-48">
                          <img src={capturedImage} alt="Scanned plant" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {currentMode && (
                        <div className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${currentMode.color} shadow-lg`}>
                          <span className="material-symbols-rounded text-white text-[13px]">{currentMode.icon}</span>
                          <span className="text-white text-[10px] font-bold">{currentMode.title}</span>
                        </div>
                      )}
                    </div>

                    {/* AI Result Card */}
                    <div className="bg-white/60 dark:bg-white/5 border border-border/50 rounded-2xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-rounded text-amber-500 text-[16px]">auto_awesome</span>
                        <span className="text-foreground font-bold text-[13px]">Hasil Analisis AI</span>
                      </div>
                      <SimpleMarkdown text={result} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pb-2">
                      <button
                        onClick={() => {
                          setCapturedImage(null);
                          setResult('');
                          setStep('capture');
                        }}
                        className={`flex-1 py-3 rounded-xl bg-gradient-to-br ${currentMode?.color} text-white font-bold text-[13px] flex items-center justify-center gap-2 shadow-lg active:scale-[0.97] transition-all cursor-pointer`}
                      >
                        <span className="material-symbols-rounded text-lg">replay</span>
                        Scan Lagi
                      </button>
                      <button
                        onClick={resetState}
                        className="flex-1 py-3 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/50 text-foreground font-bold text-[13px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
                      >
                        <span className="material-symbols-rounded text-lg">swap_horiz</span>
                        Ganti Mode
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
