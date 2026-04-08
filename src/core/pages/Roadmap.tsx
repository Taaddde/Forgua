/**
 * Roadmap page — learning paths with phases and milestones.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Clock, Coffee, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { db } from '../db/database';
import { loadRoadmaps } from '../packs';
import type { Roadmap as RoadmapType, RoadmapPhase } from '../types/pack-spec';

const trackConfig = {
  intensive: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-600/10 border-orange-500/30', activeBg: 'bg-orange-600' },
  standard: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-600/10 border-blue-500/30', activeBg: 'bg-blue-600' },
  casual: { icon: Coffee, color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-500/30', activeBg: 'bg-emerald-600' },
} as const;

export function Roadmap() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const packId = activePack?.id ?? null;

  const [roadmaps, setRoadmaps] = useState<RoadmapType[]>([]);
  const [loadedForPack, setLoadedForPack] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const loadingRoadmaps = packId !== null && packId !== loadedForPack;

  // Load roadmaps dynamically for the active pack
  useEffect(() => {
    if (!packId) return;
    let cancelled = false;
    loadRoadmaps(packId)
      .then((result) => {
        if (!cancelled) {
          setRoadmaps(result);
          setLoadedForPack(packId);
          setSelectedTrack(null);
          setExpandedPhase(null);
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

  // Load milestone progress from settings
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

  const selectedRoadmap = roadmaps.find((r) => r.id === selectedTrack);

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
                onClick={() => setSelectedTrack(roadmap.id)}
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
  const completedMilestones = selectedRoadmap.phases.reduce((sum, p, pi) =>
    sum + p.milestones.filter((_, mi) => milestoneProgress?.has(`${selectedRoadmap.id}-${pi}-${mi}`) ?? false).length
  , 0);

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
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mb-8">
        <div
          className={`h-full rounded-full transition-all duration-500 ${trackConfig[selectedRoadmap.type].activeBg}`}
          style={{ width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
        />
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {selectedRoadmap.phases.map((phase, phaseIdx) => (
          <PhaseCard
            key={phaseIdx}
            phase={phase}
            phaseIdx={phaseIdx}
            roadmapId={selectedRoadmap.id}
            isExpanded={expandedPhase === phaseIdx}
            onToggle={() => setExpandedPhase(expandedPhase === phaseIdx ? null : phaseIdx)}
            milestoneProgress={milestoneProgress ?? new Set()}
            onToggleMilestone={toggleMilestone}
          />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({
  phase, phaseIdx, roadmapId, isExpanded, onToggle, milestoneProgress, onToggleMilestone,
}: {
  phase: RoadmapPhase;
  phaseIdx: number;
  roadmapId: string;
  isExpanded: boolean;
  onToggle: () => void;
  milestoneProgress: Set<string>;
  onToggleMilestone: (key: string) => void;
}) {
  const { t } = useTranslation();
  const completedCount = phase.milestones.filter((_, mi) =>
    milestoneProgress.has(`${roadmapId}-${phaseIdx}-${mi}`)
  ).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400">
            {phaseIdx + 1}
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{phase.name}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{phase.duration}</span>
              <span className="text-xs px-1.5 py-0.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 rounded">{phase.level.toUpperCase()}</span>
              <span className="text-xs text-slate-500">{completedCount}/{phase.milestones.length}</span>
            </div>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-800 pt-3 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">{phase.content}</p>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('roadmap.dailyGoal')}</span>
            <p className="text-sm text-slate-400 mt-1">{phase.dailyGoal}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">{t('roadmap.milestones')}</span>
            <div className="mt-2 space-y-1.5">
              {phase.milestones.map((milestone, mi) => {
                const key = `${roadmapId}-${phaseIdx}-${mi}`;
                const isDone = milestoneProgress.has(key);
                return (
                  <button
                    key={mi}
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
                      {milestone}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roadmap;
