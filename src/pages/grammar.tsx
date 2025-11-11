import React from 'react';
import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';

const levels = [
  {
    name: 'Foundations',
    outcomes: ['Nouns, verbs, adjectives mastery', 'Sentence building + punctuation', 'Weekly AI grammar checks'],
    pdf: '/curriculum'
  },
  {
    name: 'Intermediate',
    outcomes: ['Tenses, subject-verb agreement, pronouns', 'Paragraph writing with feedback', 'Editing labs + rubrics'],
    pdf: '/curriculum'
  },
  {
    name: 'Advanced',
    outcomes: ['Clauses, modals, reported speech', 'Creative + opinion writing packs', 'Capstone: 120-word essay with rubric'],
    pdf: '/curriculum'
  }
];

const stages = [
  { title: 'Weeks 1-4 • Grammar games', duration: 'Month 1', description: 'Parts of speech, sentence dice, daily story prompts.' },
  { title: 'Weeks 5-8 • Tenses + paragraphs', duration: 'Month 2', description: 'Tense wheel, editing relay, structured paragraphs.' },
  { title: 'Weeks 9-12 • Writing lab', duration: 'Month 3', description: 'Narrative + opinion writing, peer reviews, publishing.' }
];

export default function GrammarPage() {
  return (
    <div>
      <ProgramHero
        program="Grammar"
        title="Grammar & Writing Lab"
        subtitle="Playful grammar drills + AI writing coach ensure kids write clearly and confidently."
        badges={['Ages 5–15', 'Live feedback', 'Weekly writing samples']}
        highlights={[
          'Sentence dice, grammar bingo, editing relays',
          'AI writing assistant + downloadable worksheets',
          'Parent dashboard with writing samples & next steps'
        ]}
      />
      <LevelTabs levels={levels} />
      <LearningJourney stages={stages} />
    </div>
  );
}
