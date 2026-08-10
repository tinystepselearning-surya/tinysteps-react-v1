export const GSC_CRAWLED_NOT_INDEXED_AUDIT_DATE = '2026-08-09';

export const GSC_CRAWLED_NOT_INDEXED_URLS = [
  { path: '/sitemap-blog.xml', action: 'resource', indexTarget: false, note: 'XML discovery resource; keep available to Google but do not treat as a search-result landing page.' },
  { path: '/sitemap.xml', action: 'resource', indexTarget: false, note: 'Sitemap index resource; indexing the XML itself is not a goal.' },
  { path: '/sitemap-static.xml', action: 'resource', indexTarget: false, note: 'XML discovery resource; indexing the XML itself is not a goal.' },
  { path: '/blog/june-school-reopening-english-readiness-plan', action: 'index', indexTarget: true, note: 'Keep: substantial parent guide with a 14-day readiness plan, skills checklist, internal paths, and FAQs.' },
  { path: '/sitemap-courses.xml', action: 'resource', indexTarget: false, note: 'XML discovery resource; indexing the XML itself is not a goal.' },
  { path: '/faq', action: 'index', indexTarget: true, note: 'Keep: broad parent FAQ hub with distinct search intent and strong internal navigation.' },
  { path: '/blog/week-27-prevent-summer-slide-reading', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; weekly-calendar intent is weaker than evergreen acquisition pages.' },
  { path: '/courses/basic-public-speaking', action: 'redirect', indexTarget: false, target: '/courses/public-speaking-foundations', note: 'Legacy course slug; consolidate all signals to the canonical public speaking foundation page.' },
  { path: '/blog/week-4-phonics-long-vowels', action: 'noindex-archive', indexTarget: false, note: 'Archive only: overlaps the stronger evergreen /blog/long-vowel-sounds-for-kids guide.' },
  { path: '/parents/choosing-course', action: 'index', indexTarget: true, note: 'Keep: high-intent parent decision page with assessment-first decision ladder, comparisons, FAQ, and internal links.' },
  { path: '/parents/speech-confidence', action: 'index', indexTarget: true, note: 'Keep and strengthen: unique parent intent around low-pressure speaking confidence.' },
  { path: '/blog/week-18-speaking-video-feedback', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; not a primary evergreen acquisition page.' },
  { path: '/blog/online-phonics-classes-vs-school', action: 'index', indexTarget: true, note: 'Keep: clear comparison intent with practical school/online coordination examples and related reading.' },
  { path: '/parents/common-mistakes', action: 'index', indexTarget: true, note: 'Keep: distinct parent-help intent with practical replacements, warning signs, and reset plan.' },
  { path: '/blog/long-vowel-sounds-for-kids', action: 'index', indexTarget: true, note: 'Keep as evergreen canonical for long-vowel parent search intent.' },
  { path: '/blog/week-10-grammar-subject-verb', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; weekly-calendar framing is weaker than evergreen grammar pages.' },
  { path: '/careers', action: 'index', indexTarget: true, note: 'Keep: distinct hiring intent with role details, requirements, process, FAQs, and application paths.' },
  { path: '/blog/r-controlled-vowels-explained', action: 'index', indexTarget: true, note: 'Keep: evergreen rule explainer with pattern groups, practice order, examples, FAQs, and related reads.' },
  { path: '/blog/cvc-words-explained-for-parents', action: 'index', indexTarget: true, note: 'Keep: evergreen decoding milestone guide with home plan, examples, FAQs, and cluster links.' },
  { path: '/blog/online-english-classes-for-kids-india', action: 'index', indexTarget: true, note: 'Keep: India-specific informational/commercial intent that supports course discovery.' },
  { path: '/book-demo', action: 'index', indexTarget: true, note: 'Keep: lead-critical assessment page with service details, outcomes, FAQs, structured data, and form.' },
  { path: '/parents/reading-at-home', action: 'index', indexTarget: true, note: 'Keep: substantial parent routine page with stage plan, troubleshooting, scripts, checklist, and HowTo markup.' },
  { path: '/blog/rss.xml', action: 'resource', indexTarget: false, note: 'RSS feed resource. Keep crawlable, explicitly noindex via X-Robots-Tag.' },
  { path: '/blog/how-phonics-classes-help-kids-read', action: 'index', indexTarget: true, note: 'Keep: evergreen informational intent and a useful bridge to the phonics program.' },
  { path: '/writing-classes-for-kids', action: 'index', indexTarget: true, note: 'Keep and strengthen: distinct writing-support intent rather than a duplicate of the grammar hub.' },
  { path: '/phonics-games-for-preschoolers', action: 'index', indexTarget: true, note: 'Keep: substantial no-print activity guide with seven games, HowTo routine, FAQs, and internal links.' },
  { path: '/rss.xml', action: 'resource', indexTarget: false, note: 'RSS feed resource. Keep crawlable, explicitly noindex via X-Robots-Tag.' },
  { path: '/blog/child-reads-in-class-but-forgets-at-home', action: 'index', indexTarget: true, note: 'Keep: specific parent pain-point intent with clear diagnostic/support value.' },
  { path: '/blog/week-22-phonics-diagnostics', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; diagnosis intent is better served by evergreen parent and phonics pages.' },
  { path: '/blog/digraphs-and-tricky-words', action: 'index', indexTarget: true, note: 'Keep: evergreen phonics topic with pattern guidance, examples, FAQs, and related reading.' },
  { path: '/courses/advanced-grammar', action: 'redirect', indexTarget: false, target: '/courses/grammar-mastery', note: 'Legacy course slug; consolidate signals to grammar mastery.' },
  { path: '/blog/week-12-speaking-confidence-seeds', action: 'index', indexTarget: true, note: 'Keep: one of the intentionally promoted weekly guides because its topic maps to durable speaking-confidence intent.' },
  { path: '/blog/week-16-phonics-summer-plan', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; seasonal weekly framing is not a primary canonical target.' },
  { path: '/parents/getting-started', action: 'index', indexTarget: true, note: 'Keep: substantial onboarding/assessment guide with HowTo markup, preparation, first-week plan, and parent scripts.' },
  { path: '/blog/week-8-grammar-tenses', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; weekly-calendar framing is weaker than durable grammar resources.' },
  { path: '/blog/week-21-speaking-competition-prep', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; narrow weekly campaign intent is not a primary canonical target.' },
  { path: '/blog/week-19-phonics-multisyllabic', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; topic can support course pages without competing as a weekly canonical.' },
  { path: '/blog/week-9-grammar-conjunctions', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; weekly-calendar framing is weaker than evergreen grammar resources.' },
  { path: '/main/courses/phonics/', action: 'redirect', indexTarget: false, target: '/courses/phonics-foundation', note: 'Legacy /main shell URL; server-side permanent redirect already consolidates to canonical course page.' },
  { path: '/blog/week-24-speaking-family-showcase', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; event-like weekly intent is not a durable acquisition target.' },
  { path: '/blog/week-15-speaking-debate-starters', action: 'noindex-archive', indexTarget: false, note: 'Keep accessible as archive/support content; weekly campaign framing is weaker than evergreen speaking pages.' },
  { path: '/courses/phonics-advanced', action: 'index', indexTarget: true, note: 'Keep: lead-critical canonical course page with course-specific metadata, outcomes, curriculum, reviews, FAQs, and Course schema.' },
  { path: '/courses/', action: 'redirect', indexTarget: false, target: '/courses', normalization: 'trailingSlash', note: 'Trailing-slash duplicate; Firebase trailingSlash:false normalizes to the canonical /courses URL.' },
  { path: '/parents/tracking-progress', action: 'index', indexTarget: true, note: 'Keep and strengthen: unique parent intent around measuring real learning progress and next-step decisions.' },
  { path: '/blog/week1', action: 'redirect', indexTarget: false, target: '/blog/week-1-phonics-satpin-launch', note: 'Legacy blog alias; permanent redirect consolidates to the canonical Week 1 guide.' },
  { path: '/courses/grammar-mastery', action: 'index', indexTarget: true, note: 'Keep: lead-critical canonical advanced grammar/writing page with course-specific content, curriculum, reviews, FAQs, and Course schema.' },
  { path: '/courses/phonics', action: 'redirect', indexTarget: false, target: '/courses/phonics-foundation', note: 'Legacy/ambiguous course slug; permanent redirect consolidates to the canonical foundation course.' },
  { path: '/blog/', action: 'redirect', indexTarget: false, target: '/blog', normalization: 'trailingSlash', note: 'Trailing-slash duplicate; Firebase trailingSlash:false normalizes to the canonical /blog URL.' },
  { path: '/main/book-demo', action: 'redirect', indexTarget: false, target: '/book-demo', note: 'Legacy /main shell URL; permanent redirect consolidates to the canonical assessment page.' },
  { path: '/privacy', action: 'redirect', indexTarget: false, target: '/privacy-policy', note: 'Legacy legal alias; permanent redirect consolidates to the canonical privacy policy.' },
  { path: '/terms', action: 'redirect', indexTarget: false, target: '/terms-and-conditions', note: 'Legacy legal alias; permanent redirect consolidates to the canonical terms page.' },
  { path: '/resources/', action: 'redirect', indexTarget: false, target: '/blog', note: 'Legacy resources alias; permanent redirect consolidates to the canonical content hub.' },
];

export const GSC_CRAWLED_NOT_INDEXED_COUNTS = GSC_CRAWLED_NOT_INDEXED_URLS.reduce((acc, row) => {
  acc[row.action] = (acc[row.action] || 0) + 1;
  return acc;
}, {});

export const GSC_INDEX_TARGETS = GSC_CRAWLED_NOT_INDEXED_URLS
  .filter((row) => row.indexTarget)
  .map((row) => row.path);
