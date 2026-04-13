/**
 * Lessons page — lists lessons grouped by level with collapsible sections.
 * Lesson index is cached in the Zustand store to avoid reloading on navigation.
 * Opens LessonPlayer when user starts/replays a lesson.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Lock, CheckCircle, Clock, ChevronRight, ChevronDown, Play, RotateCcw, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useLessonProgress, completeLesson } from '../hooks/useLesson';
import { LessonPlayer } from '../components/lesson/LessonPlayer';
import { Button } from '../components/common/Button';
import { loadLessonIndex, loadLesson } from '../packs';
import { isLessonUnlocked } from '../utils/lesson-unlock';
import type { Lesson, LessonMeta } from '../types/lesson';

type LessonStatus = 'locked' | 'available' | 'completed';

export function Lessons() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activePack = useAppStore((s) => s.activePack);
  const devUnlockAll = useAppStore((s) => s.devUnlockAll);
  const lessonIndex = useAppStore((s) => s.lessonIndex);
  const lessonIndexPackId = useAppStore((s) => s.lessonIndexPackId);
  const setLessonIndex = useAppStore((s) => s.setLessonIndex);

  const packId = activePack?.id ?? null;
  const lessonProgress = useLessonProgress(packId);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loadingLesson, setLoadingLesson] = useState<string | null>(null);

  // true while the index for the current pack hasn't been stored yet
  const loadingIndex = packId !== null && lessonIndexPackId !== packId;

  // Load lesson index — skips the fetch if the store already has it for this pack
  useEffect(() => {
    if (!packId || lessonIndexPackId === packId) return;
    let cancelled = false;
    loadLessonIndex(packId)
      .then((result) => {
        if (!cancelled) setLessonIndex(packId, result);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Failed to load lesson index:', err);
          setLessonIndex(packId, null);
        }
      });
    return () => { cancelled = true; };
  }, [packId, lessonIndexPackId, setLessonIndex]);

  const lessons = useMemo(() => lessonIndex?.lessons ?? [], [lessonIndex]);

  const completedIds = useMemo(() => {
    const set = new Set<string>();
    for (const lp of lessonProgress) {
      if (lp.status === 'completed') set.add(lp.lessonId);
    }
    return set;
  }, [lessonProgress]);

  const progressMap = useMemo(() => {
    const map = new Map<string, { score?: number; timesCompleted: number }>();
    for (const lp of lessonProgress) {
      map.set(lp.lessonId, { score: lp.score, timesCompleted: lp.timesCompleted });
    }
    return map;
  }, [lessonProgress]);

  const getLessonStatus = useCallback(
    (meta: LessonMeta): LessonStatus => {
      if (completedIds.has(meta.id)) return 'completed';
      return isLessonUnlocked(meta, completedIds, devUnlockAll) ? 'available' : 'locked';
    },
    [completedIds, devUnlockAll],
  );

  // Group lessons by level, preserving the insertion order from the index.
  // Fully agnostic: works with any level string ("n5", "a1", "beginner", etc.)
  const groupedLevels = useMemo(() => {
    const map = new Map<string, LessonMeta[]>();
    for (const lesson of lessons) {
      const arr = map.get(lesson.level) ?? [];
      arr.push(lesson);
      map.set(lesson.level, arr);
    }
    return Array.from(map.entries()).map(([level, items]) => ({ level, items }));
  }, [lessons]);

  // Collapsible level sections — expand all by default when the index first loads
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const lastInitPackRef = useRef<string | null>(null);

  useEffect(() => {
    if (groupedLevels.length === 0 || packId === lastInitPackRef.current) return;
    lastInitPackRef.current = packId;
    setExpandedLevels(new Set(groupedLevels.map((g) => g.level)));
  }, [packId, groupedLevels]);

  const toggleLevel = useCallback((level: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const handleStartLesson = useCallback(
    async (meta: LessonMeta) => {
      if (!packId) return;
      setLoadingLesson(meta.id);
      try {
        const lesson = await loadLesson(packId, meta.id);
        if (lesson) setActiveLesson(lesson);
      } catch {
        // Failed to load lesson data
      } finally {
        setLoadingLesson(null);
      }
    },
    [packId],
  );

  const handleCompleteLesson = useCallback(
    async (score: number) => {
      if (!packId || !activeLesson) return;
      try {
        await completeLesson(packId, activeLesson.id, score, activeLesson.items);
      } catch (err) {
        console.error('Failed to save lesson progress:', err);
      }
      setActiveLesson(null);
    },
    [packId, activeLesson],
  );

  if (!activePack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lightbulb className="w-12 h-12 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('study.noPack')}</h2>
        <Button onClick={() => navigate('/pack-selector')} className="mt-4">
          {t('pack.selector.title')}
        </Button>
      </div>
    );
  }

  if (loadingIndex) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!lessonIndex || lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lightbulb className="w-12 h-12 text-slate-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('lessons.noLessons')}</h2>
      </div>
    );
  }

  if (activeLesson) {
    return (
      <LessonPlayer
        lesson={activeLesson}
        onComplete={handleCompleteLesson}
        onExit={() => setActiveLesson(null)}
      />
    );
  }

  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('lessons.title')}</h1>
          <p className="text-sm text-slate-400">{t('lessons.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && devUnlockAll && (
            <span
              title="Dev flag: all lessons unlocked (Settings → Developer)"
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30"
            >
              DEV · unlocked
            </span>
          )}
          <span className="text-sm text-slate-500">
            {completedCount}/{lessons.length}
          </span>
        </div>
      </div>

      {/* Global progress bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mb-8">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${(completedCount / lessons.length) * 100}%` }}
        />
      </div>

      {/* Level groups */}
      <div className="space-y-6">
        {groupedLevels.map(({ level, items }) => {
          // Level display name comes from the pack manifest — fully agnostic
          const levelName =
            (activePack.levels ?? []).find((l) => l.id === level)?.name ?? level.toUpperCase();
          const levelCompleted = items.filter((m) => completedIds.has(m.id)).length;
          const isExpanded = expandedLevels.has(level);

          return (
            <div key={level}>
              {/* Level header — acts as collapse/expand toggle */}
              <button
                onClick={() => toggleLevel(level)}
                className="w-full flex items-center justify-between py-2 px-1 group"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    {levelName}
                  </h2>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {levelCompleted}/{items.length}
                  </span>
                  <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${(levelCompleted / items.length) * 100}%` }}
                    />
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Lesson cards — only rendered when the level is expanded */}
              {isExpanded && (
                <div className="space-y-3 mt-2">
                  {items.map((meta) => {
                    const status = getLessonStatus(meta);
                    const progress = progressMap.get(meta.id);
                    const isLoading = loadingLesson === meta.id;

                    return (
                      <LessonCard
                        key={meta.id}
                        meta={meta}
                        status={status}
                        score={progress?.score}
                        timesCompleted={progress?.timesCompleted ?? 0}
                        isLoading={isLoading}
                        onStart={() => handleStartLesson(meta)}
                        t={t}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completedCount === lessons.length && (
        <p className="text-center text-emerald-400 font-medium mt-8">
          {t('lessons.allCompleted')}
        </p>
      )}
    </div>
  );
}

function LessonCard({
  meta,
  status,
  score,
  timesCompleted,
  isLoading,
  onStart,
  t,
}: {
  meta: LessonMeta;
  status: LessonStatus;
  score?: number;
  timesCompleted: number;
  isLoading: boolean;
  onStart: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const categoryColors: Record<string, string> = {
    characters: 'text-purple-400 bg-purple-500/10',
    vocabulary: 'text-blue-400 bg-blue-500/10',
    grammar: 'text-amber-400 bg-amber-500/10',
    mixed: 'text-emerald-400 bg-emerald-500/10',
  };

  const categoryColor = categoryColors[meta.category] ?? categoryColors.mixed;

  if (status === 'locked') {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 rounded-xl p-4 opacity-60">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-500 text-sm truncate">{meta.title}</h3>
            <p className="text-xs text-slate-600 truncate">{meta.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColor}`}>
                {meta.category}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onStart}
      disabled={isLoading}
      className={`w-full text-left bg-white dark:bg-slate-900 border rounded-xl p-4 transition-colors ${
        status === 'completed'
          ? 'border-emerald-500/20 hover:border-emerald-500/40'
          : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          status === 'completed' ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
        }`}>
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          ) : status === 'completed' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <Play className="w-5 h-5 text-indigo-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">{meta.title}</h3>
          <p className="text-xs text-slate-400 truncate">{meta.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColor}`}>
              {meta.category}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('lessons.estimated', { minutes: meta.estimatedMinutes })}
            </span>
            <span className="text-[10px] text-slate-500">
              {t('lessons.newItems', { count: meta.newItemCount })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === 'completed' && score !== undefined && (
            <span className="text-xs text-emerald-400 font-medium">{score}%</span>
          )}
          {status === 'completed' && timesCompleted > 0 && (
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          )}
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </div>
      </div>
    </button>
  );
}

export default Lessons;
