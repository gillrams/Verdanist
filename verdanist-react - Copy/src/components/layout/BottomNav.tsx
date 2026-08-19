import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-auto sm:w-[450px] sm:left-1/2 sm:-translate-x-1/2 z-50 flex lg:hidden justify-around items-center px-2 sm:px-4 h-20 sm:h-24 bg-white/70 dark:bg-[#05150E]/80 backdrop-blur-2xl rounded-full shadow-[0_10px_40px_rgba(22,163,74,0.15)] border border-white/50 dark:border-white/10">
      <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center rounded-2xl px-3 sm:px-4 py-2 transition-transform active:scale-90 ${isActive ? 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-white/40 hover:text-green-500 dark:hover:text-green-300'}`}>
        <span className="material-symbols-rounded text-[24px]">grid_view</span>
        <span className="text-[9px] uppercase tracking-widest font-extrabold mt-1">Home</span>
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `flex flex-col items-center justify-center rounded-2xl px-3 sm:px-4 py-2 transition-transform active:scale-90 ${isActive ? 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-white/40 hover:text-green-500 dark:hover:text-green-300'}`}>
        <span className="material-symbols-rounded text-[24px]">show_chart</span>
        <span className="text-[9px] uppercase tracking-widest font-extrabold mt-1">Chart</span>
      </NavLink>
      <NavLink to="/logs" className={({ isActive }) => `flex flex-col items-center justify-center rounded-2xl px-3 sm:px-4 py-2 transition-transform active:scale-90 ${isActive ? 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-white/40 hover:text-green-500 dark:hover:text-green-300'}`}>
        <span className="material-symbols-rounded text-[24px]">receipt_long</span>
        <span className="text-[9px] uppercase tracking-widest font-extrabold mt-1">Logs</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center justify-center rounded-2xl px-3 sm:px-4 py-2 transition-transform active:scale-90 ${isActive ? 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-white/40 hover:text-green-500 dark:hover:text-green-300'}`}>
        <span className="material-symbols-rounded text-[24px]">settings</span>
        <span className="text-[9px] uppercase tracking-widest font-extrabold mt-1">Set</span>
      </NavLink>
      {user?.role === 'admin' && (
        <NavLink to="/admin" className={({ isActive }) => `flex flex-col items-center justify-center rounded-2xl px-3 sm:px-4 py-2 transition-transform active:scale-90 ${isActive ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-300'}`}>
          <span className="material-symbols-rounded text-[24px]">admin_panel_settings</span>
          <span className="text-[9px] uppercase tracking-widest font-extrabold mt-1">Admin</span>
        </NavLink>
      )}
    </nav>
  );
}
