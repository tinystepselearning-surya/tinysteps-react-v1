import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../common/PageHero';
import { getSubjectLandingData, type SubjectLandingId } from '../../content/publicSubjectLandings';
import { applySeo } from '../../lib/seo';
import ClusterSeoNav from '../programs/ClusterSeoNav';

type SubjectLandingPageProps = {
  subject: SubjectLandingId;
};

const sectionShell =
  'mx-auto max-w-6xl rounded-[32px] border border-white/70 bg-white/90 px-6 py-8 shadow-sm backdrop-blur sm:px-8 sm:py-10';
const cardShell = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm';
const ctaClass =
  'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition';

export default function SubjectLandingPage({ subject }: SubjectLandingPageProps) {
  const data = useMemo(() => getSubjectLandingData(subject), [subject]);
  const isPhonicsLanding = subject === 'phonics';
  const effectiveTitle = isPhonicsLanding
    ? 'Synthetic Phonics & Jolly-Style Support Guide for Parents | Tiny Steps Learning'
    : data.seoTitle;
  const effectiveDescription = isPhonicsLanding
    ? 'Support guide for parents comparing synthetic phonics, Jolly-style support, SATPIN progression, and advanced decoding pathways. For core phonics classes for kids, visit the primary Tiny Steps phonics page.'
    : data.seoDescription;
  const effectiveCanonicalPath = isPhonicsLanding ? '/phonics' : data.route;
  const effectiveHeroTitle = isPhonicsLanding ? 'Synthetic Phonics & Jolly-Style Support Guide' : data.heroTitle;
  const [openPhonicsFaqIndexes, setOpenPhonicsFaqIndexes] = useState<number[]>([0]);
  const answerBlock = useMemo(() => {
    if (subject === 'phonics') {
      return {
        title: 'Systematic synthetic phonics for every stage',
        body:
          'Tiny Steps supports parents searching for phonics, Jolly-style phonics, synthetic phonics, and advanced phonics. Our pathway starts with SATPIN and extends to digraphs, long vowels, bossy-r, and multisyllabic decoding in live online classes.',
        intent:
          'Parent intent: phonics classes for kids • synthetic phonics • SATPIN • Jolly-style phonics support • advanced phonics online.',
      };
    }

    if (subject === 'grammar') {
      return {
        title: 'Grammar and writing support that matches real parent questions',
        body:
          'Tiny Steps supports parents searching for grammar classes, writing classes, sentence structure help, punctuation practice, and paragraph writing support for kids. The pathway moves from grammar basics to clearer, more confident writing.',
        intent:
          'Parent intent: grammar classes for kids • grammar and writing classes • sentence structure • punctuation • paragraph writing support.',
      };
    }

    return {
      title: 'Public speaking, communication, and speaking confidence in one pathway',
      body:
        'Tiny Steps supports parents searching for public speaking classes, communication classes, communication skills, storytelling, and presentation confidence for kids. The pathway moves from clear speaking habits to structured talks and confident delivery.',
      intent:
        'Parent intent: public speaking classes for kids • communication classes • communication confidence • storytelling • presentation skills.',
    };
  }, [subject]);

  const phonicsFaq = useMemo(
    () =>
      isPhonicsLanding
        ? [
            {
              question: 'Do you teach Jolly Phonics or synthetic phonics?',
              answer:
                'Tiny Steps follows systematic synthetic phonics. We teach SATPIN-first progression and also use multisensory actions and routines familiar to parents who know Jolly Phonics.',
            },
            {
              question: 'What if my child already did Jolly Phonics at school?',
              answer:
                'That is fine. We place your child by skill level, then continue with blending, digraphs, long vowels, and reading fluency so there are no gaps.',
            },
            {
              question: 'Do you cover advanced phonics online?',
              answer:
                'Yes. Advanced phonics covers alternate vowel spellings, diphthongs, bossy-r, multisyllabic decoding, spelling patterns, and reading fluency.',
            },
            {
              question: 'Is this systematic or “systemic” phonics?',
              answer:
                'Parents often mean systematic phonics. Tiny Steps uses a clear lesson sequence, weekly practice goals, and stage-based progression instead of random worksheets.',
            },
          ]
        : [],
    [isPhonicsLanding],
  );
  const allPhonicsFaqOpen = openPhonicsFaqIndexes.length === phonicsFaq.length;

  const togglePhonicsFaq = (index: number) => {
    setOpenPhonicsFaqIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    );
  };

  const expandAllPhonicsFaq = () => setOpenPhonicsFaqIndexes(phonicsFaq.map((_, index) => index));
  const collapseAllPhonicsFaq = () => setOpenPhonicsFaqIndexes([]);

  const activeSectionShell = isPhonicsLanding
    ? 'mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 px-6 py-8 shadow-sm sm:px-8 sm:py-10'
    : sectionShell;

  const breadcrumbSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `https://tinystepslearning.com${data.route}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: data.breadcrumbName,
          item: `https://tinystepslearning.com${effectiveCanonicalPath}`,
        },
      ],
    }),
    [data.breadcrumbName, data.route, effectiveCanonicalPath],
  );

  const courseListSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `https://tinystepslearning.com${data.route}#tracks`,
      name: `${data.heroTitle} tracks`,
      itemListElement: data.tracks.map((track, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Course',
          name: track.name,
          description: `${track.lessonCount} lessons for ${track.age.toLowerCase()}. ${track.overview.join(', ')}.`,
          provider: {
            '@type': 'Organization',
            name: 'Tiny Steps Learning',
            url: 'https://tinystepslearning.com',
          },
        },
      })),
    }),
    [data.heroTitle, data.route, data.tracks],
  );

  useEffect(() => {
    const jsonLdBlocks: object[] = [breadcrumbSchema, courseListSchema];
    if (phonicsFaq.length) {
      jsonLdBlocks.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: phonicsFaq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      });
    }

    applySeo({
      title: effectiveTitle,
      description: effectiveDescription,
      canonicalPath: effectiveCanonicalPath,
      ogType: 'website',
      jsonLd: jsonLdBlocks,
    });
  }, [
    breadcrumbSchema,
    courseListSchema,
    effectiveCanonicalPath,
    effectiveDescription,
    effectiveTitle,
    phonicsFaq,
  ]);

  return (
    <div className="space-y-6 pb-16">
      <PageHero
        eyebrow={data.eyebrow}
        title={effectiveHeroTitle}
        description={data.heroDescription}
        badges={data.heroBadges}
        actions={(
          <Link to="/?book=1" className={`${ctaClass} ${data.palette.accentButton} ${data.palette.accentButtonHover}`}>
            Book Free Assessment
          </Link>
        )}
      />

      <section className="px-6">
        <div className={activeSectionShell}>
          <div className={`max-w-4xl rounded-3xl border p-5 ${data.palette.accentBorder} ${data.palette.accentSurface}`}>
            <h2 className="text-2xl font-bold text-slate-900">{answerBlock.title}</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">{answerBlock.body}</p>
            <p className="mt-3 text-sm font-medium text-slate-600">{answerBlock.intent}</p>
            {isPhonicsLanding ? (
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Core authority page:{' '}
                <Link to="/phonics" className="text-slate-900 underline decoration-sky-400 underline-offset-2 hover:text-sky-700">
                  phonics classes for kids
                </Link>
              </p>
            ) : null}
          </div>

          <div className="max-w-3xl">
            <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${data.palette.accentText}`}>
              Who It Is For
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Choose the track that matches your child&apos;s stage
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{data.whoIntro}</p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {data.tracks.map((track) => (
              <article key={track.slug} className={`${cardShell} ${data.palette.accentSurface}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${data.palette.accentBorder} ${data.palette.accentText}`}>
                    {track.level}
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                    {track.age}
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                    {track.lessonCount} lessons
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-slate-900">{track.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{track.overview.slice(0, 2).join(', ')}.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {phonicsFaq.length ? (
        <section className="px-6">
          <div className={activeSectionShell}>
            <div className="max-w-3xl">
              <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${data.palette.accentText}`}>Parent FAQs</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Common questions on Jolly, synthetic, and advanced phonics
              </h2>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={expandAllPhonicsFaq}
                disabled={allPhonicsFaqOpen}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAllPhonicsFaq}
                disabled={!openPhonicsFaqIndexes.length}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Collapse all
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {phonicsFaq.map((item, index) => {
                const isOpen = openPhonicsFaqIndexes.includes(index);
                return (
                  <article key={item.question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => togglePhonicsFaq(index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base font-semibold text-slate-900">{item.question}</span>
                      <span className={`text-xl font-bold text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                        +
                      </span>
                    </button>
                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden px-5 pb-5 text-slate-700">
                        {item.answer}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-6">
        <div className={activeSectionShell}>
          <div className="max-w-3xl">
            <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${data.palette.accentText}`}>
              What Your Child Will Learn
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              The focus areas stay tied to the real course data
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{data.learnIntro}</p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {data.tracks.map((track) => (
              <article key={track.slug} className={cardShell}>
                <h3 className="text-xl font-bold text-slate-900">{track.name}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {track.overview.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${data.palette.accentSurface} ${data.palette.accentBorder} border`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6">
        <div className={activeSectionShell}>
          <div className="max-w-3xl">
            <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${data.palette.accentText}`}>
              Curriculum Path
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Every track follows a named learning journey
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Stage titles and lesson ranges below are pulled from the canonical curriculum structure already used in the app.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {data.tracks.map((track) => (
              <article key={track.slug} className={cardShell}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{track.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {track.age} • {track.lessonCount} lessons
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${data.palette.accentBorder} ${data.palette.accentText}`}>
                    {track.stages.length} stages
                  </span>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {track.stages.map((stage) => (
                    <div key={`${track.slug}-${stage.title}`} className={`rounded-3xl border p-4 ${data.palette.accentSurface} ${data.palette.accentBorder}`}>
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${data.palette.accentText}`}>
                        {stage.lessonRange}
                      </p>
                      <h4 className="mt-2 text-lg font-semibold text-slate-900">{stage.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{stage.focus}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6">
        <div className={activeSectionShell}>
          <div className="max-w-3xl">
            <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${data.palette.accentText}`}>
              Outcomes Parents Can Expect
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Published outcomes, not page-local promises
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{data.outcomesIntro}</p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {data.tracks.map((track) => (
              <article key={track.slug} className={cardShell}>
                <h3 className="text-xl font-bold text-slate-900">{track.name}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {track.outcomes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${data.palette.accentSurface} ${data.palette.accentBorder} border`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6">
        <div className={activeSectionShell}>
          <div className="max-w-3xl">
            <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${data.palette.accentText}`}>
              Why Tiny Steps
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              A clear teaching approach for parents to evaluate
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{data.approachIntro}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {data.approachPoints.map((item) => (
              <div key={item} className={`${cardShell} ${data.palette.accentSurface}`}>
                <p className="text-base leading-7 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6">
        <div className={`${activeSectionShell} text-center`}>
          <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${data.palette.accentText}`}>Next Step</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{data.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">{data.ctaDescription}</p>
          <div className="mt-8">
            <Link to="/?book=1" className={`${ctaClass} ${data.palette.accentButton} ${data.palette.accentButtonHover}`}>
              Book Free Assessment
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <ClusterSeoNav cluster={subject} />
      </div>
    </div>
  );
}
