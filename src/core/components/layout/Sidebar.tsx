import { NavLink } from 'react-router-dom';
import logoUrl from '/logo.svg';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  GraduationCap,
  Search,
  BookText,
  Headphones,
  Mic,
  PenTool,
  Map,
  Settings,
  X,
  Lightbulb,
  Heart,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

type NavEntry =
  | { type: 'link'; to: string; icon: typeof LayoutDashboard; labelKey: string }
  | { type: 'separator' };

const navItems: NavEntry[] = [
  { type: 'link', to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { type: 'separator' },
  { type: 'link', to: '/lessons', icon: Lightbulb, labelKey: 'nav.lessons' },
  { type: 'link', to: '/study', icon: GraduationCap, labelKey: 'nav.study' },
  { type: 'link', to: '/explore', icon: Search, labelKey: 'nav.explore' },
  { type: 'separator' },
  { type: 'link', to: '/reading', icon: BookText, labelKey: 'nav.reading' },
  { type: 'link', to: '/listening', icon: Headphones, labelKey: 'nav.listening' },
  { type: 'link', to: '/speaking', icon: Mic, labelKey: 'nav.speaking' },
  { type: 'link', to: '/writing', icon: PenTool, labelKey: 'nav.writing' },
  { type: 'separator' },
  { type: 'link', to: '/roadmap', icon: Map, labelKey: 'nav.roadmap' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const activePack = useAppStore((s) => s.activePack);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Forgua" className="w-7 h-7" />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Forgua</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active pack badge */}
        {activePack && (
          <NavLink
            to="/pack-selector"
            className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="text-lg">{activePack.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{activePack.name}</div>
              <div className="text-xs text-slate-500">{activePack.nativeName}</div>
            </div>
          </NavLink>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, idx) => {
            if (item.type === 'separator') {
              return <div key={`sep-${idx}`} className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-4" />;
            }
            const { to, icon: Icon, labelKey } = item;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{t(labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Settings + Donate links at bottom */}
        <div className="px-3 pb-4 border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>{t('nav.settings')}</span>
          </NavLink>

          <a
            href="https://github.com/sponsors/taaddde"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 group"
          >
            <Heart className="w-5 h-5 shrink-0 group-hover:fill-rose-400 transition-colors" />
            <span>{t('nav.support')}</span>
          </a>
        </div>
      </aside>
    </>
  );
}
