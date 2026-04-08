/**
 * BrowserSupportBanner — shown when Web Speech API is unavailable or blocked.
 * Speech recognition requires Chrome or Edge (uses Google's STT service internally).
 */

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { isTauri } from '../../utils/platform';

interface BrowserSupportBannerProps {
  feature: 'speech' | 'tts' | 'recording';
}

export function BrowserSupportBanner({ feature }: BrowserSupportBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isDesktop = isTauri();

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-600/10 border border-amber-500/20 mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        {feature === 'speech' ? (
          <>
            <p className="text-sm font-medium text-amber-200">
              Speech recognition requires Chrome or Edge
            </p>
            <p className="text-xs text-amber-300/70">
              {isDesktop
                ? 'Open the web app in Chrome for speech exercises: '
                : 'Your current browser does not support this feature. Open this page in '}
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-200"
              >
                Google Chrome
              </a>
              {' or '}
              <a
                href="https://www.microsoft.com/edge"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-200"
              >
                Microsoft Edge
              </a>
              {' to use microphone exercises.'}
            </p>
          </>
        ) : (
          <p className="text-sm text-amber-200">
            The {feature} feature is only available in Chrome and Edge.
          </p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-300 shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
