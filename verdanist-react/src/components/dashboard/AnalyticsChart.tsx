import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Fungsi untuk menghasilkan data awal dinamis berdasarkan waktu sekarang
const generateInitialData = () => {
  const data = [];
  const now = new Date();

  // Buat 6 titik data ke belakang (mundur per 10 menit)
  for (let i = 6; i >= 1; i--) {
    const pastTime = new Date(now.getTime() - i * 10 * 60 * 1000);
    const timeStr = `${pastTime.getHours().toString().padStart(2, '0')}:${pastTime.getMinutes().toString().padStart(2, '0')}`;

    // Nilai acak dasar
    data.push({
      time: timeStr,
      temp: parseFloat((25 + Math.random() * 3).toFixed(1)),
      humidity: Math.round(60 + Math.random() * 15)
    });
  }

  // Titik terakhir (Sekarang)
  data.push({ time: 'Now', temp: 28.0, humidity: 75 });
  return data;
};

interface AnalyticsChartProps {
  currentTemp: number;
  currentHumidity: number;
}

export default function AnalyticsChart({ currentTemp, currentHumidity }: AnalyticsChartProps) {
  const [data, setData] = useState(generateInitialData);

  // Update titik terakhir grafik dengan data live dari Environment
  useEffect(() => {
    setData(currentData => {
      const newData = [...currentData];
      const lastIndex = newData.length - 1;
      newData[lastIndex] = {
        ...newData[lastIndex],
        temp: currentTemp,
        humidity: currentHumidity
      };
      return newData;
    });
  }, [currentTemp, currentHumidity]);

  // Simulasi Real-time: Menambah data baru setiap 10 menit
  useEffect(() => {
    const interval = setInterval(() => {
      setData(currentData => {
        const lastPoint = currentData[currentData.length - 1];

        // Generate waktu baru
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        // Generate nilai acak yang mendekati nilai terakhir agar grafik smooth
        const newTemp = Math.min(Math.max(lastPoint.temp + (Math.random() > 0.5 ? 0.3 : -0.3), 20), 35);
        const newHum = Math.min(Math.max(lastPoint.humidity + (Math.random() > 0.5 ? 2 : -2), 40), 95);

        const newDataPoint = {
          time: timeStr,
          temp: parseFloat(newTemp.toFixed(1)),
          humidity: Math.round(newHum)
        };

        // Buang data terlama, masukkan data terbaru (mentransfer grafik ke kiri)
        return [...currentData.slice(1), newDataPoint];
      });
    }, 600000); // 600000 ms = 10 menit

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-[2rem] p-5 lg:p-6 flex flex-col shadow-[0_8px_32px_0_rgba(34,197,94,0.1)] border border-white/60 dark:border-white/10 h-full transition-all duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            Real-time Trends
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </h3>
          <p className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest mt-0.5">Live sensor updates</p>
        </div>

        {/* Legends */}
        <div className="flex items-center gap-4 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-xl border border-white/50 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/30"></div>
            <span className="text-[11px] font-extrabold text-gray-600 dark:text-white/70 uppercase tracking-widest">Suhu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/30"></div>
            <span className="text-[11px] font-extrabold text-gray-600 dark:text-white/70 uppercase tracking-widest">Kelembaban</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Gradient untuk Suhu */}
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              {/* Gradient untuk Kelembaban */}
              <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />

            {/* Garis Ambang Batas Ideal */}
            <ReferenceLine
              yAxisId="left"
              y={27}
              stroke="#10b981"
              strokeDasharray="5 5"
              label={{ value: 'Ideal Temp (27°C)', fill: '#10b981', fontSize: 9, fontWeight: 'bold', position: 'insideBottomLeft' }}
            />
            <ReferenceLine
              yAxisId="right"
              y={70}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: 'Ideal Humid (70%)', fill: '#3b82f6', fontSize: 9, fontWeight: 'bold', position: 'insideBottomRight' }}
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
              dy={10}
            />

            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
              domain={[15, 40]}
              tickFormatter={(value) => `${value.toFixed(1)}°C`}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
              domain={[30, 100]}
              tickFormatter={(value) => `${Math.round(value)}%`}
            />

            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
              itemStyle={{ fontWeight: 'extrabold', padding: '2px 0' }}
              labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '10px' }}
              formatter={(value, name) => {
                if (value === undefined || value === null) return '—';
                const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
                if (isNaN(numValue)) return value.toString();
                if (name === 'temp') return `${numValue.toFixed(1)}°C`;
                if (name === 'humidity') return `${Math.round(numValue)}%`;
                return numValue;
              }}
            />

            {/* Area Suhu */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              stroke="#10b981"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorTemp)"
              animationDuration={500}
              dot={{ stroke: '#10b981', strokeWidth: 2, fill: '#white', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
            />

            {/* Area Kelembaban */}
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="humidity"
              stroke="#3b82f6"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorHum)"
              animationDuration={500}
              dot={{ stroke: '#3b82f6', strokeWidth: 2, fill: '#white', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
