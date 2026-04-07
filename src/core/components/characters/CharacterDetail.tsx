/**
 * CharacterDetail — detailed view of any character entry.
 * Shows readings, meanings, stroke animation, component breakdown, mnemonic, and examples.
 * Language-agnostic: reads data from CharacterEntry without assuming any specific writing system.
 */

import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { AudioPlayer } from '../audio/AudioPlayer';
import { StrokeAnimator } from './StrokeAnimator';
import { ComponentBreakdown } from './ComponentBreakdown';
import { useAppStore } from '../../store/useAppStore';
import type { CharacterEntry } from '../../types/pack-spec';

interface CharacterDetailProps {
  entry: CharacterEntry;
  packId: string;
  onClose?: () => void;
}

export function CharacterDetail({ entry, onClose }: CharacterDetailProps) {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const ttsLang = activePack?.speech.ttsLang;

  // Group readings by type
  const readingsByType = new Map<string, string[]>();
  for (const r of entry.readings) {
    const existing = readingsByType.get(r.type) ?? [];
    existing.push(r.value);
    readingsByType.set(r.type, existing);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1" />
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Character large */}
      <div className="text-center mb-6">
        <div className="text-7xl font-bold text-slate-100 mb-2">{entry.character}</div>
        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
          <span>{t('characters.strokeCount', { count: entry.strokeCount })}</span>
          {entry.radical && (
            <>
              <span>·</span>
              <span>
                {t('characters.radical')}: {entry.radical}
                {entry.radicalMeaning && ` (${entry.radicalMeaning})`}
              </span>
            </>
          )}
        </div>
        {ttsLang && (
          <div className="mt-2">
            <AudioPlayer
              text={entry.character}
              lang={ttsLang}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Component breakdown */}
      {entry.components && entry.components.length > 0 && (
        <div className="mb-6">
          <ComponentBreakdown
            character={entry.character}
            components={entry.components}
          />
        </div>
      )}

      {/* Stroke order animation */}
      {entry.strokeOrderSvg && entry.strokeOrderSvg.length > 0 && (
        <div className="mb-6 bg-slate-800/50 rounded-xl p-4">
          <StrokeAnimator
            strokes={entry.strokeOrderSvg}
            width={200}
            height={200}
          />
        </div>
      )}

      {/* Readings */}
      {readingsByType.size > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {t('browse.detail.readings')}
          </h3>
          <div className="space-y-1.5">
            {Array.from(readingsByType.entries()).map(([type, values]) => (
              <div key={type} className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-slate-500 w-16 shrink-0 capitalize">{type}</span>
                <span className="text-sm text-slate-200">{values.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meanings */}
      <div className="mb-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {t('browse.detail.meanings')}
        </h3>
        <p className="text-sm text-slate-200">{entry.meanings.join(', ')}</p>
      </div>

      {/* Mnemonic */}
      {entry.mnemonic && (
        <div className="mb-5 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
          <p className="text-sm text-amber-200/80 italic">{entry.mnemonic}</p>
        </div>
      )}

      {/* Examples */}
      {entry.examples && entry.examples.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {t('browse.detail.examples')}
          </h3>
          <div className="space-y-2">
            {entry.examples.map((ex, i) => (
              <div key={i} className="text-sm bg-slate-800/50 rounded-lg p-2">
                <span className="text-slate-200">{ex.word}</span>
                <span className="text-slate-500 ml-2">({ex.reading})</span>
                <p className="text-slate-400 text-xs mt-0.5">{ex.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
