/**
 * TopToolbar Component
 * Compact in-card toolbar with book, speaker, and volume controls
 * Absolutely positioned in top-right corner of the card
 */

import { useState } from "react";
import { areSoundsEnabled, toggleSounds } from "./soundEffects";

export interface TopToolbarProps {
  onOpenWordList?: () => void;      // Book icon - open word list
  onToggleSpeak?: () => void;        // Speaker icon - toggle TTS/audio play
  onOpenAudioSettings?: () => void;  // Volume icon - audio mixer/settings
  onOpenDashboard?: () => void;      // Chart icon - open progress dashboard
  disabled?: boolean;
}

export default function TopToolbar({
  onOpenWordList,
  onToggleSpeak,
  onOpenAudioSettings,
  onOpenDashboard,
  disabled = false,
}: TopToolbarProps) {
  const [soundsEnabled, setSoundsEnabled] = useState(areSoundsEnabled());

  const handleToggleSounds = () => {
    const newValue = toggleSounds();
    setSoundsEnabled(newValue);
  };
  return (
    <div 
      className="absolute right-3 top-3 z-20 flex items-center gap-2"
      role="toolbar"
      aria-label="Game controls"
    >
      {/* Dashboard Icon - Progress */}
      {onOpenDashboard && (
        <button
          onClick={onOpenDashboard}
          disabled={disabled}
          className="rounded-xl bg-white/90 hover:bg-white min-h-[56px] px-3 py-2 shadow ring-1 ring-slate-200 text-slate-700 text-sm font-semibold focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          aria-label="Open progress dashboard"
          title="Progress Dashboard"
        >
          <span aria-hidden="true" className="text-base">📊</span>
          <span className="hidden sm:inline">View Progress</span>
        </button>
      )}
      {/* Book Icon - Word List */}
      {onOpenWordList && (
        <button
          onClick={onOpenWordList}
          disabled={disabled}
          className="rounded-xl bg-white/90 hover:bg-white min-h-[56px] min-w-[56px] px-3 py-2 shadow ring-1 ring-slate-200 text-slate-700 text-base font-semibold focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Open word list"
          title="Word List"
        >
          <span aria-hidden="true">📖</span>
        </button>
      )}

      {/* Speaker Icon - Toggle Audio */}
      {onToggleSpeak && (
        <button
          onClick={onToggleSpeak}
          disabled={disabled}
          className="rounded-xl bg-white/90 hover:bg-white min-h-[56px] min-w-[56px] px-3 py-2 shadow ring-1 ring-slate-200 text-slate-700 text-base font-semibold focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Play or pause audio"
          title="Toggle Audio"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      )}

      {/* Sound Effects Toggle - Mute/Unmute celebrations */}
      <button
        onClick={handleToggleSounds}
        disabled={disabled}
        className="rounded-xl bg-white/90 hover:bg-white min-h-[56px] min-w-[56px] px-3 py-2 shadow ring-1 ring-slate-200 text-slate-700 text-base font-semibold focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={soundsEnabled ? "Mute sound effects" : "Unmute sound effects"}
        title={soundsEnabled ? "Mute Sounds" : "Unmute Sounds"}
        aria-pressed={soundsEnabled}
      >
        <span aria-hidden="true">{soundsEnabled ? "🔔" : "🔕"}</span>
      </button>

      {/* Volume Icon - Audio Settings */}
      {onOpenAudioSettings && (
        <button
          onClick={onOpenAudioSettings}
          disabled={disabled}
          className="rounded-xl bg-white/90 hover:bg-white min-h-[56px] min-w-[56px] px-3 py-2 shadow ring-1 ring-slate-200 text-slate-700 text-base font-semibold focus:outline-none focus:ring-[3px] focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Audio settings"
          title="Audio Settings"
        >
          <span aria-hidden="true">🎚️</span>
        </button>
      )}
    </div>
  );
}
