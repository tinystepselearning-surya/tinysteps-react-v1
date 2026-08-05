export type TeamIconKey =
  | 'book'
  | 'chart'
  | 'compass'
  | 'headset'
  | 'layers'
  | 'message'
  | 'mic'
  | 'pen'
  | 'school'
  | 'shield'
  | 'sparkles'
  | 'users';

export interface TeamContentCard {
  title: string;
  description: string;
  icon: TeamIconKey;
}

export interface TeamProcessStep {
  label: string;
  title: string;
  description: string;
}

export const trustMetrics = [
  { value: '5,000+', label: 'Learners supported', icon: 'users' },
  { value: '15+', label: 'Countries reached', icon: 'compass' },
  { value: 'Live online', label: 'Teacher-guided learning', icon: 'headset' },
  { value: 'Structured', label: 'Programme pathways', icon: 'layers' },
] satisfies Array<{ value: string; label: string; icon: TeamIconKey }>;

export const founderResponsibilities = [
  { title: 'Curriculum Direction', icon: 'compass' },
  { title: 'Teacher Development', icon: 'users' },
  { title: 'Academic Quality', icon: 'shield' },
] satisfies Array<{ title: string; icon: TeamIconKey }>;

export const academicSystemCards = [
  {
    title: 'Curriculum Design',
    description: 'Structured, stage-wise learning pathways rather than disconnected worksheets.',
    icon: 'compass',
  },
  {
    title: 'Lesson Development',
    description: 'Interactive lesson decks, practice activities, games, reading tasks and application exercises.',
    icon: 'book',
  },
  {
    title: 'Teacher Development',
    description: 'Programme guidance, lesson preparation support, feedback and continued academic development.',
    icon: 'users',
  },
  {
    title: 'Progress Support',
    description: 'Child-level review, parent communication and recommendations for continued practice.',
    icon: 'chart',
  },
] satisfies TeamContentCard[];

export const teacherDevelopmentSteps = [
  {
    label: 'Step 1',
    title: 'Select',
    description:
      'Teachers are reviewed for spoken English, child interaction, subject understanding, reliability and online-class readiness.',
  },
  {
    label: 'Step 2',
    title: 'Prepare',
    description:
      'Teachers receive programme structure, lesson resources, teaching guidance and expectations for child participation.',
  },
  {
    label: 'Step 3',
    title: 'Strengthen',
    description:
      'Teaching is supported through feedback, academic review, parent insights and continued development.',
  },
] satisfies TeamProcessStep[];

export const qualitySteps = [
  { label: '01', title: 'Assess', description: 'Understand the child’s current level, strengths and gaps.' },
  { label: '02', title: 'Place', description: 'Recommend the appropriate programme and starting point.' },
  { label: '03', title: 'Teach', description: 'Deliver structured live lessons through guided interaction.' },
  { label: '04', title: 'Practise', description: 'Reinforce skills through reading, speaking, writing and application.' },
  { label: '05', title: 'Review', description: 'Monitor participation, accuracy, confidence and programme progression.' },
  { label: '06', title: 'Communicate', description: 'Help parents understand improvements and areas needing further practice.' },
] satisfies TeamProcessStep[];

export const teachingCommunity = [
  {
    title: 'Phonics and Early Reading Educators',
    description: 'Support sound awareness, decoding, blending, spelling patterns and growing reading fluency.',
    icon: 'book',
  },
  {
    title: 'Grammar and Writing Educators',
    description: 'Guide sentence formation, grammar control, written expression and confident application.',
    icon: 'pen',
  },
  {
    title: 'Public Speaking and Communication Educators',
    description: 'Build clear expression, structured speaking, storytelling and participation confidence.',
    icon: 'mic',
  },
  {
    title: 'Curriculum and Academic Support Team',
    description: 'Shape programme pathways, lesson resources, teaching guidance and quality review.',
    icon: 'shield',
  },
  {
    title: 'Parent and Programme Support Team',
    description: 'Keep families informed and help learning routines stay clear, consistent and connected.',
    icon: 'message',
  },
] satisfies TeamContentCard[];

export const teamFaqItems = [
  {
    question: 'Who teaches Tiny Steps classes?',
    answer:
      'Tiny Steps classes are taught by online educators who guide children through structured practice in phonics, reading, grammar, writing, sentence formation and public speaking.',
  },
  {
    question: 'How are Tiny Steps teachers prepared?',
    answer:
      'Teachers receive the programme structure, lesson resources, teaching guidance and expectations for child participation. They are supported with feedback and continued academic development.',
  },
  {
    question: 'How does Tiny Steps maintain academic quality?',
    answer:
      'Tiny Steps connects assessment, structured programme placement, guided lessons, purposeful practice, academic review and clear parent communication in one learning system.',
  },
  {
    question: 'How is my child’s starting level decided?',
    answer:
      'A free 35-minute 1:1 assessment class helps the team understand the child’s current strengths and gaps before recommending an appropriate programme and starting point.',
  },
  {
    question: 'Will parents receive progress updates?',
    answer:
      'Yes. Parent communication helps families understand what is improving, what needs further practice and the recommended next steps in the child’s programme.',
  },
  {
    question: 'Does Tiny Steps work with schools?',
    answer:
      'Yes. Tiny Steps supports schools with structured phonics curriculum, classroom resources, progressive teacher training, implementation guidance, progress review and year-long support.',
  },
] as const;
