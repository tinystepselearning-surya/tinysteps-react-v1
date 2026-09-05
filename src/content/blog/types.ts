export type BlogAudience = 'Parent' | 'Schools & Research';
export type BlogDiscoveryCategory =
  | 'Phonics'
  | 'Grammar'
  | 'Speaking & Communication'
  | 'Parent Guides'
  | 'Schools & Research';

export type BlogPost = {
  slug: string;
  title: string;
  category: 'Phonics' | 'Grammar' | 'Public Speaking' | 'English Communication' | 'Parent Tips' | 'Research';
  author: string;
  date: string; // ISO date
  modifiedDate?: string; // ISO date; set only after a meaningful editorial revision
  readTime: string;
  hideFromList?: boolean; // Exclude retired/supporting sources from rendered discovery recommendations
  hero?: string; // image url
  metaDescription?: string;
  excerpt: string;
  audience?: BlogAudience;
  discoveryCategory?: BlogDiscoveryCategory;
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
