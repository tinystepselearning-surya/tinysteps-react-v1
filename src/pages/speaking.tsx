// React import removed (unused)
import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';

const levels = [
  {
    name: 'Public Speaking (Basic)',
    outcomes: [
      '15-60 second talks, show & tell',
      'Voice, face & body language warmups',
      'Confidence routines + practice prompts',
    ],
    pdf: '/curriculum'
  },
  {
    name: 'Public Speaking (Advanced)',
    outcomes: [
      'Structure, storytelling, and Q&A',
      'Persuasion + debate foundations',
      'Capstone presentation showcase',
    ],
    pdf: '/curriculum'
  }
];

const stages = [
  { title: 'Stage 1 • Comfort + clarity', duration: 'Lessons 1–12', description: 'Confidence routines, clear speech, simple structure.' },
  { title: 'Stage 2 • Story + Q&A', duration: 'Lessons 13–24', description: 'Describe, show & tell, mini talks, friendly questions.' },
  { title: 'Stage 3 • Presentation readiness', duration: 'Lessons 25–36', description: 'Audience practice, strong openings, showcase speech.' }
];

export default function SpeakingPage() {
  return (
    <div>
      <ProgramHero
        program="Public Speaking"
        title="Super Speakers Studio"
        subtitle="From shy to spotlight-ready with live coaches, AI observation notes, and stage-based showcases."
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
