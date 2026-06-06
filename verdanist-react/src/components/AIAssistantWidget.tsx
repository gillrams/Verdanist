import { motion } from 'framer-motion';

interface Props {
  temperature?: number;
  humidity?: number;
}

export default function AIAssistantWidget({ temperature = 29, humidity = 70 }: Props) {
  let suggestion = "All systems optimal. Monitor for unexpected changes.";
  let action = "No action needed";
  let icon = "eco";
  let colorClass = "text-green-500 dark:text-green-400";
  let glowClass = "from-green-400/30 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/5";

  if (temperature > 30) {
    suggestion = `High temperature (${temperature}°C) detected. Risk of heat stress.`;
    action = "Recommend activating Mist System";
    icon = "device_thermostat";
    colorClass = "text-amber-500 dark:text-amber-400";
    glowClass = "from-amber-400/30 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/5";
  } else if (humidity < 60) {
    suggestion = `Low humidity (${humidity}%) detected. Dry conditions.`;
    action = "Recommend starting Water Pump";
    icon = "water_drop";
    colorClass = "text-blue-500 dark:text-blue-400";
    glowClass = "from-blue-400/30 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/5";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`relative w-full rounded-3xl p-[1px] bg-gradient-to-br ${glowClass} overflow-hidden shadow-md`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      <div className="w-full h-full bg-card/75 dark:bg-card/80 backdrop-blur-xl rounded-[23px] p-5 border border-border relative z-10">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shadow-sm border border-border shrink-0 ${colorClass}`}>
            <span className="material-symbols-rounded text-2xl">{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-purple-600 to-indigo-500 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">AI Crop Assistant</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[pulse_2s_infinite]"></span>
            </div>
            <p className="text-foreground text-sm font-bold mb-1 leading-snug">
              {suggestion}
            </p>
            <p className="text-muted-foreground text-xs font-semibold flex items-center gap-1">
              <span className="material-symbols-rounded text-[14px]">auto_awesome</span>
              {action}
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
}
