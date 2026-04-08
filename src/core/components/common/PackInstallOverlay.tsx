import { useTranslation } from 'react-i18next';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function PackInstallOverlay() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const adapterLoading = useAppStore((s) => s.adapterLoading);
  const adapterProgress = useAppStore((s) => s.adapterProgress);

  if (!adapterLoading || !activePack) return null;

  const phase = adapterProgress?.phase ?? 'dictionaries';
  const progress = adapterProgress?.value ?? 0;
  const percent = Math.round(progress * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-slate-900 border border-slate-800 rounded-2xl p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            {phase === 'ready' ? (
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            ) : (
              <Download className="w-8 h-8 text-indigo-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-100 text-center mb-2">
          {t('packInstall.title', { packName: activePack.name })}
        </h2>

        {/* Phase label */}
        <p className="text-sm text-slate-400 text-center mb-6">
          {t(`packInstall.${phase}`)}
        </p>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(percent, 2)}%` }}
          />
        </div>

        {/* Percent + spinner */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{percent}%</span>
          {phase !== 'ready' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
