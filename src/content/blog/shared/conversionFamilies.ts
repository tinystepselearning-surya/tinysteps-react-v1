import type { BlogPost } from '../types';
import { getBlogTechnicalAuthority } from './technicalAuthority';

export type BlogConversionFamily =
  | 'phonics-diagnostic'
  | 'phonics-practice'
  | 'reading-fluency'
  | 'grammar-diagnostic'
  | 'sentence-building'
  | 'speaking-confidence'
  | 'general-english'
  | 'schools-partnership';

export type BlogConversionActionKind = 'demo' | 'program' | 'schools' | 'contact';

export type BlogConversionAction = {
  label: string;
  to: string;
  kind: BlogConversionActionKind;
};

export type BlogConversionConfig = {
  family: BlogConversionFamily;
  program: 'phonics' | 'grammar' | 'speaking' | 'general';
  authorityCluster: string;
  intentCluster: string;
  eyebrow: string;
  heading: string;
  description: string;
  primaryAction: BlogConversionAction;
  secondaryAction?: BlogConversionAction;
};

type BlogConversionInput = Pick<BlogPost, 'slug' | 'category'> &
  Partial<Pick<BlogPost, 'audience' | 'discoveryCategory'>>;

const EXPLICIT_FAMILY_BY_SLUG: Partial<Record<string, BlogConversionFamily>> = {
  'child-knows-abc-but-cannot-read': 'phonics-diagnostic',
  'why-child-knows-letter-sounds-but-cannot-read-words': 'phonics-diagnostic',
  'how-kids-learn-blending': 'phonics-practice',
  'phonics-blending-activities': 'phonics-practice',
  'satpin-phonics-guide': 'phonics-practice',
  'phonics-for-parents-guide': 'phonics-practice',
  'how-to-improve-reading-fluency-in-children': 'reading-fluency',
  'child-knows-grammar-but-makes-mistakes': 'grammar-diagnostic',
  'how-to-improve-sentence-formation-in-kids': 'sentence-building',
  'week-7-grammar-nouns-to-paragraphs': 'sentence-building',
  'child-understands-english-but-does-not-speak': 'speaking-confidence',
  'child-gives-one-word-answers': 'speaking-confidence',
  'week-12-speaking-confidence-seeds': 'speaking-confidence',
};

