import { LEGACY_WEEK_BLOG_PATH_REDIRECTS } from '../src/lib/blogWeekRenames.js';

export const RETIRED_BLOG_PATH_REDIRECTS = Object.freeze({
  '/blog/child-knows-letter-sounds-but-cannot-read': '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  '/blog/can-child-master-english-in-10-days': '/blog/can-child-improve-english-in-10-days',
  '/blog/why-child-answers-only-in-one-word': '/blog/child-gives-one-word-answers',
  '/blog/child-reads-words-but-does-not-understand-story': '/blog/why-child-reads-words-but-does-not-understand-story',
  '/blog/june-school-readiness-english-revision-plan': '/blog/june-school-reopening-english-readiness-plan',
  '/blog/how-long-does-it-take-child-to-learn-phonics': '/blog/how-long-does-phonics-take',
  '/blog/best-online-phonics-classes-for-kids': '/blog/how-to-choose-phonics-classes',
  '/blog/best-phonics-classes-for-kids': '/blog/how-to-choose-phonics-classes',
  '/blog/phonics-grammar-speaking-connected-english-communication': '/blog/how-phonics-grammar-and-communication-work-together',
  '/blog/engage-children-phonics-grammar-speaking-at-home': '/blog/how-to-engage-kids-in-english-learning-at-home',
  '/blog/best-age-to-start-phonics-classes-for-kids': '/blog/what-age-to-start-phonics',
  '/blog/how-tiny-steps-builds-reading-confidence': '/blog/how-phonics-builds-reading-confidence',
  ...LEGACY_WEEK_BLOG_PATH_REDIRECTS,
});

export const RETIRED_BLOG_SLUG_REDIRECTS = Object.freeze(
  Object.fromEntries(
    Object.entries(RETIRED_BLOG_PATH_REDIRECTS).map(([source, destination]) => [
      source.replace('/blog/', ''),
      destination.replace('/blog/', ''),
    ]),
  ),
);

export function rewriteRetiredBlogPaths(value) {
  let output = String(value ?? '');
  for (const [source, destination] of Object.entries(RETIRED_BLOG_PATH_REDIRECTS)) {
    output = output.split(source).join(destination);
  }
  return output;
}
