import React, { useState, useEffect, useCallback } from 'react';
import type { RoundSpec } from '../types';
import Balloon from './Balloon';
import { loadPromptAudio, playPromptAudio, initAudioContext } from '../audio';
import type { Howl } from 'howler';

interface PromptDisplayProps {
  round: RoundSpec;
  onAnswer: (selectedIds: string[], elapsedMs: number) => void;
  multiSelect?: boolean;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({
  round,
  onAnswer,
  multiSelect = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [startTime] = useState<number>(Date.now());
  const [promptAudio, setPromptAudio] = useState<Howl | null>(null);

  // Initialize audio context on first render
  useEffect(() => {
    initAudioContext();
  }, []);

  // Preload prompt audio when round changes
  useEffect(() => {
    const audioKey = round.prompt.audioKey;
    if (!audioKey) return;

    // Build audio path from audioKey
    const audioPath = `/audio/phonemes/${audioKey}.mp3`;
    
    loadPromptAudio(audioPath).then((howl) => {
      setPromptAudio(howl);
      
      // Auto-play for audio-only prompts
      if (round.promptType === 'audioOnly' && howl) {
        setTimeout(() => playPromptAudio(howl), 300);
      }
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
      if (num >= 1 && num <= 8 && num <= round.choices.length) {
        e.preventDefault();
        const choiceId = round.choices[num - 1];
        handleChoiceClick(choiceId);
      }

      // Enter key: replay audio or submit if multi-select
      if (e.key === 'Enter') {
        e.preventDefault();
        if (multiSelect && selectedIds.size > 0) {
          handleCheckAnswer();
        } else {
          // Replay audio
          playPromptAudio(promptAudio);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [round, handleChoiceClick, multiSelect, selectedIds.size, handleCheckAnswer]);

  // Render prompt based on type
  const renderPrompt = () => {
    switch (round.promptType) {
      case 'audioOnly':
        return (
          <div className="text-center mb-8">
            <button
              className="px-8 py-4 bg-blue-500 text-white rounded-lg text-xl font-semibold hover:bg-blue-600 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500"
              onClick={() => playPromptAudio(promptAudio)}
              aria-label="Play prompt audio"
            >
              🔊 Listen
            </button>
            <p className="mt-4 text-gray-600">Click to hear the sound</p>
          </div>
        );

      case 'letterToIPA':
        return (
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-gray-800 mb-4">{round.prompt.letter}</div>
            <p className="text-gray-600">Which IPA symbol represents this letter?</p>
          </div>
        );

      case 'graphemeToIPA':
        return (
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-gray-800 mb-4">{round.prompt.grapheme}</div>
            <p className="text-gray-600">Select the IPA symbol for this sound</p>
          </div>
        );

      case 'ipaToGrapheme':
        return (
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-gray-800 mb-4">{round.prompt.ipa}</div>
            <p className="text-gray-600">Select all spellings that make this sound</p>
            {multiSelect && (
              <p className="text-sm text-blue-600 mt-2">Multi-select enabled • Press Enter or click Check</p>
            )}
          </div>
        );

      case 'minimalPair':
        return (
          <div className="text-center mb-8">
            <button
              className="px-8 py-4 bg-purple-500 text-white rounded-lg text-xl font-semibold hover:bg-purple-600 transition-colors focus:outline-none focus:ring-4 focus:ring-purple-500"
              onClick={() => playPromptAudio(promptAudio)}
              aria-label="Play minimal pair audio"
            >
              🔊 Listen Carefully
            </button>
            <p className="mt-4 text-gray-600">Which sound do you hear?</p>
            <p className="text-sm text-purple-600 mt-1">Bonus: Answer in under 2 seconds!</p>
          </div>
        );

      case 'trickyRhyme':
        return (
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="text-5xl font-bold text-gray-800 mb-2">{round.prompt.targetId}</div>
              <button
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors focus:outline-none focus:ring-4 focus:ring-green-500"
                onClick={() => playPromptAudio(promptAudio)}
                aria-label="Play word audio"
              >
                🔊 Hear it
              </button>
            </div>
            <p className="text-gray-600">Select words that rhyme with this</p>
            {multiSelect && (
              <p className="text-sm text-green-600 mt-2">Multi-select enabled • All that rhyme!</p>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center mb-8">
            <p className="text-gray-600">Select the correct answer</p>
          </div>
        );
    }
  };

  // Convert choices to consistent format
  const choices = round.choices.map((choice) => {
    return { id: choice, label: choice };
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Prompt area */}
      <div className="mb-8">{renderPrompt()}</div>

      {/* Balloons grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 place-items-center">
        {choices.map((choice, index) => (
          <Balloon
            key={choice.id}
            label={choice.label}
            selected={selectedIds.has(choice.id)}
            onClick={() => handleChoiceClick(choice.id)}
            index={index}
          />
        ))}
      </div>

      {/* Check button for multi-select */}
      {multiSelect && (
        <div className="flex justify-center">
          <button
            onClick={handleCheckAnswer}
            disabled={selectedIds.size === 0}
            className={`
              px-12 py-4 rounded-lg text-xl font-bold
              transition-all duration-200
              focus:outline-none focus:ring-4 focus:ring-green-500
              ${
                selectedIds.size > 0
                  ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105 shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            aria-label={`Check answer (${selectedIds.size} selected)`}
          >
            ✓ Check Answer
          </button>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>💡 Press 1-8 to select balloons • Enter to {multiSelect ? 'check' : 'replay audio'}</p>
      </div>
    </div>
  );
};

export default PromptDisplay;
