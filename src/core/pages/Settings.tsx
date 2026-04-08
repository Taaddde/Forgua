import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Palette, Database, Info, Download, Upload, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { exportUserData, importUserData, downloadBackup } from '../db/backup';
import { APP_VERSION, getPlatform } from '../utils/platform';
import type { UILanguage, ThemeMode } from '../store/useAppStore';

const languages: { value: UILanguage; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

const themes: { value: ThemeMode; labelKey: string }[] = [
  { value: 'dark', labelKey: 'settings.themes.dark' },
  { value: 'light', labelKey: 'settings.themes.light' },
  { value: 'system', labelKey: 'settings.themes.system' },
];

export function Settings() {
  const { t, i18n } = useTranslation();
  const uiLanguage = useAppStore((s) => s.uiLanguage);
  const theme = useAppStore((s) => s.theme);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setTheme = useAppStore((s) => s.setTheme);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLanguageChange(lang: UILanguage) {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  }

  async function handleExport() {
    try {
      const data = await exportUserData();
      const date = new Date().toISOString().split('T')[0];
      downloadBackup(data, `linguaforge-backup-${date}.json`);
      setFeedback({ type: 'success', message: t('backup.exportSuccess') });
    } catch {
      setFeedback({ type: 'error', message: 'Export failed' });
    }
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (!confirm(t('backup.importConfirm'))) return;

    try {
      const text = await file.text();
      const result = await importUserData(text);
      setFeedback({
        type: result.errors.length === 0 ? 'success' : 'error',
        message: result.errors.length === 0
          ? t('backup.importSuccess', { count: result.imported })
          : t('backup.importError', { error: result.errors[0] }),
      });
    } catch {
      setFeedback({ type: 'error', message: t('backup.invalidFile') });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-8">{t('settings.title')}</h1>

      {/* Feedback toast */}
      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 text-sm ${
          feedback.type === 'success'
            ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-300'
            : 'bg-red-600/15 border border-red-500/30 text-red-300'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
          {feedback.message}
        </div>
      )}

      {/* Language */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('settings.language')}</h2>
        </div>
        <div className="flex gap-2">
          {languages.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleLanguageChange(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uiLanguage === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('settings.theme')}</h2>
        </div>
        <div className="flex gap-2">
          {themes.map(({ value, labelKey }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </section>

      {/* Data */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('settings.data')}</h2>
        </div>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            {t('backup.export')}
          </button>
          <label className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors text-sm cursor-pointer">
            <Upload className="w-4 h-4 text-slate-500" />
            {t('backup.import')}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* About */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('settings.about')}</h2>
        </div>
        <div className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-sm text-slate-300">LinguaForge v{APP_VERSION}</p>
          <p className="text-xs text-slate-500">{t('settings.platform')}: {getPlatform() === 'tauri' ? t('settings.desktopApp') : getPlatform() === 'pwa' ? t('settings.installedPwa') : t('settings.browserMode')}</p>
          <p className="text-xs text-slate-500">Open source language learning engine. MIT License.</p>
        </div>
      </section>
    </div>
  );
}

export default Settings;
