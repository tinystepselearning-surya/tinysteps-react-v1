import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import {
  CLASS_SAMPLE_CATEGORIES,
  CLASS_SAMPLE_CATEGORY_LABELS,
  isValidYouTubeVideoId,
  toClassSampleItem,
  type ClassSampleCategory,
  type ClassSampleItem,
} from '../lib/classSamples';
import { createFAQPageSchema } from '../lib/schemas';
import AutoLinkedText from '../components/seo/AutoLinkedText';
import LazySection from '../components/common/LazySection';

const TestimonialsSection = lazy(() => import('../components/seo/TestimonialsSection'));
const TestimonialSubmissionForm = lazy(() => import('../components/seo/TestimonialSubmissionForm'));

type FilterCategory = 'all' | ClassSampleCategory;

const CANONICAL_URL = 'https://tinystepslearning.com/class-samples';
const WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%E2%80%99d%20like%20to%20know%20more%20about%20your%20real%20class%20samples%20and%20programs%20for%20my%20child.';

const FILTERS: Array<{ value: FilterCategory; label: string }> = [
  { value: 'all', label: 'All' },
  ...CLASS_SAMPLE_CATEGORIES.map((category) => ({
    value: category,
    label: CLASS_SAMPLE_CATEGORY_LABELS[category],
  })),
];
const faqItems = [
  {
    question: 'What can parents see on the class samples page?',
    answer:
      'Parents can understand how Tiny Steps online classes are structured, how teachers guide children, and what kind of phonics, reading, grammar, sentence formation, or public speaking practice may happen.',
  },
  {
    question: 'Are Tiny Steps classes live or recorded?',
    answer:
      'Tiny Steps classes are live teacher-guided online classes. Class samples or learning examples are used to help parents understand the teaching style.',
  },
  {
    question: 'Will my child only watch the teacher?',
    answer:
      'No. Tiny Steps focuses on child participation. Children are encouraged to read, speak, answer, practise, and try again with teacher support.',
  },
  {
    question: 'How does the teacher correct mistakes?',
    answer:
      'Teachers guide children gently during the activity, helping them correct reading, sentence, grammar, or speaking mistakes without pressure.',
  },
  {
    question: 'Should I watch samples before booking?',
    answer:
      'Samples can help parents understand the teaching approach, but the best next step is a free assessment because every child starts at a different level.',
  },
];
const faqSchema = {
  ...createFAQPageSchema(faqItems),
  '@id': 'https://tinystepslearning.com/class-samples#faq',
};
const parentObservationItems = [
  'The teacher guides the child step by step.',
  'The child gets chances to read, speak, answer, and try again.',
  'Corrections are given gently during the activity.',
  'Activities are matched to the child’s age and level.',
  'Parents can understand what skill is being practised.',
];

const sampleLearningMoments = [
  {
    title: 'Phonics',
    description: 'Child practises sounds and blending.',
  },
  {
    title: 'Reading',
    description: 'Child reads words, sentences, or short passages.',
  },
  {
    title: 'Grammar',
    description: 'Child builds and corrects sentences.',
  },
  {
    title: 'Public Speaking',
    description: 'Child answers prompts, describes pictures, or tells a short story.',
  },
];

const classExpectations = [
  {
    step: '01',
    title: 'Quick warm-up or revision',
    description: 'Classes begin with a short recap to settle the child and activate earlier learning.',
  },
  {
    step: '02',
    title: 'Skill-based teaching activity',
    description: 'The teacher introduces one focused concept clearly and keeps the child engaged in the task.',
  },
  {
    step: '03',
    title: 'Guided child practice',
    description: 'Children respond actively while the teacher supports each attempt in real time.',
  },
  {
    step: '04',
    title: 'Correction and encouragement',
    description: 'Mistakes are corrected gently and children are encouraged to keep trying without pressure.',
  },
  {
    step: '05',
    title: 'Parent-friendly next step',
    description: 'Families get a simple next-step or practice suggestion after class or milestone progress.',
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Class Samples', item: CANONICAL_URL },
  ],
};

const collectionPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Real Tiny Steps class sample videos',
  url: CANONICAL_URL,
  description:
    'Watch real Tiny Steps phonics, reading, grammar, communication, and confidence-building class moments before enrolling in our online English classes for kids.',
  about: [
    'online phonics classes',
    'English classes for kids',
    'real class samples',
    'what Tiny Steps classes look like',
  ],
  isPartOf: {
    '@type': 'WebSite',
    name: 'Tiny Steps Learning',
    url: 'https://tinystepslearning.com/',
  },
};

function getYoutubeEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
}

function VideoSurface({ video, priority = false }: { video: ClassSampleItem; priority?: boolean }) {
  const canEmbed = isValidYouTubeVideoId(video.youtubeVideoId);
  const [isActivated, setIsActivated] = useState(false);
  const thumbnailUrl = canEmbed
    ? `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`
    : '';

  return (
    <div className="relative aspect-video overflow-hidden rounded-[24px] bg-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.16)]">
      {canEmbed && isActivated ? (
        <iframe
          src={getYoutubeEmbedUrl(video.youtubeVideoId)}
          title={`${video.title} | Tiny Steps class sample`}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full border-0"
        />
      ) : canEmbed ? (
        <button
          type="button"
          onClick={() => setIsActivated(true)}
          className="group relative h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          aria-label={`Play class sample: ${video.title}`}
        >
          <img
            src={thumbnailUrl}
            alt={`${video.title} video thumbnail`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),_rgba(15,23,42,0.5))]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <span className="rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85">
              Click to play
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              YouTube sample
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/92 text-slate-950 shadow-[0_12px_32px_rgba(15,23,42,0.28)] transition group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current" aria-hidden="true">
                <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.68L9.54 5.98A1 1 0 008 6.82z" />
              </svg>
            </span>
          </div>
        </button>
      ) : (
        <div className="flex h-full w-full flex-col justify-between bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(125,211,252,0.18),_transparent_36%),linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
              Class Sample
            </span>
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
              Video Pending
            </span>
          </div>
          <div className="space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current text-white" aria-hidden="true">
                <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.68L9.54 5.98A1 1 0 008 6.82z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold">This video panel is ready for the linked YouTube class clip</p>
              <p className="mt-1 max-w-md text-sm leading-6 text-white/70">
                The layout stays polished while the final Tiny Steps class sample is being published.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-[30px] border border-white/90 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="aspect-video animate-pulse rounded-[24px] bg-slate-200" />
          <div className="mt-4 flex gap-2">
            <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function ClassSamplesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [videos, setVideos] = useState<ClassSampleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClassSamples() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [{ collection, getDocs, limit, query, where }, { db }] = await Promise.all([
          import('firebase/firestore'),
          import('../lib/firebaseConfig'),
        ]);

        const ref = query(
          collection(db, 'classSamples'),
          where('active', '==', true),
          limit(200),
        );
        const snap = await getDocs(ref);
        const nextVideos = snap.docs.map((entry) => toClassSampleItem(entry.id, entry.data()));
        if (!cancelled) setVideos(nextVideos);
      } catch (error) {
        console.error('[ClassSamplesPage] failed to load class samples', error);
        if (!cancelled) {
          setVideos([]);
          setLoadError('Our real class sample library is being prepared and will be available shortly.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadClassSamples();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeVideos = useMemo(
    () =>
      videos
        .filter((video) => video.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [videos],
  );

  const featuredVideo = useMemo(
    () => activeVideos.find((video) => video.featured) ?? activeVideos[0] ?? null,
    [activeVideos],
  );

  const filteredVideos = useMemo(() => {
    if (activeFilter === 'all') return activeVideos;
    return activeVideos.filter((video) => video.category === activeFilter);
  }, [activeFilter, activeVideos]);

  const galleryUsedHrefs = useMemo(() => new Set<string>(), []);
  const parentNoticeUsedHrefs = useMemo(() => new Set<string>(), []);
  const classExpectationsUsedHrefs = useMemo(() => new Set<string>(), []);

  const itemListSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Tiny Steps real class samples',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: activeVideos.length,
      itemListElement: activeVideos.map((video, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${CANONICAL_URL}#${video.id}`,
        name: video.title,
        description: video.description,
      })),
    }),
    [activeVideos],
  );

  return (
    <main className="min-h-screen bg-[#fcfcfb] text-slate-900">
      <Meta
        title="Tiny Steps Class Samples | See Online English Classes for Kids"
        description="See how Tiny Steps online English classes help children practise phonics, reading, grammar, sentence formation, and public speaking through live guided learning."
        keywords="online phonics classes, English classes for kids, real class samples, what Tiny Steps classes look like, online reading classes for kids, grammar classes for children"
        canonical={CANONICAL_URL}
        jsonLd={[breadcrumbSchema, collectionPageSchema, itemListSchema, faqSchema]}
      />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-[-7rem] h-72 w-72 rounded-full bg-amber-100/90 blur-3xl" />
          <div className="absolute right-[-5rem] top-16 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/80 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-10 lg:grid-cols-[minmax(0,1.03fr)_minmax(340px,0.97fr)] lg:px-6 lg:pb-16 lg:pt-14">
          <div className="max-w-2xl self-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Real Class Moments</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-[3.6rem] lg:leading-[1.02]">
              See How Tiny Steps Online Classes Work
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              <AutoLinkedText text="Explore how Tiny Steps teaches phonics, reading, grammar, sentence formation, and public speaking through live, child-friendly online practice." />
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
              <AutoLinkedText text="If you are comparing online phonics classes, reading support, or English classes for kids with visible progress, this page gives you a direct feel for the teaching quality, pace, and child participation Tiny Steps is known for." />
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/book-demo"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                Book Free Assessment
              </Link>
              <Link
                to="/courses"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
              >
                Explore Courses
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 shadow-sm">Live teacher-guided learning</span>
              <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 shadow-sm">Child participation, not passive watching</span>
              <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 shadow-sm">Gentle correction and guided practice</span>
              <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5 shadow-sm">Free assessment before course recommendation</span>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/80 bg-white/82 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur">
            {isLoading ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                    <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
                  </div>
                  <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="aspect-video animate-pulse rounded-[24px] bg-slate-200" />
                <div className="mt-4 flex gap-2">
                  <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
              </>
            ) : featuredVideo ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Featured Sample</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">{featuredVideo.title}</h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    {CLASS_SAMPLE_CATEGORY_LABELS[featuredVideo.category]}
                  </span>
                </div>

                <VideoSurface video={featuredVideo} priority />

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  {featuredVideo.ageBand ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">{featuredVideo.ageBand}</span>
                  ) : null}
                  {featuredVideo.durationLabel ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">{featuredVideo.durationLabel}</span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Real class sample</span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{featuredVideo.description}</p>
              </>
            ) : (
              <div className="flex min-h-[360px] flex-col justify-between rounded-[24px] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(248,250,252,1))] p-6 ring-1 ring-slate-200">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Featured Sample</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    {loadError ? 'Our real class sample library is launching shortly' : 'Real class clips are launching shortly'}
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
                    {loadError
                      ? loadError
                      : 'We are preparing the first set of real Tiny Steps class moments so parents can watch them directly here, without leaving the site.'}
                  </p>
                </div>
                <div className="rounded-[20px] bg-slate-50 p-4 text-sm text-slate-500">
                  Parents will be able to watch the clips right here on the Tiny Steps website through privacy-friendly embedded playback.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 lg:px-6">
        <div className="grid gap-3 rounded-[28px] border border-white/80 bg-white/82 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:grid-cols-2 xl:grid-cols-4">
          {[
            'Real class moments',
            '1:1 teacher attention',
            'Phonics • Grammar • Communication',
            'Progress parents can actually see',
          ].map((item) => (
            <div key={item} className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-2 pt-4 lg:px-6">
        <div className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What parents can observe in our classes</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700 sm:text-base">
            {parentObservationItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Browse By Focus</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Class sample gallery</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              <AutoLinkedText text="Filter by phonics, reading, grammar, communication, or confidence to explore the class moments most relevant to your child." />
            </p>
          </div>
          <div className="text-sm text-slate-500">Start with the learning area you care about most, then explore how Tiny Steps teaching feels in practice.</div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter class sample videos by learning category">
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
                  selected
                    ? 'bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.15)]'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <GallerySkeleton />
        ) : loadError ? (
          <div className="mt-8 rounded-[30px] border border-amber-200 bg-amber-50/70 px-6 py-8 text-sm leading-6 text-slate-700">
            {loadError}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="mt-8 rounded-[30px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm leading-6 text-slate-600">
            {activeVideos.length === 0
              ? 'Our first set of real class sample clips is launching shortly. In the meantime, you can book a free demo or explore the course tracks above.'
              : 'More clips for this focus area are coming shortly. Try another category to explore the available class moments.'}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredVideos.map((video) => (
              <article
                key={video.id}
                id={video.id}
                className={`rounded-[30px] border p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.12)] ${
                  video.featured
                    ? 'border-amber-200/90 bg-[linear-gradient(180deg,_rgba(255,251,235,0.95),_rgba(255,255,255,0.98))]'
                    : 'border-white/90 bg-white'
                }`}
              >
                <VideoSurface video={video} />

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {CLASS_SAMPLE_CATEGORY_LABELS[video.category]}
                  </span>
                  {video.ageBand ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{video.ageBand}</span>
                  ) : null}
                  {video.durationLabel ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{video.durationLabel}</span>
                  ) : null}
                  {video.featured ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Featured</span>
                  ) : null}
                </div>

                <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{video.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600"><AutoLinkedText text={video.description} usedHrefs={galleryUsedHrefs} /></p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 lg:px-6">
        <div className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Sample teaching contexts</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Sample learning moments</h2>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sampleLearningMoments.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600"><AutoLinkedText text={item.description} usedHrefs={parentNoticeUsedHrefs} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-4 lg:px-6">
        <div className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">How classes feel</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">What a Tiny Steps class usually includes</h2>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {classExpectations.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-400">{item.step}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600"><AutoLinkedText text={item.description} usedHrefs={classExpectationsUsedHrefs} /></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <div className="grid gap-6 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="relative min-h-[280px] bg-[linear-gradient(180deg,_rgba(241,245,249,0.7),_rgba(255,255,255,0.95))]">
            <img
              src="/priya-founder-tiny-steps-learning.webp"
              alt="Priya, founder of Tiny Steps Learning"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="px-6 py-8 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Founder Reassurance</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Families should be able to see the teaching before they decide</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              <AutoLinkedText text="These class samples are here because parent trust matters. We want families to hear the pacing, notice the teacher attention, and understand the standard of care we aim for in every Tiny Steps class." />
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              <AutoLinkedText text="Every clip on this page is shared with parent consent, and every sample is chosen to reflect the calm, structured experience we believe children need in live online learning." />
            </p>

            <div className="mt-8 border-t border-slate-200 pt-5">
              <div className="text-lg font-semibold text-slate-900">Priya, Founder</div>
              <p className="mt-1 text-sm text-slate-500">Tiny Steps Learning</p>
            </div>
          </div>
        </div>
      </section>

      <LazySection minHeightClassName="min-h-[280px]">
        <Suspense fallback={null}>
          <TestimonialsSection
            title="What parents noticed in real classes"
            subtitle="Reviews focused on class quality, teacher attention, and child engagement."
            pageTag="class-samples"
            limit={4}
            compact
            viewAllHref="/testimonials"
          />
        </Suspense>
      </LazySection>

      <section className="mx-auto max-w-6xl px-4 pb-6 pt-8 lg:px-6">
        <div className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">{item.question}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LazySection minHeightClassName="min-h-[220px]">
        <Suspense fallback={null}>
          <TestimonialSubmissionForm
            pageTag="class-samples"
            title="Share feedback after watching class samples"
            description="If these samples helped you evaluate class quality, share your experience. Submissions are moderation-first and never auto-published."
            compact
          />
        </Suspense>
      </LazySection>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 lg:px-6">
        <div className="rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(125,211,252,0.2),_transparent_32%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-6 py-10 ring-1 ring-slate-200 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Next Step</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Want to see the right class style for your child?</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              <AutoLinkedText text="Start with a free assessment. Tiny Steps will understand your child’s current level and recommend whether the right starting point is phonics, reading, grammar, sentence formation, or public speaking." />
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/book-demo"
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Book Free Assessment
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
            >
              Talk on WhatsApp
            </a>
          </div>

          <div className="mt-12 w-full max-w-4xl rounded-2xl bg-white/60 p-6 backdrop-blur-md">
            <h3 className="font-semibold text-slate-900">Explore Programs</h3>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
              <Link to="/courses" className="text-slate-600 hover:text-slate-900 transition">All Courses →</Link>
              <Link to="/phonics" className="text-slate-600 hover:text-slate-900 transition">Phonics Classes →</Link>
              <Link to="/grammar" className="text-slate-600 hover:text-slate-900 transition">Grammar Classes →</Link>
              <Link to="/speaking" className="text-slate-600 hover:text-slate-900 transition">Public Speaking →</Link>
              <Link to="/why-tiny-steps" className="text-slate-600 hover:text-slate-900 transition">Why Tiny Steps →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
