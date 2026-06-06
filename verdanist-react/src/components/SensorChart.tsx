import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const data = [
  { time: '00:00', moisture: 55 },
  { time: '04:00', moisture: 50 },
  { time: '08:00', moisture: 80 },
  { time: '12:00', moisture: 75 },
  { time: '16:00', moisture: 68 },
  { time: '20:00', moisture: 65 },
  { time: '24:00', moisture: 62 },
];

interface Props {
  isDarkMode: boolean;
}

export default function SensorChart({ isDarkMode }: Props) {
  const textColor = isDarkMode ? '#9ca3af' : '#6b7280'; // gray-400 : gray-500
  const lineColor = isDarkMode ? '#34d399' : '#10b981'; // emerald-400 : emerald-500
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full h-[220px] bg-card/60 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-border shadow-sm"
    >
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-bold text-foreground text-sm">Soil Moisture History</h3>
        <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-full">Past 24h</span>
      </div>
      <div className="w-full h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={isDarkMode ? 0.6 : 0.3}/>
                <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                color: isDarkMode ? '#f3f4f6' : '#111827',
                backdropFilter: 'blur(8px)'
              }}
              itemStyle={{ color: lineColor, fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="moisture" stroke={lineColor} strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
