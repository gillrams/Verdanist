import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  Building2, Bell, ChevronRight,
  Sun, Wifi, LogOut, Key, Camera, Pencil, Globe
} from "lucide-react";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { getNotifPrefs, saveNotifPrefs, registerServiceWorkerAndSubscribe } from '../utils/notifications';

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-6 mb-2">
      {icon}
      <span style={{ fontSize: 12, fontWeight: 700 }} className="text-muted-foreground/80 uppercase tracking-wider">{title}</span>
    </div>
  );
}

function SettingsRow({ label, sub, suffix, icon, onClick }: { label: string; sub?: string; suffix?: React.ReactNode; icon?: React.ReactNode; onClick?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={onClick}>
      {icon && (
        <div className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
      )}
      <div className="flex-1">
        <p style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">{label}</p>
        {sub && <p style={{ fontSize: 12 }} className="text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {suffix ?? <ChevronRight className="w-4 h-4 text-muted-foreground/60" />}
    </div>
  );
}

function ToggleRow({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
      <div className="flex-1">
        <p style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">{label}</p>
        <p style={{ fontSize: 12 }} className="text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 ${value ? "bg-primary" : "bg-border"}`}
      >
        <div className={`w-5 h-5 bg-card rounded-full shadow-md transition-all ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, logout, currentFarm, clearFarmAccess } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [notifTemp, setNotifTemp] = useState(false);
  const [notifRH, setNotifRH] = useState(false);
  const [notifPump, setNotifPump] = useState(false);
  
  const CURRENT_VERSION = "2.4.1";
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);

  // Load local notification settings on mount
  useEffect(() => {
    const prefs = getNotifPrefs();
    setNotifTemp(prefs.notifTemp);
    setNotifRH(prefs.notifRH);
    setNotifPump(prefs.notifPump);

    // Check for updates
    const checkUpdate = async () => {
      try {
        const res = await fetch('/version.json?t=' + new Date().getTime());
        const data = await res.json();
        if (data.latest_version && data.latest_version !== CURRENT_VERSION) {
          setUpdateAvailable(true);
          setUpdateData(data);
        }
      } catch (e) {
        console.error("Gagal mengecek pembaruan", e);
      }
    };
    checkUpdate();
  }, []);

  const handleNotifToggle = async (type: 'temp' | 'rh' | 'pump', value: boolean) => {
    if (value) {
      if (!user) {
        alert("Silakan login terlebih dahulu.");
        return;
      }
      const success = await registerServiceWorkerAndSubscribe(user.id);
      if (!success) {
        alert("Gagal berlangganan notifikasi. Pastikan Anda mengizinkan notifikasi di browser.");
        return; // Don't enable the toggle if permission is denied
      }
    }

    const currentPrefs = getNotifPrefs();
    const newPrefs = { ...currentPrefs };
    
    if (type === 'temp') {
      setNotifTemp(value);
      newPrefs.notifTemp = value;
    } else if (type === 'rh') {
      setNotifRH(value);
      newPrefs.notifRH = value;
    } else if (type === 'pump') {
      setNotifPump(value);
      newPrefs.notifPump = value;
    }
    
    saveNotifPrefs(newPrefs);
  };


  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleUpdateName = async () => {
    const newName = window.prompt(t('settings.enterNewName'), user?.displayName || "");
    if (!newName || newName.trim() === "" || newName === user?.displayName) return;
    
    setIsUpdatingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: newName.trim() }
    });
    
    // Update the profiles table as well so it reflects in the Admin dashboard
    try {
      await supabase.from('profiles').update({ full_name: newName.trim() }).eq('id', user?.id);
    } catch (e) { console.error('Profiles table update failed', e); }

    setIsUpdatingProfile(false);
    
    if (error) {
      alert(t('settings.failName') + error.message);
    } else {
      window.location.reload();
    }
  };

  const handleUpdatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUpdatingProfile(true);
    const fileExt = file.name.split('.').pop();
    // Using user.id as the folder/filename ensures it overwrites the old photo (upsert)
    // and keeps storage clean (1 photo per user max).
    const filePath = `${user.id}/profile.${fileExt}`;

    try {
      // 1. Upload to Supabase Storage Bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true, // This automatically replaces the old photo!
          cacheControl: '3600',
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Append a timestamp to the URL to bypass browser cache when the image updates
      const finalUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

      // 3. Update User Profile with the new URL (use custom_avatar_url to prevent Google overwrite)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { custom_avatar_url: finalUrl }
      });

      if (updateError) {
        throw updateError;
      }

      // 4. Update the profiles table as well
      try {
        await supabase.from('profiles').update({ custom_avatar_url: finalUrl }).eq('id', user.id);
      } catch (e) { console.error('Profiles table update failed', e); }

      window.location.reload();
    } catch (error: any) {
      alert(t('settings.failPhoto') + (error.message || 'Error'));
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.displayName ? user.displayName.substring(0, 1).toUpperCase() : (isAdmin ? "A" : "U");

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background pb-28">
        <div className="px-6 pt-14 pb-6 flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground">
              {t('settings.title')}
            </h1>
            <p style={{ fontSize: 14 }} className="text-muted-foreground">{t('settings.subtitle')}</p>
          </div>
          <ThemeToggle className="w-10 h-10 bg-card border border-border" />
        </div>

        {/* Profile */}
        <div className="px-6 mb-5">
          <div className="bg-card border border-border shadow-sm rounded-3xl p-5 relative overflow-hidden">
            {isUpdatingProfile && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/80 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-primary/50 transition-all">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600 }} className="text-primary-foreground">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-3 h-3 text-ring" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUpdatePhoto} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleUpdateName}>
                  <p style={{ fontWeight: 600, fontSize: 16 }} className="text-foreground group-hover:text-primary transition-colors">
                    {user?.displayName || t('settings.user')}
                  </p>
                  <Pencil className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                </div>
                <p style={{ fontSize: 13 }} className="text-muted-foreground mt-0.5">
                  {user?.email || "email@domain.com"}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-ring" />
                  <span style={{ fontSize: 11, fontWeight: 600 }} className="text-ring capitalize">
                    {user?.role || t('settings.guest')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SectionHeader icon={<Building2 className="w-4 h-4 text-ring" />} title={t('settings.activeFarm')} />
        <div className="px-6 mb-5">
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden divide-y divide-border">
            <SettingsRow label={currentFarm?.name || "Kebun Utama"} sub={`${currentFarm?.location || 'Bogor'} · ${t('common.active')}`} suffix={<span className="text-ring" style={{ fontSize: 12, fontWeight: 600 }}>{t('settings.connected')}</span>} />
            <SettingsRow label={t('settings.changeFarm')} sub={t('settings.changeFarmSub')} onClick={() => { clearFarmAccess(); navigate('/farms'); }} />
            <SettingsRow label={t('settings.accessToken')} sub={(() => {
              const saved = JSON.parse(localStorage.getItem('verdanist_saved_tokens') || '{}');
              const token = currentFarm?.id ? saved[currentFarm.id] : null;
              if (token && token.length > 6) {
                return token.substring(0, token.length - 6) + '●●●●●●';
              }
              return token || '—';
            })()} icon={<Key className="w-4 h-4 text-ring" />} />
          </div>
        </div>


        <SectionHeader icon={<Bell className="w-4 h-4 text-ring" />} title={t('settings.notifications')} />
        <div className="px-6 mb-5">
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden divide-y divide-border">
            <ToggleRow label={t('settings.alertTemp')} sub={t('settings.alertTempSub')} value={notifTemp} onChange={(v) => handleNotifToggle('temp', v)} />
            <ToggleRow label={t('settings.alertHum')} sub={t('settings.alertHumSub')} value={notifRH} onChange={(v) => handleNotifToggle('rh', v)} />
            <ToggleRow label={t('settings.pumpStatus')} sub={t('settings.pumpStatusSub')} value={notifPump} onChange={(v) => handleNotifToggle('pump', v)} />
          </div>
        </div>

        <SectionHeader icon={<Sun className="w-4 h-4 text-ring" />} title={t('settings.appearance')} />
        <div className="px-6 mb-5">
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">{t('settings.theme')}</p>
                <p style={{ fontSize: 12 }} className="text-muted-foreground mt-0.5">{t('settings.themeSub')}</p>
              </div>
              <ThemeToggle className="scale-90" />
            </div>
            
            <div className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={toggleLang}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">{t('settings.language')}</p>
                <p style={{ fontSize: 12 }} className="text-muted-foreground mt-0.5">{t('settings.langSub')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, fontWeight: 600 }} className="text-primary">{lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
                <Globe className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <SectionHeader icon={<Wifi className="w-4 h-4 text-ring" />} title={t('settings.sensorConn')} />
        <div className="px-6 mb-5">
          <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden divide-y divide-border">
            <SettingsRow label="ESP32 Gateway" sub={`${t('settings.connected')} · 192.168.1.20`} suffix={<div className="w-2 h-2 rounded-full bg-ring" />} />
            <SettingsRow label={t('settings.updateInterval')} sub={t('settings.every30s')} />
            <SettingsRow label="API Endpoint" sub="api.verdanist.id/v2" />
          </div>
        </div>

        <SectionHeader icon={<Building2 className="w-4 h-4 text-ring" />} title="Versi Aplikasi" />
        <div className="px-6 mb-5">
          <div className="bg-card border border-border shadow-sm rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <p style={{ fontSize: 14, fontWeight: 500 }} className="text-foreground">Verdanist v{CURRENT_VERSION}</p>
                <p style={{ fontSize: 12 }} className="text-muted-foreground mt-0.5">Versi Saat Ini</p>
              </div>
              {updateAvailable && updateData ? (
                <button
                  onClick={() => {
                    if (window.confirm(`Update tersedia: v${updateData.latest_version}\n\n${updateData.release_notes}\n\nApakah Anda ingin mengunduh sekarang?`)) {
                      window.location.href = updateData.download_url;
                    }
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm animate-pulse"
                >
                  Update Tersedia
                </button>
              ) : (
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
                  Versi Terbaru
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 mb-4">
          <button
            onClick={handleLogout}
            className="w-full bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl py-4 flex items-center justify-center gap-2 hover:bg-destructive/20 active:scale-[0.98] transition-all shadow-sm"
            style={{ fontWeight: 600, fontSize: 15 }}
          >
            <LogOut className="w-5 h-5" />
            {t('settings.logoutBtn')}
          </button>
        </div>
        <p style={{ fontSize: 11 }} className="text-center text-muted-foreground/40 mb-6">Verdanist v2.4.1 · Build 2026.05</p>
      </div>
    </>
  );
}
