import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Building2, Users, Cpu, CheckCircle2, Clock,
  Wifi, WifiOff, UserCheck, RefreshCw, ShieldAlert
} from "lucide-react";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';

type AdminTab = "kebun" | "pengguna" | "sistem";

export default function Admin() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<AdminTab>("kebun");
  const [farms, setFarms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data: farmsData } = await supabase.from('farms').select('*').order('created_at', { ascending: false });
      if (farmsData) setFarms(farmsData);

      const { data: profilesData } = await supabase.from('profiles').select('*').order('role', { ascending: true });
      if (profilesData) setUsers(profilesData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveFarm = async (id: string) => {
    setActionLoading(id);
    await supabase.from('farms').update({ status: 'active' }).eq('id', id);
    setFarms(f => f.map(farm => farm.id === id ? { ...farm, status: 'active' } : farm));
    setActionLoading(null);
  };

  const deleteFarm = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    setActionLoading(id);
    await supabase.from('farms').delete().eq('id', id);
    setFarms(f => f.filter(farm => farm.id !== id));
    setActionLoading(null);
  };

  const updateRole = async (id: string, role: string) => {
    setActionLoading(id);
    await supabase.from('profiles').update({ role }).eq('id', id);
    setUsers(u => u.map(user => user.id === id ? { ...user, role } : user));
    setActionLoading(null);
  };

  const pendingCount = users.filter((u) => u.role === "guest").length;
  const activeCount = users.filter((u) => u.role !== "guest").length;
  const activeFarms = farms.filter((f) => f.status === "active").length;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background pb-28">
        {/* Admin header */}
        <div className="px-6 pt-14 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              <p style={{ fontSize: 12, fontWeight: 700 }} className="text-destructive uppercase tracking-widest">
                {t('admin.panel')}
              </p>
            </div>
            <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground">
              {t('admin.control')}
            </h1>
          </div>
          <ThemeToggle className="w-10 h-10 bg-card border border-border" />
        </div>

        {/* Top stats */}
        <div className="px-6 mb-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('admin.activeFarms'), value: `${activeFarms}/${farms.length}`, icon: <Wifi className="w-4 h-4" />, color: "var(--color-primary)", bg: "var(--color-secondary)" },
              { label: t('admin.activeUsers'), value: `${activeCount}`, icon: <Users className="w-4 h-4" />, color: "var(--color-chart-2)", bg: "rgba(107, 153, 200, 0.1)" },
              { label: t('admin.pendingGuests'), value: `${pendingCount}`, icon: <Clock className="w-4 h-4" />, color: "var(--color-chart-3)", bg: "rgba(245, 158, 11, 0.1)" },
              { label: t('admin.systemStatus'), value: t('admin.safe'), icon: <CheckCircle2 className="w-4 h-4" />, color: "var(--color-primary)", bg: "var(--color-secondary)" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4 border border-border shadow-sm"
                style={{ background: s.bg }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: s.color }}>
                    {s.value}
                  </span>
                </div>
                <p style={{ fontSize: 12 }} className="text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab nav */}
        <div className="px-6 mb-4">
          <div className="bg-card border border-border rounded-2xl p-1 flex gap-1 shadow-sm">
            {([
              { id: "kebun", label: t('admin.tabFarms'), icon: <Building2 className="w-3.5 h-3.5" /> },
              { id: "pengguna", label: t('admin.tabUsers'), icon: <Users className="w-3.5 h-3.5" />, badge: pendingCount },
              { id: "sistem", label: t('admin.tabSystem'), icon: <Cpu className="w-3.5 h-3.5" /> },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as AdminTab)}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all relative shadow-sm ${
                  tab === t.id
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "text-muted-foreground hover:bg-secondary/50"
                }`}
                style={{ fontWeight: 600, fontSize: 13 }}
              >
                {t.icon}
                {t.label}
                {"badge" in t && t.badge > 0 && (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                    style={{ fontSize: 9, fontWeight: 700, color: "white" }}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6">
          {loading ? (
             <div className="text-center py-10 text-muted-foreground">{t('admin.loading')}</div>
          ) : (
            <>
              {tab === "kebun" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 13 }} className="text-muted-foreground">{farms.length} {t('admin.registeredFarms')}</span>
                  </div>
                  {farms.map((farm) => (
                    <div
                      key={farm.id}
                      className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4 shadow-sm transition-colors hover:bg-secondary/50"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        farm.status === "active" ? "bg-secondary" : "bg-destructive/10"
                      }`}>
                        {farm.status === "active"
                          ? <Wifi className="w-5 h-5 text-primary" />
                          : <WifiOff className="w-5 h-5 text-destructive" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground truncate">{farm.name}</p>
                        </div>
                        <p style={{ fontSize: 12 }} className="text-muted-foreground">{farm.location} · {farm.id.substring(0,8)}</p>
                          <span
                            className={`inline-block mt-1.5 rounded-full px-2 py-0.5 ${
                              farm.status === "active" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                            }`}
                            style={{ fontSize: 11, fontWeight: 600 }}
                          >
                            {farm.status === "active" ? t('admin.activeStatus') : t('admin.pendingStatus')}
                          </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {farm.status !== 'active' && (
                          <button disabled={actionLoading === farm.id} onClick={() => approveFarm(farm.id)} className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl" style={{ fontSize: 12, fontWeight: 600 }}>{t('admin.approveBtn')}</button>
                        )}
                        <button disabled={actionLoading === farm.id} onClick={() => deleteFarm(farm.id)} className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-xl" style={{ fontSize: 12, fontWeight: 600 }}>{t('admin.deleteBtn')}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "pengguna" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 13 }} className="text-muted-foreground">{users.length} {t('admin.usersCount')}</span>
                  </div>

                  {users.filter(u => u.role === "guest").map((user) => (
                    <div key={user.id} className="bg-chart-3/5 border border-chart-3/20 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 bg-chart-3/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600 }} className="text-chart-3">
                            {(user.display_name || user.email || "G")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground">{user.display_name || t('admin.guest')}</p>
                          <p style={{ fontSize: 12 }} className="text-muted-foreground">{user.email}</p>
                        </div>
                        <span className="bg-chart-3/15 text-chart-3 rounded-full px-2 py-0.5 flex-shrink-0"
                          style={{ fontSize: 10, fontWeight: 700 }}>
                          {t('admin.pendingStatus')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateRole(user.id, 'farmer')}
                          className="flex-1 bg-primary/10 text-primary border border-primary/20 rounded-xl py-2 flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors"
                          style={{ fontWeight: 600, fontSize: 13 }}
                        >
                          <UserCheck className="w-4 h-4" />
                          {t('admin.makeFarmer')}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm mt-3">
                    {users.filter(u => u.role !== "guest").map((user) => (
                      <div key={user.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-secondary">
                          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 600 }} className="text-primary">
                            {(user.display_name || user.email || "U")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontWeight: 600, fontSize: 13 }} className="text-foreground">{user.display_name || user.email}</p>
                          <p style={{ fontSize: 11 }} className="text-muted-foreground capitalize">{user.role}</p>
                        </div>
                        <button
                          onClick={() => updateRole(user.id, user.role === 'admin' ? 'farmer' : 'admin')}
                          className="text-muted-foreground hover:text-primary transition-colors text-xs border border-border px-2 py-1 rounded"
                        >
                          {t('admin.changeTo')} {user.role === 'admin' ? 'Farmer' : 'Admin'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "sistem" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 13 }} className="text-muted-foreground">{t('admin.infraStatus')}</span>
                    <button onClick={fetchAdminData} className="flex items-center gap-1.5 text-muted-foreground bg-card border border-border rounded-xl px-3 py-1.5 hover:bg-secondary transition-colors shadow-sm"
                      style={{ fontSize: 12 }}>
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t('admin.refresh')}
                    </button>
                  </div>

                  <div className="bg-secondary border border-ring/20 rounded-2xl px-4 py-4 flex items-center gap-3 mb-2 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-ring" />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground">{t('admin.sysRunning')}</p>
                      <p style={{ fontSize: 12 }} className="text-muted-foreground">{t('admin.sysNormal')}</p>
                    </div>
                  </div>


                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