const FAMILY_COPY: Record<BlogConversionFamily, Omit<BlogConversionConfig, 'family' | 'authorityCluster' | 'intentCluster'>> = {
  'phonics-diagnostic': {
    program: 'phonics',
    eyebrow: 'If reading is still getting stuck',
    heading: 'Find the exact point where decoding is breaking down',
    description:
      'A Tiny Steps teacher can check letter-sound recall, blending and early word reading in one free 35-minute 1:1 demo assessment class, then recommend the next phonics step.',
    primaryAction: {
      label: 'Book a free phonics assessment',
      to: '/book-demo',
      kind: 'demo',
    },
    secondaryAction: {
      label: 'Explore Tiny Steps phonics classes',
      to: '/phonics',
      kind: 'program',
    },
  },
  'phonics-practice': {
    program: 'phonics',
    eyebrow: 'When home practice needs a clearer next step',
    heading: 'Turn phonics practice into a structured learning path',
    description:
      'If you are unsure whether your child needs more sound work, blending practice or the next decoding stage, a free 35-minute 1:1 assessment can help you choose the right starting point.',
    primaryAction: {
      label: 'Book a free phonics assessment',
      to: '/book-demo',
      kind: 'demo',
    },
    secondaryAction: {
      label: 'Explore Tiny Steps phonics classes',
      to: '/phonics',
      kind: 'program',
    },
  },
  'reading-fluency': {
    program: 'phonics',
    eyebrow: 'When reading is accurate but still effortful',
    heading: 'Understand what is slowing fluent reading down',
    description:
      'A free 35-minute 1:1 assessment can help distinguish decoding, automatic word reading and fluency needs before you decide what your child should practise next.',
    primaryAction: {
      label: 'Book a free reading assessment',
      to: '/book-demo',
      kind: 'demo',
    },
    secondaryAction: {
      label: 'Explore Tiny Steps phonics classes',
      to: '/phonics',
      kind: 'program',
    },
  },
  'grammar-diagnostic': {
    program: 'grammar',
    eyebrow: 'When the rule is known but mistakes keep appearing',
    heading: 'Check whether grammar knowledge is transferring into real use',
    description:
      'A Tiny Steps teacher can look at how your child applies grammar while speaking and writing, then recommend the most useful sentence and grammar practice.',
    primaryAction: {
      label: 'Book a free grammar assessment',
      to: '/book-demo',
      kind: 'demo',
    },
    secondaryAction: {
      label: 'Explore Tiny Steps grammar classes',
      to: '/grammar',
      kind: 'program',
    },
  },
  'sentence-building': {
    program: 'grammar',
    eyebrow: 'When ideas are there but sentences are not clear yet',
    heading: 'See which part of sentence building needs support next',
    description:
      'A free 35-minute 1:1 assessment can help identify whether your child needs support with core sentence structure, expansion, grammar accuracy or written transfer.',
    primaryAction: {
      label: 'Book a free sentence-building assessment',
      to: '/book-demo',
      kind: 'demo',
    },
    secondaryAction: {
      label: 'Explore Tiny Steps grammar classes',
      to: '/grammar',
      kind: 'program',
    },
  },
  'speaking-confidence': {
    program: 'speaking',
    eyebrow: 'When understanding is stronger than speaking',
    heading: 'Find the next step from short answers to clearer communication',
    description:
      'A Tiny Steps teacher can check sentence response, idea expansion and speaking confidence in one free 35-minute 1:1 assessment, then recommend the right communication pathway.',
    primaryAction: {
      label: 'Book a free speaking assessment',
      to: '/book-demo',
      kind: 'demo',
    },
    secondaryAction: {
      label: 'Explore Tiny Steps speaking classes',
      to: '/speaking',
      kind: 'program',
    },
  },
  'general-english': {
    program: 'general',
    eyebrow: 'If you are not sure which English skill to address first',
    heading: 'Get one clear starting recommendation for your child',
    description:
      'Use the free 35-minute 1:1 demo assessment to understand whether phonics, reading, grammar, sentence formation or speaking should be the next priority.',
    primaryAction: {
      label: 'Book a free English assessment',
      to: '/book-demo',
      kind: 'demo',
    },
    secondaryAction: {
      label: 'Choose the right Tiny Steps course',
      to: '/courses',
      kind: 'program',
    },
  },
  'schools-partnership': {
    program: 'general',
    eyebrow: 'For schools planning structured English implementation',
    heading: 'Turn the research into a practical school implementation plan',
    description:
      'Explore Tiny Steps school partnerships for phonics implementation, teacher support and classroom-ready progression without routing school decision-makers into the parent demo funnel.',
    primaryAction: {
      label: 'Explore Tiny Steps for Schools',
      to: '/for-schools',
      kind: 'schools',
    },
    secondaryAction: {
      label: 'Contact Tiny Steps about your school',
      to: '/contact',
      kind: 'contact',
    },
  },
};

function inferFamily(post: BlogConversionInput): BlogConversionFamily {
  const explicit = EXPLICIT_FAMILY_BY_SLUG[post.slug];
  if (explicit) return explicit;

  const authority = getBlogTechnicalAuthority(post);
  if (authority.audience === 'Schools & Research' || authority.discoveryCategory === 'Schools & Research') {
    return 'schools-partnership';
  }

  if (authority.cluster === 'Phonics') {
    if (authority.role === 'diagnostic-owner') return 'phonics-diagnostic';
    if (authority.topics.some((topic) => topic.toLowerCase().includes('fluency'))) return 'reading-fluency';
    return 'phonics-practice';
  }

  if (authority.cluster === 'Grammar') {
    if (post.slug === 'child-knows-grammar-but-makes-mistakes') return 'grammar-diagnostic';
    return 'sentence-building';
  }

  if (authority.cluster === 'Speaking & Communication') return 'speaking-confidence';

  switch (authority.discoveryCategory) {
    case 'Phonics':
      return 'phonics-practice';
    case 'Grammar':
      return 'sentence-building';
    case 'Speaking & Communication':
      return 'speaking-confidence';
    default:
      return 'general-english';
  }
}

export function getBlogConversionConfig(post: BlogConversionInput): BlogConversionConfig {
  const authority = getBlogTechnicalAuthority(post);
  const family = inferFamily(post);
  const copy = FAMILY_COPY[family];

  return {
    family,
    authorityCluster: authority.cluster,
    intentCluster: authority.topics[0] || family,
    ...copy,
  };
}

export function isParentDemoConversion(config: BlogConversionConfig): boolean {
  return config.family !== 'schools-partnership' && config.primaryAction.kind === 'demo';
}
