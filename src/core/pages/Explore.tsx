/**
 * Explore page — unified content browser combining search, filters,
 * and expandable card detail with SRS integration.
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Plus, Check, ChevronDown, ChevronUp, LayoutList, LayoutGrid } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { CharacterDetail } from '../components/characters/CharacterDetail';
import { db } from '../db/database';
import { createInitialSRSState } from '../engine/srs';
import { Button } from '../components/common/Button';
import type { Card } from '../types/models';
import type { CharacterEntry, CharacterReading, CharacterComponent, CharacterExample } from '../types/pack-spec';

const ITEMS_PER_PAGE = 30;
const VIEW_PREF_KEY = 'explore-view';

type ViewMode = 'list' | 'grid';

function getInitialView(): ViewMode {
  try {
    const saved = localStorage.getItem(VIEW_PREF_KEY);
    if (saved === 'grid') return 'grid';
  } catch { /* noop */ }
  return 'list';
}

export function Explore() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const packId = activePack?.id ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialView);

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem(VIEW_PREF_KEY, mode); } catch { /* noop */ }
  };

  // All cards for filtering
  const allCards = useLiveQuery(async () => {
    if (!packId) return [];
    let col = db.cards.where('packId').equals(packId);
    if (categoryFilter !== 'all') {
      col = db.cards.where('[packId+category]').equals([packId, categoryFilter]);
    }
    return col.toArray();
  }, [packId, categoryFilter]);

  const srsCardIds = useLiveQuery(async () => {
    if (!packId) return new Set<number>();
    const states = await db.srsState.where('packId').equals(packId).toArray();
    return new Set(states.map((s) => s.cardId));
  }, [packId]);

  // Apply search + level filter
  const filtered = useMemo(() => {
    if (!allCards) return [];
    let result = allCards;

    if (levelFilter !== 'all') {
      result = result.filter((c) => c.level === levelFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.reading?.toLowerCase().includes(q) ?? false) ||
        c.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [allCards, searchQuery, levelFilter]);

  // Paginate
  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);
  const pageItems = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // Available levels from active pack
  const levels = activePack?.levels ?? [];

  const addToReview = useCallback(async (cardId: number) => {
    if (!packId) return;
    const exists = await db.srsState.get(cardId);
    if (!exists) {
      await db.srsState.put(createInitialSRSState(cardId, packId));
    }
  }, [packId]);

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setLevelFilter('all');
    setPage(0);
    setExpandedId(null);
  };

  if (!activePack) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('study.noPack')}
      </div>
    );
  }

  const categoryOptions = ['all', 'vocabulary', 'characters', 'grammar'];
  const isLoading = allCards === undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{t('explore.title')}</h1>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder={t('explore.searchPlaceholder')}
            className="w-full pl-10 pr-8 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-slate-500 hover:text-slate-300" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shrink-0">
          <button
            onClick={() => toggleView('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            title={t('explore.listView')}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleView('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            title={t('explore.gridView')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Category filters */}
        {categoryOptions.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setPage(0); setExpandedId(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat === 'all' ? t('browse.allCategories') : t(`learn.categories.${cat}`)}
          </button>
        ))}

        {/* Level filter */}
        {levels.length > 1 && (
          <select
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); setPage(0); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t('explore.allLevels')}</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Counter */}
      <p className="text-xs text-slate-500 mb-4">
        {t('browse.showing', { count: totalFiltered, total: allCards?.length ?? 0 })}
      </p>

      {isLoading && <p className="text-slate-400">{t('common.loading')}</p>}

      {!isLoading && pageItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-3">{t('browse.noResults')}</p>
          {(searchQuery || categoryFilter !== 'all' || levelFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {t('explore.clearFilters')}
            </Button>
          )}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {pageItems.map((card) => {
            const inReview = srsCardIds?.has(card.id!) ?? false;
            const isExpanded = expandedId === card.id;

            return (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : card.id!)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100 shrink-0">{card.front}</span>
                    {card.reading && (
                      <span className="text-sm text-slate-500">{card.reading}</span>
                    )}
                    <span className="text-sm text-slate-400 truncate">{card.back}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {inReview && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {t('learn.inReview')}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <CardDetail card={card} inReview={inReview} onAdd={() => addToReview(card.id!)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pageItems.map((card) => {
            const inReview = srsCardIds?.has(card.id!) ?? false;
            const isExpanded = expandedId === card.id;

            return (
              <div key={card.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : card.id!)}
                  className="w-full p-4 text-left hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{card.front}</span>
                    {inReview && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                  {card.reading && <span className="text-sm text-slate-500 block">{card.reading}</span>}
                  <span className="text-sm text-slate-400 block mt-1">{card.back}</span>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">{card.category}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">{card.level}</span>
                  </div>
                </button>

                {isExpanded && (
                  <CardDetail card={card} inReview={inReview} onAdd={() => addToReview(card.id!)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => { setPage(page - 1); setExpandedId(null); }}>
            {t('common.previous')}
          </Button>
          <span className="text-sm text-slate-400">{page + 1} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => { setPage(page + 1); setExpandedId(null); }}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Shared detail types & helpers ─── */

interface CardExtra {
  meanings?: string[];
  pos?: string;
  readings?: { type: string; value: string }[];
  strokeCount?: number;
  explanation?: string;
  examples?: { word?: string; sentence?: string; text?: string; reading?: string; meaning?: string; translation?: string }[];
  [key: string]: unknown;
}

function cardToCharacterEntry(card: Card): CharacterEntry {
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

function CardDetail({ card, inReview, onAdd }: { card: Card; inReview: boolean; onAdd: () => void }) {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const extra = (card.extra ?? {}) as CardExtra;

  if (card.category === 'characters') {
    const entry = cardToCharacterEntry(card);
    return (
      <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
        <CharacterDetail entry={entry} packId={card.packId} />
        {!inReview && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-3.5 h-3.5" />
            {t('learn.addToReview')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-3">
      <div className="flex items-center gap-2">
        <AudioPlayer text={card.front} lang={activePack?.speech.ttsLang} size="sm" />
        {card.reading && <span className="text-sm text-slate-500">{card.reading}</span>}
      </div>

      {extra.meanings && extra.meanings.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">{t('browse.detail.meanings')}</span>
          <p className="text-slate-800 dark:text-slate-200 text-sm mt-1">{extra.meanings.join(', ')}</p>
        </div>
      )}

      {extra.pos && (
        <span className="inline-block text-xs px-2 py-0.5 bg-indigo-600/20 text-indigo-300 rounded">
          {extra.pos}
        </span>
      )}

      {extra.readings && extra.readings.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {extra.readings.map((r, i) => (
            <div key={i}>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {r.type === 'on' ? t('characters.onReading') : r.type === 'kun' ? t('characters.kunReading') : r.type}
              </span>
              <p className="text-slate-800 dark:text-slate-200 text-sm">{r.value}</p>
            </div>
          ))}
        </div>
      )}

      {extra.strokeCount && (
        <p className="text-xs text-slate-500">{t('characters.strokeCount', { count: extra.strokeCount })}</p>
      )}

      {extra.explanation && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{extra.explanation}</p>
      )}

      {extra.examples && extra.examples.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">{t('browse.detail.examples')}</span>
          <div className="mt-1 space-y-1.5">
            {extra.examples.slice(0, 5).map((ex, i) => (
              <div key={i} className="text-sm bg-slate-100 dark:bg-slate-800/50 rounded-lg p-2">
                <span className="text-slate-800 dark:text-slate-200">{ex.word ?? ex.sentence ?? ex.text}</span>
                {ex.reading && <span className="text-slate-500 ml-2">({ex.reading})</span>}
                {(ex.meaning ?? ex.translation) && (
                  <p className="text-slate-400 text-xs mt-0.5">{ex.meaning ?? ex.translation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!inReview && (
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" />
          {t('learn.addToReview')}
        </Button>
      )}
    </div>
  );
}

export default Explore;
