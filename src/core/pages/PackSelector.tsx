import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { installPack } from '../db/seeds';
import { getAvailablePacks } from '../packs/pack-registry';
import type { PackManifest } from '../types/pack-spec';

export function PackSelector() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activePack = useAppStore((s) => s.activePack);
  const selectPack = useAppStore((s) => s.selectPack);
  const adapterLoading = useAppStore((s) => s.adapterLoading);
  const adapterError = useAppStore((s) => s.adapterError);

  const [packs, setPacks] = useState<PackManifest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvailablePacks()
      .then(setPacks)
      .catch((err) => console.error('Failed to load packs:', err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelect(manifest: PackManifest) {
    await installPack(manifest);
    await selectPack(manifest);
    navigate('/');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
          <Languages className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          {t('pack.selector.title')}
        </h1>
        <p className="text-slate-400">
          {t('pack.selector.subtitle')}
        </p>
      </div>

      {adapterError && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {adapterError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => {
            const isActive = activePack?.id === pack.id;

            return (
              <button
                key={pack.id}
                onClick={() => handleSelect(pack)}
                disabled={adapterLoading}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  isActive
                    ? 'bg-indigo-600/10 border-indigo-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                } disabled:opacity-50`}
              >
                <span className="text-3xl">{pack.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-slate-100">{pack.name}</span>
                    <span className="text-sm text-slate-500">{pack.nativeName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{pack.levels.length} {t('pack.selector.levels')}</span>
                    <span>·</span>
                    <span>{pack.writingSystems.length > 0
                      ? pack.writingSystems.map((ws) => ws.name).join(', ')
                      : pack.family
                    }</span>
                    <span>·</span>
                    <span>v{pack.version}</span>
                  </div>
                </div>
                {isActive ? (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {!loading && packs.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          {t('pack.selector.noPacks')}
        </div>
      )}
    </div>
  );
}

export default PackSelector;
