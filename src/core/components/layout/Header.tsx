import { Menu, Sun, Moon, Monitor } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { ThemeMode } from '../../store/useAppStore';

const themeIcons: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeOrder: ThemeMode[] = ['dark', 'light', 'system'];

export function Header() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const ThemeIcon = themeIcons[theme];

  function cycleTheme() {
    const currentIndex = themeOrder.indexOf(theme);
    const next = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(next);
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-30">
      <button
        onClick={toggleSidebar}
        aria-label="Open menu"
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <button
        onClick={cycleTheme}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        title={`Theme: ${theme}`}
      >
        <ThemeIcon className="w-5 h-5" />
      </button>
    </header>
  );
}
