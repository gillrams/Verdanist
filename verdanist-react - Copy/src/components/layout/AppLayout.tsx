import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#E8F5E9] dark:bg-[#05150E] transition-colors relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 pb-32 lg:pb-10 w-full relative">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
