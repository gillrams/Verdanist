import React, { useState, useEffect } from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { Network } from '@capacitor/network';
import { WifiOff } from 'lucide-react';

import PlantScannerModal from '../dashboard/PlantScannerModal';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  useEffect(() => {
    const initNetwork = async () => {
      const status = await Network.getStatus();
      setIsOffline(!status.connected);
    };
    initNetwork();

    const listener = Network.addListener('networkStatusChange', status => {
      setIsOffline(!status.connected);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F0FDF4] dark:bg-[#071E14]">
      {/* Sidebar - only visible on desktop (lg and up) */}
      <Sidebar onOpenScanner={() => setIsScannerOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-x-hidden min-h-screen pb-20 lg:pb-0 relative flex flex-col">
        {isOffline && (
          <div className="bg-destructive text-destructive-foreground px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 z-50 sticky top-0">
            <WifiOff className="w-4 h-4" />
            Tidak ada koneksi internet
          </div>
        )}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar - only visible on mobile/tablet */}
      <div className="lg:hidden">
        <BottomNav onOpenScanner={() => setIsScannerOpen(true)} />
      </div>

      <PlantScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
}
