import { motion } from 'framer-motion';

interface PlantScannerButtonProps {
  onClick: () => void;
}

export default function PlantScannerButton({ onClick }: PlantScannerButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-green-600/15 hover:from-emerald-500/25 hover:via-teal-500/20 hover:to-green-600/25 border border-emerald-500/25 hover:border-emerald-500/40 rounded-3xl p-5 flex items-center gap-4 transition-all duration-300 shadow-[var(--shadow-custom)] hover:shadow-lg group cursor-pointer text-left"
    >
      {/* Camera Icon */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
          <span className="material-symbols-rounded text-white text-2xl">photo_camera</span>
        </div>
        {/* Scanning pulse effect */}
        <div className="absolute -inset-1 rounded-2xl bg-emerald-400/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity" style={{ animationDuration: '2s' }} />
        {/* AI badge */}
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-white dark:border-[#0a1f14] shadow-sm">
          <span className="material-symbols-rounded text-white text-[11px]">auto_awesome</span>
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h3 className="text-foreground font-bold text-[15px] leading-tight mb-1">
          Scan Tanaman
        </h3>
        <p className="text-muted-foreground text-[11px] font-medium leading-snug">
          Deteksi jenis, penyakit & kebutuhan perawatan dengan AI
        </p>
      </div>

      {/* Arrow */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center transition-all group-hover:translate-x-0.5">
        <span className="material-symbols-rounded text-emerald-600 dark:text-emerald-400 text-lg">arrow_forward</span>
      </div>
    </motion.button>
  );
}
