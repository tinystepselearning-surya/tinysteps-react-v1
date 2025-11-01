/**
 * DraggableTile - Word tile with HTML5 Drag & Drop + keyboard fallback
 */

import React from "react";

interface DraggableTileProps {
  word: string;
  wordId: string;
  isPlaced: boolean;
  isSelected: boolean;
  onPickup: (wordId: string) => void;
  onKeyboardSelect: (wordId: string) => void;
}

export function DraggableTile({
  word,
  wordId,
  isPlaced,
  isSelected,
  onPickup,
  onKeyboardSelect,
}: DraggableTileProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", wordId);
    onPickup(wordId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onKeyboardSelect(wordId);
    }
  };

  // Invisible when placed
  if (isPlaced) {
    return (
      <div
        className="w-48 h-20 rounded-2xl bg-transparent border-2 border-dashed border-gray-300"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Drag word: ${word}`}
      aria-pressed={isSelected}
      className={`
        w-48 h-20 rounded-2xl shadow-xl cursor-grab active:cursor-grabbing
        flex items-center justify-center font-bold text-2xl
        transition-all duration-200
        ${
          isSelected
            ? "bg-gradient-to-r from-yellow-300 to-orange-300 scale-105 ring-4 ring-yellow-400"
            : "bg-gradient-to-r from-blue-400 to-purple-400 hover:scale-105"
        }
        text-white focus:outline-none focus:ring-4 focus:ring-blue-500
      `}
    >
      {word}
    </div>
  );
}
