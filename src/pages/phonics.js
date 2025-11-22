import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';
const levels = [
    {
        name: 'Beginner',
        outcomes: ['SATPIN mastery & blending routines', 'Tricky words set A', 'Daily AI reading prompts'],
        pdf: '/curriculum'
    },
    {
        name: 'Intermediate',
        outcomes: ['Digraphs, vowel teams, silent-e', 'Dictation + spelling rules', 'Weekly fluency recordings'],
        pdf: '/curriculum'
    },
    {
        name: 'Advanced',
        outcomes: ['Multisyllabic decoding & morphology', 'Comprehension questions + writing', 'Capstone: 150-word reading video'],
        pdf: '/curriculum'
    }
];
const stages = [
    { title: 'Weeks 1-4 • Sounds to words', duration: 'Month 1', description: 'SATPIN, blending club, AI-driven home practice.' },
    { title: 'Weeks 5-8 • Rules & teams', duration: 'Month 2', description: 'Digraphs, magic-e, vowel teams, tricky words set B.' },
    { title: 'Weeks 9-12 • Fluency & writing', duration: 'Month 3', description: 'Reading passages with expression, spelling, and short paragraphs.' }
];
export default function PhonicsPage() {
    return (_jsxs("div", { children: [_jsx(ProgramHero, { program: "Phonics", title: "Phonics Superstar Program", subtitle: "Systematic, multi-sensory phonics taught live with AI reading coaches and weekly parent insights.", badges: ['Ages 3–12', 'Live 1:1 or pods', 'AI progress dashboard'], highlights: [
                    'SATPIN + digraphs + multisyllabic decoding',
                    'Recorded practice + decodable libraries',
                    'Weekly feedback + WhatsApp nudges'
                ] }), _jsx(LevelTabs, { levels: levels }), _jsx(LearningJourney, { stages: stages })] }));
}
