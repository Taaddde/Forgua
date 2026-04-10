/**
 * LowQualityVoiceBanner — proactive, dismissible notice that appears when
 * Forgua detects the active TTS voice is likely low-quality for the current pack.
 *
 * Rationale: users on a "compact" OS voice have no way to know that the raspy
 * audio they hear is fixable. Waiting for them to open Settings is asking a lot.
 * We surface it once per language with a direct CTA to the Settings page.
 *
 * Dismissal is persisted per language tag so it never nags twice.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, Settings2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../db/database';
import {
  isLikelyLowQualityVoice,
  pickBestVoice,
  waitForVoices,
  getVoicesForLang,
} from '../../engine/tts';

const KEY_PREFIX = 'audio-warning-dismissed-';

export function LowQualityVoiceBanner() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const ttsLang = activePack?.speech.ttsLang ?? null;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!ttsLang) {
      return;
    }

    async function check(lang: string) {
      // Wait until voices are loaded, otherwise we'd get a false negative.
      await waitForVoices();
      if (cancelled) return;

      const all = getVoicesForLang(lang);
      if (all.length === 0) {
        if (!cancelled) setVisible(false);
        return; // Nothing to warn about — silent graceful degradation.
      }

      // Check if the user already dismissed this for the current language.
      const dismissed = await db.settings.get(KEY_PREFIX + lang);
      if (dismissed?.value === '1') {
        if (!cancelled) setVisible(false);
        return;
      }

      // Has the user explicitly chosen a voice for this language? If so, trust them.
      const voiceMap = await db.settings.get('audio-voice-map');
      let userChoice: string | undefined;
      if (typeof voiceMap?.value === 'string') {
        try {
          const parsed = JSON.parse(voiceMap.value);
          userChoice = parsed?.[lang];
        } catch {
          /* ignore */
        }
      }
      if (userChoice) {
        if (!cancelled) setVisible(false);
        return;
      }

      const active = pickBestVoice(lang);
      if (!active) {
        if (!cancelled) setVisible(false);
        return;
      }
      if (!cancelled) setVisible(isLikelyLowQualityVoice(active));
    }

    void check(ttsLang);

    // Re-check when voices get loaded/unloaded (e.g. user installs a new OS voice).
    const onVoicesChanged = () => {
      if (ttsLang) void check(ttsLang);
    };
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    }

    return () => {
      cancelled = true;
      if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      }
    };
  }, [ttsLang]);

  const dismiss = async () => {
    if (ttsLang) {
      await db.settings.put({ key: KEY_PREFIX + ttsLang, value: '1' });
    }
    setVisible(false);
  };

  if (!visible || !ttsLang) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-40 max-w-sm rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/80 backdrop-blur shadow-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {t('audio.lowQualityBanner.title')}
          </h4>
          <p className="text-xs text-amber-800 dark:text-amber-200/90 mt-1 leading-relaxed">
            {t('audio.lowQualityBanner.body')}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Link
              to="/settings"
              onClick={() => setVisible(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {t('audio.lowQualityBanner.cta')}
            </Link>
            <button
              onClick={dismiss}
              className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              {t('audio.lowQualityBanner.dismiss')}
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-amber-600/80 dark:text-amber-400/80 hover:text-amber-800 dark:hover:text-amber-200 shrink-0"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
