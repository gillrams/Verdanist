import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { requestAllPermissions } from './utils/permissions';
import Welcome from './pages/Welcome';
import DemoDashboard from './pages/DemoDashboard';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FarmSelection from './pages/FarmSelection';
import FarmApplication from './pages/FarmApplication';
import FarmAccess from './pages/FarmAccess';
import WelcomeGuest from './pages/WelcomeGuest';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import AppLayout from './components/layout/AppLayout';

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // 1. Request Permissions on startup
      requestAllPermissions();

      // 2. Setup dynamic status bar
      const setupStatusBar = async () => {
        try {
          const isDark = document.documentElement.classList.contains('dark');
          await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        } catch (e) {
          console.warn("Status bar setup failed", e);
        }
      };
      setupStatusBar();

      // Listen for theme changes to update status bar
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            setupStatusBar();
          }
        });
      });
      observer.observe(document.documentElement, { attributes: true });

      // 3. Back button minimize
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.minimizeApp();
        } else {
          window.history.back();
        }
      });

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  return (
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/farms" element={<FarmSelection />} />
          <Route path="/farms/apply" element={<FarmApplication />} />
          <Route path="/farms/access" element={<FarmAccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/welcome-guest" element={<ProtectedRoute><WelcomeGuest /></ProtectedRoute>} />
          <Route path="/demo" element={<AppLayout><DemoDashboard /></AppLayout>} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><AppLayout><Logs /></AppLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
          <Route path="/about" element={<AppLayout><About /></AppLayout>} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
