import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'farms' | 'users' | 'system'>('farms');
  const [farms, setFarms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Search and Filter States
  const [searchFarm, setSearchFarm] = useState('');
  const [filterFarmStatus, setFilterFarmStatus] = useState('all');
  const [searchUser, setSearchUser] = useState('');
  const [filterUserRole, setFilterUserRole] = useState('all');

  // System Configurations State
  const [sysMistingTime, setSysMistingTime] = useState(10);
  const [sysTempThreshold, setSysTempThreshold] = useState(30.0);
  const [sysHumidityThreshold, setSysHumidityThreshold] = useState(60);
  const [sysSoilThreshold, setSysSoilThreshold] = useState(40);
  const [sysPlantPreset, setSysPlantPreset] = useState<'caisim' | 'melon' | 'aroid' | 'sukulen' | 'custom'>('custom');
  const [sysTelemetryInterval, setSysTelemetryInterval] = useState(30);
  const [sysMistingPattern, setSysMistingPattern] = useState<'continuous' | 'pulsed'>('continuous');
  const [sysTempOffset, setSysTempOffset] = useState(0.0);
  const [sysHumOffset, setSysHumOffset] = useState(0);
  const [sysSoilOffset, setSysSoilOffset] = useState(0);
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedSystemDevice, setSelectedSystemDevice] = useState<'ESP32_INDOOR' | 'ESP32_OUTDOOR'>('ESP32_INDOOR');
  
  // Real-time sensor statuses for comparison widget
  const [deviceSensors, setDeviceSensors] = useState<{ temp: number | null, hum: number | null, soil: number | null }>({ temp: null, hum: null, soil: null });

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    fetchSystemSettings(selectedSystemDevice);
  }, [selectedSystemDevice]);

  const fetchSystemSettings = async (deviceId: 'ESP32_INDOOR' | 'ESP32_OUTDOOR') => {
    try {
      const { data, error } = await supabase
        .from('device_settings')
        .select('*')
        .eq('device_id', deviceId)
        .single();
      
      let initialTemp = null;
      let initialHum = null;
      
      if (data && !error) {
        setSysTempThreshold(data.temp_threshold ?? 30.0);
        setSysHumidityThreshold(data.hum_threshold ?? 60);
        initialTemp = data.temperature;
        initialHum = data.humidity;
      }
      
      // Fetch latest soil moisture reading
      const { data: soilData, error: soilError } = await supabase
        .from('sensor_readings')
        .select('value')
        .eq('device_id', deviceId)
        .eq('type', 'soil_moisture')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let initialSoil = null;
      if (soilData && !soilError) {
        initialSoil = Number(soilData.value);
      } else {
        // Fallback value for visual demo purposes if no readings are present
        initialSoil = 58;
      }

      setDeviceSensors({ temp: initialTemp, hum: initialHum, soil: initialSoil });

      // Load advanced configs from localStorage
      const storedMisting = localStorage.getItem(`misting_time_${deviceId}`);
      setSysMistingTime(storedMisting ? parseInt(storedMisting) : 10);

      const storedPreset = localStorage.getItem(`verdanist_preset_${deviceId}`);
      setSysPlantPreset((storedPreset as any) ?? 'custom');

      const storedSoilThresh = localStorage.getItem(`verdanist_soil_threshold_${deviceId}`);
      setSysSoilThreshold(storedSoilThresh ? parseInt(storedSoilThresh) : 40);

      const storedInterval = localStorage.getItem(`verdanist_telemetry_interval_${deviceId}`);
      setSysTelemetryInterval(storedInterval ? parseInt(storedInterval) : 30);

      const storedPattern = localStorage.getItem(`verdanist_misting_pattern_${deviceId}`);
      setSysMistingPattern((storedPattern as any) ?? 'continuous');

      const storedTempOffset = localStorage.getItem(`verdanist_temp_offset_${deviceId}`);
      setSysTempOffset(storedTempOffset ? parseFloat(storedTempOffset) : 0.0);

      const storedHumOffset = localStorage.getItem(`verdanist_hum_offset_${deviceId}`);
      setSysHumOffset(storedHumOffset ? parseInt(storedHumOffset) : 0);

      const storedSoilOffset = localStorage.getItem(`verdanist_soil_offset_${deviceId}`);
      setSysSoilOffset(storedSoilOffset ? parseInt(storedSoilOffset) : 0);

    } catch (err) {
      console.error('Error fetching system settings:', err);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all farms
      const { data: farmsData, error: farmsError } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!farmsError && farmsData) {
        setFarms(farmsData);
      }

      // 2. Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true });
      
      if (!profilesError && profilesData) {
        setUsers(profilesData);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Approve Farm
  const handleApproveFarm = async (farmId: string) => {
    setActionLoading(farmId);
    try {
      const { error } = await supabase
        .from('farms')
        .update({ status: 'active' })
        .eq('id', farmId);

      if (!error) {
        setFarms(current => 
          current.map(f => f.id === farmId ? { ...f, status: 'active' } : f)
        );
      } else {
        alert('Gagal menyetujui kebun: ' + error.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Reject / Delete Farm
  const handleDeleteFarm = async (farmId: string) => {
    if (!confirm('Apakah Anda yakin ingin menolak & menghapus kebun ini?')) return;
    setActionLoading(farmId);
    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId);

      if (!error) {
        setFarms(current => current.filter(f => f.id !== farmId));
      } else {
        alert('Gagal menghapus kebun: ' + error.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Update User Role
  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'farmer' | 'guest') => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (!error) {
        setUsers(current => 
          current.map(u => u.id === userId ? { ...u, role: newRole } : u)
        );
      } else {
        alert('Gagal memperbarui peran pengguna: ' + error.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 3.5. Apply Plant Presets
  const handlePresetChange = (preset: 'caisim' | 'melon' | 'aroid' | 'sukulen' | 'custom') => {
    setSysPlantPreset(preset);
    if (preset === 'caisim') {
      setSysTempThreshold(32.0);
      setSysHumidityThreshold(65);
      setSysSoilThreshold(60);
    } else if (preset === 'melon') {
      setSysTempThreshold(34.0);
      setSysHumidityThreshold(55);
      setSysSoilThreshold(50);
    } else if (preset === 'aroid') {
      setSysTempThreshold(30.0);
      setSysHumidityThreshold(70);
      setSysSoilThreshold(45);
    } else if (preset === 'sukulen') {
      setSysTempThreshold(38.0);
      setSysHumidityThreshold(40);
      setSysSoilThreshold(25);
    }
  };

  // 4. Save global thresholds to Supabase and custom configs to local storage
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('device_settings')
        .update({
          temp_threshold: sysTempThreshold,
          hum_threshold: sysHumidityThreshold
        })
        .eq('device_id', selectedSystemDevice);

      if (!error) {
        localStorage.setItem(`misting_time_${selectedSystemDevice}`, sysMistingTime.toString());
        localStorage.setItem(`verdanist_preset_${selectedSystemDevice}`, sysPlantPreset);
        localStorage.setItem(`verdanist_soil_threshold_${selectedSystemDevice}`, sysSoilThreshold.toString());
        localStorage.setItem(`verdanist_telemetry_interval_${selectedSystemDevice}`, sysTelemetryInterval.toString());
        localStorage.setItem(`verdanist_misting_pattern_${selectedSystemDevice}`, sysMistingPattern);
        localStorage.setItem(`verdanist_temp_offset_${selectedSystemDevice}`, sysTempOffset.toString());
        localStorage.setItem(`verdanist_hum_offset_${selectedSystemDevice}`, sysHumOffset.toString());
        localStorage.setItem(`verdanist_soil_offset_${selectedSystemDevice}`, sysSoilOffset.toString());

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Gagal menyimpan pengaturan: ' + error.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtering Logic
  const filteredFarms = farms.filter(farm => {
    const matchesSearch = (farm.name || '').toLowerCase().includes(searchFarm.toLowerCase()) || 
                          (farm.location || '').toLowerCase().includes(searchFarm.toLowerCase()) ||
                          (farm.api_key || '').toLowerCase().includes(searchFarm.toLowerCase());
    const matchesStatus = filterFarmStatus === 'all' || farm.status === filterFarmStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter(user => {
    const displayName = user.full_name || user.display_name || user.name || user.email || 'User';
    const matchesSearch = displayName.toLowerCase().includes(searchUser.toLowerCase()) ||
                          user.id.toLowerCase().includes(searchUser.toLowerCase()) ||
                          (user.role || '').toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = filterUserRole === 'all' || user.role === filterUserRole;
    return matchesSearch && matchesRole;
  });

  // Calculate statistics
  const pendingFarms = farms.filter(f => f.status === 'pending').length;
  const activeFarmsCount = farms.filter(f => f.status === 'active').length;
  const totalFarmers = users.filter(u => u.role === 'farmer').length;
  const totalGuests = users.filter(u => u.role === 'guest').length;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up font-sans">
        
        {/* Header Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-red-500/20">
                🛡️ Admin Area
              </span>
            </div>
            <h1 className="text-gray-900 dark:text-white text-2xl lg:text-3xl font-extrabold tracking-tight">
              Control Panel
            </h1>
            <p className="text-gray-500 dark:text-white/40 text-xs lg:text-sm font-bold uppercase tracking-wider mt-0.5">
              Kelola Pengguna, Kebun, dan Parameter Sistem Verdanist
            </p>
          </div>

          <div className="flex overflow-x-auto scrollbar-none bg-white/50 dark:bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white dark:border-white/5 shadow-sm max-w-full">
            <button 
              onClick={() => setActiveTab('farms')}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer flex-shrink-0 ${activeTab === 'farms' ? 'bg-[#0A2F1F] dark:bg-white text-white dark:text-black shadow-md' : 'text-gray-500 dark:text-white/60 hover:text-green-600 dark:hover:text-white'}`}
            >
              <span className="material-symbols-rounded text-sm sm:text-base">agriculture</span>
              Kebun ({farms.length})
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer flex-shrink-0 ${activeTab === 'users' ? 'bg-[#0A2F1F] dark:bg-white text-white dark:text-black shadow-md' : 'text-gray-500 dark:text-white/60 hover:text-green-600 dark:hover:text-white'}`}
            >
              <span className="material-symbols-rounded text-sm sm:text-base">group</span>
              Pengguna ({users.length})
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer flex-shrink-0 ${activeTab === 'system' ? 'bg-[#0A2F1F] dark:bg-white text-white dark:text-black shadow-md' : 'text-gray-500 dark:text-white/60 hover:text-green-600 dark:hover:text-white'}`}
            >
              <span className="material-symbols-rounded text-sm sm:text-base">settings_input_component</span>
              Sistem
            </button>
          </div>
        </div>

        {/* Top Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-white/60 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 transition-all hover:scale-[1.02]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              <span className="material-symbols-rounded">hourglass_empty</span>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-gray-400 dark:text-white/30 uppercase tracking-widest leading-tight">Persetujuan Kebun</p>
              <p className="text-base sm:text-lg lg:text-xl font-black text-gray-900 dark:text-white mt-1 leading-none truncate">{pendingFarms} Pending</p>
            </div>
          </div>

          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-white/60 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 transition-all hover:scale-[1.02]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              <span className="material-symbols-rounded">domain</span>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-gray-400 dark:text-white/30 uppercase tracking-widest leading-tight">Kebun Aktif</p>
              <p className="text-base sm:text-lg lg:text-xl font-black text-gray-900 dark:text-white mt-1 leading-none truncate">{activeFarmsCount} Kebun</p>
            </div>
          </div>

          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-white/60 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 transition-all hover:scale-[1.02]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              <span className="material-symbols-rounded">engineering</span>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-gray-400 dark:text-white/30 uppercase tracking-widest leading-tight">Farmer Aktif</p>
              <p className="text-base sm:text-lg lg:text-xl font-black text-gray-900 dark:text-white mt-1 leading-none truncate">{totalFarmers} Pengguna</p>
            </div>
          </div>

          <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-white/60 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 transition-all hover:scale-[1.02]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
              <span className="material-symbols-rounded">lock_person</span>
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-gray-400 dark:text-white/30 uppercase tracking-widest leading-tight">Guest Pending</p>
              <p className="text-base sm:text-lg lg:text-xl font-black text-gray-900 dark:text-white mt-1 leading-none truncate">{totalGuests} Tamu</p>
            </div>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl rounded-2xl sm:rounded-[2rem] border border-white/60 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-xl min-h-[500px] relative">
          
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-gray-500 dark:text-white/40 font-bold uppercase tracking-widest">Mengambil data admin...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'farms' && (
                <motion.div 
                  key="farms"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Daftar & Pengajuan Kebun (Farms)</h3>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">Menampilkan kebun yang mengajukan pendaftaran (Pending) dan yang sudah disetujui (Active)</p>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                      <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">search</span>
                      <input
                        type="text"
                        placeholder="Cari nama kebun, lokasi, atau token..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        value={searchFarm}
                        onChange={e => setSearchFarm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer"
                      value={filterFarmStatus}
                      onChange={e => setFilterFarmStatus(e.target.value)}
                    >
                      <option value="all">Semua Status</option>
                      <option value="pending">⏳ Pending (Pengajuan Baru)</option>
                      <option value="active">✅ Active (Sudah Terdaftar)</option>
                    </select>
                  </div>

                  {/* Farms Table */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5 bg-white/20 dark:bg-black/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-white/2 border-b border-gray-100 dark:border-white/5">
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Nama Kebun</th>
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Lokasi / Kota</th>
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Token Akses</th>
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Status</th>
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest text-right whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm font-semibold">
                        {filteredFarms.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-xs text-gray-500 dark:text-white/40 font-bold whitespace-nowrap">
                              Tidak ada kebun terdaftar yang sesuai filter.
                            </td>
                          </tr>
                        ) : (
                          filteredFarms.map(farm => {
                            const isPending = farm.status === 'pending';
                            return (
                              <tr key={farm.id} className="hover:bg-white/30 dark:hover:bg-white/2 transition-colors">
                                <td className="p-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg flex-shrink-0">
                                      <span className="material-symbols-rounded">agriculture</span>
                                    </div>
                                    <div>
                                      <p className="text-gray-900 dark:text-white font-extrabold text-sm">{farm.name}</p>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: {farm.id.substring(0, 8)}...</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-white/60 font-bold">
                                    <span className="material-symbols-rounded text-sm text-gray-400">location_on</span>
                                    {farm.location}
                                  </span>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 select-all block bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                                      {farm.api_key || 'TOKEN-BELUM-DIBUAT'}
                                    </code>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(farm.api_key);
                                        alert('Token disalin!');
                                      }}
                                      className="w-7 h-7 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 hover:text-emerald-500 flex items-center justify-center transition cursor-pointer"
                                      title="Salin Token"
                                    >
                                      <span className="material-symbols-rounded text-xs">content_copy</span>
                                    </button>
                                  </div>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                    isPending ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                  }`}>
                                    {isPending ? (
                                      <>
                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                                        Pending
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        Active
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="p-4 text-right whitespace-nowrap">
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      disabled={actionLoading === farm.id}
                                      onClick={() => handleDeleteFarm(farm.id)}
                                      className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 text-xs font-extrabold transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <span className="material-symbols-rounded text-xs">delete</span>
                                      {isPending ? 'Tolak' : 'Hapus'}
                                    </button>
                                    
                                    {isPending && (
                                      <button
                                        disabled={actionLoading === farm.id}
                                        onClick={() => handleApproveFarm(farm.id)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-500/15"
                                      >
                                        <span className="material-symbols-rounded text-xs">check_circle</span>
                                        Setujui
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div 
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Daftar & Pengajuan Pengguna (Users)</h3>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">Kelola tamu baru (Guest) yang mengajukan persetujuan role dan petani aktif (Farmer/Admin)</p>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                      <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">search</span>
                      <input
                        type="text"
                        placeholder="Cari nama, email, UID, atau role..."
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                        value={searchUser}
                        onChange={e => setSearchUser(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer"
                      value={filterUserRole}
                      onChange={e => setFilterUserRole(e.target.value)}
                    >
                      <option value="all">Semua Peran</option>
                      <option value="guest">🔒 Guest (Menunggu Persetujuan)</option>
                      <option value="farmer">🚜 Farmer (Petani Aktif)</option>
                      <option value="admin">🛡️ Admin (Administrator)</option>
                    </select>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5 bg-white/20 dark:bg-black/10">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 dark:bg-white/2 border-b border-gray-100 dark:border-white/5">
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Pengguna</th>
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">UID Supabase</th>
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Peran (Role)</th>
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">Status Akses</th>
                          <th className="p-4 text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-widest text-right whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm font-semibold">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-16 text-xs text-gray-500 dark:text-white/40 font-bold whitespace-nowrap">
                              Tidak ada pengguna terdaftar yang sesuai filter.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(profile => {
                            const isGuest = profile.role === 'guest';
                            const isFarmer = profile.role === 'farmer';
                            const isAdmin = profile.role === 'admin';
                            
                            // Safe fallback mapping for name and email
                            const displayName = profile.full_name || profile.display_name || profile.name || 'User Verdanist';
                            const displayEmail = profile.email || 'guest@verdanist.com';

                            return (
                              <tr key={profile.id} className="hover:bg-white/30 dark:hover:bg-white/2 transition-colors">
                                <td className="p-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                                      isAdmin ? 'bg-red-500/10 text-red-500' : isFarmer ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                                    }`}>
                                      <span className="material-symbols-rounded">
                                        {isAdmin ? 'shield_person' : isFarmer ? 'engineering' : 'lock_person'}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-gray-900 dark:text-white font-extrabold text-sm">{displayName}</p>
                                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{displayEmail}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <code className="text-xs font-bold text-gray-500 dark:text-white/40 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded select-all font-mono">
                                    {profile.id}
                                  </code>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                    isAdmin ? 'bg-red-500/10 text-red-600 border border-red-500/20' : isFarmer ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/5'
                                  }`}>
                                    {profile.role}
                                  </span>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                    isGuest ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                  }`}>
                                    {isGuest ? (
                                      <>
                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                        Menunggu Persetujuan
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                        Akses Aktif
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="p-4 text-right whitespace-nowrap">
                                  <div className="flex gap-2 justify-end">
                                    {isGuest && (
                                      <button
                                        disabled={actionLoading === profile.id}
                                        onClick={() => handleUpdateRole(profile.id, 'farmer')}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer shadow-sm"
                                      >
                                        <span className="material-symbols-rounded text-xs">check_circle</span>
                                        Setujui (Farmer)
                                      </button>
                                    )}
                                    
                                    {isFarmer && (
                                      <button
                                        disabled={actionLoading === profile.id}
                                        onClick={() => handleUpdateRole(profile.id, 'guest')}
                                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 text-xs font-extrabold transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <span className="material-symbols-rounded text-xs">lock_person</span>
                                        Downgrade ke Guest
                                      </button>
                                    )}
 
                                    {!isAdmin ? (
                                      <button
                                        disabled={actionLoading === profile.id}
                                        onClick={() => handleUpdateRole(profile.id, 'admin')}
                                        className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 text-xs font-extrabold transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <span className="material-symbols-rounded text-xs">admin_panel_settings</span>
                                        Jadikan Admin
                                      </button>
                                    ) : (
                                      <button
                                        disabled={actionLoading === profile.id}
                                        onClick={() => handleUpdateRole(profile.id, 'farmer')}
                                        className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-white/60 text-xs font-extrabold transition flex items-center gap-1 cursor-pointer"
                                      >
                                        <span className="material-symbols-rounded text-xs">arrow_downward</span>
                                        Turunkan ke Farmer
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'system' && (
                <motion.div 
                  key="system"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Header Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Global System Automation</h3>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">Konfigurasi batas threshold sensor & otomatisasi modul IoT ESP32</p>
                    </div>

                    {/* Premium Device Selector Tab */}
                    <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 self-start">
                      <button
                        type="button"
                        onClick={() => setSelectedSystemDevice('ESP32_INDOOR')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${selectedSystemDevice === 'ESP32_INDOOR' ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white/60'}`}
                      >
                        <span className="material-symbols-rounded text-sm">home_work</span>
                        Indoor
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSystemDevice('ESP32_OUTDOOR')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${selectedSystemDevice === 'ESP32_OUTDOOR' ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white/60'}`}
                      >
                        <span className="material-symbols-rounded text-sm">nest_eco_leaf</span>
                        Outdoor
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Panel: Settings Form (7 Columns) */}
                    <form onSubmit={handleSaveSettings} className="space-y-6 lg:col-span-7">
                      <div className="bg-white/20 dark:bg-white/2 rounded-3xl p-5 border border-gray-100 dark:border-white/5 space-y-6">
                        
                        {/* 0. Crop Automation Preset */}
                        <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-4 border border-white/5 space-y-3">
                          <label className="text-xs font-extrabold uppercase text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="material-symbols-rounded text-sm">potted_plant</span>
                            Profil Otomatisasi Tanaman (Preset)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <select
                                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-emerald-500 transition-all font-bold text-gray-900 dark:text-white text-xs cursor-pointer"
                                value={sysPlantPreset}
                                onChange={e => handlePresetChange(e.target.value as any)}
                              >
                                <option value="caisim">🥬 Caisim / Sayuran Daun</option>
                                <option value="melon">🍈 Melon / Hortikultura</option>
                                <option value="aroid">🪴 Aroid / Tanaman Hias</option>
                                <option value="sukulen">🌵 Kaktus / Sukulen</option>
                                <option value="custom">⚙️ Kustom (Atur Manual)</option>
                              </select>
                            </div>
                            <div className="text-[10px] text-gray-400 font-semibold leading-relaxed flex items-center bg-black/5 dark:bg-black/20 p-2.5 rounded-xl border border-white/5">
                              {sysPlantPreset === 'caisim' && "🥦 Optimal untuk sawi, pakcoy, selada. Membutuhkan air berlebih, suhu sejuk (<32°C), dan kelembaban tinggi."}
                              {sysPlantPreset === 'melon' && "🍉 Cocok untuk tanaman buah merambat. Membutuhkan suhu hangat (<34°C) dengan tanah lembab sedang."}
                              {sysPlantPreset === 'aroid' && "🌿 Sangat baik untuk Monstera, Philodendron, Anthurium. Menyukai kelembaban udara ekstra tinggi."}
                              {sysPlantPreset === 'sukulen' && "🏜️ Ideal untuk lidah buaya dan kaktus gurun. Meminimalisir penyiraman kecuali tanah sangat kering."}
                              {sysPlantPreset === 'custom' && "🛠️ Parameter disesuaikan sendiri secara manual. Mode preset otomatis dinonaktifkan."}
                            </div>
                          </div>
                        </div>

                        {/* A. AMBANG BATAS SENSOR */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-rounded text-xs text-gray-400 font-bold">tune</span>
                            Ambang Batas Sensor Otomatisasi
                          </h4>

                          {/* 1. Max Temp Threshold */}
                          <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-4 border border-white/5">
                            <div className="flex justify-between items-baseline mb-2">
                              <label className="text-xs font-extrabold uppercase text-gray-500 dark:text-white/40 flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-sm text-red-500">thermostat</span>
                                Batas Suhu Maksimal
                              </label>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{sysTempThreshold}°C</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="15"
                                max="45"
                                step="0.5"
                                className="flex-1 accent-emerald-500 cursor-pointer"
                                value={sysTempThreshold}
                                onChange={e => {
                                  setSysTempThreshold(parseFloat(e.target.value));
                                  setSysPlantPreset('custom');
                                }}
                              />
                              <input
                                type="number"
                                step="0.1"
                                required
                                className="w-16 px-2 py-1.5 text-center text-xs font-bold bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 dark:text-white"
                                value={sysTempThreshold}
                                onChange={e => {
                                  setSysTempThreshold(parseFloat(e.target.value) || 0);
                                  setSysPlantPreset('custom');
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium mt-1">Pompa menyala otomatis jika suhu di atas batas ini untuk menurunkan panas.</p>
                          </div>

                          {/* 2. Min Humidity Threshold */}
                          <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-4 border border-white/5">
                            <div className="flex justify-between items-baseline mb-2">
                              <label className="text-xs font-extrabold uppercase text-gray-500 dark:text-white/40 flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-sm text-blue-500">humidity_low</span>
                                Batas Kelembaban Udara Minimal
                              </label>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{sysHumidityThreshold}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="20"
                                max="90"
                                step="1"
                                className="flex-1 accent-emerald-500 cursor-pointer"
                                value={sysHumidityThreshold}
                                onChange={e => {
                                  setSysHumidityThreshold(parseInt(e.target.value));
                                  setSysPlantPreset('custom');
                                }}
                              />
                              <input
                                type="number"
                                required
                                className="w-16 px-2 py-1.5 text-center text-xs font-bold bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 dark:text-white"
                                value={sysHumidityThreshold}
                                onChange={e => {
                                  setSysHumidityThreshold(parseInt(e.target.value) || 0);
                                  setSysPlantPreset('custom');
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium mt-1">Pompa menyala otomatis jika kelembaban udara turun di bawah batas ini.</p>
                          </div>

                          {/* 3. Min Soil Moisture Threshold */}
                          <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-4 border border-white/5">
                            <div className="flex justify-between items-baseline mb-2">
                              <label className="text-xs font-extrabold uppercase text-gray-500 dark:text-white/40 flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-sm text-emerald-500 font-bold">potted_plant</span>
                                Batas Kelembaban Tanah Minimal
                              </label>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{sysSoilThreshold}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="10"
                                max="90"
                                step="1"
                                className="flex-1 accent-emerald-500 cursor-pointer"
                                value={sysSoilThreshold}
                                onChange={e => {
                                  setSysSoilThreshold(parseInt(e.target.value));
                                  setSysPlantPreset('custom');
                                }}
                              />
                              <input
                                type="number"
                                required
                                className="w-16 px-2 py-1.5 text-center text-xs font-bold bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 dark:text-white"
                                value={sysSoilThreshold}
                                onChange={e => {
                                  setSysSoilThreshold(parseInt(e.target.value) || 0);
                                  setSysPlantPreset('custom');
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium mt-1">Pompa menyala otomatis jika kadar air/kelembaban dalam tanah di bawah batas ini.</p>
                          </div>
                        </div>

                        {/* B. PENGATURAN PERANGKAT IOT */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-rounded text-xs text-gray-400 font-bold">developer_board</span>
                            Konfigurasi Hardware & Misting
                          </h4>
                          
                          <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-4 border border-white/5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* 1. Durasi */}
                              <div>
                                <label className="text-xs font-extrabold uppercase text-gray-500 dark:text-white/40 mb-1.5 flex items-center gap-1.5">
                                  <span className="material-symbols-rounded text-sm text-amber-500">timer</span>
                                  Durasi Menyala (Detik)
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  max="60"
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-emerald-500 transition-all font-bold text-gray-900 dark:text-white text-xs"
                                  value={sysMistingTime}
                                  onChange={e => setSysMistingTime(parseInt(e.target.value) || 0)}
                                />
                                <p className="text-[9px] text-gray-400 font-medium mt-1">Durasi pompa menyala ketika terpicu.</p>
                              </div>

                              {/* 2. Telemetry Interval */}
                              <div>
                                <label className="text-xs font-extrabold uppercase text-gray-500 dark:text-white/40 mb-1.5 flex items-center gap-1.5">
                                  <span className="material-symbols-rounded text-sm text-emerald-500">sync_alt</span>
                                  Interval Telemetri Data
                                </label>
                                <select
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-emerald-500 transition-all font-bold text-gray-900 dark:text-white text-xs cursor-pointer"
                                  value={sysTelemetryInterval}
                                  onChange={e => setSysTelemetryInterval(parseInt(e.target.value))}
                                >
                                  <option value={10}>10 Detik (Sensitif/Realtime)</option>
                                  <option value={30}>30 Detik (Ideal/Standar)</option>
                                  <option value={60}>1 Menit (Hemat Daya)</option>
                                  <option value={300}>5 Menit (Mode Bandwidth Rendah)</option>
                                </select>
                                <p className="text-[9px] text-gray-400 font-medium mt-1">Frekuensi pengiriman sensor ESP32 ke cloud.</p>
                              </div>
                            </div>

                            {/* 3. Pola Penyiraman */}
                            <div>
                              <label className="text-xs font-extrabold uppercase text-gray-500 dark:text-white/40 mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-sm text-cyan-500">water_drop</span>
                                Pola Misting (Watering Pattern)
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSysMistingPattern('continuous')}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${sysMistingPattern === 'continuous' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-transparent text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-white/5'}`}
                                >
                                  <span className="material-symbols-rounded text-sm">waves</span>
                                  Kontinu (Terus)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSysMistingPattern('pulsed')}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${sysMistingPattern === 'pulsed' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' : 'bg-transparent text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-white/5'}`}
                                >
                                  <span className="material-symbols-rounded text-sm">pulse</span>
                                  Pulsasi (5s On/5s Off)
                                </button>
                              </div>
                              <p className="text-[9px] text-gray-400 font-medium mt-1.5">Pulsasi membantu tanah kering menyerap kelembaban air tanpa genangan.</p>
                            </div>
                          </div>
                        </div>

                        {/* C. KALIBRASI SENSOR (CALIBRATION OFFSETS) */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-rounded text-xs text-gray-400 font-bold">build</span>
                            Kalibrasi Deviasi Sensor Fisik
                          </h4>

                          <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-4 border border-white/5 space-y-4">
                            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                              ⚠️ Sesuaikan nilai offset di bawah jika sensor fisik mengalami degradasi performa atau memiliki deviasi pembacaan dibandingkan alat ukur manual.
                            </p>

                            {/* 1. Temp Offset */}
                            <div>
                              <div className="flex justify-between items-baseline mb-1">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                                  Kalibrasi Suhu
                                </label>
                                <span className={`text-xs font-black ${sysTempOffset > 0 ? 'text-amber-500' : sysTempOffset < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                  {sysTempOffset > 0 ? `+${sysTempOffset.toFixed(1)}` : sysTempOffset.toFixed(1)}°C
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-blue-500 font-bold">-5.0°C</span>
                                <input
                                  type="range"
                                  min="-5.0"
                                  max="5.0"
                                  step="0.1"
                                  className="flex-1 accent-emerald-500 cursor-pointer h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none"
                                  value={sysTempOffset}
                                  onChange={e => setSysTempOffset(parseFloat(e.target.value))}
                                />
                                <span className="text-[10px] text-amber-500 font-bold">+5.0°C</span>
                              </div>
                            </div>

                            {/* 2. Hum Offset */}
                            <div>
                              <div className="flex justify-between items-baseline mb-1">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                                  Kalibrasi Kelembaban Udara
                                </label>
                                <span className={`text-xs font-black ${sysHumOffset > 0 ? 'text-emerald-500' : sysHumOffset < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                  {sysHumOffset > 0 ? `+${sysHumOffset}` : sysHumOffset}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-blue-500 font-bold">-15%</span>
                                <input
                                  type="range"
                                  min="-15"
                                  max="15"
                                  step="1"
                                  className="flex-1 accent-emerald-500 cursor-pointer h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none"
                                  value={sysHumOffset}
                                  onChange={e => setSysHumOffset(parseInt(e.target.value))}
                                />
                                <span className="text-[10px] text-emerald-500 font-bold">+15%</span>
                              </div>
                            </div>

                            {/* 3. Soil Offset */}
                            <div>
                              <div className="flex justify-between items-baseline mb-1">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                                  Kalibrasi Kelembaban Tanah
                                </label>
                                <span className={`text-xs font-black ${sysSoilOffset > 0 ? 'text-emerald-500' : sysSoilOffset < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                  {sysSoilOffset > 0 ? `+${sysSoilOffset}` : sysSoilOffset}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-blue-500 font-bold">-15%</span>
                                <input
                                  type="range"
                                  min="-15"
                                  max="15"
                                  step="1"
                                  className="flex-1 accent-emerald-500 cursor-pointer h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none"
                                  value={sysSoilOffset}
                                  onChange={e => setSysSoilOffset(parseInt(e.target.value))}
                                />
                                <span className="text-[10px] text-emerald-500 font-bold">+15%</span>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-4 pt-2">
                        <button
                          type="submit"
                          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-extrabold hover:opacity-90 shadow-md shadow-emerald-500/15 transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                        >
                          <span className="material-symbols-rounded text-base">save</span>
                          Simpan Pengaturan
                        </button>

                        {saveSuccess && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                            <span className="material-symbols-rounded text-sm">check_circle</span>
                            Pengaturan {selectedSystemDevice} Berhasil Disimpan!
                          </span>
                        )}
                      </div>
                    </form>

                    {/* Right Panel: Live Sensor comparison Widget (5 Columns) */}
                    <div className="lg:col-span-5 space-y-4">
                      
                      {/* Widget Container */}
                      <div className="bg-[#0A2F1F]/40 dark:bg-black/35 backdrop-blur-2xl rounded-3xl p-5 border border-emerald-500/10 dark:border-white/5 space-y-4">
                        
                        {/* Title */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                          <span className="text-xs font-extrabold uppercase text-emerald-500 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            Monitor IoT Real-time
                          </span>
                          <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {selectedSystemDevice}
                          </span>
                        </div>

                        {/* Comparative Status widget */}
                        <div className="space-y-3.5">
                          
                          {/* 1. Temp Comparison */}
                          <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-3.5 border border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                              <span>Suhu Ruangan</span>
                              <span>Ambang Batas</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-1.5">
                              <div>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">
                                  {deviceSensors.temp !== null ? `${(deviceSensors.temp + sysTempOffset).toFixed(1)}°C` : '---'}
                                </span>
                                {sysTempOffset !== 0 && (
                                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-2">
                                    Calibrated ({sysTempOffset > 0 ? `+${sysTempOffset.toFixed(1)}` : sysTempOffset.toFixed(1)}°C)
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-gray-500 dark:text-white/60">
                                {sysTempThreshold.toFixed(1)}°C
                              </span>
                            </div>
                            
                            {/* Visual Comparison Alert */}
                            {deviceSensors.temp !== null && (
                              <div className="mt-2.5">
                                {(deviceSensors.temp + sysTempOffset) > sysTempThreshold ? (
                                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                                    <span className="material-symbols-rounded text-sm">warning</span>
                                    Suhu Panas! Kipas/Pompa Otomatis Menyala
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                    <span className="material-symbols-rounded text-sm">check_circle</span>
                                    Suhu Aman di Bawah Batas Maksimal
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 2. Hum Comparison */}
                          <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-3.5 border border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                              <span>Kelembaban Udara</span>
                              <span>Ambang Batas</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-1.5">
                              <div>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">
                                  {deviceSensors.hum !== null ? `${Math.round(deviceSensors.hum + sysHumOffset)}%` : '---'}
                                </span>
                                {sysHumOffset !== 0 && (
                                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-2">
                                    Calibrated ({sysHumOffset > 0 ? `+${sysHumOffset}` : sysHumOffset}%)
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-gray-500 dark:text-white/60">
                                {sysHumidityThreshold}%
                              </span>
                            </div>

                            {/* Visual Comparison Alert */}
                            {deviceSensors.hum !== null && (
                              <div className="mt-2.5">
                                {Math.round(deviceSensors.hum + sysHumOffset) < sysHumidityThreshold ? (
                                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                                    <span className="material-symbols-rounded text-sm">warning</span>
                                    Kelembaban Udara Kering! Misting Otomatis Menyala
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                    <span className="material-symbols-rounded text-sm">check_circle</span>
                                    Kelembaban Udara Stabil di Atas Batas
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 3. Soil Comparison */}
                          <div className="bg-white/5 dark:bg-white/2 rounded-2xl p-3.5 border border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                              <span>Kelembaban Tanah</span>
                              <span>Ambang Batas</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-1.5">
                              <div>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">
                                  {deviceSensors.soil !== null ? `${Math.round(deviceSensors.soil + sysSoilOffset)}%` : '---'}
                                </span>
                                {sysSoilOffset !== 0 && (
                                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-2">
                                    Calibrated ({sysSoilOffset > 0 ? `+${sysSoilOffset}` : sysSoilOffset}%)
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-bold text-gray-500 dark:text-white/60">
                                {sysSoilThreshold}%
                              </span>
                            </div>

                            {/* Visual Comparison Alert */}
                            {deviceSensors.soil !== null && (
                              <div className="mt-2.5">
                                {Math.round(deviceSensors.soil + sysSoilOffset) < sysSoilThreshold ? (
                                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                                    <span className="material-symbols-rounded text-sm">warning</span>
                                    Kondisi Tanah Kering! Pompa Air Otomatis Menyala
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                    <span className="material-symbols-rounded text-sm">check_circle</span>
                                    Kadar Air Tanah Ideal & Subur
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Automation Overview Card */}
                        <div className="bg-emerald-500/5 rounded-2xl p-3.5 border border-emerald-500/10 space-y-1">
                          <h4 className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-rounded text-xs">smart_toy</span>
                            Status Otomatisasi Terkini
                          </h4>
                          <p className="text-[10px] text-gray-500 dark:text-white/40 font-semibold leading-relaxed">
                            {deviceSensors.temp !== null && deviceSensors.hum !== null && deviceSensors.soil !== null ? (
                              ((deviceSensors.temp + sysTempOffset) > sysTempThreshold || 
                               Math.round(deviceSensors.hum + sysHumOffset) < sysHumidityThreshold || 
                               Math.round(deviceSensors.soil + sysSoilOffset) < sysSoilThreshold) ? (
                                <span className="text-red-500 font-extrabold flex flex-col gap-0.5">
                                  <span>🚨 Pompa Menyala Otomatis karena terpicu sensor:</span>
                                  {(deviceSensors.temp + sysTempOffset) > sysTempThreshold && (
                                    <span className="text-[9px] list-disc pl-3">
                                      • Suhu ruangan terlalu panas ({(deviceSensors.temp + sysTempOffset).toFixed(1)}°C &gt; {sysTempThreshold.toFixed(1)}°C)
                                    </span>
                                  )}
                                  {Math.round(deviceSensors.hum + sysHumOffset) < sysHumidityThreshold && (
                                    <span className="text-[9px] list-disc pl-3">
                                      • Udara di sekitar terlalu kering ({Math.round(deviceSensors.hum + sysHumOffset)}% &lt; {sysHumidityThreshold}%)
                                    </span>
                                  )}
                                  {Math.round(deviceSensors.soil + sysSoilOffset) < sysSoilThreshold && (
                                    <span className="text-[9px] list-disc pl-3">
                                      • Kelembaban tanah terlalu kering ({Math.round(deviceSensors.soil + sysSoilOffset)}% &lt; {sysSoilThreshold}%)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-emerald-500 font-extrabold">🌱 Seluruh parameter lingkungan (Suhu, Udara, Tanah) dalam keadaan optimal. Sistem otomasi aman/standby.</span>
                              )
                            ) : (
                              "Menunggu sinyal data sensor dari modul IoT ESP32..."
                            )}
                          </p>
                        </div>

                      </div>

                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </div>

      </div>
    </AppLayout>
  );
}
