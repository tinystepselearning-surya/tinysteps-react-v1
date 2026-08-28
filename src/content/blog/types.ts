export type BlogPost = {
  slug: string;
  title: string;
  category: 'Phonics' | 'Grammar' | 'Public Speaking' | 'English Communication' | 'Parent Tips' | 'Research';
  author: string;
  date: string; // ISO date
  readTime: string;
  hero?: string; // image url
  metaDescription?: string;
  excerpt: string;
  seriesLabel?: string;
  body: {
    type: 'h2' | 'h3' | 'p' | 'li';
    content: string;
  }[];
  faq?: {
    question: string;
    answer: string;
  }[];
  viewsCount?: number;
  popularScore?: number;
};

export type PhonicsSeoPost = {
  slug: string;
  title: string;
  focus: string;
  quickAnswer: string;
  homePlan: string[];
  classChecklistFocus: string;
  avoidFocus: string;
  progress: string;
  support: string;
  faq: {
    question: string;
    answer: string;
  }[];
  relatedReads?: {
    label: string;
    to: string;
  }[];
  readTime?: string;
};

export type BlogBlock = {
  type: 'h2' | 'h3' | 'p' | 'li';
  content: string;
};

export type WeeklyPlaybook = {
  heading: string;
  context: string;
  routine: string[];
  rescue: string;
  outcomes: string[];
  parentQuestions: string[];
};
