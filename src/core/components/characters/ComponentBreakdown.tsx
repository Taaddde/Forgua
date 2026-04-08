/**
 * ComponentBreakdown — visual decomposition of a character into its sub-components.
 * Works for any writing system: kanji radicals, hangul jamos, etc.
 */

import type { CharacterComponent } from '../../types/pack-spec';

interface ComponentBreakdownProps {
  character: string;
  components: CharacterComponent[];
  className?: string;
}

const typeColors: Record<string, string> = {
  radical: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  semantic: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  phonetic: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  jamo: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
};

const defaultColor = 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

export function ComponentBreakdown({ character, components, className = '' }: ComponentBreakdownProps) {
  if (components.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Original character */}
        <span className="text-3xl text-slate-900 dark:text-slate-100">{character}</span>
        <span className="text-slate-500 text-lg">=</span>

        {/* Component chips */}
        {components.map((comp, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-600">+</span>}
            <div
              className={`flex flex-col items-center px-3 py-2 rounded-lg border ${typeColors[comp.type ?? ''] ?? defaultColor}`}
            >
              <span className="text-2xl leading-none">{comp.component}</span>
              <span className="text-[10px] mt-1 opacity-80">{comp.meaning}</span>
              {comp.position && (
                <span className="text-[9px] opacity-50">{comp.position}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
