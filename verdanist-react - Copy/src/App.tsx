import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import DemoDashboard from './pages/DemoDashboard';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmSelection from './pages/FarmSelection';
import FarmApplication from './pages/FarmApplication';
import FarmAccess from './pages/FarmAccess';
import WelcomeGuest from './pages/WelcomeGuest';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/farms" element={<FarmSelection />} />
          <Route path="/farms/apply" element={<FarmApplication />} />
          <Route path="/farms/access" element={<FarmAccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/welcome-guest" element={<ProtectedRoute><WelcomeGuest /></ProtectedRoute>} />
          <Route path="/demo" element={<DemoDashboard />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
