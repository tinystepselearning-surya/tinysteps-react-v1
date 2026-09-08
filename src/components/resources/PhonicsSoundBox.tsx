import { useEffect, useRef, useState, type FC } from 'react';
import {
  getPhonicsSound,
  getPhonicsSoundAudioCandidates,
} from '../../lib/phonicsSoundRegistry.js';
import type { PhonicsWordSoundSegment } from '../../lib/phonicsWordUtilityRegistry.js';

type PlaybackState = 'idle' | 'loading' | 'playing' | 'unavailable';

const PhonicsSoundBox: FC<{ segment: PhonicsWordSoundSegment; word: string }> = ({ segment, word }) => {
  const sound = getPhonicsSound(segment.soundId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlaybackState>('idle');

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  if (!sound) return null;

  const playCandidate = (candidates: readonly string[], index: number) => {
    if (index >= candidates.length) {
      setState('unavailable');
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio(candidates[index]);
    audio.preload = 'auto';
    audioRef.current = audio;
    setState('loading');

    const tryNext = () => {
      if (audioRef.current !== audio) return;
      playCandidate(candidates, index + 1);
    };

    audio.addEventListener('error', tryNext, { once: true });
    audio.addEventListener('ended', () => {
      if (audioRef.current === audio) setState('idle');
    }, { once: true });

    const playResult = audio.play();
    if (playResult && typeof playResult.then === 'function') {
      playResult
        .then(() => {
          if (audioRef.current === audio) setState('playing');
        })
        .catch(tryNext);
    } else {
      setState('playing');
    }
  };

  const handlePlay = () => {
    const candidates = getPhonicsSoundAudioCandidates(sound.id);
    if (!candidates.length) {
      setState('unavailable');
      return;
    }
    playCandidate(candidates, 0);
  };

  return (
    <div className="min-w-[6.5rem] flex-1 rounded-2xl border border-sky-100 bg-white p-3.5 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]" data-phonics-sound-id={sound.id}>
      <div className="font-mono text-2xl font-black tracking-tight text-slate-950">{segment.grapheme}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{sound.phonemeLabel}</div>
      <button
        type="button"
        onClick={handlePlay}
        className="mt-3 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-800 transition hover:border-sky-300 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`Play the ${segment.grapheme} sound in ${word}`}
        disabled={state === 'loading'}
      >
        <span aria-hidden="true">🔊</span>
        {state === 'loading' ? 'Loading' : state === 'playing' ? 'Playing' : 'Play'}
      </button>
      {state === 'unavailable' ? <p className="mt-2 text-[10px] font-bold leading-4 text-amber-700">Audio coming soon</p> : null}
    </div>
  );
};

export default PhonicsSoundBox;
