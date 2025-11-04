/**
 * Sound Gate Toast
 * One-time prompt to enable sound
 */

import { useState, useEffect } from "react";
import { getSoundConfig, enableSound, prewarmAudio } from "./sound";

interface SoundGateProps {
  gameSlug: string;
  onEnabled?: () => void;
}

export default function SoundGate({ gameSlug, onEnabled }: SoundGateProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const config = getSoundConfig(gameSlug);
    if (!config.enabled) {
      setShow(true);
    }
  }, [gameSlug]);

  const handleEnable = () => {
    enableSound(gameSlug);
    prewarmAudio();
    setShow(false);
    if (onEnabled) onEnabled();
  };

  const handleDismiss = () => {
    enableSound(gameSlug); // Still enable, just dismiss
    prewarmAudio();
    setShow(false);
    if (onEnabled) onEnabled();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-500 p-4 flex items-center gap-4">
        <div className="text-4xl">🔊</div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">Enable Sound?</p>
          <p className="text-sm text-slate-600">Get audio feedback & voice hints!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEnable}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Enable sound"
          >
            Yes
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            aria-label="Dismiss sound prompt"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
