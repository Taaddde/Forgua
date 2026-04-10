/**
 * Roadmap page — learning paths with phases and milestones.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Zap, Clock, Coffee, ChevronDown, ChevronUp, Check, Loader2, Target, BookOpen, GraduationCap, Lock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { useProgress } from '../hooks/useProgress';
import { useLessonProgress } from '../hooks/useLesson';
import { db } from '../db/database';
import { loadRoadmaps } from '../packs';
import { Button } from '../components/common/Button';
import type { Roadmap as RoadmapType, RoadmapPhase, RoadmapMilestone } from '../types/pack-spec';
import type { UserProgress } from '../types/models';

const trackConfig = {
  intensive: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-600/10 border-orange-500/30', activeBg: 'bg-orange-600' },
  standard: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-500/30', activeBg: 'bg-blue-600' },
  casual: { icon: Coffee, color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-500/30', activeBg: 'bg-emerald-600' },
} as const;

const routeIcon: Record<string, typeof BookOpen> = {
  '/lessons': BookOpen,
  '/study': GraduationCap,
  '/reading': BookOpen,
};

// --- Milestone helpers ---

function getMilestoneText(m: string | RoadmapMilestone): string {
  return typeof m === 'string' ? m : m.text;
}

/** Returns auto-completion state: true = done, false = not done, null = manual (no auto-detect). */
function evaluateMilestone(
  m: string | RoadmapMilestone,
  srsProgress: UserProgress[],
  completedLessonIds: Set<string>,
): boolean | null {
  if (typeof m === 'string' || !m.type || m.type === 'manual') return null;

  if (m.type === 'srs_learned') {
    const relevant = srsProgress.filter(
      (p) => (!m.level || p.level === m.level) && (!m.category || p.category === m.category),
    );
    const current = relevant.reduce((sum, p) => sum + p.learned, 0);
    return current >= (m.target ?? 0);
  }

  if (m.type === 'srs_mature') {
    const relevant = srsProgress.filter(
      (p) => (!m.level || p.level === m.level) && (!m.category || p.category === m.category),
    );
    const current = relevant.reduce((sum, p) => sum + p.mature, 0);
    return current >= (m.target ?? 0);
  }

  if (m.type === 'lessons_completed') {
    const prefixes = m.lessonPrefixes ?? (m.lessonPrefix ? [m.lessonPrefix] : []);
    if (prefixes.length === 0) return null;
    const completedCount = Array.from(completedLessonIds).filter((id) =>
      prefixes.some((p) => id.startsWith(p)),
    ).length;
    return completedCount >= (m.total ?? 1);
  }

  return null;
}

/** Returns { current, target } for srs_* and lessons_completed milestones; null for manual. */
function getMilestoneCounter(
  m: string | RoadmapMilestone,
  srsProgress: UserProgress[],
  completedLessonIds: Set<string>,
): { current: number; target: number } | null {
  if (typeof m === 'string' || !m.type || m.type === 'manual') return null;

  if (m.type === 'srs_learned') {
    const relevant = srsProgress.filter(
      (p) => (!m.level || p.level === m.level) && (!m.category || p.category === m.category),
    );
    return { current: relevant.reduce((sum, p) => sum + p.learned, 0), target: m.target ?? 0 };
  }

  if (m.type === 'srs_mature') {
    const relevant = srsProgress.filter(
      (p) => (!m.level || p.level === m.level) && (!m.category || p.category === m.category),
    );
    return { current: relevant.reduce((sum, p) => sum + p.mature, 0), target: m.target ?? 0 };
  }

  if (m.type === 'lessons_completed') {
    const prefixes = m.lessonPrefixes ?? (m.lessonPrefix ? [m.lessonPrefix] : []);
    const current = Array.from(completedLessonIds).filter((id) =>
      prefixes.some((p) => id.startsWith(p)),
    ).length;
    return { current, target: m.total ?? 1 };
  }

  return null;
}

// --- Component ---

