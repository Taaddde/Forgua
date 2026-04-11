/**
 * ClozeMulti exercise — fill multiple blanks in a sentence or passage.
 *
 * Template format: use {0}, {1}, {2} as blank markers.
 * Example: "El {0} está en la {1} de la {2}."
 *
 * Each blank can be:
 * - MC chips (options provided): click to select
 * - Free text (no options): type the answer
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { scoreClozeMulti } from '../../engine/scoring';
import { Button } from '../common/Button';
import { ReviewGrade } from '../../types/models';

type ReviewGradeValue = typeof ReviewGrade[keyof typeof ReviewGrade];

export interface BlankSlot {
  answer: string;
  options?: string[];   // If absent → free-text input
}

interface ClozeMultiProps {
  template: string;
  blanks: BlankSlot[];
  onAnswer: (correct: boolean, grade: ReviewGradeValue) => void;
}

/** Split template into text segments and blank indices */
function parseTemplate(template: string, count: number): Array<{ type: 'text'; value: string } | { type: 'blank'; index: number }> {
  const parts: Array<{ type: 'text'; value: string } | { type: 'blank'; index: number }> = [];
  let remaining = template;

  for (let i = 0; i < count; i++) {
    const marker = `{${i}}`;
    const idx = remaining.indexOf(marker);
    if (idx === -1) break;

    if (idx > 0) parts.push({ type: 'text', value: remaining.slice(0, idx) });
    parts.push({ type: 'blank', index: i });
    remaining = remaining.slice(idx + marker.length);
  }

  if (remaining) parts.push({ type: 'text', value: remaining });
  return parts;
}

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function ClozeMulti({ template, blanks, onAnswer }: ClozeMultiProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<(string | null)[]>(blanks.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const parsed = parseTemplate(template, blanks.length);
  const allFilled = values.every((v) => v !== null && v.trim() !== '');

  function setValue(index: number, value: string) {
    if (submitted) return;
    setValues((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function handleSubmit() {
    if (!allFilled || submitted) return;

    const perBlank = blanks.map((blank, i) => {
      const userVal = values[i] ?? '';
      return normalizeAnswer(userVal) === normalizeAnswer(blank.answer);
    });

    setResults(perBlank);
    setSubmitted(true);

    const correctCount = perBlank.filter(Boolean).length;
    const scoreResult = scoreClozeMulti(correctCount, blanks.length);
    setTimeout(() => onAnswer(scoreResult.correct, scoreResult.grade), 1500);
  }

  function getInputStyle(index: number): string {
    const base = 'inline-block px-3 py-1 mx-1 rounded-lg border-b-2 text-center font-medium align-baseline transition-colors';
    if (!submitted) {
      const filled = values[index] !== null && values[index] !== '';
      return `${base} ${filled
        ? 'border-indigo-500 bg-indigo-600/10 text-indigo-300 min-w-[5rem]'
        : 'border-slate-400 bg-transparent text-slate-400 min-w-[5rem]'}`;
    }
    return `${base} min-w-[5rem] ${results[index]
      ? 'border-emerald-500 bg-emerald-600/10 text-emerald-300'
      : 'border-red-500 bg-red-600/10 text-red-300'}`;
  }

  function getChipStyle(option: string, blankIndex: number): string {
    const isSelected = values[blankIndex] === option;
    const base = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border';

    if (submitted) {
      if (option === blanks[blankIndex].answer) {
        return `${base} bg-emerald-600/20 border-emerald-500/40 text-emerald-300`;
      }
      if (isSelected && option !== blanks[blankIndex].answer) {
        return `${base} bg-red-600/20 border-red-500/40 text-red-300`;
      }
      return `${base} bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400`;
    }

    return isSelected
      ? `${base} bg-indigo-600/20 border-indigo-500/40 text-indigo-300`
      : `${base} bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer`;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {t('exercise.fillBlankMulti')}
        </span>
      </div>

      {/* Sentence with inline blank indicators */}
      <div className="text-lg text-slate-900 dark:text-slate-100 leading-loose text-center mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
        {parsed.map((part, i) => {
          if (part.type === 'text') {
            return <span key={i}>{part.value}</span>;
          }
          const blank = blanks[part.index];
          return (
            <span key={i} className={getInputStyle(part.index)}>
              {values[part.index] ?? '___'}
            </span>
          );
        })}
      </div>

      {/* Controls per blank */}
      <div className="space-y-4 mb-6">
        {blanks.map((blank, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                submitted
                  ? results[index]
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'bg-red-600/20 text-red-400'
                  : 'bg-indigo-600/20 text-indigo-400'
              }`}>
                {index + 1}
              </span>
              {submitted && (
                results[index]
                  ? <Check className="w-4 h-4 text-emerald-400" />
                  : <X className="w-4 h-4 text-red-400" />
              )}
              {submitted && !results[index] && (
                <span className="text-xs text-slate-400">
                  {t('exercise.expected')}: <span className="text-slate-200">{blank.answer}</span>
                </span>
              )}
            </div>

            {blank.options ? (
              /* MC chips */
              <div className="flex flex-wrap gap-2 pl-8">
                {blank.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setValue(index, option)}
                    disabled={submitted}
                    className={getChipStyle(option, index)}
                    data-testid={`blank-${index}-option-${option}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              /* Free-text input */
              <div className="pl-8">
                <input
                  type="text"
                  value={values[index] ?? ''}
                  onChange={(e) => setValue(index, e.target.value)}
                  disabled={submitted}
                  placeholder={`Espacio ${index + 1}...`}
                  data-testid={`blank-${index}-input`}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-60"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} disabled={!allFilled} className="w-full">
          {t('exercise.check')}
        </Button>
      )}

      {submitted && (
        <div className={`text-center text-sm font-medium mt-2 ${
          results.every(Boolean) ? 'text-emerald-400' : 'text-amber-400'
        }`}>
          {results.every(Boolean)
            ? t('exercise.correct')
            : `${results.filter(Boolean).length}/${blanks.length} ${t('exercise.correct').toLowerCase()}`}
        </div>
      )}
    </div>
  );
}
