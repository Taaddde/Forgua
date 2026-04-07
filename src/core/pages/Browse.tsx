/**
 * Browse page — search and filter all pack content with detail view.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Plus, Check } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { CharacterDetail } from '../components/characters/CharacterDetail';
import { db } from '../db/database';
import { createInitialSRSState } from '../engine/srs';
import { Button } from '../components/common/Button';
import type { Card } from '../types/models';
import type { CharacterEntry, CharacterReading, CharacterComponent, CharacterExample } from '../types/pack-spec';

export function Browse() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const packId = activePack?.id ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const allCards = useLiveQuery(async () => {
    if (!packId) return [];
    if (categoryFilter === 'all') {
      return db.cards.where('packId').equals(packId).toArray();
    }
    return db.cards.where('[packId+category]').equals([packId, categoryFilter]).toArray();
  }, [packId, categoryFilter]);

  const srsCardIds = useLiveQuery(async () => {
    if (!packId) return new Set<number>();
    const states = await db.srsState.where('packId').equals(packId).toArray();
    return new Set(states.map((s) => s.cardId));
  }, [packId]);

  const filtered = useMemo(() => {
    if (!allCards) return [];
    if (!searchQuery.trim()) return allCards;
    const q = searchQuery.trim().toLowerCase();
    return allCards.filter((c) =>
      c.front.toLowerCase().includes(q) ||
      c.back.toLowerCase().includes(q) ||
      (c.reading?.toLowerCase().includes(q) ?? false) ||
      c.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [allCards, searchQuery]);

  const addToReview = async (cardId: number) => {
    if (!packId) return;
    const exists = await db.srsState.get(cardId);
    if (!exists) {
      await db.srsState.put(createInitialSRSState(cardId, packId));
    }
  };

  if (!activePack) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('study.noPack')}
      </div>
    );
  }

  const categoryOptions = ['all', 'vocabulary', 'characters', 'grammar'];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">{t('browse.title')}</h1>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('browse.search')}
            className="w-full pl-10 pr-8 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-500 hover:text-slate-300" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? t('browse.allCategories') : t(`learn.categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        {t('browse.showing', { count: filtered.length, total: allCards?.length ?? 0 })}
      </p>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-center py-12">{t('browse.noResults')}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 90).map((card) => {
          const inReview = srsCardIds?.has(card.id!) ?? false;
          return (
            <button
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <span className="text-lg font-bold text-slate-100">{card.front}</span>
                {inReview && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              {card.reading && <span className="text-sm text-slate-500 block">{card.reading}</span>}
              <span className="text-sm text-slate-400 block mt-1">{card.back}</span>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded">{card.category}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded">{card.level}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedCard(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {selectedCard.category === 'characters' ? (
              <>
                <CharacterDetail
                  entry={cardToCharEntry(selectedCard)}
                  packId={selectedCard.packId}
                  onClose={() => setSelectedCard(null)}
                />
                <div className="mt-4 pt-4 border-t border-slate-800">
                  {srsCardIds?.has(selectedCard.id!) ? (
                    <span className="text-sm text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> {t('learn.inReview')}
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => addToReview(selectedCard.id!)}>
                      <Plus className="w-3.5 h-3.5" /> {t('learn.addToReview')}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-slate-100">{selectedCard.front}</h2>
                    <AudioPlayer text={selectedCard.reading ?? selectedCard.front} lang={activePack?.speech.ttsLang} size="sm" />
                    {selectedCard.reading && <p className="text-sm text-slate-500">{selectedCard.reading}</p>}
                  </div>
                  <button onClick={() => setSelectedCard(null)}>
                    <X className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                  </button>
                </div>
                <p className="text-lg text-slate-200 mb-4">{selectedCard.back}</p>
                <DetailContent card={selectedCard} />
                <div className="mt-4 pt-4 border-t border-slate-800">
                  {srsCardIds?.has(selectedCard.id!) ? (
                    <span className="text-sm text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> {t('learn.inReview')}
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => addToReview(selectedCard.id!)}>
                      <Plus className="w-3.5 h-3.5" /> {t('learn.addToReview')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function cardToCharEntry(card: Card): CharacterEntry {
  const extra = card.extra ?? {};
  return {
    character: card.front,
    readings: (extra.readings as CharacterReading[]) ?? [],
    meanings: (extra.meanings as string[]) ?? [card.back],
    strokeCount: (extra.strokeCount as number) ?? 0,
    strokeOrder: extra.strokeOrder as string | undefined,
    strokeOrderSvg: extra.strokeOrderSvg as string[] | undefined,
    radical: extra.radical as string | undefined,
    radicalMeaning: extra.radicalMeaning as string | undefined,
    components: extra.components as CharacterComponent[] | undefined,
    level: card.level,
    tags: card.tags,
    examples: extra.examples as CharacterExample[] | undefined,
    mnemonic: extra.mnemonic as string | undefined,
  };
}

interface CardExtra {
  meanings?: string[];
  pos?: string;
  readings?: { type: string; value: string }[];
  strokeCount?: number;
  explanation?: string;
  examples?: { word?: string; sentence?: string; text?: string; reading?: string; meaning?: string; translation?: string }[];
  [key: string]: unknown;
}

function DetailContent({ card }: { card: Card }) {
  const { t } = useTranslation();
  const extra = (card.extra ?? {}) as CardExtra;

  return (
    <div className="space-y-3">
      {extra.meanings && extra.meanings.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">{t('browse.detail.meanings')}</span>
          <p className="text-slate-300 text-sm mt-1">{extra.meanings.join(', ')}</p>
        </div>
      )}
      {extra.pos && (
        <span className="inline-block text-xs px-2 py-0.5 bg-indigo-600/20 text-indigo-300 rounded">{extra.pos}</span>
      )}
      {extra.readings && extra.readings.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {extra.readings.map((r, i) => (
            <div key={i}>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {r.type === 'on' ? t('characters.onReading') : r.type === 'kun' ? t('characters.kunReading') : r.type}
              </span>
              <p className="text-slate-200 text-sm">{r.value}</p>
            </div>
          ))}
        </div>
      )}
      {extra.strokeCount && (
        <p className="text-xs text-slate-500">{t('characters.strokeCount', { count: extra.strokeCount })}</p>
      )}
      {extra.explanation && (
        <p className="text-sm text-slate-300 leading-relaxed">{extra.explanation}</p>
      )}
      {extra.examples && extra.examples.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">{t('browse.detail.examples')}</span>
          <div className="mt-1 space-y-2">
            {extra.examples.slice(0, 5).map((ex, i) => (
              <div key={i} className="text-sm bg-slate-800/50 rounded-lg p-2">
                <span className="text-slate-200">{ex.word ?? ex.sentence ?? ex.text}</span>
                {ex.reading && <span className="text-slate-500 ml-2">({ex.reading})</span>}
                {(ex.meaning ?? ex.translation) && (
                  <p className="text-slate-400 text-xs mt-0.5">{ex.meaning ?? ex.translation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Browse;
