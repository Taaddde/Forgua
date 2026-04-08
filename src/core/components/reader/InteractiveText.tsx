/**
 * InteractiveText — renders tokens as clickable spans with optional furigana.
 * Used in the Reading page for click-to-define functionality.
 */

import type { Token } from '../../types/adapter';

interface InteractiveTextProps {
  tokens: Token[];
  onTokenClick: (token: Token, event: React.MouseEvent) => void;
  showFurigana?: boolean;
}

export function InteractiveText({ tokens, onTokenClick, showFurigana = false }: InteractiveTextProps) {
  return (
    <span className="text-lg text-slate-900 dark:text-slate-100 leading-loose">
      {tokens.map((token, idx) => {
        const isWord = token.pos && token.pos !== 'symbol' && token.pos !== 'punctuation';

        if (!isWord) {
          return <span key={idx}>{token.surface}</span>;
        }

        if (showFurigana && token.reading && token.reading !== token.surface) {
          return (
            <ruby
              key={idx}
              onClick={(e) => onTokenClick(token, e)}
              className="cursor-pointer hover:bg-indigo-500/20 rounded px-0.5 transition-colors"
            >
              {token.surface}
              <rp>(</rp>
              <rt className="text-xs text-slate-500">{token.reading}</rt>
              <rp>)</rp>
            </ruby>
          );
        }

        return (
          <span
            key={idx}
            onClick={(e) => onTokenClick(token, e)}
            className="cursor-pointer hover:bg-indigo-500/20 rounded px-0.5 transition-colors"
          >
            {token.surface}
          </span>
        );
      })}
    </span>
  );
}
