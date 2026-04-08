import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Flame, Target, TrendingUp, ChevronRight, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/useAppStore';
import { useProgress } from '../hooks/useProgress';
import { Button } from '../components/common/Button';
import { db } from '../db/database';
import { loadLessonIndex } from '../packs';
import { startOfDay, subDays, format } from 'date-fns';
import type { LessonIndex } from '../types/lesson';

export function Dashboard() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const navigate = useNavigate();
  const packId = activePack?.id ?? null;
  const { totalStats, todayStats, studyHistory } = useProgress(packId);

  const [lessonIndex, setLessonIndex] = useState<LessonIndex | null>(null);

  // Load lesson index dynamically
  useEffect(() => {
    if (!packId) return;
    let cancelled = false;
    loadLessonIndex(packId)
      .then((result) => { if (!cancelled) setLessonIndex(result); })
      .catch(() => { if (!cancelled) setLessonIndex(null); });
    return () => { cancelled = true; };
  }, [packId]);

  // Next available lesson
  const nextLesson = useLiveQuery(async () => {
    if (!packId || !lessonIndex) return null;
    const completed = await db.lessonProgress
      .where('packId').equals(packId)
      .filter((lp) => lp.status === 'completed')
      .toArray();
    const completedIds = new Set(completed.map((lp) => lp.lessonId));
    return lessonIndex.lessons.find(
      (l) => !completedIds.has(l.id) && l.prerequisites.every((p) => completedIds.has(p)),
    ) ?? null;
  }, [packId, lessonIndex]);

  // Count of due review cards
  const dueCount = useLiveQuery(async () => {
    if (!packId) return 0;
    return db.srsState
      .where('[packId+nextReview]')
      .between([packId, new Date(0)], [packId, new Date()], true, true)
      .count();
  }, [packId]);

  // Lesson progress stats
  const lessonStats = useLiveQuery(async () => {
    if (!packId) return { completed: 0, total: 0 };
    const completed = await db.lessonProgress
      .where('packId').equals(packId)
      .filter((lp) => lp.status === 'completed')
      .count();
    return { completed, total: lessonIndex?.lessons.length ?? 0 };
  }, [packId, lessonIndex]);

  if (!activePack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
          <GraduationCap className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          {t('dashboard.welcome')}
        </h1>
        <p className="text-slate-400 max-w-md mb-8">
          {t('dashboard.selectPack')}
        </p>
        <Button size="lg" onClick={() => navigate('/pack-selector')}>
          {t('pack.selector.title')}
        </Button>
      </div>
    );
  }

  const accuracyDisplay = todayStats.reviewed > 0
    ? `${Math.round(todayStats.accuracy * 100)}%`
    : '—';

  const stats = [
    { icon: Target, label: t('dashboard.reviewed'), value: String(todayStats.reviewed), color: 'text-blue-400' },
    { icon: GraduationCap, label: t('dashboard.newCards'), value: String(todayStats.newCards), color: 'text-emerald-400' },
    { icon: TrendingUp, label: t('dashboard.accuracy'), value: accuracyDisplay, color: 'text-amber-400' },
    { icon: Flame, label: t('dashboard.streak'), value: `${totalStats.currentStreak} ${t('dashboard.days')}`, color: 'text-orange-400' },
  ];

  // Build weekly chart data (last 7 days)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 6 - i));
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const daySessions = studyHistory.filter(
      (s) => new Date(s.date) >= day && new Date(s.date) < dayEnd,
    );
    return {
      day: format(day, 'EEE'),
      reviewed: daySessions.reduce((sum, s) => sum + s.reviewed, 0),
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">{activePack.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activePack.name}</h1>
          <p className="text-sm text-slate-400">{activePack.nativeName} · v{activePack.version}</p>
        </div>
      </div>

      {/* Next action card */}
      <div className="mb-8">
        {(dueCount ?? 0) > 0 ? (
          <button
            onClick={() => navigate('/study')}
            className="w-full p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-left hover:bg-indigo-600/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('dashboard.reviewDue', { count: dueCount ?? 0 })}
                </h3>
                <p className="text-sm text-slate-400">{t('dashboard.reviewDescription')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-indigo-400 shrink-0" />
            </div>
          </button>
        ) : nextLesson ? (
          <button
            onClick={() => navigate('/lessons')}
            className="w-full p-6 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 text-left hover:bg-emerald-600/20 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('dashboard.nextLesson')}
                </h3>
                <p className="text-sm text-slate-400">{nextLesson.title}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
          </button>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-slate-400">{t('dashboard.allCaughtUp')}</p>
          </div>
        )}
      </div>

      {/* Lesson progress bar */}
      {lessonStats && lessonStats.total > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {t('dashboard.lessonProgress')}
            </h2>
            <span className="text-xs text-slate-500">{lessonStats.completed}/{lessonStats.total}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(lessonStats.completed / lessonStats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Today's stats */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        {t('dashboard.todayStats')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-500 font-medium">{label}</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
          </div>
        ))}
      </div>

      {/* Weekly activity chart */}
      {studyHistory.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            {t('dashboard.weeklyActivity')}
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-8 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--chart-tooltip-bg, #f8fafc)',
                    border: '1px solid var(--chart-tooltip-border, #e2e8f0)',
                    borderRadius: '8px',
                    color: 'var(--chart-tooltip-text, #0f172a)',
                  }}
                />
                <Bar dataKey="reviewed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Total progress */}
      {totalStats.totalLearned > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            {t('dashboard.totalProgress')}
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 block">{totalStats.totalLearned}</span>
              <span className="text-xs text-slate-500">{t('dashboard.totalLearned')}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 block">{totalStats.totalMature}</span>
              <span className="text-xs text-slate-500">{t('dashboard.totalMature')}</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 block">
                {totalStats.totalLearned > 0 ? `${Math.round(totalStats.overallAccuracy * 100)}%` : '—'}
              </span>
              <span className="text-xs text-slate-500">{t('dashboard.overallAccuracy')}</span>
            </div>
          </div>
        </>
      )}

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate('/study')}>
          {t('study.startReview')}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/lessons')}>
          <Lightbulb className="w-4 h-4" />
          {t('nav.lessons')}
        </Button>
      </div>
    </div>
  );
}

export default Dashboard;
