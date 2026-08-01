import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check initial
    const storedTheme = localStorage.getItem("verdanist_theme");
    
    // Helper to apply theme
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      } else {
        setTheme("light");
        document.documentElement.classList.remove("dark");
      }
      
      // Update Native Status Bar
      if (Capacitor.isNativePlatform()) {
        try {
          StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          StatusBar.setBackgroundColor({ color: isDark ? '#111214' : '#FAFAFA' });
        } catch (e) {}
      }
    };

    if (storedTheme) {
      applyTheme(storedTheme === "dark");
    } else {
      // Auto detect system theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark);
    }

    // Listen for system theme changes if no manual override
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("verdanist_theme")) {
        applyTheme(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("verdanist_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Update Native Status Bar
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setStyle({ style: nextTheme === "dark" ? Style.Dark : Style.Light });
        StatusBar.setBackgroundColor({ color: nextTheme === "dark" ? '#111214' : '#FAFAFA' });
      } catch (e) {}
    }
  };

  return (
    <button
      onClick={toggle}
      className={`w-11 h-11 flex items-center justify-center rounded-full bg-switch-background hover:bg-border transition-colors ${className}`}
      aria-label="Toggle Theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Sun className="w-5 h-5 text-ring" />
      )}
    </button>
  );
}
