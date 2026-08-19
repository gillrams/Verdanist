import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EnvironmentOverviewProps {
  device?: 'indoor' | 'outdoor';
  temp: number;
  humidity: number;
}

export default function EnvironmentOverview({ device = 'indoor', temp, humidity }: EnvironmentOverviewProps) {
  // Local state and simulation removed because it's lifted to Dashboard.tsx

  // --- TEMPERATURE LOGIC ---
  const getTempConfig = (t: number) => {
    if (t < 22) return {
      color: 'text-blue-500',
      shadow: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]',
      bgLabel: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-200',
      status: 'Cold'
    };
    if (t <= 30) return {
      color: 'text-green-500',
      shadow: 'drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]',
      bgLabel: 'bg-green-50 dark:bg-green-500/10 text-green-600 border-green-200',
      status: 'Optimal'
    };
    return {
      color: 'text-red-500',
      shadow: 'drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]',
      bgLabel: 'bg-red-50 dark:bg-red-500/10 text-red-600 border-red-200',
      status: 'Hot'
    };
  };

  // --- HUMIDITY LOGIC ---
  const getHumConfig = (h: number) => {
    if (h < 40) return {
      gradient: 'from-orange-300 to-yellow-300',
      waveColor: 'text-yellow-300 drop-shadow-[0_-4px_8px_rgba(253,224,71,0.5)]',
      stroke: 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]',
      text: 'text-yellow-600 dark:text-yellow-400'
    };
    if (h <= 70) return {
      gradient: 'from-blue-400 to-cyan-300',
      waveColor: 'text-cyan-300 drop-shadow-[0_-4px_8px_rgba(103,232,249,0.5)]',
      stroke: 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
      text: 'text-blue-600 dark:text-blue-400'
    };
    return {
      gradient: 'from-indigo-500 to-blue-500',
      waveColor: 'text-blue-400 drop-shadow-[0_-4px_8px_rgba(96,165,250,0.5)]',
      stroke: 'text-indigo-600 drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]',
      text: 'text-indigo-600 dark:text-indigo-400'
    };
  };

  const tempCfg = getTempConfig(temp);
  const humCfg = getHumConfig(humidity);

  // Calculate stroke offset (283 is full circle)
  // Temp max 50C -> stroke range
  const tempOffset = 283 - (temp / 50) * 283;

  return (
    <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-[2rem] p-5 lg:p-6 flex flex-col relative shadow-[0_8px_32px_0_rgba(34,197,94,0.1)] border border-white/60 dark:border-white/10 h-full overflow-hidden group transition-all duration-500">

      {/* Decorative Orbs */}
      <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[40px] opacity-20 transition-colors duration-700 pointer-events-none ${temp > 30 ? 'bg-red-500' : temp < 22 ? 'bg-blue-500' : 'bg-green-500'}`}></div>
      <div className={`absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-[40px] opacity-20 transition-colors duration-700 pointer-events-none ${humidity > 70 ? 'bg-indigo-500' : humidity < 40 ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Environment</h3>
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 inline-block ${device === 'indoor' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {device === 'indoor' ? '🏠 Indoor Area' : '🌳 Outdoor Area'}
          </span>
        </div>
        <span className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full font-bold border transition-colors duration-500 ${tempCfg.bgLabel}`}>
          {tempCfg.status}
        </span>
      </div>

      <div className="flex flex-row items-center justify-around gap-2 sm:gap-8 flex-1 w-full">

        {/* Temperature Side (Animated Ring Gauge) */}
        <div className="flex flex-col items-center justify-center relative group/gauge w-1/2">
          <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-[6px] sm:border-[10px] border-gray-100 dark:border-white/5 relative flex items-center justify-center shadow-inner overflow-hidden bg-white/50 dark:bg-black/20">

            {/* Background Animations for Temperature */}
            <div className="absolute inset-0 z-10 overflow-hidden rounded-full pointer-events-none">
              {tempCfg.status === 'Hot' && (
                <>
                  <motion.div animate={{ y: [50, -50], opacity: [0, 0.6, 0], scale: [0.5, 1.5] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute left-[30%] bottom-0 w-2 h-2 rounded-full bg-red-400 blur-[1px]"></motion.div>
                  <motion.div animate={{ y: [50, -50], opacity: [0, 0.4, 0], scale: [0.8, 2] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 1 }} className="absolute right-[30%] bottom-0 w-3 h-3 rounded-full bg-orange-400 blur-[2px]"></motion.div>
                  <motion.div animate={{ y: [50, -50], opacity: [0, 0.5, 0], scale: [0.5, 1] }} transition={{ repeat: Infinity, duration: 1.8, ease: "linear", delay: 0.5 }} className="absolute left-[50%] bottom-0 w-1.5 h-1.5 rounded-full bg-yellow-400 blur-[1px]"></motion.div>
                </>
              )}
              {tempCfg.status === 'Cold' && (
                <>
                  <motion.div animate={{ y: [-50, 50], x: [-10, 10], opacity: [0, 0.7, 0], rotate: [0, 180] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} className="absolute left-[25%] top-0 text-blue-300 text-[10px] blur-[0.5px]">❄</motion.div>
                  <motion.div animate={{ y: [-50, 50], x: [10, -10], opacity: [0, 0.5, 0], rotate: [0, -180] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 1.2 }} className="absolute right-[25%] top-0 text-cyan-200 text-[8px] blur-[0.5px]">❄</motion.div>
                  <motion.div animate={{ y: [-50, 50], x: [-5, 5], opacity: [0, 0.6, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "linear", delay: 0.5 }} className="absolute left-[50%] top-0 w-1.5 h-1.5 rounded-full bg-white blur-[1px]"></motion.div>
                </>
              )}
              {tempCfg.status === 'Optimal' && (
                <>
                  <motion.div animate={{ y: [-10, 10, -10], x: [-10, 10, -10], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute left-[20%] top-[30%] w-3 h-3 rounded-full bg-green-300 blur-[2px]"></motion.div>
                  <motion.div animate={{ y: [10, -10, 10], x: [10, -10, 10], opacity: [0.2, 0.6, 0.2] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute right-[20%] bottom-[30%] w-4 h-4 rounded-full bg-emerald-200 blur-[3px]"></motion.div>
                </>
              )}
            </div>

            {/* Animated Thermometer Ring using framer-motion */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform z-20 pointer-events-none" viewBox="0 0 100 100">
              {/* Main Temperature Ring */}
              <motion.circle
                className={`${tempCfg.color} ${tempCfg.shadow} transition-colors duration-500`}
                cx="50" cy="50" fill="none" r="45"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="283"
                strokeLinecap="round"
                animate={{ strokeDashoffset: tempOffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>

            {/* Value */}
            <div className="text-center z-30 flex flex-col items-center drop-shadow-md">
              <div className="flex items-start">
                <motion.span
                  key={temp}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none"
                >
                  {Number(temp).toFixed(1)}
                </motion.span>
                <span className={`text-[9px] sm:text-[11px] font-bold ml-0.5 mt-0.5 transition-colors duration-500 ${tempCfg.color}`}>°C</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-gray-500 dark:text-white/60">
            <span className={`material-symbols-rounded text-[12px] sm:text-sm transition-colors duration-500 ${tempCfg.color}`}>thermostat</span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-center">Air Temp</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-16 sm:h-24 bg-gray-200 dark:bg-white/10 rounded-full shrink-0"></div>

        {/* Humidity Side (Animated Wave Gauge) */}
        <div className="flex flex-col items-center justify-center relative group/gauge w-1/2">
          <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-[6px] sm:border-[10px] border-gray-100 dark:border-white/5 relative flex items-center justify-center shadow-inner overflow-hidden bg-white/50 dark:bg-black/20">

            {/* Animated Water Wave using framer-motion */}
            <motion.div
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t ${humCfg.gradient} opacity-80 transition-colors duration-1000`}
              animate={{ height: `${humidity}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              {/* Wave SVG */}
              <motion.svg
                className={`absolute w-[200%] h-4 sm:h-6 -top-3 sm:-top-5 ${humCfg.waveColor} transition-colors duration-1000`}
                viewBox="0 0 800 50"
                preserveAspectRatio="none"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 3 }}
              >
                <path d="M0,25 C100,50 150,0 200,25 C250,50 300,0 400,25 C500,50 550,0 600,25 C650,50 700,0 800,25 L800,50 L0,50 Z" fill="currentColor" />
              </motion.svg>
            </motion.div>

            {/* Circular Stroke Overlay */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform z-20 pointer-events-none" viewBox="0 0 100 100">
              <circle className={`${humCfg.stroke} transition-colors duration-1000`} cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="283" strokeDashoffset="71" strokeWidth="8" strokeLinecap="round"></circle>
            </svg>

            {/* Value */}
            <div className="text-center z-30 flex flex-col items-center drop-shadow-md">
              <div className="flex items-start">
                <motion.span
                  key={humidity}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-none"
                >
                  {Number(humidity).toFixed(1)}
                </motion.span>
                <span className={`text-[9px] sm:text-[11px] font-bold ml-0.5 mt-0.5 transition-colors duration-500 ${humCfg.text}`}>%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-gray-500 dark:text-white/60">
            <span className={`material-symbols-rounded text-[12px] sm:text-sm transition-colors duration-500 ${humCfg.text}`}>
              {device === 'indoor' ? 'water_drop' : 'potted_plant'}
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-center">
              {device === 'indoor' ? 'Air Humid' : 'Soil Moisture'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}


