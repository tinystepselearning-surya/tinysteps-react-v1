import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';

const levels = [
  {
    name: 'Basic Grammar',
    outcomes: [
      'Nouns, verbs, adjectives mastery',
      'Sentence building + punctuation',
      'Lesson-by-lesson editing practice',
    ],
    pdf: '/curriculum'
  },
  {
    name: 'Advanced Grammar',
    outcomes: [
      'Clauses, modals, reported speech',
      'Paragraph writing with feedback',
      'Capstone writing showcase',
    ],
    pdf: '/curriculum'
  }
];

const stages = [
  { title: 'Stage 1 • Sentence foundations', duration: 'Lessons 1–12', description: 'Parts of speech, simple sentences, quick edits.' },
  { title: 'Stage 2 • Meaning + structure', duration: 'Lessons 13–24', description: 'Prepositions, conjunctions, plurals, run-on fixes.' },
  { title: 'Stage 3 • Tenses + writing', duration: 'Lessons 25–36', description: 'Questions, punctuation, tense accuracy, capstone writing.' }
];

export default function GrammarPage() {
  return (
    <div>
      <ProgramHero
        program="Grammar"
        title="Grammar & Writing Lab"
        subtitle="Playful grammar drills + AI writing coach ensure kids write clearly and confidently."
        badges={['Ages 5–15', 'Live feedback', 'Lesson-based writing samples']}
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
