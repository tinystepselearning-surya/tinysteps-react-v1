/**
 * WordCard Component
 * Interactive flash card with flip animation, MCQ, and feedback
 */

import { useState, useEffect } from "react";
import type { Word } from "./data";
import { playAudio, speakWord, speakMeaning, speakIPA } from "./utils";

export type GamePhase = "meaning" | "ipa" | "reveal";

interface WordCardProps {
  word: Word;
  meaningOptions: string[];
  ipaOptions: string[];
  correctMeaningIndex: number;
  correctIPAIndex: number;
  onComplete: (correctMeaning: boolean, correctIPA: boolean) => void;
}

export default function WordCard({
  word,
  meaningOptions,
  ipaOptions,
  correctMeaningIndex,
  correctIPAIndex,
  onComplete,
}: WordCardProps) {
  const [phase, setPhase] = useState<GamePhase>("meaning");
  const [selectedMeaningIndex, setSelectedMeaningIndex] = useState<number | null>(null);
  const [selectedIPAIndex, setSelectedIPAIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset state when word changes
  useEffect(() => {
    setPhase("meaning");
    setSelectedMeaningIndex(null);
    setSelectedIPAIndex(null);
    setIsFlipped(false);
    
    // Speak the word when a new card appears
    const cleanup = speakWord(word.word);
    return cleanup;
  }, [word.word]);

  const handleMeaningSelect = (index: number) => {
    if (selectedMeaningIndex !== null) return;
    
    setSelectedMeaningIndex(index);
    const isCorrect = index === correctMeaningIndex;
    
    // Speak the selected meaning
    speakMeaning(meaningOptions[index]);
    
    // Play audio feedback
    const cleanup = playAudio(
      isCorrect ? "/audio/correct.mp3" : "/audio/wrong.mp3"
    );

    // Move to IPA phase after delay
    setTimeout(() => {
      cleanup();
      setPhase("ipa");
    }, 1500);
  };

  const handleIPASelect = (index: number) => {
    if (selectedIPAIndex !== null) return;
    
    setSelectedIPAIndex(index);
    const isCorrect = index === correctIPAIndex;
    
    // Speak the selected IPA
    speakIPA(ipaOptions[index]);
    
    // Play audio feedback
    const cleanup = playAudio(
      isCorrect ? "/audio/correct.mp3" : "/audio/wrong.mp3"
    );

    // Move to reveal phase after delay
    setTimeout(() => {
      cleanup();
      setPhase("reveal");
      setIsFlipped(true);
    }, 1500);
  };

  const handleNextWord = () => {
    const correctMeaning = selectedMeaningIndex === correctMeaningIndex;
    const correctIPA = selectedIPAIndex === correctIPAIndex;
    onComplete(correctMeaning, correctIPA);
  };

  const getButtonClass = (
    index: number,
    selectedIndex: number | null,
    correctIndex: number
  ): string => {
    const baseClass =
      "w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400";

    if (selectedIndex === null) {
      return `${baseClass} bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg`;
    }

    if (index === selectedIndex) {
      const isCorrect = index === correctIndex;
      return isCorrect
        ? `${baseClass} bg-gradient-to-r from-green-400 to-green-500 text-white shadow-xl animate-bounce`
        : `${baseClass} bg-gradient-to-r from-red-400 to-red-500 text-white shadow-xl animate-shake`;
    }

    if (index === correctIndex) {
      return `${baseClass} bg-gradient-to-r from-green-400 to-green-500 text-white shadow-xl`;
    }

    return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Card Container with Flip Effect */}
      <div className="relative w-full min-h-[500px] perspective-1000">
        <div
          className={`w-full h-full transition-transform duration-700 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of Card (MCQ Phase) */}
          <div
            className={`absolute w-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl shadow-2xl p-8 backface-hidden ${
              isFlipped ? "invisible" : "visible"
            }`}
          >
            {/* Word Display */}
            <div className="text-center mb-8">
              <h2 className="text-6xl font-black text-purple-600 mb-4 animate-pulse">
                {word.word}
              </h2>
              <p className="text-2xl text-gray-600 font-semibold">
                {phase === "meaning" ? "What does it mean?" : "What's the IPA?"}
              </p>
            </div>

            {/* MCQ Options */}
            <div className="space-y-4">
              {phase === "meaning" &&
                meaningOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleMeaningSelect(index)}
                    disabled={selectedMeaningIndex !== null}
                    className={getButtonClass(
                      index,
                      selectedMeaningIndex,
                      correctMeaningIndex
                    )}
                    aria-label={`Option ${index + 1}: ${option}`}
                  >
                    {option}
                  </button>
                ))}

              {phase === "ipa" &&
                ipaOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleIPASelect(index)}
                    disabled={selectedIPAIndex !== null}
                    className={getButtonClass(
                      index,
                      selectedIPAIndex,
                      correctIPAIndex
                    )}
                    aria-label={`Option ${index + 1}: ${option}`}
                  >
                    {option}
                  </button>
                ))}
            </div>
          </div>

          {/* Back of Card (Reveal Phase) */}
          <div
            className={`absolute w-full bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 rounded-3xl shadow-2xl p-8 backface-hidden rotate-y-180 ${
              isFlipped ? "visible" : "invisible"
            }`}
          >
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-5xl font-black text-green-600">
                  {word.word}
                </h2>
                <button
                  onClick={() => speakWord(word.word)}
                  className="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300"
                  aria-label="Pronounce word"
                  title="Hear pronunciation"
                >
                  🔊
                </button>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl text-gray-700 flex-1">
                    <span className="font-bold text-purple-600">IPA:</span>{" "}
                    <span className="font-mono text-2xl">{word.ipa}</span>
                  </p>
                  <button
                    onClick={() => speakIPA(word.ipa)}
                    className="p-2 bg-purple-400 text-white rounded-full hover:bg-purple-500 transition-colors focus:outline-none focus:ring-4 focus:ring-purple-300"
                    aria-label="Pronounce IPA"
                    title="Hear IPA sound"
                  >
                    🔊
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xl text-gray-700 flex-1">
                    <span className="font-bold text-purple-600">Meaning:</span>{" "}
                    {word.meaning}
                  </p>
                  <button
                    onClick={() => speakMeaning(word.meaning)}
                    className="p-2 bg-green-400 text-white rounded-full hover:bg-green-500 transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
                    aria-label="Read meaning"
                    title="Hear meaning"
                  >
                    🔊
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-xl text-gray-700 mb-2">
                  <span className="font-bold text-purple-600">Forms:</span>{" "}
                  {word.forms}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-xl text-gray-700 italic">
                  <span className="font-bold text-purple-600">Example:</span>{" "}
                  "{word.example}"
                </p>
              </div>

              <button
                onClick={handleNextWord}
                className="mt-6 px-10 py-4 bg-gradient-to-r from-green-400 to-blue-400 text-white font-bold text-2xl rounded-full shadow-xl hover:from-green-500 hover:to-blue-500 transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-400"
                aria-label="Next word"
              >
                Next Word! 🚀
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for 3D flip effect */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
