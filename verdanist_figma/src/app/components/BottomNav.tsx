import { Home, BarChart2, ClipboardList, Settings, ShieldAlert } from "lucide-react";

export type AppTab = "home" | "analytics" | "logs" | "settings" | "admin";

interface BottomNavProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  isAdmin: boolean;
}

const BASE_TABS = [
  { id: "home" as AppTab, icon: Home, label: "Beranda" },
  { id: "analytics" as AppTab, icon: BarChart2, label: "Grafik" },
  { id: "logs" as AppTab, icon: ClipboardList, label: "Riwayat" },
  { id: "settings" as AppTab, icon: Settings, label: "Atur" },
];

const ADMIN_TAB = { id: "admin" as AppTab, icon: ShieldAlert, label: "Admin" };

export function BottomNav({ active, onChange, isAdmin }: BottomNavProps) {
  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 px-4 pointer-events-none z-50">
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-full px-2 py-2 flex items-center gap-1 pointer-events-auto shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          const isAdminTab = tab.id === "admin";
          const activeColor = isAdminTab ? "text-destructive" : "text-primary";
          const activeBg = isAdminTab ? "bg-destructive/10" : "bg-primary/10";

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex flex-col items-center rounded-full transition-all duration-200 px-4 py-2 ${
                isActive ? activeBg : "hover:bg-muted/60"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive ? activeColor : "text-muted-foreground/50"
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`mt-0.5 transition-colors duration-200 ${isActive ? activeColor : "text-muted-foreground/40"}`}
                style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}
              >
                {tab.label}
              </span>
              {/* Active dot indicator */}
              {isActive && (
                <span
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isAdminTab ? "bg-destructive" : "bg-primary"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
