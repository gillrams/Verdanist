import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Droplets, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SensorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: 'indoor' | 'outdoor';
  validSensors: number;
  temp1: number | null;
  hum1: number | null;
  temp2: number | null;
  hum2: number | null;
  temp3: number | null;
  hum3: number | null;
  avgTemp: number | null;
  avgHum: number | null;
  tempThreshold: number;
  humThreshold: number;
  pumpActive: boolean;
}

export default function SensorDetailsModal({
  isOpen, onClose, zone, validSensors,
  temp1, hum1, temp2, hum2, temp3, hum3,
  avgTemp, avgHum, tempThreshold, humThreshold, pumpActive
}: SensorDetailsModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const getStatusColor = (val: number | null, threshold: number, isTemp: boolean) => {
    if (val === null) return 'text-muted-foreground';
    if (isTemp) return val >= threshold ? 'text-orange-500' : 'text-emerald-500';
    return val <= threshold ? 'text-orange-500' : 'text-emerald-500';
  };

  const sensors = [
    { id: 1, temp: temp1, hum: hum1 },
    { id: 2, temp: temp2, hum: hum2 },
    { id: 3, temp: temp3, hum: hum3 },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-border flex flex-col"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-border/50 bg-secondary/30 relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 bg-background hover:bg-secondary rounded-full transition-colors"
            >
              <span className="material-symbols-rounded text-[20px] text-muted-foreground">close</span>
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-foreground tracking-tight">Detail Sensor {zone === 'indoor' ? 'Indoor' : 'Outdoor'}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{validSensors} Sensor Aktif</p>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6">
            
            {/* Individual Sensors */}
            <div className="grid gap-3">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Pembacaan Fisik</h4>
              {sensors.map((s) => (
                <div key={s.id} className="bg-secondary/40 border border-border/50 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.temp !== null ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-destructive'}`} />
                    <span className="font-bold text-sm text-foreground">Sensor {s.id}</span>
                  </div>
                  
                  <div className="flex gap-4 sm:gap-6">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Suhu</span>
                      </div>
                      <span className="font-extrabold text-sm">{s.temp !== null ? `${s.temp.toFixed(1)}°C` : '--'}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Droplets className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">RH</span>
                      </div>
                      <span className="font-extrabold text-sm">{s.hum !== null ? `${s.hum.toFixed(1)}%` : '--'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Averages & Thresholds */}
            <div className="grid gap-3">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Rata-rata & Ambang Batas (Auto)</h4>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Temp */}
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Suhu Rata-rata</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-black tracking-tight">{avgTemp !== null ? avgTemp.toFixed(1) : '--'}</span>
                    <span className="text-sm font-bold text-muted-foreground mb-1">°C</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="text-muted-foreground">Batas:</span>
                    <span className="font-bold">{tempThreshold}°C</span>
                    <span className={`ml-auto ${getStatusColor(avgTemp, tempThreshold, true)}`}>
                      {avgTemp !== null && avgTemp >= tempThreshold ? 'Panas' : 'Aman'}
                    </span>
                  </div>
                </div>

                {/* Hum */}
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Droplets className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">RH Rata-rata</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-black tracking-tight">{avgHum !== null ? avgHum.toFixed(1) : '--'}</span>
                    <span className="text-sm font-bold text-muted-foreground mb-1">%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="text-muted-foreground">Batas:</span>
                    <span className="font-bold">{humThreshold}%</span>
                    <span className={`ml-auto ${getStatusColor(avgHum, humThreshold, false)}`}>
                      {avgHum !== null && avgHum <= humThreshold ? 'Kering' : 'Aman'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pump Action Result */}
            <div className={`mt-2 rounded-2xl p-4 border flex items-center justify-between ${
              pumpActive 
                ? 'bg-primary/10 border-primary/30' 
                : 'bg-secondary/50 border-border'
            }`}>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status Aktuator</p>
                <p className="font-extrabold text-foreground text-sm flex items-center gap-2">
                  Pompa Misting
                  {pumpActive ? (
                    <span className="flex items-center gap-1 text-primary text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Menyala
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs bg-background px-2 py-0.5 rounded-full border border-border">
                      <XCircle className="w-3 h-3" /> Mati
                    </span>
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                pumpActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-background text-muted-foreground shadow-sm'
              }`}>
                <span className="material-symbols-rounded">{pumpActive ? 'water_drop' : 'power_off'}</span>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
