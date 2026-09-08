import { useEffect, useRef, useState } from 'react';
import type { PhonicsWordSoundSegment } from '../../content/phonicsWordSounds';
import {
  getPhonicsSoundDefinition,
  type PhonicsSoundId,
} from '../../lib/phonicsSoundRegistry';

type PlaybackState = 'idle' | 'playing' | 'unavailable';

type PhonicsSoundBoxesProps = {
  readonly word: string;
  readonly segments: readonly PhonicsWordSoundSegment[];
  readonly heading?: string;
  readonly className?: string;
};

function segmentKey(segment: PhonicsWordSoundSegment, index: number) {
  return `${index}:${segment.grapheme}:${segment.soundId}`;
}

export default function PhonicsSoundBoxes({
  word,
  segments,
  heading = 'Tap each sound',
  className = '',
}: PhonicsSoundBoxesProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [stateByKey, setStateByKey] = useState<Record<string, PlaybackState>>({});

  useEffect(() => {
    return () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    };
  }, []);

  const stopCurrentAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  };

  const setPlaybackState = (key: string, next: PlaybackState) => {
    setStateByKey((current) => ({ ...current, [key]: next }));
  };

  const playSound = async (soundId: PhonicsSoundId, key: string) => {
    const sound = getPhonicsSoundDefinition(soundId);
    if (!sound || typeof Audio === 'undefined') {
      setPlaybackState(key, 'unavailable');
      return;
    }

    stopCurrentAudio();
    setActiveKey(key);
    setPlaybackState(key, 'playing');

    const audio = new Audio(sound.assetPath);
    audio.preload = 'auto';
    audioRef.current = audio;

    const markUnavailable = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setActiveKey((current) => (current === key ? null : current));
      setPlaybackState(key, 'unavailable');
    };

    audio.addEventListener('ended', () => {
      if (audioRef.current === audio) audioRef.current = null;
      setActiveKey((current) => (current === key ? null : current));
      setPlaybackState(key, 'idle');
    }, { once: true });

    audio.addEventListener('error', markUnavailable, { once: true });

    try {
      await audio.play();
    } catch {
      markUnavailable();
    }
  };

  return (
    <section
      className={`rounded-[1.6rem] border border-slate-200 bg-white p-5 sm:p-6 ${className}`.trim()}
      data-phonics-sound-boxes
      aria-label={`Sound boxes for ${word}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-700">Sound it out</p>
          <h2 className="mt-2 text-xl font-black tracking-[-0.02em] text-slate-950">{heading}</h2>
        </div>
        <p className="text-sm font-bold text-slate-500">{word}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label={`Phonics sounds in ${word}`}>
        {segments.map((segment, index) => {
          const key = segmentKey(segment, index);
          const sound = getPhonicsSoundDefinition(segment.soundId);
          const playbackState = stateByKey[key] ?? 'idle';
          const isPlaying = activeKey === key && playbackState === 'playing';
          const isUnavailable = playbackState === 'unavailable';

          return (
            <div key={key} className="flex min-w-[5.2rem] flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => playSound(segment.soundId, key)}
                className="group flex min-h-[5.4rem] min-w-[5.2rem] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                aria-label={`Play ${segment.grapheme} sound in ${word}`}
                data-phonics-sound-id={segment.soundId}
                data-phonics-grapheme={segment.grapheme}
              >
                <span className="text-2xl font-black tracking-[-0.03em]">{segment.grapheme}</span>
                <span className="mt-1 text-xs font-black text-sky-700" aria-hidden="true">
                  {isPlaying ? 'Playing…' : '🔊 Play'}
                </span>
              </button>

              <span className={`max-w-[7rem] text-center text-[11px] font-semibold leading-4 ${isUnavailable ? 'text-amber-700' : 'text-slate-400'}`} aria-live="polite">
                {isUnavailable ? 'Audio coming soon' : sound?.label ?? segment.soundId}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Each button uses an explicit reviewed sound mapping. Tiny Steps does not guess pronunciation from spelling.
      </p>
    </section>
  );
}
