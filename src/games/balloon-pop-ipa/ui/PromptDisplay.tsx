import React, { useState, useEffect, useCallback } from 'react';
import type { RoundSpec } from '../types';
import Balloon from './Balloon';
import { loadPromptAudio, playPromptAudio, initAudioContext } from '../audio';
import { getHint } from '../phoneme-hints';
import { DIFFICULTY } from '../config.difficulty';
import type { Howl } from 'howler';
import { useSpeak } from '../../../hooks/useSpeak';

interface PromptDisplayProps {
  round: RoundSpec;
  onAnswer: (selectedIds: string[], elapsedMs: number) => void;
  multiSelect?: boolean;
  balloonPositions: Array<{ 
    id: string; 
    laneX: number; 
    riseSec: number; 
    labelIPA: string; 
    hint: string;
    isCorrect: boolean;
  }>;
  reducedMotion?: boolean;
  wrongAttempts: number;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onAudioStatusChange?: (status: 'idle' | 'loading' | 'ready' | 'missing' | 'error') => void;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({
  round,
  onAnswer,
  multiSelect = false,
  balloonPositions,
  reducedMotion = false,
  wrongAttempts,
  onToggleFullscreen,
  isFullscreen,
  onAudioStatusChange,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [startTime] = useState<number>(Date.now());
  const [promptAudio, setPromptAudio] = useState<Howl | null>(null);
  
  // Speech synthesis hook for phoneme playback
  const { status: speechStatus, speakPhoneme } = useSpeak();

  // Initialize audio context on first render
  useEffect(() => {
    console.debug('[PromptDisplay] Component mounted');
    initAudioContext();
  }, []);

  // Preload prompt audio when round changes (with timeout)
  useEffect(() => {
    const audioKey = round.prompt.audioKey;
    if (!audioKey) {
      onAudioStatusChange?.('idle');
      return;
    }

    console.debug('[PromptDisplay] Preloading audio:', audioKey);
    onAudioStatusChange?.('loading');

    // Build audio path from audioKey
    const audioPath = `/audio/phonemes/${audioKey}.mp3`;
    
    // Add timeout to prevent blocking
    const timeoutMs = 700;
    let timeoutId: number;
    let settled = false;

    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = window.setTimeout(() => {
        if (!settled) {
          // Audio file not available - will use TTS fallback
          onAudioStatusChange?.('missing');
          settled = true;
          resolve(null);
        }
      }, timeoutMs);
    });

    Promise.race([
      loadPromptAudio(audioPath),
      timeoutPromise
    ]).then((howl) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);

      if (howl) {
        console.debug('[PromptDisplay] Audio preload success:', audioKey);
        setPromptAudio(howl);
        onAudioStatusChange?.('ready');
        
        // Auto-play for audio-only prompts
        if (round.promptType === 'audioOnly') {
          setTimeout(() => playPromptAudio(howl), 300);
        }
      } else {
        // Audio file not available yet - this is expected during development
        // Game will fall back to Web Speech Synthesis (TTS)
        onAudioStatusChange?.('missing');
      }
    }).catch(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      // Silently handle errors - fallback to TTS is available
      onAudioStatusChange?.('error');
    });

    // Cleanup on unmount
    return () => {
      if (promptAudio) {
        promptAudio.unload();
      }
    };
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset selection when round changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [round]);

  const handleChoiceClick = useCallback(
    (choiceId: string) => {
      if (multiSelect) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(choiceId)) {
            next.delete(choiceId);
          } else {
            next.add(choiceId);
          }
          return next;
        });
      } else {
        // Single select: submit immediately
        const elapsedMs = Date.now() - startTime;
        onAnswer([choiceId], elapsedMs);
      }
    },
    [multiSelect, onAnswer, startTime]
  );

  const handleCheckAnswer = useCallback(() => {
    if (selectedIds.size === 0) return;
    const elapsedMs = Date.now() - startTime;
    onAnswer(Array.from(selectedIds), elapsedMs);
  }, [selectedIds, onAnswer, startTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-8 select choices
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8 && num <= balloonPositions.length) {
        e.preventDefault();
        const choiceId = balloonPositions[num - 1].id;
        handleChoiceClick(choiceId);
      }

      // Enter key: replay audio or submit if multi-select
      if (e.key === 'Enter') {
        e.preventDefault();
        if (multiSelect && selectedIds.size > 0) {
          handleCheckAnswer();
        } else {
          // Replay audio - try file audio first, then speech synthesis
          if (promptAudio) {
            playPromptAudio(promptAudio);
          } else {
            // Fallback to speech synthesis
            const targetIPA = round.prompt.ipa || round.prompt.audioKey || symbol;
            if (targetIPA) {
              speakPhoneme(targetIPA).catch(() => {
                // Silent fail - never block gameplay
              });
            }
          }
        }
      }

      // Escape key: clear selection (multi-select)
      if (e.key === 'Escape' && multiSelect) {
        e.preventDefault();
        setSelectedIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [balloonPositions, handleChoiceClick, multiSelect, selectedIds.size, handleCheckAnswer, promptAudio, speakPhoneme, round.prompt]);

  // Determine target symbol and hint for bottom toolbar
  const getTargetSymbolAndHint = () => {
    switch (round.promptType) {
      case 'audioOnly':
      case 'minimalPair':
        // Use audioKey if available
        if (round.prompt.audioKey) {
          const hint = getHint(round.prompt.audioKey);
          return { symbol: round.prompt.audioKey, hint };
        }
        break;
      case 'letterToIPA':
        // Show the letter being asked about
        return { symbol: round.prompt.letter || '?', hint: 'letter' };
      case 'graphemeToIPA':
        // Show the grapheme
        return { symbol: round.prompt.grapheme || '?', hint: 'grapheme' };
      case 'ipaToGrapheme':
        // Show the IPA symbol
        if (round.prompt.ipa) {
          const hint = getHint(round.prompt.ipa);
          return { symbol: round.prompt.ipa, hint };
        }
        break;
      case 'trickyRhyme':
        // Show target word
        if (round.prompt.targetId) {
          return { symbol: round.prompt.targetId, hint: 'rhymes' };
        }
        break;
    }
    return { symbol: '?', hint: 'listen' };
  };

  const { symbol, hint } = getTargetSymbolAndHint();

  // Determine if hint glow should show
  const showHintGlow = wrongAttempts >= DIFFICULTY.glowAfterWrongAttempts;

  // Handler for Listen button - try file audio first, then speech synthesis
  const handleListen = useCallback(async () => {
    // Try file-based audio first
    if (promptAudio) {
      playPromptAudio(promptAudio);
      return;
    }
    
    // Fallback to speech synthesis
    const targetIPA = round.prompt.ipa || round.prompt.audioKey;
    if (targetIPA) {
      try {
        await speakPhoneme(targetIPA);
      } catch {
        // Silent fail - never block gameplay
      }
    }
  }, [promptAudio, round.prompt, speakPhoneme]);

  // Determine audio button state - always enabled now (speech fallback)
  const audioReady = promptAudio !== null || speechStatus !== 'unavailable';
  const audioButtonText = promptAudio ? '🔊 Listen' : speechStatus === 'unavailable' ? '🔊 Audio coming soon' : '🦉 Listen';
  const audioButtonClass = audioReady 
    ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
    : 'bg-gray-300 text-gray-600 cursor-not-allowed';

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Playfield - where balloons rise */}
      <div className="relative flex-1 min-h-[72vh] pb-24" data-test="playfield">
        {balloonPositions.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">🎈</div>
              <div className="text-lg font-semibold">Getting balloons ready...</div>
            </div>
          </div>
        )}
        
        {balloonPositions.map((balloon) => (
          <Balloon
            key={balloon.id}
            labelIPA={balloon.labelIPA}
            hint={balloon.hint}
            laneX={balloon.laneX}
            riseSec={balloon.riseSec}
            selected={selectedIds.has(balloon.id)}
            onClick={() => handleChoiceClick(balloon.id)}
            reducedMotion={reducedMotion}
            isCorrect={balloon.isCorrect}
            showHintGlow={showHintGlow}
          />
        ))}

        {/* Check button for multi-select - floats above toolbar */}
        {multiSelect && selectedIds.size > 0 && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={handleCheckAnswer}
              className="px-12 py-4 rounded-full text-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-2xl transition-all duration-200 focus:outline-none focus:ring-[3px] focus:ring-green-500 focus:ring-offset-2 hover:scale-105"
              aria-label={`Check answer (${selectedIds.size} selected)`}
            >
              ✓ Check Answer
            </button>
          </div>
        )}
      </div>

      {/* Keyboard hints - just above toolbar */}
      <div className="fixed bottom-20 left-0 right-0 z-20 text-center">
        <p className="text-xs md:text-sm text-gray-500 bg-white/60 backdrop-blur-sm inline-block px-4 py-1 rounded-full">
          💡 1–8: select • Enter: {multiSelect ? 'check' : 'replay'}{multiSelect && ' • Esc: clear'} • F: fullscreen
        </p>
      </div>

      {/* Fixed bottom toolbar with safe-area padding */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t px-4 py-3 pb-safe flex items-center justify-center gap-3 z-30 shadow-lg"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <button 
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Exit full screen (or press 'f')" : "Enter full screen (or press 'f')"}
          title={isFullscreen ? "Exit full screen (or press 'f')" : "Enter full screen (or press 'f')"}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-[3px] focus:ring-blue-500 focus:ring-offset-2 text-sm md:text-base"
        >
          {isFullscreen ? '⤡ Exit' : '⤢ Full'}
        </button>
        
        <button 
          onClick={handleListen}
          aria-label={audioReady ? "Play prompt audio" : "Audio not yet available"}
          title={promptAudio ? "Play phoneme audio file" : speechStatus !== 'unavailable' ? "Speak phoneme using text-to-speech" : "Audio will be added soon"}
          disabled={!audioReady}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-[3px] focus:ring-blue-500 focus:ring-offset-2 text-sm md:text-base ${audioButtonClass}`}
        >
          {audioButtonText}
        </button>
        
        <div className="text-base md:text-lg font-semibold text-gray-800">
          {symbol} — <span className="opacity-80">{hint}</span>
        </div>
      </div>
    </div>
  );
};

export default PromptDisplay;
