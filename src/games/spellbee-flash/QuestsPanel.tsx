/**
 * QuestsPanel Component
 * Daily quests to drive engagement and variety
 */

import { useState } from "react";
import type { Quest } from "./utils";

interface QuestsPanelProps {
  quests: Quest[];
}

export default function QuestsPanel({ quests }: QuestsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (quests.length === 0) return null;

  return (
    <div className="w-[180px]">
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-2xl overflow-hidden border-2 border-purple-300">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-black text-lg flex items-center justify-between hover:from-purple-500 hover:to-pink-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={isExpanded ? "Collapse quests" : "Expand quests"}
          aria-expanded={isExpanded}
        >
          <span>✨ Daily Quests</span>
          <span className="text-2xl transform transition-transform duration-200" style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
          }}>
            ▼
          </span>
        </button>

        {/* Quest List */}
        {isExpanded && (
          <div className="p-4 space-y-3">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className={`bg-white rounded-xl p-3 shadow-md transition-all duration-300 ${
                  quest.done ? "border-2 border-green-400" : "border-2 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{quest.icon}</span>
                  <span className="font-bold text-sm text-gray-800 flex-1">
                    {quest.title}
                  </span>
                  {quest.done && (
                    <span className="text-green-600 font-bold text-lg animate-bounce">✓</span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        quest.done 
                          ? "bg-gradient-to-r from-green-400 to-emerald-400" 
                          : "bg-gradient-to-r from-purple-400 to-pink-400"
                      }`}
                      style={{
                        width: `${Math.min((quest.progress / quest.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-right">
                    {quest.progress}/{quest.target}
                  </p>
                </div>

                {/* Completion Celebration */}
                {quest.done && (
                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-green-600 animate-pulse">
                      🎉 Quest Complete!
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
