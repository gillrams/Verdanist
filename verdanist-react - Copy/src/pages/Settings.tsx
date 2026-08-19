import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Helper components used in Settings
const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-white/10 pb-1">
    {title}
  </h2>
);

export default function Settings() {
  const { user, logout } = useAuth();
  const [farmName, setFarmName] = useState('Persada Farm');
  const [zone, setZone] = useState<'indoor' | 'outdoor'>('indoor');

  // Sensor thresholds
  const [tempMin, setTempMin] = useState(22);
  const [tempMax, setTempMax] = useState(33);
  const [humMin, setHumMin] = useState(55);
  const [humMax, setHumMax] = useState(80);
  const [soilMoistMin, setSoilMoistMin] = useState(30);
  const [soilMoistMax, setSoilMoistMax] = useState(70);

  // Pump config
  const [pumpCooldown, setPumpCooldown] = useState(5); // minutes
  const [pumpMaxPerDay, setPumpMaxPerDay] = useState(5);

  // Notification settings
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '06:00' });

  // Theme settings
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Load saved settings from Supabase (placeholder – you can extend later)
  useEffect(() => {
    // Example: fetch settings document for the user
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      if (!error && data) {
        setFarmName(data.farm_name ?? farmName);
        setZone(data.zone ?? zone);
        setTempMin(data.temp_min ?? tempMin);
        setTempMax(data.temp_max ?? tempMax);
        setHumMin(data.humidity_min ?? humMin);
        setHumMax(data.humidity_max ?? humMax);
        setSoilMoistMin(data.soil_moisture_min ?? soilMoistMin);
        setSoilMoistMax(data.soil_moisture_max ?? soilMoistMax);
        setPumpCooldown(data.pump_cooldown ?? pumpCooldown);
        setPumpMaxPerDay(data.pump_max_per_day ?? pumpMaxPerDay);
        setNotifyEmail(data.notify_email ?? notifyEmail);
        setNotifyPush(data.notify_push ?? notifyPush);
        setQuietHours({ start: data.quiet_start ?? quietHours.start, end: data.quiet_end ?? quietHours.end });
        setTheme(data.theme ?? theme);
      }
    };
    if (user) fetchSettings();
  }, [user]);

  const saveSettings = async () => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      farm_name: farmName,
      zone,
      temp_min: tempMin,
      temp_max: tempMax,
      humidity_min: humMin,
      humidity_max: humMax,
      soil_moisture_min: soilMoistMin,
      soil_moisture_max: soilMoistMax,
      pump_cooldown: pumpCooldown,
      pump_max_per_day: pumpMaxPerDay,
      notify_email: notifyEmail,
      notify_push: notifyPush,
      quiet_start: quietHours.start,
      quiet_end: quietHours.end,
      theme,
    };
    const { error } = await supabase.from('user_settings').upsert(payload, { returning: 'minimal' });
    if (error) console.error('Failed to save settings', error);
    else alert('Settings saved!');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        {/* Profile */}
        <section className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/60 dark:border-white/10">
          <SectionHeader title="Profil Pengguna" />
          <div className="flex items-center gap-4">
            <span className="material-symbols-rounded text-4xl text-emerald-600">account_circle</span>
            <div>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">{user?.displayName || 'Pengguna'}</p>
              <p className="text-sm text-gray-500 dark:text-white/60">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-auto px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </section>

        {/* Farm Info */}
        <section className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/60 dark:border-white/10">
          <SectionHeader title="Informasi Farm" />
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Nama Farm</span>
              <input
                type="text"
                className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white focus:outline-none"
                value={farmName}
                onChange={e => setFarmName(e.target.value)}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Zona</span>
              <select
                className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white focus:outline-none"
                value={zone}
                onChange={e => setZone(e.target.value as 'indoor' | 'outdoor')}
              >
                <option value="indoor">Indoor (Greenhouse)</option>
                <option value="outdoor">Outdoor (Area Luar)</option>
              </select>
            </label>
          </div>
        </section>

        {/* Sensor Thresholds */}
        <section className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/60 dark:border-white/10">
          <SectionHeader title="Batas Sensor" />
          <div className="grid md:grid-cols-2 gap-4">
            {zone !== 'outdoor' && (
              <>
                <label className="flex flex-col">
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Suhu Min (°C)</span>
                  <input
                    type="number"
                    className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
                    value={tempMin}
                    onChange={e => setTempMin(parseInt(e.target.value))}
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Suhu Max (°C)</span>
                  <input
                    type="number"
                    className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
                    value={tempMax}
                    onChange={e => setTempMax(parseInt(e.target.value))}
                  />
                </label>
              </>
            )}
            <label className="flex flex-col">
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Kelembaban Udara Min (%)</span>
              <input
                type="number"
                className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
                value={humMin}
                onChange={e => setHumMin(parseInt(e.target.value))}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Kelembaban Udara Max (%)</span>
              <input
                type="number"
                className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
                value={humMax}
                onChange={e => setHumMax(parseInt(e.target.value))}
              />
            </label>
            {zone === 'outdoor' && (
              <>
                <label className="flex flex-col md:col-span-2">
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Kelembaban Tanah Min (%)</span>
                  <input
                    type="number"
                    className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
                    value={soilMoistMin}
                    onChange={e => setSoilMoistMin(parseInt(e.target.value))}
                  />
                </label>
                <label className="flex flex-col md:col-span-2">
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Kelembaban Tanah Max (%)</span>
                  <input
                    type="number"
                    className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
                    value={soilMoistMax}
                    onChange={e => setSoilMoistMax(parseInt(e.target.value))}
                  />
                </label>
              </>
            )}
          </div>
        </section>

        {/* Pump Configuration */}
        <section className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/60 dark:border-white/10">
          <SectionHeader title="Konfigurasi Pompa" />
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Cooldown (menit)</span>
              <input
                type="number"
                className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
                value={pumpCooldown}
                onChange={e => setPumpCooldown(parseInt(e.target.value))}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40 mb-1">Maksimum Penyiraman/Hari</span>
              <input
                type="number"
                className="rounded-lg px-3 py-2 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
                value={pumpMaxPerDay}
                onChange={e => setPumpMaxPerDay(parseInt(e.target.value))}
              />
            </label>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/60 dark:border-white/10">
          <SectionHeader title="Pengaturan Notifikasi" />
          <div className="grid md:grid-cols-2 gap-4 items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={e => setNotifyEmail(e.target.checked)}
                className="form-checkbox h-4 w-4 text-emerald-600 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Email</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyPush}
                onChange={e => setNotifyPush(e.target.checked)}
                className="form-checkbox h-4 w-4 text-emerald-600 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Push (Browser)</span>
            </label>
            <div className="md:col-span-2 flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-gray-500 dark:text-white/40">Jam Tenang</span>
              <input
                type="time"
                value={quietHours.start}
                onChange={e => setQuietHours({ ...quietHours, start: e.target.value })}
                className="rounded-lg px-2 py-1 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
              />
              <span className="mx-1">-</span>
              <input
                type="time"
                value={quietHours.end}
                onChange={e => setQuietHours({ ...quietHours, end: e.target.value })}
                className="rounded-lg px-2 py-1 bg-white/30 dark:bg-white/10 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Theme Settings */}
        <section className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/60 dark:border-white/10">
          <SectionHeader title="Tema & Tampilan" />
          <div className="flex items-center space-x-4">
            <button
              className={`px-4 py-2 rounded-xl ${theme === 'light' ? 'bg-emerald-500 text-white' : 'bg-white/30 text-gray-900'} transition-colors`}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
            <button
              className={`px-4 py-2 rounded-xl ${theme === 'dark' ? 'bg-emerald-500 text-white' : 'bg-white/30 text-gray-900'} transition-colors`}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
