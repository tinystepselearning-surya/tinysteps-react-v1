/**
 * GroupDashboard Component
 * A-Z overview showing progress for each letter group
 */

import { useState, useMemo } from 'react';
import { WORDS } from './data';
import {
  listWordsForGroup,
  computeGroupStats,
  getWordMasteryAndAccuracy,
} from './utils';
import GroupCard from './GroupCard';
import WordsModal from './WordsModal';

export default function GroupDashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Compute stats for all groups (A-Z + All + #)
  const groupStats = useMemo(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const groups: Record<
      string,
      {
        total: number;
        completed: number;
        percent: number;
        confidence: 'Low' | 'Medium' | 'High';
        trend: 'improving' | 'stable' | 'declining' | 'new';
      }
    > = {};

    // Compute each letter group
    for (const letter of alphabet) {
      const stats = computeGroupStats(WORDS, letter);
      if (stats.total > 0) {
        groups[letter] = stats;
      }
    }

    // Compute "All" group
    groups['All'] = computeGroupStats(WORDS, 'All');

    // Compute "#" (non-alpha) group
    const nonAlphaStats = computeGroupStats(WORDS, '#');
    if (nonAlphaStats.total > 0) {
      groups['#'] = nonAlphaStats;
    }

    return groups;
  }, []);

  // Get last played group from localStorage
  const lastPlayedGroup = useMemo(() => {
    const saved = localStorage.getItem('spellbee-last-group-v1');
    return saved && groupStats[saved] ? saved : null;
  }, [groupStats]);

  // Handlers
  const handleStart = (groupId: string) => {
    // Save to localStorage
    localStorage.setItem('spellbee-last-group-v1', groupId);
    // User will wire router navigation separately
    console.log(`[GroupDashboard] Start group: ${groupId}`);
  };

  const handleView = (groupId: string) => {
    setSelectedGroup(groupId);
    setModalOpen(true);
  };

  const handleReset = (groupId: string) => {
    if (!confirm(`Reset all progress for group ${groupId}?`)) return;

    const words = listWordsForGroup(WORDS, groupId);
    const mastery = JSON.parse(
      localStorage.getItem('spellbee-mastery-v1') || '{}'
    );

    // Clear mastery for all words in this group
    for (const word of words) {
      const index = WORDS.indexOf(word);
      if (index !== -1 && mastery[index]) {
        delete mastery[index];
      }
    }

    localStorage.setItem('spellbee-mastery-v1', JSON.stringify(mastery));

    // Force re-render
    window.location.reload();
  };

  // Prepare modal data
  const modalWords = useMemo(() => {
    if (!selectedGroup) return [];

    const words = listWordsForGroup(WORDS, selectedGroup);
    return words.map((word) => {
      const wordIndex = WORDS.indexOf(word);
      const { mastery, accuracy } = getWordMasteryAndAccuracy(wordIndex);

      return {
        id: `${wordIndex}-${word.word}`,
        word: word.word,
        mastery,
        accuracy,
      };
    });
  }, [selectedGroup]);

  // Render groups in order: All, A-Z, #
  const groupOrder = useMemo(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const order: string[] = ['All'];

    for (const letter of alphabet) {
      if (groupStats[letter]) {
        order.push(letter);
      }
    }

    if (groupStats['#']) {
      order.push('#');
    }

    return order;
  }, [groupStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2">
            Group Dashboard
          </h1>
          <p className="text-slate-600 text-base sm:text-lg">
            Track your progress across all letter groups
          </p>
        </div>

        {/* Summary Chips */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* All Groups Summary */}
          <div className="rounded-xl bg-purple-100 px-4 py-2.5 border border-purple-200">
            <div className="text-xs uppercase tracking-wide text-purple-700 font-semibold mb-0.5">
              All Groups
            </div>
            <div className="text-2xl font-extrabold text-purple-900">
              {groupStats['All']?.completed ?? 0} /{' '}
              {groupStats['All']?.total ?? 0}
            </div>
            <div className="text-xs text-purple-700 mt-0.5">
              {groupStats['All']?.percent ?? 0}% Complete
            </div>
          </div>

          {/* Last Played */}
          {lastPlayedGroup && lastPlayedGroup !== 'All' && (
            <div className="rounded-xl bg-blue-100 px-4 py-2.5 border border-blue-200">
              <div className="text-xs uppercase tracking-wide text-blue-700 font-semibold mb-0.5">
                Last Played
              </div>
              <div className="text-2xl font-extrabold text-blue-900">
                Group {lastPlayedGroup}
              </div>
              <div className="text-xs text-blue-700 mt-0.5">
                {groupStats[lastPlayedGroup]?.completed ?? 0} /{' '}
                {groupStats[lastPlayedGroup]?.total ?? 0} Words
              </div>
            </div>
          )}
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {groupOrder.map((groupId) => (
            <GroupCard
              key={groupId}
              groupId={groupId}
              stats={groupStats[groupId]}
              onStart={() => handleStart(groupId)}
              onView={() => handleView(groupId)}
              onReset={() => handleReset(groupId)}
            />
          ))}
        </div>

        {/* Modal */}
        <WordsModal
          open={modalOpen}
          groupId={selectedGroup ?? ''}
          words={modalWords}
          onClose={() => {
            setModalOpen(false);
            setSelectedGroup(null);
          }}
        />
      </div>
    </div>
  );
}
