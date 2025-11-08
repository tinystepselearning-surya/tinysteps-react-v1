/**
 * courses.ts
 * Data model for course-based learning system
 * Each course contains milestones with status and progress tracking
 */

export type MilestoneStatus = "locked" | "in_progress" | "done";

export type MilestoneKPI = "accuracy" | "streak" | "time" | "attempts";

export interface Milestone {
  id: string; // e.g., "phonics-foundations-M1"
  title: string; // short label
  desc: string; // 1-line description
  status: MilestoneStatus;
  progress: number; // 0–100
  kpi?: MilestoneKPI[]; // optional KPIs to show
}

export type CourseID =
  // Phonics
  | "phonics-foundations"
  | "early-phonics-rules"
  | "advanced-phonics-rules"
  | "phonics-brush-up"
  // Grammar & Writing
  | "grammar-beginner"
  | "grammar-advanced"
  // Public Speaking
  | "public-speaking-beginner"
  | "public-speaking-intermediate"
  | "public-speaking-advanced";

export interface Course {
  id: CourseID;
  name: string;
  subject: "phonics" | "grammar_writing" | "public_speaking";
  age: string;
  color: string; // Tailwind class or hex
  tagline: string;
  milestones: Milestone[];
}

export const COURSES: Course[] = [
  // Phonics Courses
  {
    id: "phonics-foundations",
    name: "Phonics Foundations",
    subject: "phonics",
    age: "3–5",
    color: "#FDE68A",
    tagline: "Building sound awareness and basic letter recognition",
    milestones: [
      {
        id: "phonics-foundations-M1",
        title: "Letter Sounds A-M",
        desc: "Master first 13 letter-sound correspondences",
        status: "done",
        progress: 100,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "phonics-foundations-M2",
        title: "Letter Sounds N-Z",
        desc: "Complete alphabet with remaining sounds",
        status: "in_progress",
        progress: 75,
        kpi: ["accuracy"],
      },
      {
        id: "phonics-foundations-M3",
        title: "Simple CVC Words",
        desc: "Blend and read basic consonant-vowel-consonant words",
        status: "in_progress",
        progress: 60,
        kpi: ["accuracy", "time"],
      },
      {
        id: "phonics-foundations-M4",
        title: "Rhyming Words",
        desc: "Identify and create rhyming word pairs",
        status: "in_progress",
        progress: 45,
      },
      {
        id: "phonics-foundations-M5",
        title: "Sound Games",
        desc: "Interactive games for sound recognition",
        status: "locked",
        progress: 0,
      },
    ],
  },
  {
    id: "early-phonics-rules",
    name: "Early Phonics Rules",
    subject: "phonics",
    age: "5–7",
    color: "#FCA5A5",
    tagline: "Digraphs, blends, and basic phonics patterns",
    milestones: [
      {
        id: "early-phonics-rules-M1",
        title: "Consonant Blends",
        desc: "bl, cl, fl, gl, pl, sl, br, cr, dr, fr, gr, pr, tr",
        status: "in_progress",
        progress: 80,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "early-phonics-rules-M2",
        title: "Consonant Digraphs",
        desc: "sh, ch, th, wh, ph, ck",
        status: "in_progress",
        progress: 65,
        kpi: ["accuracy"],
      },
      {
        id: "early-phonics-rules-M3",
        title: "Short Vowel Sounds",
        desc: "Master a, e, i, o, u in CVC patterns",
        status: "in_progress",
        progress: 50,
        kpi: ["accuracy", "time"],
      },
      {
        id: "early-phonics-rules-M4",
        title: "Simple Sentences",
        desc: "Read and understand basic decodable sentences",
        status: "locked",
        progress: 0,
      },
      {
        id: "early-phonics-rules-M5",
        title: "Sight Words",
        desc: "Learn common high-frequency words",
        status: "locked",
        progress: 0,
      },
    ],
  },
  {
    id: "advanced-phonics-rules",
    name: "Advanced Phonics Rules",
    subject: "phonics",
    age: "6–8",
    color: "#C4B5FD",
    tagline: "Vowel teams, diphthongs, and complex patterns",
    milestones: [
      {
        id: "advanced-phonics-rules-M1",
        title: "Long Vowel Teams",
        desc: "ai/ay, ee/ea, oa/ow, ui/ue patterns",
        status: "in_progress",
        progress: 70,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "advanced-phonics-rules-M2",
        title: "R-Controlled Vowels",
        desc: "ar, er, ir, or, ur patterns",
        status: "in_progress",
        progress: 55,
        kpi: ["accuracy"],
      },
      {
        id: "advanced-phonics-rules-M3",
        title: "Diphthongs",
        desc: "oi/oy, ou/ow, aw/au patterns",
        status: "locked",
        progress: 0,
        kpi: ["accuracy", "time"],
      },
      {
        id: "advanced-phonics-rules-M4",
        title: "Silent E (Magic E)",
        desc: "VCe pattern with a_e, i_e, o_e, u_e",
        status: "locked",
        progress: 0,
      },
      {
        id: "advanced-phonics-rules-M5",
        title: "Multisyllabic Words",
        desc: "Decode and read compound words and longer words",
        status: "locked",
        progress: 0,
      },
    ],
  },
  {
    id: "phonics-brush-up",
    name: "Phonics Brush-Up",
    subject: "phonics",
    age: "8–12",
    color: "#93C5FD",
    tagline: "Remedial program for late starters or reinforcement",
    milestones: [
      {
        id: "phonics-brush-up-M1",
        title: "Foundation Review",
        desc: "Quick review of basic letter sounds and CVC words",
        status: "in_progress",
        progress: 85,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "phonics-brush-up-M2",
        title: "Pattern Recognition",
        desc: "Identify and apply common phonics patterns",
        status: "in_progress",
        progress: 70,
        kpi: ["accuracy"],
      },
      {
        id: "phonics-brush-up-M3",
        title: "Reading Fluency",
        desc: "Build speed and accuracy in decodable text",
        status: "in_progress",
        progress: 55,
        kpi: ["accuracy", "time"],
      },
      {
        id: "phonics-brush-up-M4",
        title: "Spelling Practice",
        desc: "Apply phonics rules to spelling activities",
        status: "locked",
        progress: 0,
      },
      {
        id: "phonics-brush-up-M5",
        title: "Progress Assessment",
        desc: "Track improvement and identify focus areas",
        status: "locked",
        progress: 0,
      },
    ],
  },

  // Grammar & Writing Courses
  {
    id: "grammar-beginner",
    name: "Grammar Beginner",
    subject: "grammar_writing",
    age: "6–8",
    color: "#FDBA74",
    tagline: "Parts of speech, basic sentence structure, and punctuation",
    milestones: [
      {
        id: "grammar-beginner-M1",
        title: "Parts of Speech",
        desc: "Identify nouns, verbs, adjectives, and pronouns",
        status: "in_progress",
        progress: 75,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "grammar-beginner-M2",
        title: "Sentence Structure",
        desc: "Subject-verb agreement and basic sentence types",
        status: "in_progress",
        progress: 60,
        kpi: ["accuracy"],
      },
      {
        id: "grammar-beginner-M3",
        title: "Punctuation Basics",
        desc: "Periods, question marks, exclamation points",
        status: "in_progress",
        progress: 45,
        kpi: ["accuracy", "time"],
      },
      {
        id: "grammar-beginner-M4",
        title: "Capitalization Rules",
        desc: "Proper nouns, sentence beginnings, 'I'",
        status: "locked",
        progress: 0,
      },
      {
        id: "grammar-beginner-M5",
        title: "Simple Writing",
        desc: "Write complete sentences and short paragraphs",
        status: "locked",
        progress: 0,
      },
    ],
  },
  {
    id: "grammar-advanced",
    name: "Grammar Advanced",
    subject: "grammar_writing",
    age: "8–12",
    color: "#34D399",
    tagline: "Complex sentences, advanced grammar, and writing skills",
    milestones: [
      {
        id: "grammar-advanced-M1",
        title: "Complex Sentences",
        desc: "Compound and complex sentence structures",
        status: "in_progress",
        progress: 65,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "grammar-advanced-M2",
        title: "Advanced Parts of Speech",
        desc: "Adverbs, prepositions, conjunctions, interjections",
        status: "in_progress",
        progress: 50,
        kpi: ["accuracy"],
      },
      {
        id: "grammar-advanced-M3",
        title: "Tense and Agreement",
        desc: "Verb tenses, subject-verb-object agreement",
        status: "locked",
        progress: 0,
        kpi: ["accuracy", "time"],
      },
      {
        id: "grammar-advanced-M4",
        title: "Paragraph Writing",
        desc: "Topic sentences, supporting details, conclusions",
        status: "locked",
        progress: 0,
      },
      {
        id: "grammar-advanced-M5",
        title: "Editing and Proofreading",
        desc: "Identify and correct grammar and punctuation errors",
        status: "locked",
        progress: 0,
      },
    ],
  },

  // Public Speaking Courses
  {
    id: "public-speaking-beginner",
    name: "Public Speaking Beginner",
    subject: "public_speaking",
    age: "5–7",
    color: "#60A5FA",
    tagline: "Building confidence and basic presentation skills",
    milestones: [
      {
        id: "public-speaking-beginner-M1",
        title: "Voice Projection",
        desc: "Speak clearly and at appropriate volume",
        status: "in_progress",
        progress: 80,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "public-speaking-beginner-M2",
        title: "Eye Contact",
        desc: "Make and maintain eye contact with audience",
        status: "in_progress",
        progress: 65,
        kpi: ["accuracy"],
      },
      {
        id: "public-speaking-beginner-M3",
        title: "Simple Introductions",
        desc: "Introduce yourself and others clearly",
        status: "in_progress",
        progress: 50,
        kpi: ["accuracy", "time"],
      },
      {
        id: "public-speaking-beginner-M4",
        title: "Short Presentations",
        desc: "Present a favorite toy, book, or activity",
        status: "locked",
        progress: 0,
      },
      {
        id: "public-speaking-beginner-M5",
        title: "Active Listening",
        desc: "Listen attentively and respond appropriately",
        status: "locked",
        progress: 0,
      },
    ],
  },
  {
    id: "public-speaking-intermediate",
    name: "Public Speaking Intermediate",
    subject: "public_speaking",
    age: "7–9",
    color: "#F472B6",
    tagline: "Developing presentation skills and audience engagement",
    milestones: [
      {
        id: "public-speaking-intermediate-M1",
        title: "Body Language",
        desc: "Use appropriate gestures and posture",
        status: "in_progress",
        progress: 70,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "public-speaking-intermediate-M2",
        title: "Storytelling",
        desc: "Tell stories with clear beginning, middle, and end",
        status: "in_progress",
        progress: 55,
        kpi: ["accuracy"],
      },
      {
        id: "public-speaking-intermediate-M3",
        title: "Question Handling",
        desc: "Answer questions clearly and confidently",
        status: "locked",
        progress: 0,
        kpi: ["accuracy", "time"],
      },
      {
        id: "public-speaking-intermediate-M4",
        title: "Group Presentations",
        desc: "Present as part of a small group",
        status: "locked",
        progress: 0,
      },
      {
        id: "public-speaking-intermediate-M5",
        title: "Visual Aids",
        desc: "Use simple props or drawings to enhance presentations",
        status: "locked",
        progress: 0,
      },
    ],
  },
  {
    id: "public-speaking-advanced",
    name: "Public Speaking Advanced",
    subject: "public_speaking",
    age: "9–12",
    color: "#A7F3D0",
    tagline: "Mastering advanced presentation and communication skills",
    milestones: [
      {
        id: "public-speaking-advanced-M1",
        title: "Research and Preparation",
        desc: "Research topics and organize presentation content",
        status: "in_progress",
        progress: 60,
        kpi: ["accuracy", "streak"],
      },
      {
        id: "public-speaking-advanced-M2",
        title: "Persuasive Speaking",
        desc: "Present arguments and persuade audience",
        status: "in_progress",
        progress: 45,
        kpi: ["accuracy"],
      },
      {
        id: "public-speaking-advanced-M3",
        title: "Impromptu Speaking",
        desc: "Speak spontaneously on given topics",
        status: "locked",
        progress: 0,
        kpi: ["accuracy", "time"],
      },
      {
        id: "public-speaking-advanced-M4",
        title: "Debate Skills",
        desc: "Present and defend positions in structured debates",
        status: "locked",
        progress: 0,
      },
      {
        id: "public-speaking-advanced-M5",
        title: "Professional Presentations",
        desc: "Deliver formal presentations with slides or visual aids",
        status: "locked",
        progress: 0,
      },
    ],
  },
];

// Export as PHASES for backward compatibility (will be updated)
export const PHASES = COURSES;
export type Phase = Course;
export type PhaseID = CourseID;
