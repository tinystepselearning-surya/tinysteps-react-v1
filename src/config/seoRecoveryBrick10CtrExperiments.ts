import type { BlogPost } from '../content/blog/types';

export const SEO_RECOVERY_BRICK10_REVISION = '2026-09-12-brick10';
export const SEO_RECOVERY_BRICK10_GSC_RANGE = Object.freeze({
  startDate: '2026-08-13',
  endDate: '2026-09-09',
  comparisonStartDate: '2026-07-16',
  comparisonEndDate: '2026-08-12',
});

export type SeoRecoveryBrick10Experiment = {
  slug: string;
  page: string;
  baseline: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  title: string;
  metaDescription: string;
  rationale: string;
};

export const SEO_RECOVERY_BRICK10_EXPERIMENTS = Object.freeze([
  {
    slug: 'satpin-phonics-guide',
    page: '/blog/satpin-phonics-guide',
    baseline: { clicks: 83, impressions: 6907, ctr: 0.012016794556247285, position: 7.910235992471406 },
    title: 'SATPIN Phonics Guide: Sounds, Order, Words & Blending',
    metaDescription:
      'What is SATPIN phonics? Learn the SATPIN order, sounds, words, blending, early sentences and what comes next, with practical examples for parents.',
    rationale:
      'High-impression striking-distance page. The snippet now answers the dominant SATPIN, SATPIN phonics, SATPIN method, order, words and reading query family more directly.',
  },
  {
    slug: 'long-vowel-sounds-for-kids',
    page: '/blog/long-vowel-sounds-for-kids',
    baseline: { clicks: 5, impressions: 695, ctr: 0.007194244604316547, position: 8.784172661870503 },
    title: 'Long Vowel Sounds for Kids: Rules, Patterns & Examples',
    metaDescription:
      'Learn long vowel sounds for kids with clear examples of silent-e, vowel teams and open syllables, plus common mix-ups and what to practise next.',
    rationale:
      'The current page ranks within reach but the snippet leads with pattern order. The test foregrounds the broader parent search language: rules, patterns and examples.',
  },
  {
    slug: 'grammar-conjunctions',
    page: '/blog/grammar-conjunctions',
    baseline: { clicks: 1, impressions: 565, ctr: 0.0017699115044247787, position: 7.453097345132743 },
    title: 'Conjunctions for Kids: And, But, Because & So Examples',
    metaDescription:
      'Teach conjunctions for kids with simple and, but, because and so examples. Learn how each word joins ideas, shows contrast, gives reasons or shows results.',
    rationale:
      'Very low CTR at page-one average position. The test makes the examples explicit in both title and description instead of relying on a generic how-to formulation.',
  },
  {
    slug: 'grammar-subject-verb',
    page: '/blog/grammar-subject-verb',
    baseline: { clicks: 0, impressions: 159, ctr: 0, position: 6.29559748427673 },
    title: 'Subject-Verb Agreement for Kids: Rules, Examples & Mistakes',
    metaDescription:
      'Learn subject-verb agreement for kids with simple rules and examples for he, she, it, they, is/are and has/have, plus common mistakes and easy fixes.',
    rationale:
      'Zero clicks despite a strong average position. The test brings rules and concrete example families into the snippet to better match instructional intent.',
  },
  {
    slug: 'digraphs-and-tricky-words',
    page: '/blog/digraphs-and-tricky-words',
    baseline: { clicks: 1, impressions: 176, ctr: 0.005681818181818182, position: 7.170454545454546 },
    title: 'Digraphs and Tricky Words for Kids: Examples & Reading Tips',
    metaDescription:
      'Learn digraphs and tricky words with sh, ch and ng examples. See what children can decode, what needs extra attention and how to avoid whole-word guessing.',
    rationale:
      'Low CTR at a page-one average position. The test adds child/parent language and concrete digraph examples while preserving the page’s decode-vs-remember distinction.',
  },
] satisfies readonly SeoRecoveryBrick10Experiment[]);

const experimentBySlug = new Map(SEO_RECOVERY_BRICK10_EXPERIMENTS.map((experiment) => [experiment.slug, experiment]));

export function applySeoRecoveryBrick10CtrExperiment(post: BlogPost): BlogPost {
  const experiment = experimentBySlug.get(post.slug);
  if (!experiment) return post;

  return {
    ...post,
    title: experiment.title,
    metaDescription: experiment.metaDescription,
  };
}
