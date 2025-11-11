// @ts-nocheck
import React from 'react';
import { MasteryProgress } from '../common/MasteryProgress';

const summaries: Record<string, {
  course: string;
  week: string;
  mastery: number;
  status: string;
  trend: string;
  mastered: string[];
  practice: string[];
  tip: string;
}> = {
  phonics: {
    course: 'Phonics Foundation',
    week: 'Week 4',
    mastery: 68,
    status: 'Developing → Proficient',
    trend: '42% → 55% → 61% → 68%',
    mastered: ['Long-vowel picture sort (ai/ay)', 'Sound-motion drills (daily streak 5/5)', 'Decodable reader — Level B'],
    practice: ['Magic-e words speed (cap/cape)', 'Tricky words: said, come'],
    tip: 'Play “Magic-e Flip” for 7 mins · Read Level B reader aloud · Write 5 sentences using long vowels.'
  },
  grammar: {
    course: 'Grammar Essentials',
    week: 'Week 5',
    mastery: 52,
    status: 'Developing',
    trend: '30% → 36% → 45% → 52%',
    mastered: ['Identify nouns/pronouns', 'Present vs. past verb swap', 'Punctuation of basic sentences'],
    practice: ['Subject-verb agreement in simple past', 'Comma usage in lists'],
    tip: 'Use the “Grammar Safari” game for 10 mins · Write a 4-sentence diary entry focusing on verbs.'
  },
  speaking: {
    course: 'Super Speakers Studio',
    week: 'Week 6',
    mastery: 74,
    status: 'Confidence rising',
    trend: '50% → 58% → 66% → 74%',
    mastered: ['3-point storytelling without cue cards', 'Hand gestures synced with speech', 'Introductions under 30s'],
    practice: ['Vocal variety (rise/fall)', 'Handling audience Q&A for 2 questions'],
    tip: 'Record a quick “My city” speech · Review coach notes on pace · Play mirror game for 5 minutes.'
  },
  all: {
    course: 'Integrated English Journey',
    week: 'Week 4',
    mastery: 60,
    status: 'Solid momentum',
    trend: '35% → 44% → 52% → 60%',
    mastered: ['Reading stamina +3 mins', 'Pronunciation of target digraphs', 'Paragraph with capitalisation'],
    practice: ['Consistent speaking volume', 'Commas before conjunctions'],
    tip: 'Cycle phonics + grammar drills 5 mins each · Practice a short show-and-tell in front of family.'
  }
};

export const ParentReportPreview: React.FC<{ track: 'all' | 'phonics' | 'grammar' | 'speaking' }> = ({ track }) => {
  const summary = summaries[track] || summaries.all;
  return (
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
      <div className="mb-3 font-semibold text-gray-900">📊 Weekly Progress Summary</div>
      <div className="mb-3 grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1 text-sm text-gray-700">
          <div>Child: Sarah</div>
          <div>Week: {summary.week}</div>
          <div>Course: {summary.course}</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <MasteryProgress percent={summary.mastery} />
          <div className="text-sm text-gray-700 text-center">{summary.status}</div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3 text-center text-xs text-gray-600">
          <span className="font-semibold text-gray-900">Trend</span>
          <span>{summary.trend}</span>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="font-medium">✓ Mastered This Week:</div>
          <ul className="list-disc pl-5 text-sm">
            {summary.mastered.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium">⚠ Needs Practice:</div>
          <ul className="list-disc pl-5 text-sm">
            {summary.practice.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-700">💡 Tips: {summary.tip}</div>
      <div className="mt-3 text-right text-sm text-primary-600">[Download Full Report PDF]</div>
    </div>
  );
};
