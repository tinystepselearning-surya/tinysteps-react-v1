/**
 * DropZone - Target slot for meaning/IPA with visual feedback
 */

import React, { useState } from "react";

interface DropZoneProps {
  targetId: string;
  targetType: "meaning" | "ipa";
  label: string;
  correctWordId: string;
  placedWordId: string | null;
  isCorrect: boolean;
  showHint: boolean;
  onDrop: (wordId: string, targetId: string) => void;
  onKeyboardDrop: (targetId: string) => void;
}

export function DropZone({
  targetId,
  targetType,
  label,
  correctWordId,
  placedWordId,
  isCorrect,
  showHint,
  onDrop,
  onKeyboardDrop,
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const wordId = e.dataTransfer.getData("text/plain");
    onDrop(wordId, targetId);

    // Trigger shake animation on wrong drop
    if (wordId !== correctWordId && !isCorrect) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onKeyboardDrop(targetId);
    }
  };

  const isEmpty = placedWordId === null;
  const bgColor = isCorrect
    ? "bg-gradient-to-r from-green-300 to-emerald-300"
    : isEmpty
    ? "bg-gray-100"
    : "bg-gradient-to-r from-red-200 to-pink-200";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Drop zone for ${targetType}: ${label}`}
      className={`
        relative w-full min-h-24 rounded-2xl border-4 border-dashed p-4
        transition-all duration-200 flex items-center justify-center
        focus:outline-none focus:ring-4 focus:ring-purple-500
        ${bgColor}
        ${isOver ? "border-purple-500 scale-105" : "border-gray-400"}
        ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}
        ${showHint ? "ring-4 ring-yellow-400 animate-pulse" : ""}
      `}
      style={
        shake
          ? {
              animation: "shake 0.5s ease-in-out",
              animationName: "shake",
            }
          : undefined
      }
    >
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700 mb-1">
          {targetType === "meaning" ? "📖 Meaning" : "🔊 IPA"}
        </p>
        <p className="text-lg font-bold text-gray-900 break-words px-2">
          {label}
        </p>
        {isCorrect && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce">
            ✅
          </div>
        )}
      </div>
    </div>
  );
}
