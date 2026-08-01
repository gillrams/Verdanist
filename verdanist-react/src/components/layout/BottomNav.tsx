import { NavLink } from 'react-router-dom';
import { Home, BarChart2, ClipboardList, Settings, ShieldAlert } from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function BottomNav({ onOpenScanner }: { onOpenScanner?: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 px-4 pointer-events-none z-50">
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-full px-2 py-2 flex items-center justify-between gap-1 pointer-events-auto shadow-2xl relative w-full max-w-sm">
        <NavLink to="/dashboard" className={({ isActive }) => `relative flex flex-col items-center rounded-full transition-all duration-200 px-3 py-2 ${isActive ? 'bg-primary/10' : 'hover:bg-muted/60'}`}>
          {({ isActive }) => (
            <>
              <Home className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`mt-0.5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>{t('bnav.home')}</span>
              {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `relative flex flex-col items-center rounded-full transition-all duration-200 px-3 py-2 ${isActive ? 'bg-primary/10' : 'hover:bg-muted/60'}`}>
          {({ isActive }) => (
            <>
              <BarChart2 className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`mt-0.5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>{t('bnav.chart')}</span>
              {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>

        {/* Center Scanner FAB */}
        <div className="relative -top-5 px-1 shrink-0">
          <button
            onClick={onOpenScanner}
            className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white hover:scale-105 active:scale-95 transition-all border-4 border-card group"
          >
            <span className="material-symbols-rounded text-2xl group-hover:scale-110 transition-transform">photo_camera</span>
            <div className="absolute -inset-1 rounded-full border-2 border-emerald-400/50 animate-ping opacity-0 group-hover:opacity-100 transition-opacity" style={{ animationDuration: '2s' }} />
          </button>
        </div>

        <NavLink to="/logs" className={({ isActive }) => `relative flex flex-col items-center rounded-full transition-all duration-200 px-3 py-2 ${isActive ? 'bg-primary/10' : 'hover:bg-muted/60'}`}>
          {({ isActive }) => (
            <>
              <ClipboardList className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`mt-0.5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>{t('bnav.history')}</span>
              {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `relative flex flex-col items-center rounded-full transition-all duration-200 px-3 py-2 ${isActive ? 'bg-primary/10' : 'hover:bg-muted/60'}`}>
          {({ isActive }) => (
            <>
              <Settings className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`mt-0.5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`} style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>{t('bnav.settings')}</span>
              {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `relative flex flex-col items-center rounded-full transition-all duration-200 px-3 py-2 ${isActive ? 'bg-destructive/10' : 'hover:bg-muted/60'}`}>
            {({ isActive }) => (
              <>
                <ShieldAlert className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-destructive' : 'text-muted-foreground/50'}`} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`mt-0.5 transition-colors duration-200 ${isActive ? 'text-destructive' : 'text-muted-foreground/40'}`} style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, lineHeight: 1 }}>{t('bnav.admin')}</span>
                {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-destructive" />}
              </>
            )}
          </NavLink>
        )}
      </div>
    </div>
  );
}
