import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import ikonLogoLight from '../../assets/Ikon_logo_light.png';
import ikonLogoDark from '../../assets/Ikon_logo_dark.png';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { t, toggleLang, lang } = useLanguage();

  return (
    <aside className="hidden lg:flex flex-col py-8 bg-white/70 dark:bg-[#0A2F1F]/40 backdrop-blur-2xl h-screen w-72 rounded-r-[3rem] z-40 sticky top-0 flex-shrink-0 border-r border-white/50 dark:border-white/5 shadow-2xl shadow-green-900/5">
      <div className="px-8 mb-10 flex items-center gap-3">
        <img src={ikonLogoLight} alt="Verdanist Logo" className="w-12 h-12 object-contain drop-shadow-md dark:hidden" />
        <img src={ikonLogoDark} alt="Verdanist Logo" className="w-12 h-12 object-contain drop-shadow-md hidden dark:block" />
        <div>
          <h1 className="text-green-700 dark:text-green-400 font-extrabold text-xl tracking-tight">Verdanist</h1>
          <p className="font-bold text-xs text-green-600/60 dark:text-white/50 uppercase tracking-widest mt-0.5">Persada Farm</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        <NavLink to="/dashboard" className={({ isActive }) => `px-6 py-4 flex items-center gap-4 rounded-2xl transition-all font-bold text-sm ${isActive ? 'bg-white dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-md shadow-green-900/5' : 'text-gray-500 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/5 hover:text-green-600 dark:hover:text-white'}`}>
          <span className="material-symbols-rounded text-xl">grid_view</span>
          <span>{t('nav.overview')}</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `px-6 py-4 flex items-center gap-4 rounded-2xl transition-all font-bold text-sm ${isActive ? 'bg-white dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-md shadow-green-900/5' : 'text-gray-500 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/5 hover:text-green-600 dark:hover:text-white'}`}>
          <span className="material-symbols-rounded text-xl">show_chart</span>
          <span>{t('nav.analytics')}</span>
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => `px-6 py-4 flex items-center gap-4 rounded-2xl transition-all font-bold text-sm ${isActive ? 'bg-white dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-md shadow-green-900/5' : 'text-gray-500 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/5 hover:text-green-600 dark:hover:text-white'}`}>
          <span className="material-symbols-rounded text-xl">receipt_long</span>
          <span>{t('nav.history')}</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `px-6 py-4 flex items-center gap-4 rounded-2xl transition-all font-bold text-sm ${isActive ? 'bg-white dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-md shadow-green-900/5' : 'text-gray-500 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/5 hover:text-green-600 dark:hover:text-white'}`}>
          <span className="material-symbols-rounded text-xl">settings</span>
          <span>{t('nav.settings')}</span>
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `px-6 py-4 flex items-center gap-4 rounded-2xl transition-all font-bold text-sm ${isActive ? 'bg-white dark:bg-green-500/20 text-green-600 dark:text-green-400 shadow-md shadow-green-900/5' : 'text-gray-500 dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/5 hover:text-green-600 dark:hover:text-white'}`}>
            <span className="material-symbols-rounded text-xl">admin_panel_settings</span>
            <span>{t('nav.admin')}</span>
          </NavLink>
        )}
      </nav>

      <div className="space-y-2 mt-auto pb-4 px-4">
        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className="w-full text-left text-gray-500 dark:text-white/60 px-6 py-3 flex items-center gap-4 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 rounded-2xl transition-all font-bold text-sm"
        >
          <Globe className="w-5 h-5" />
          <span>{lang === 'id' ? '🇬🇧 English' : '🇮🇩 Indonesia'}</span>
        </button>
        <button onClick={logout} className="w-full text-left text-gray-500 dark:text-white/60 px-6 py-4 flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 rounded-2xl transition-all font-bold text-sm">
          <span className="material-symbols-rounded text-xl">logout</span>
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
