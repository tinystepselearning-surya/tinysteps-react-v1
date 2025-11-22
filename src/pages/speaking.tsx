// React import removed (unused)
import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';

const levels = [
  {
    name: 'Foundations',
    outcomes: ['15-45 second talks, show & tell', 'Voice, face & body language warmups', 'Confidence rituals + gamified practice'],
    pdf: '/curriculum'
  },
  {
    name: 'Confidence',
    outcomes: ['Hook-Body-Close framework', 'Impromptu jar, debates, Q&A', 'Weekly video feedback'],
    pdf: '/curriculum'
  },
  {
    name: 'Super Speakers',
    outcomes: ['Persuasive + informative speeches', 'Visual aids, storytelling, stagecraft', 'Capstone recording + rubric score'],
    pdf: '/curriculum'
  }
];

const stages = [
  { title: 'Weeks 1-4 • Confidence seed', duration: 'Month 1', description: 'Micro-speaks, posture, voice games, S.P.E.A.K habit.' },
  { title: 'Weeks 5-8 • Structure & expression', duration: 'Month 2', description: 'Hook-Body-Close, gestures, vocal variety, storytelling.' },
  { title: 'Weeks 9-12 • Performance', duration: 'Month 3', description: 'Debates, visual aids, capstone speech + parent showcase.' }
];

export default function SpeakingPage() {
  return (
    <div>
      <ProgramHero
        program="Public Speaking"
        title="Super Speakers Studio"
        subtitle="From shy to spotlight-ready with live coaches, AI observation notes, and weekly showcase videos."
        badges={['Ages 4–15', 'S.P.E.A.K habit', 'Parent video notes']}
        highlights={[
          'Show & tell, storytelling, debates, persuasive speeches',
          'AI voice analytics + coach feedback',
          'Capstone performances recorded and certified'
        ]}
      />
      <LevelTabs levels={levels} />
      <LearningJourney stages={stages} />
    </div>
  );
}
