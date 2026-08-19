import { useState } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { SplashScreen } from "./components/SplashScreen";
import { ThemeToggle } from "./components/ThemeToggle";
import {
  SelectFarmScreen,
  EnterTokenScreen,
  RegisterFarmScreen,
} from "./components/OnboardingScreens";
import {
  AuthScreen,
  GuestWaitingScreen,
} from "./components/AuthScreen";
import { DashboardScreen } from "./components/DashboardScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { LogsScreen } from "./components/LogsScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { AdminScreen } from "./components/AdminScreen";
import { BottomNav, AppTab } from "./components/BottomNav";

type Screen =
  | "splash"
  | "welcome"
  | "select-farm"
  | "enter-token"
  | "register-farm"
  | "login"
  | "guest-waiting"
  | "app";

interface SelectedFarm {
  id: string;
  name: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [tab, setTab] = useState<AppTab>("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<SelectedFarm>({
    id: "1",
    name: "Kebun Utama Cikaret",
  });

  const handleFarmSelect = (farm: SelectedFarm) => {
    setSelectedFarm(farm);
    setScreen("enter-token");
  };

  const handleLoginSuccess = (admin = false) => {
    setIsAdmin(admin);
    setScreen("app");
    setTab("home");
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setScreen("welcome");
    setTab("home");
  };

  return (
    <div className="size-full flex items-center justify-center bg-[#060808]">
      {/* Mobile frame */}
      <div
        className="relative w-full max-w-sm overflow-hidden bg-background text-foreground"
        style={{
          height: "100dvh",
          maxHeight: 844,
          overflowY: "auto",
        }}
      >
        {/* Global Theme Toggle */}
        {screen !== "splash" && screen !== "app" && (
          <div className="absolute top-6 right-6 z-50">
            <ThemeToggle />
          </div>
        )}

        {/* Screens */}
        {screen === "splash" && (
          <SplashScreen onComplete={() => setScreen("welcome")} />
        )}

        {screen === "welcome" && (
          <WelcomeScreen
            onStart={() => setScreen("select-farm")}
            onLogin={() => setScreen("login")}
          />
        )}

        {screen === "select-farm" && (
          <SelectFarmScreen
            onSelect={handleFarmSelect}
            onRegister={() => setScreen("register-farm")}
            onBack={() => setScreen("welcome")}
          />
        )}

        {screen === "enter-token" && (
          <EnterTokenScreen
            farmName={selectedFarm.name}
            onContinue={() => setScreen("login")}
            onBack={() => setScreen("select-farm")}
          />
        )}

        {screen === "register-farm" && (
          <RegisterFarmScreen
            onSuccess={() => handleLoginSuccess(false)}
            onBack={() => setScreen("select-farm")}
          />
        )}

        {screen === "login" && (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            onGuestWaiting={() => setScreen("guest-waiting")}
            onBack={() => setScreen("select-farm")}
          />
        )}

        {screen === "guest-waiting" && (
          <GuestWaitingScreen onBack={() => setScreen("login")} />
        )}

        {screen === "app" && (
          <>
            {tab === "home" && (
              <DashboardScreen isAdmin={isAdmin} farmName={selectedFarm.name} />
            )}
            {tab === "analytics" && <AnalyticsScreen />}
            {tab === "logs" && <LogsScreen />}
            {tab === "settings" && (
              <SettingsScreen onLogout={handleLogout} isAdmin={isAdmin} />
            )}
            {tab === "admin" && isAdmin && <AdminScreen />}

            <BottomNav active={tab} onChange={setTab} isAdmin={isAdmin} />
          </>
        )}
      </div>
    </div>
  );
}