export function Roadmap() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activePack = useAppStore((s) => s.activePack);
  const packId = activePack?.id ?? null;

  const [roadmaps, setRoadmaps] = useState<RoadmapType[]>([]);
  const [loadedForPack, setLoadedForPack] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null | undefined>(undefined);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [autoExpandedForTrack, setAutoExpandedForTrack] = useState<string | null>(null);

  const loadingRoadmaps = packId !== null && packId !== loadedForPack;

  const { totalStats, progress: srsProgress } = useProgress(packId);
  const lessonProgressRecords = useLessonProgress(packId);

  const completedLessonIds = useMemo(() => {
    const set = new Set<string>();
    for (const lp of lessonProgressRecords) {
      if (lp.status === 'completed') set.add(lp.lessonId);
    }
    return set;
  }, [lessonProgressRecords]);

  // Load roadmaps dynamically for the active pack
  useEffect(() => {
    if (!packId) return;
    let cancelled = false;
    loadRoadmaps(packId)
      .then((result) => {
        if (!cancelled) {
          setRoadmaps(result);
          setLoadedForPack(packId);
          setSelectedTrack(undefined);
          setExpandedPhase(null);
          setAutoExpandedForTrack(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Failed to load roadmaps:', err);
          setRoadmaps([]);
          setLoadedForPack(packId);
        }
      });
    return () => { cancelled = true; };
  }, [packId]);

  // Persist and restore track selection per pack
  const persistedTrack = useLiveQuery(async () => {
    if (!packId) return null;
    const setting = await db.settings.get(`roadmap-track-${packId}`);
    return typeof setting?.value === 'string' ? setting.value : null;
  }, [packId]);

  const effectiveTrack = useMemo(() => {
    if (selectedTrack !== undefined) return selectedTrack;
    if (loadedForPack === packId && roadmaps.length > 0 && persistedTrack && roadmaps.find((r) => r.id === persistedTrack)) {
      return persistedTrack;
    }
    return null;
  }, [selectedTrack, loadedForPack, packId, roadmaps, persistedTrack]);

  const selectTrack = useCallback(async (id: string) => {
    setSelectedTrack(id);
    setAutoExpandedForTrack(null);
    if (packId) {
      await db.settings.put({ key: `roadmap-track-${packId}`, value: id as unknown as string });
    }
  }, [packId]);

  // Manual milestone progress (checkboxes saved in IndexedDB)
  const milestoneProgress = useLiveQuery(async () => {
    if (!packId) return new Set<string>();
    const setting = await db.settings.get(`roadmap-progress-${packId}`);
    if (setting && Array.isArray(setting.value)) {
      return new Set(setting.value as string[]);
    }
    return new Set<string>();
  }, [packId]);

  const toggleMilestone = useCallback(async (key: string) => {
    if (!packId || !milestoneProgress) return;
    const newSet = new Set(milestoneProgress);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    await db.settings.put({
      key: `roadmap-progress-${packId}`,
      value: [...newSet] as unknown as string,
    });
  }, [packId, milestoneProgress]);

  const selectedRoadmap = roadmaps.find((r) => r.id === effectiveTrack);

  // Compute effective "done" state per milestone key
  const milestoneStates = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!selectedRoadmap || !milestoneProgress) return map;

    selectedRoadmap.phases.forEach((phase, pi) => {
      phase.milestones.forEach((m, mi) => {
        const key = `${selectedRoadmap.id}-${pi}-${mi}`;
        const autoResult = evaluateMilestone(m, srsProgress, completedLessonIds);
        if (autoResult !== null) {
          map.set(key, autoResult);
        } else {
          map.set(key, milestoneProgress.has(key));
        }
      });
    });

    return map;
  }, [selectedRoadmap, milestoneProgress, srsProgress, completedLessonIds]);

  // First phase with any incomplete milestone
  const currentPhaseIdx = useMemo(() => {
    if (!selectedRoadmap) return 0;
    const idx = selectedRoadmap.phases.findIndex((phase, pi) => {
      const total = phase.milestones.length;
      const done = phase.milestones.filter((_, mi) =>
        milestoneStates.get(`${selectedRoadmap.id}-${pi}-${mi}`) === true,
      ).length;
      return done < total;
    });
    return idx === -1 ? selectedRoadmap.phases.length - 1 : idx;
  }, [selectedRoadmap, milestoneStates]);

  // Auto-expand current phase once per track selection (render-time adjustment)
  if (effectiveTrack && milestoneProgress !== undefined && autoExpandedForTrack !== effectiveTrack) {
    setExpandedPhase(currentPhaseIdx);
    setAutoExpandedForTrack(effectiveTrack);
  }

  if (!activePack) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('study.noPack')}
      </div>
    );
  }

  if (loadingRoadmaps) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        {t('roadmap.noRoadmaps')}
      </div>
    );
  }

  // Track selection
  if (!selectedRoadmap) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('roadmap.title')}</h1>
        <p className="text-slate-400 text-sm mb-8">{t('roadmap.selectTrack')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roadmaps.map((roadmap) => {
            const config = trackConfig[roadmap.type];
            const Icon = config.icon;
            return (
              <button
                key={roadmap.id}
                onClick={() => selectTrack(roadmap.id)}
                className={`p-6 rounded-xl border text-left transition-all hover:scale-[1.02] ${config.bg}`}
              >
                <Icon className={`w-8 h-8 ${config.color} mb-3`} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t(`roadmap.${roadmap.type}.name`)}
                </h3>
                <p className={`text-sm font-medium ${config.color} mb-2`}>
                  {t(`roadmap.${roadmap.type}.tagline`)}
                </p>
                <p className="text-xs text-slate-400">{roadmap.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Phase timeline
  const totalMilestones = selectedRoadmap.phases.reduce((sum, p) => sum + p.milestones.length, 0);
  const completedMilestones = selectedRoadmap.phases.reduce(
    (sum, p, pi) =>
      sum +
      p.milestones.filter((_, mi) =>
        milestoneStates.get(`${selectedRoadmap.id}-${pi}-${mi}`) === true,
      ).length,
    0,
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedRoadmap.name}</h1>
          <p className="text-sm text-slate-400">
            {t('roadmap.progress', { completed: completedMilestones, total: totalMilestones })}
          </p>
        </div>
        <button
          onClick={() => { setSelectedTrack(null); setExpandedPhase(null); }}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          {t('roadmap.changeTrack')}
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${trackConfig[selectedRoadmap.type].activeBg}`}
          style={{ width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
        />
      </div>

      {/* Real SRS stats context */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 min-h-[1rem]">
        {totalStats.totalLearned > 0 && (
          <span>
            <span className="text-slate-300 font-medium">{totalStats.totalLearned}</span>
            {' '}{t('roadmap.statsLearned')}
          </span>
        )}
        {totalStats.totalMature > 0 && (
          <span>
            <span className="text-slate-300 font-medium">{totalStats.totalMature}</span>
            {' '}{t('roadmap.statsMature')}
          </span>
        )}
        {totalStats.currentStreak > 0 && (
          <span>
            <span className="text-slate-300 font-medium">{totalStats.currentStreak}</span>
            {' '}{t('roadmap.statsStreak')}
          </span>
        )}
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {selectedRoadmap.phases.map((phase, phaseIdx) => (
          <PhaseCard
            key={phaseIdx}
            phase={phase}
            phaseIdx={phaseIdx}
            roadmapId={selectedRoadmap.id}
            isCurrent={phaseIdx === currentPhaseIdx}
            isExpanded={expandedPhase === phaseIdx}
            onToggle={() => setExpandedPhase(expandedPhase === phaseIdx ? null : phaseIdx)}
            milestoneStates={milestoneStates}
            srsProgress={srsProgress}
            completedLessonIds={completedLessonIds}
            onToggleMilestone={toggleMilestone}
            onNavigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({
  phase, phaseIdx, roadmapId, isCurrent, isExpanded, onToggle,
  milestoneStates, srsProgress, completedLessonIds,
  onToggleMilestone, onNavigate,
}: {
  phase: RoadmapPhase;
  phaseIdx: number;
  roadmapId: string;
  isCurrent: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  milestoneStates: Map<string, boolean>;
  srsProgress: UserProgress[];
  completedLessonIds: Set<string>;
  onToggleMilestone: (key: string) => void;
  onNavigate: (route: string) => void;
}) {
  const { t } = useTranslation();

  const completedCount = phase.milestones.filter((_, mi) =>
    milestoneStates.get(`${roadmapId}-${phaseIdx}-${mi}`) === true,
  ).length;
  const isPhaseComplete = completedCount === phase.milestones.length && phase.milestones.length > 0;

  const actions = (phase.actions && phase.actions.length > 0)
    ? phase.actions
    : [
        { label: t('nav.lessons'), route: '/lessons', variant: 'secondary' as const },
        { label: t('nav.study'), route: '/study', variant: 'primary' as const },
      ];

  return (
    <div className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-colors ${
      isCurrent
        ? 'border-indigo-500/40 dark:border-indigo-500/30'
        : isPhaseComplete
          ? 'border-emerald-500/20'
          : 'border-slate-200 dark:border-slate-800'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Phase badge */}
          {isPhaseComplete ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
          ) : isCurrent ? (
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-sm font-bold text-indigo-400 shrink-0">
              {phaseIdx + 1}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 shrink-0">
              {phaseIdx + 1}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                isPhaseComplete
                  ? 'text-slate-500'
                  : isCurrent
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-slate-700 dark:text-slate-300'
              }`}>
                {phase.name}
              </span>
              {isCurrent && (
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded font-medium shrink-0">
                  {t('roadmap.currentPhase')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{phase.duration}</span>
              <span className="text-xs px-1.5 py-0.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 rounded">
                {phase.level.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500">
                {completedCount}/{phase.milestones.length} {t('roadmap.milestones').toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        {isExpanded
          ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        }
      </button>

      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-800">

          {/* 1. DO NOW — action buttons */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase mr-1">
              {t('roadmap.doNow')}
            </span>
            {actions.map((action, ai) => {
              const Icon = routeIcon[action.route] ?? GraduationCap;
              return (
                <Button
                  key={ai}
                  size="sm"
                  variant={action.variant === 'secondary' ? 'secondary' : 'primary'}
                  onClick={() => onNavigate(action.route)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {action.label}
                </Button>
              );
            })}
          </div>

          <div className="px-4 pb-4 space-y-4">
            {/* 2. DAILY GOAL */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  {t('roadmap.dailyGoal')}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{phase.dailyGoal}</p>
            </div>

            {/* 3. CONTENT */}
            <p className="text-sm text-slate-500">{phase.content}</p>

            {/* 4. MILESTONES */}
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {t('roadmap.milestones')}
              </span>
              <div className="mt-2 space-y-2">
                {phase.milestones.map((m, mi) => {
                  const key = `${roadmapId}-${phaseIdx}-${mi}`;
                  const text = getMilestoneText(m);
                  const autoResult = evaluateMilestone(m, srsProgress, completedLessonIds);
                  const counter = getMilestoneCounter(m, srsProgress, completedLessonIds);
                  const isDone = milestoneStates.get(key) === true;
                  const isAuto = autoResult !== null;

                  return (
                    <div key={mi}>
                      {isAuto ? (
                        // Auto-detected milestone — not user-toggleable
                        <div className="flex items-start gap-2.5">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-500'
                              : 'border-slate-600 bg-slate-800/30'
                          }`}>
                            {isDone
                              ? <Check className="w-3 h-3 text-white" />
                              : <Lock className="w-2.5 h-2.5 text-slate-500" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${
                              isDone ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {text}
                            </span>
                            {counter && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${Math.min(100, (counter.current / counter.target) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-500 shrink-0">
                                  {counter.current}/{counter.target}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Manual milestone — user-toggleable checkbox
                        <button
                          onClick={() => onToggleMilestone(key)}
                          className="w-full flex items-center gap-2.5 text-left group"
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-500'
                              : 'border-slate-600 group-hover:border-slate-500'
                          }`}>
                            {isDone && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm transition-colors ${
                            isDone ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {text}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roadmap;
