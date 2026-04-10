/**
 * AudioSettingsSection — full audio/TTS/microphone configuration block
 * embedded inside the Settings page.
 *
 * Responsibilities:
 *  - Per-language voice selector (auto-detected from installed packs).
 *  - Global playback speed.
 *  - Voice preview button.
 *  - Microphone device picker with the honest STT limitation disclaimer.
 *  - "Play sample" to let the user confirm the selected voice sounds right.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, Mic, Languages } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAudio } from '../../hooks/useAudio';
import { useAudioPreferences } from '../../hooks/useAudioPreferences';
import { VoicePicker } from './VoicePicker';
import { MicDevicePicker } from './MicDevicePicker';
import { waitForVoices } from '../../engine/tts';
import { db } from '../../db/database';

export function AudioSettingsSection() {
  const { t } = useTranslation();
  const activePack = useAppStore((s) => s.activePack);
  const packTtsLang = activePack?.speech.ttsLang ?? null;

  const {
    voicesForLang,
    activeVoice,
    speak,
    isSupported,
  } = useAudio(packTtsLang ?? undefined);
  const { voiceMap, setVoiceForLang, speed, setSpeed, resetWarning } =
    useAudioPreferences();

  const [selectedLang, setSelectedLang] = useState<string | null>(packTtsLang);
  const [voicesReady, setVoicesReady] = useState(false);

  useEffect(() => {
    setSelectedLang(packTtsLang);
  }, [packTtsLang]);

  useEffect(() => {
    void waitForVoices().then(() => setVoicesReady(true));
  }, []);

  // Build the list of languages the user can configure: always includes the
  // active pack's ttsLang, plus any language that already has a user preference.
  const configurableLangs = useMemo(() => {
    const set = new Set<string>();
    if (packTtsLang) set.add(packTtsLang);
    Object.keys(voiceMap).forEach((l) => set.add(l));
    // Also surface any language that has voices installed and matches known locales
    // on the pack — but keep it minimal to avoid overwhelming the user.
    return Array.from(set);
  }, [packTtsLang, voiceMap]);

  const langVoices = selectedLang ? voicesForLang(selectedLang) : [];

  const handleSelect = async (voiceURI: string | null) => {
    if (!selectedLang) return;
    await setVoiceForLang(selectedLang, voiceURI);
    // Also clear the "low quality" dismissal so the user can see feedback if needed.
    await resetWarning(selectedLang);
  };

  const handlePreview = async () => {
    if (!selectedLang) return;
    const sample = t('audio.voicePicker.sample', {
      defaultValue: 'Hello, this is a voice preview.',
    });
    await speak(sample, selectedLang).catch(() => {});
  };

  const handleResetWarnings = async () => {
    // Clears every low-quality voice dismissal so the banner can reappear.
    const all = await db.settings.toArray();
    for (const s of all) {
      if (s.key.startsWith('audio-warning-dismissed-')) {
        await db.settings.delete(s.key);
      }
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-5 h-5 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          {t('settings.audio')}
        </h2>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-5">
        {/* TTS section */}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
            <Languages className="w-4 h-4 text-slate-500" />
            {t('settings.ttsVoice')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            {t('settings.ttsVoiceHelp')}
          </p>

          {!isSupported ? (
            <p className="text-xs text-slate-500">{t('audio.notSupported')}</p>
          ) : !voicesReady ? (
            <p className="text-xs text-slate-500">{t('common.loading')}</p>
          ) : (
            <>
              {configurableLangs.length > 1 && (
                <div className="mb-3">
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {t('settings.voiceLanguage')}
                  </label>
                  <select
                    value={selectedLang ?? ''}
                    onChange={(e) => setSelectedLang(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    {configurableLangs.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedLang ? (
                <VoicePicker
                  lang={selectedLang}
                  voices={langVoices}
                  selectedVoiceURI={voiceMap[selectedLang]}
                  activeVoiceURI={activeVoice?.voiceURI}
                  onSelect={handleSelect}
                />
              ) : (
                <p className="text-xs text-slate-500">{t('settings.noPackForVoice')}</p>
              )}

              {selectedLang && langVoices.length > 0 && (
                <button
                  onClick={handlePreview}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {t('settings.playSample')}
                </button>
              )}
            </>
          )}

          {/* Speed slider */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <span>{t('audio.speed')}</span>
              <span className="text-slate-500 tabular-nums">{speed.toFixed(2)}×</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={speed}
              onChange={(e) => void setSpeed(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <button
            onClick={handleResetWarnings}
            className="mt-4 text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            {t('settings.resetVoiceWarnings')}
          </button>
        </div>

        {/* Microphone section */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
            <Mic className="w-4 h-4 text-slate-500" />
            {t('settings.microphone')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            {t('settings.microphoneHelp')}
          </p>
          <MicDevicePicker />
        </div>
      </div>
    </section>
  );
}
