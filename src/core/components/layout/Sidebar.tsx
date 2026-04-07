import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Library,
  BookText,
  Headphones,
  Mic,
  PenTool,
  Map,
  Settings,
  X,
  Lightbulb,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/lessons', icon: Lightbulb, labelKey: 'nav.lessons' },
  { to: '/study', icon: GraduationCap, labelKey: 'nav.study' },
  { to: '/learn', icon: BookOpen, labelKey: 'nav.learn' },
  { to: '/browse', icon: Library, labelKey: 'nav.browse' },
  { to: '/reading', icon: BookText, labelKey: 'nav.reading' },
  { to: '/listening', icon: Headphones, labelKey: 'nav.listening' },
  { to: '/speaking', icon: Mic, labelKey: 'nav.speaking' },
  { to: '/writing', icon: PenTool, labelKey: 'nav.writing' },
  { to: '/roadmap', icon: Map, labelKey: 'nav.roadmap' },
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
            <img src="/logo.svg" alt="LinguaForge" className="w-7 h-7" />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">LinguaForge</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active pack badge */}
        {activePack && (
          <NavLink
            to="/pack-selector"
            className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <span className="text-lg">{activePack.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{activePack.name}</div>
              <div className="text-xs text-slate-500">{activePack.nativeName}</div>
            </div>
          </NavLink>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Settings link at bottom */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-3">
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
        </div>
      </aside>
    </>
  );
}
