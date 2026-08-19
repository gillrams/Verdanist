import { useState } from "react";
import {
  Building2, Users, Cpu, CheckCircle2, Clock, XCircle,
  Wifi, WifiOff, AlertTriangle, ChevronRight, UserCheck,
  UserX, Plus, RefreshCw, ShieldAlert
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

type AdminTab = "kebun" | "pengguna" | "sistem";

const FARMS = [
  { id: "1", name: "Kebun Utama Cikaret", location: "Bogor", zones: 4, status: "online" as const, members: 3, alerts: 0 },
  { id: "2", name: "Greenhouse Lembang B", location: "Lembang", zones: 2, status: "online" as const, members: 5, alerts: 1 },
  { id: "3", name: "Ladang Tomat Ciwidey", location: "Ciwidey", zones: 3, status: "offline" as const, members: 2, alerts: 2 },
  { id: "4", name: "Nursery Sentul", location: "Sentul", zones: 6, status: "online" as const, members: 4, alerts: 0 },
];

const USERS = [
  { id: "1", name: "Rizki Ananda", email: "rizki@email.com", farm: "Kebun Utama", role: "operator", status: "active" as const, joined: "12 Mei 2026" },
  { id: "2", name: "Budi Santoso", email: "budi@email.com", farm: "Greenhouse B", role: "operator", status: "active" as const, joined: "8 Apr 2026" },
  { id: "3", name: "Siti Rahayu", email: "siti@email.com", farm: "Nursery Sentul", role: "viewer", status: "pending" as const, joined: "24 Mei 2026" },
  { id: "4", name: "Andi Pratama", email: "andi@email.com", farm: "Kebun Utama", role: "operator", status: "pending" as const, joined: "25 Mei 2026" },
  { id: "5", name: "Dewi Lestari", email: "dewi@email.com", farm: "Ladang Tomat", role: "viewer", status: "inactive" as const, joined: "1 Mar 2026" },
];

const SYSTEM_INFO = [
  { label: "Versi Firmware ESP32", value: "v3.2.1", ok: true },
  { label: "Uptime Server", value: "14 hari 6 jam", ok: true },
  { label: "Database", value: "PostgreSQL 16.2", ok: true },
  { label: "MQTT Broker", value: "Terhubung", ok: true },
  { label: "API Gateway", value: "api.verdanist.id/v2", ok: true },
  { label: "Backup Terakhir", value: "Hari ini 03:00", ok: true },
  { label: "Penyimpanan", value: "68% dari 500 GB", ok: false },
  { label: "Sensor Offline", value: "2 perangkat", ok: false },
];

export function AdminScreen() {
  const [tab, setTab] = useState<AdminTab>("kebun");
  const [users, setUsers] = useState(USERS);

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const onlineFarms = FARMS.filter((f) => f.status === "online").length;
  const totalAlerts = FARMS.reduce((sum, f) => sum + f.alerts, 0);

  const approveUser = (id: string) => {
    setUsers((us) => us.map((u) => u.id === id ? { ...u, status: "active" as const } : u));
  };
  const rejectUser = (id: string) => {
    setUsers((us) => us.filter((u) => u.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-28">
      {/* Admin header */}
      <div className="px-6 pt-14 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            <p style={{ fontSize: 12, fontWeight: 700 }} className="text-destructive uppercase tracking-widest">
              Panel Admin
            </p>
          </div>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground">
            Kontrol Pusat
          </h1>
        </div>
        <ThemeToggle className="w-10 h-10 bg-card border border-border" />
      </div>

      {/* Top stats */}
      <div className="px-6 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Kebun Online", value: `${onlineFarms}/${FARMS.length}`, icon: <Wifi className="w-4 h-4" />, color: "var(--color-primary)", bg: "var(--color-secondary)" },
            { label: "Pengguna Aktif", value: `${activeCount}`, icon: <Users className="w-4 h-4" />, color: "var(--color-chart-2)", bg: "rgba(107, 153, 200, 0.1)" },
            { label: "Menunggu", value: `${pendingCount}`, icon: <Clock className="w-4 h-4" />, color: "var(--color-chart-3)", bg: "rgba(245, 158, 11, 0.1)" },
            { label: "Alert Aktif", value: `${totalAlerts}`, icon: <AlertTriangle className="w-4 h-4" />, color: "var(--color-destructive)", bg: "var(--color-destructive-foreground)" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4 border border-border shadow-sm"
              style={{ background: s.bg === "var(--color-destructive-foreground)" ? "rgba(239, 68, 68, 0.1)" : s.bg }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: s.color }}>{s.icon}</span>
                <span
                  style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600, color: s.color }}
                >
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
            { id: "kebun", label: "Kebun", icon: <Building2 className="w-3.5 h-3.5" /> },
            { id: "pengguna", label: "Pengguna", icon: <Users className="w-3.5 h-3.5" />, badge: pendingCount },
            { id: "sistem", label: "Sistem", icon: <Cpu className="w-3.5 h-3.5" /> },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
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
        {tab === "kebun" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 13 }} className="text-muted-foreground">{FARMS.length} kebun terdaftar</span>
              <button className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-xl px-3 py-1.5 border border-destructive/20 hover:bg-destructive/20 transition-colors"
                style={{ fontSize: 12, fontWeight: 600 }}>
                <Plus className="w-3.5 h-3.5" />
                Tambah Kebun
              </button>
            </div>
            {FARMS.map((farm) => (
              <div
                key={farm.id}
                className={`bg-card border rounded-2xl p-4 flex items-start gap-4 shadow-sm transition-colors hover:bg-secondary/50 ${
                  farm.alerts > 0 ? "border-destructive/40" : "border-border"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  farm.status === "online" ? "bg-secondary" : "bg-destructive/10"
                }`}>
                  {farm.status === "online"
                    ? <Wifi className="w-5 h-5 text-primary" />
                    : <WifiOff className="w-5 h-5 text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground truncate">{farm.name}</p>
                    {farm.alerts > 0 && (
                      <span className="bg-destructive/15 text-destructive rounded-full px-2 py-0.5 flex-shrink-0"
                        style={{ fontSize: 10, fontWeight: 700 }}>
                        {farm.alerts} alert
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12 }} className="text-muted-foreground">{farm.location} · {farm.zones} zona · {farm.members} anggota</p>
                  <span
                    className={`inline-block mt-1.5 rounded-full px-2 py-0.5 ${
                      farm.status === "online"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {farm.status === "online" ? "Online" : "Offline"}
                  </span>
                </div>
                <button className="text-muted-foreground/60 mt-1">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "pengguna" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 13 }} className="text-muted-foreground">{users.length} pengguna</span>
              {pendingCount > 0 && (
                <span className="bg-chart-3/10 text-chart-3 rounded-full px-3 py-1"
                  style={{ fontSize: 12, fontWeight: 600 }}>
                  {pendingCount} menunggu persetujuan
                </span>
              )}
            </div>

            {/* Pending first */}
            {users.filter(u => u.status === "pending").map((user) => (
              <div key={user.id} className="bg-chart-3/5 border border-chart-3/20 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 bg-chart-3/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 16, fontWeight: 600 }} className="text-chart-3">
                      {user.name[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground">{user.name}</p>
                    <p style={{ fontSize: 12 }} className="text-muted-foreground">{user.email}</p>
                    <p style={{ fontSize: 11 }} className="text-muted-foreground/60 mt-0.5">{user.farm} · Bergabung {user.joined}</p>
                  </div>
                  <span className="bg-chart-3/15 text-chart-3 rounded-full px-2 py-0.5 flex-shrink-0"
                    style={{ fontSize: 10, fontWeight: 700 }}>
                    Menunggu
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveUser(user.id)}
                    className="flex-1 bg-primary/10 text-primary border border-primary/20 rounded-xl py-2 flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors"
                    style={{ fontWeight: 600, fontSize: 13 }}
                  >
                    <UserCheck className="w-4 h-4" />
                    Setujui
                  </button>
                  <button
                    onClick={() => rejectUser(user.id)}
                    className="flex-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl py-2 flex items-center justify-center gap-1.5 hover:bg-destructive/20 transition-colors"
                    style={{ fontWeight: 600, fontSize: 13 }}
                  >
                    <UserX className="w-4 h-4" />
                    Tolak
                  </button>
                </div>
              </div>
            ))}

            {/* Active + inactive */}
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm">
              {users.filter(u => u.status !== "pending").map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-secondary">
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 15, fontWeight: 600 }} className="text-primary">
                      {user.name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontWeight: 600, fontSize: 13 }} className="text-foreground">{user.name}</p>
                    <p style={{ fontSize: 11 }} className="text-muted-foreground">{user.farm} · {user.role}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 flex-shrink-0 ${
                      user.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground/60"
                    }`}
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {user.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "sistem" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 13 }} className="text-muted-foreground">Status infrastruktur</span>
              <button className="flex items-center gap-1.5 text-muted-foreground bg-card border border-border rounded-xl px-3 py-1.5 hover:bg-secondary transition-colors shadow-sm"
                style={{ fontSize: 12 }}>
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {/* Overall status */}
            <div className="bg-secondary border border-ring/20 rounded-2xl px-4 py-4 flex items-center gap-3 mb-2 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-ring" />
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }} className="text-foreground">Semua sistem berjalan</p>
                <p style={{ fontSize: 12 }} className="text-muted-foreground">2 item butuh perhatian</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-sm">
              {SYSTEM_INFO.map((item) => (
                <div key={item.label} className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.ok ? "bg-ring" : "bg-destructive"}`} />
                  <div className="flex-1">
                    <p style={{ fontSize: 13 }} className="text-muted-foreground">{item.label}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600 }} className={item.ok ? "text-foreground" : "text-destructive"}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Danger zone */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-red-900/30" />
                <span style={{ fontSize: 11, fontWeight: 700 }} className="text-red-900 uppercase tracking-widest">
                  Zona Berbahaya
                </span>
                <div className="flex-1 h-px bg-red-900/30" />
              </div>
              {[
                { label: "Reset Semua Sensor", sub: "Hapus kalibrasi & data sementara" },
                { label: "Paksa Sinkronisasi", sub: "Sinkron ulang semua perangkat ESP32" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full bg-[#1A0A0A] border border-red-900/30 rounded-2xl px-4 py-3.5 flex items-center justify-between mb-2"
                >
                  <div className="text-left">
                    <p style={{ fontWeight: 600, fontSize: 13 }} className="text-red-400">{action.label}</p>
                    <p style={{ fontSize: 11 }} className="text-[#4A3A3A]">{action.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-900" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
