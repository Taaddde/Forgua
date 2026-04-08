import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, ChevronRight, CheckCircle, XCircle, ArrowRight, SkipForward } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePlacement } from '../hooks/usePlacement';
import { Button } from '../components/common/Button';

export function Placement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activePack = useAppStore((s) => s.activePack);
  const {
    step,
    config,
    result,
    isLoading,
    currentQuestions,
    currentQuestionIndex,
    currentLevelId,
    startPlacement,
    submitSelfReport,
    submitAnswer,
  } = usePlacement();

  useEffect(() => {
    if (activePack && step === 'idle') {
      startPlacement(activePack.id);
    }
  }, [activePack, step, startPlacement]);

  if (!activePack) {
    navigate('/pack-selector');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Self-report step: show levels with can-do statements
  if (step === 'self-report' && config) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t('placement.title')}
          </h1>
          <p className="text-slate-400">
            {t('placement.subtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {/* Start from scratch — prominent first option */}
          <button
            onClick={() => navigate('/')}
            className="w-full p-5 rounded-xl bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center shrink-0">
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-lg font-semibold text-slate-100">
                  {t('placement.fromScratch')}
                </span>
                <p className="text-sm text-slate-400 mt-0.5">
                  {t('placement.fromScratchDesc')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('placement.orSelectLevel')}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Level options */}
          {config.levels.map((level) => {
            const packLevel = activePack.levels.find((l) => l.id === level.levelId);
            return (
              <button
                key={level.levelId}
                onClick={() => submitSelfReport(level.levelId)}
                className="w-full p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {packLevel?.name ?? level.levelId}
                      </span>
                      {packLevel?.description && (
                        <span className="text-sm text-slate-500">{packLevel.description}</span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {level.canDoStatements.map((statement, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5 shrink-0">-</span>
                          {statement}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz step: show questions one at a time, no feedback
  if (step === 'quiz' && currentQuestions.length > 0) {
    const question = currentQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / currentQuestions.length) * 100;
    const levelName = activePack.levels.find((l) => l.id === currentLevelId)?.name ?? currentLevelId;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              {t('placement.testing', { level: levelName })}
            </span>
            <span className="text-xs text-slate-500">
              {currentQuestionIndex + 1} / {currentQuestions.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-6">
          {question.context && (
            <p className="text-sm text-slate-500 mb-4">{question.context}</p>
          )}
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-8">
            {question.prompt}
          </h2>

          {/* Multiple choice options */}
          {question.type === 'multiple-choice' && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => submitAnswer(index)}
                  className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/40 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-left text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-400 shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* True/False */}
          {question.type === 'true-false' && (
            <div className="flex gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={() => submitAnswer(true)}
              >
                <CheckCircle className="w-5 h-5" />
                {t('placement.true')}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={() => submitAnswer(false)}
              >
                <XCircle className="w-5 h-5" />
                {t('placement.false')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Result step
  if (step === 'result' && result) {
    const confirmedLevel = activePack.levels.find((l) => l.id === result.confirmedLevel);
    const skippedCount = result.skippedLevels.length;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t('placement.resultTitle')}
          </h1>
          <p className="text-slate-400">
            {t('placement.resultSubtitle')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 mb-8">
          {/* Confirmed level */}
          <div className="text-center mb-6">
            <span className="text-sm text-slate-500 uppercase tracking-wider">
              {t('placement.yourLevel')}
            </span>
            <h2 className="text-3xl font-bold text-indigo-400 mt-2">
              {confirmedLevel?.name ?? result.confirmedLevel}
            </h2>
            {confirmedLevel?.description && (
              <p className="text-slate-400 mt-1">{confirmedLevel.description}</p>
            )}
          </div>

          {/* Accuracy */}
          <div className="flex items-center justify-center gap-8 py-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {Math.round(result.accuracy * 100)}%
              </span>
              <p className="text-xs text-slate-500">{t('placement.accuracy')}</p>
            </div>
            {skippedCount > 0 && (
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <SkipForward className="w-4 h-4 text-amber-400" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{skippedCount}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {t('placement.skippedLevels', { count: skippedCount })}
                </p>
              </div>
            )}
          </div>
        </div>

        {skippedCount > 0 && (
          <p className="text-sm text-slate-500 text-center mb-8">
            {t('placement.skippedExplanation')}
          </p>
        )}

        <div className="flex justify-center">
          <Button size="lg" onClick={() => navigate('/')}>
            {t('placement.startStudying')}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

export default Placement;
