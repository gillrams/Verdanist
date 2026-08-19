import React from 'react';
import { motion } from 'framer-motion';

const routines = [
  { id: 'routine-mist', label: 'Morning Misting', time: '06:00 AM - 06:15 AM', active: true },
  { id: 'routine-vent', label: 'Auto-Ventilation', time: 'When Temp > 30°C', active: true },
];

export default function SmartRoutinesWidget({ onToggle }: { onToggle: (id: string) => void }) {
  return (
    <div className="mt-6 lg:mt-8">
      <h2 className="text-gray-400 dark:text-gray-500 text-xs lg:text-sm font-bold uppercase tracking-widest mb-3 lg:mb-4 px-1">Smart Routines</h2>
      <div className="flex flex-col gap-3">
        {routines.map((routine, i) => (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            onClick={() => onToggle(routine.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-2xl p-4 bg-white/50 dark:bg-[#0A2F1F]/40 backdrop-blur-md flex items-center justify-between border border-white/60 dark:border-white/10 shadow-sm cursor-pointer hover:bg-white/80 dark:hover:bg-[#0A2F1F]/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 border border-purple-500/10">
                <span className="material-symbols-rounded text-[20px]">schedule</span>
              </div>
              <div>
                <p className="text-[#0A2F1F] dark:text-white/90 font-bold text-sm">{routine.label}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1 mt-0.5 font-medium">
                  <span className="material-symbols-rounded text-[12px]">bolt</span> {routine.time}
                </p>
              </div>
            </div>
            {/* Toggle */}
            <button className="relative w-12 h-6 lg:w-14 lg:h-7 rounded-full bg-purple-500 dark:bg-purple-600 border border-purple-500 dark:border-purple-600 pointer-events-none shrink-0 transition-colors">
              <span className="absolute top-[1px] lg:top-0.5 left-[calc(100%-1.3rem)] lg:left-[calc(100%-1.6rem)] w-[20px] h-[20px] lg:w-6 lg:h-6 rounded-full bg-white shadow-sm transition-all" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
