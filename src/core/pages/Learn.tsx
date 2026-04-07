/**
 * Learn page — browse and add new content to the SRS review queue.
 * Cards are displayed by category with expandable details.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';
import { createInitialSRSState } from '../engine/srs';
import { Button } from '../components/common/Button';
import { CharacterDetail } from '../components/characters/CharacterDetail';
import type { Card } from '../types/models';
import type { CharacterEntry, CharacterReading, CharacterComponent, CharacterExample } from '../types/pack-spec';

type LearnCategory = 'vocabulary' | 'characters' | 'grammar';

const ITEMS_PER_PAGE = 30;

export function Learn() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const packId = activePack?.id ?? null;

  const [category, setCategory] = useState<LearnCategory>('vocabulary');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const cards = useLiveQuery(async () => {
    if (!packId) return [];
    return db.cards
      .where('[packId+category]')
      .equals([packId, category])
      .offset(page * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .toArray();
  }, [packId, category, page]);

  const totalCount = useLiveQuery(async () => {
    if (!packId) return 0;
    return db.cards.where('[packId+category]').equals([packId, category]).count();
  }, [packId, category]);

  const srsCardIds = useLiveQuery(async () => {
    if (!packId) return new Set<number>();
    const states = await db.srsState.where('packId').equals(packId).toArray();
    return new Set(states.map((s) => s.cardId));
  }, [packId]);

  const addToReview = useCallback(async (cardId: number) => {
    if (!packId) return;
    const exists = await db.srsState.get(cardId);
    if (!exists) {
      await db.srsState.put(createInitialSRSState(cardId, packId));
    }
  }, [packId]);

  if (!activePack) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('study.noPack')}
      </div>
    );
  }

  const categories: { key: LearnCategory; label: string }[] = [
    { key: 'vocabulary', label: t('learn.categories.vocabulary') },
    { key: 'characters', label: t('learn.categories.characters') },
    { key: 'grammar', label: t('learn.categories.grammar') },
  ];

  const isLoading = cards === undefined;
  const total = totalCount ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">{t('learn.title')}</h1>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setCategory(key); setPage(0); setExpandedId(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-400">{t('common.loading')}</p>}

      {!isLoading && cards.length === 0 && (
        <p className="text-slate-500 text-center py-12">{t('learn.noContent')}</p>
      )}

      {/* Card list */}
      <div className="space-y-2">
        {(cards ?? []).map((card) => {
          const inReview = srsCardIds?.has(card.id!) ?? false;
          const isExpanded = expandedId === card.id;

          return (
            <div
              key={card.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : card.id!)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg font-bold text-slate-100 shrink-0">{card.front}</span>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            {t('common.previous')}
          </Button>
          <span className="text-sm text-slate-400">{page + 1} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
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
  const extra = (card.extra ?? {}) as CardExtra;

  // For character cards, show CharacterDetail
  if (card.category === 'characters') {
    const entry = cardToCharacterEntry(card);
    return (
      <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-3">
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
      {extra.meanings && extra.meanings.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">{t('browse.detail.meanings')}</span>
          <p className="text-slate-200 text-sm mt-1">{extra.meanings.join(', ')}</p>
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
          <div className="mt-1 space-y-1.5">
            {extra.examples.slice(0, 3).map((ex, i) => (
              <div key={i} className="text-sm">
                <span className="text-slate-200">{ex.word ?? ex.sentence ?? ex.text}</span>
                {ex.reading && <span className="text-slate-500 ml-2">({ex.reading})</span>}
                {(ex.meaning ?? ex.translation) && (
                  <span className="text-slate-400 ml-2">— {ex.meaning ?? ex.translation}</span>
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

export default Learn;
