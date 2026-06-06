import React from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F0FDF4] dark:bg-[#071E14]">
      {/* Sidebar - only visible on desktop (lg and up) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-x-hidden min-h-screen pb-20 lg:pb-0">
        {children}
      </main>

      {/* Bottom Navigation Bar - only visible on mobile/tablet */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
