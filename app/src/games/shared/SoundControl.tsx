/**
 * Sound Control Widget
 * Volume slider + mute toggle for game HUDs
 */

import { useState, useEffect } from "react";
import { getSoundConfig, setVolume, toggleMute, enableSound, prewarmAudio, type SoundConfig } from "./sound";

interface SoundControlProps {
  gameSlug: string;
  onConfigChange?: (config: SoundConfig) => void;
}

export default function SoundControl({ gameSlug, onConfigChange }: SoundControlProps) {
  const [config, setConfig] = useState<SoundConfig>(() => getSoundConfig(gameSlug));
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    const updatedConfig = getSoundConfig(gameSlug);
    setConfig(updatedConfig);
  }, [gameSlug]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(gameSlug, newVolume);
    const updated = { ...config, volume: newVolume };
    setConfig(updated);
    if (onConfigChange) onConfigChange(updated);
  };

  const handleMuteToggle = () => {
    const newMuted = toggleMute(gameSlug);
    const updated = { ...config, muted: newMuted };
    setConfig(updated);
    if (onConfigChange) onConfigChange(updated);
  };

  const handleEnable = () => {
    enableSound(gameSlug);
    prewarmAudio();
    const updated = getSoundConfig(gameSlug);
    setConfig(updated);
    setShowSlider(true);
    if (onConfigChange) onConfigChange(updated);
  };

  // Always render a visible control so the player (or teacher/parent) can enable sound.
  return (
    <div className="relative flex items-center gap-2">
      {!config.enabled ? (
        <button
          onClick={handleEnable}
          className="p-3 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Enable sound"
          title="Enable sound"
        >
          <span className="text-3xl">🔊</span>
        </button>
      ) : (
        <>
          <button
            onClick={handleMuteToggle}
            className="p-3 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={config.muted ? "Unmute sound" : "Mute sound"}
            title={config.muted ? "Unmute" : "Mute"}
          >
            <span className="text-3xl">
              {config.muted ? "🔇" : config.volume > 0.5 ? "🔊" : "🔉"}
            </span>
          </button>

          <button
            onClick={() => setShowSlider(!showSlider)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Volume control"
            title="Volume"
          >
            🎚️
          </button>
        </>
      )}

      {config.enabled && showSlider && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg p-3 z-50 border border-slate-200">
          <label className="block text-xs text-slate-600 mb-2">
            Volume: {Math.round(config.volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.volume}
            onChange={handleVolumeChange}
            className="w-32 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Volume slider"
          />
        </div>
      )}
    </div>
  );
}
