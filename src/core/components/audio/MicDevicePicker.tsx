/**
 * MicDevicePicker — shows the currently active audio input, lists alternatives,
 * and offers deep links to OS/browser settings to change the system default.
 *
 * Honest about limitations:
 *   - Web Speech API STT ignores deviceId, so "selecting" a mic only affects
 *     MediaRecorder-based recordings (pronunciation feedback) and shows the
 *     user which device Chrome is using. For STT, the user must change the
 *     system default — we help them get there.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { useMicDevices } from '../../hooks/useMicDevices';
import { useAudioPreferences } from '../../hooks/useAudioPreferences';
import { getOS, isTauri, openSoundSettings } from '../../utils/platform';

interface MicDevicePickerProps {
  /** Compact mode renders a smaller layout for inline embedding next to the mic button. */
  compact?: boolean;
}

export function MicDevicePicker({ compact = false }: MicDevicePickerProps) {
  const { t } = useTranslation();
  const {
    devices,
    active,
    labelsGranted,
    isProbing,
    error,
    isSupported,
    probe,
  } = useMicDevices();
  const { micDeviceId, setMicDeviceId } = useAudioPreferences();
  const [openingSettings, setOpeningSettings] = useState(false);

  // Probe once on mount so we know the active device, but only if we already have permission.
  // We don't auto-trigger the permission dialog here — the user should decide.
  useEffect(() => {
    if (isSupported && labelsGranted) {
      void probe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  if (!isSupported) {
    return (
      <div className="text-xs text-slate-500 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        {t('audio.micPicker.notSupported')}
      </div>
    );
  }

  const currentPreferred = devices.find((d) => d.deviceId === micDeviceId) ?? null;
  const activeLabel = active.label || currentPreferred?.label || t('audio.micPicker.unknown');

  const handleOpenSystemSettings = async () => {
    setOpeningSettings(true);
    try {
      if (isTauri()) {
        await openSoundSettings();
      } else {
        // In a web context, Chrome/Edge don't let us programmatically open their
        // internal settings tab. Instructions are shown inline for each OS.
      }
    } finally {
      setOpeningSettings(false);
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {/* Active device surface */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <Mic className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('audio.micPicker.activeInput')}
          </p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {labelsGranted || active.label ? activeLabel : t('audio.micPicker.permissionRequired')}
          </p>
        </div>
        <button
          onClick={() => void probe()}
          disabled={isProbing}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50"
          title={t('audio.micPicker.refresh')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Device list */}
      {labelsGranted && devices.length > 0 && (
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            {t('audio.micPicker.preferredDevice')}
          </label>
          <select
            value={micDeviceId ?? ''}
            onChange={(e) => void setMicDeviceId(e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t('audio.micPicker.systemDefault')}</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || t('audio.micPicker.unnamed', { id: d.deviceId.slice(0, 8) })}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {t('audio.micPicker.preferredHelp')}
          </p>
        </div>
      )}

      {!labelsGranted && (
        <button
          onClick={() => void probe()}
          className="w-full px-3 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          {t('audio.micPicker.grantPermission')}
        </button>
      )}

      {/* Honest STT limitation notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-700 dark:text-amber-200 leading-relaxed space-y-2">
          <p>{t('audio.micPicker.sttLimitation')}</p>
          <OsSpecificInstructions onOpen={handleOpenSystemSettings} opening={openingSettings} />
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-500 dark:text-rose-400">
          {t(`audio.micPicker.errors.${error}`, { defaultValue: error })}
        </p>
      )}
    </div>
  );
}

function OsSpecificInstructions({
  onOpen,
  opening,
}: {
  onOpen: () => void | Promise<void>;
  opening: boolean;
}) {
  const { t } = useTranslation();
  const os = getOS();
  const tauri = isTauri();

  if (tauri) {
    return (
      <button
        onClick={() => void onOpen()}
        disabled={opening}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium transition-colors disabled:opacity-50"
      >
        <ExternalLink className="w-3 h-3" />
        {t('audio.micPicker.openSystemSound')}
      </button>
    );
  }

  // Web context — can't programmatically open chrome://settings from a page.
  // Show copy-pasteable URL + OS-level instructions.
  const instructionKey = `audio.micPicker.instructions.${os}`;
  return (
    <div className="space-y-1.5">
      <p className="font-medium">{t('audio.micPicker.browserStep')}</p>
      <code className="block text-[10px] bg-amber-900/10 dark:bg-amber-100/10 px-1.5 py-0.5 rounded font-mono select-all">
        chrome://settings/content/microphone
      </code>
      <p className="font-medium mt-2">{t('audio.micPicker.osStep')}</p>
      <p>{t(instructionKey, { defaultValue: t('audio.micPicker.instructions.unknown') })}</p>
    </div>
  );
}
