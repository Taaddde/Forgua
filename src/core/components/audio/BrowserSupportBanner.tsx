/**
 * BrowserSupportBanner — shows a warning when Web Speech API is unavailable.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';

interface BrowserSupportBannerProps {
  feature: 'speech' | 'tts' | 'recording';
}

export function BrowserSupportBanner({ feature }: BrowserSupportBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-600/10 border border-amber-500/20 mb-6">
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-amber-200">
          {t('audio.browserWarning', { feature: t(`audio.features.${feature}`) })}
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-300 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
