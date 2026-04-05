import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applySeo, getRouteConfig } from '../lib/seo';
import { createCourseSchema } from '../lib/schemas';
import PageHero from '../components/common/PageHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';
import ProgramFacts from '../components/programs/ProgramFacts';
import ProgramProof from '../components/programs/ProgramProof';
import ParentReassurance from '../components/programs/ParentReassurance';
import NextStepsLinks from '../components/programs/NextStepsLinks';
import {
  formatINR,
  GROUP_MONTHLY_FEES,
  ONE_TO_ONE_MONTHLY_PACKAGES,
  PER_CLASS_PRICE,
  ULTRA_PREMIUM_PRICING,
} from '../config/pricing';

const levels = [
  {
    name: 'Foundations',
    outcomes: [
      'Letter sounds + SATPIN blending routines',
      'Short vowels + early CVC words',
      'Lesson-by-lesson practice prompts',
    ],
    pdf: '/curriculum'
  },
  {
    name: 'Early Phonics',
    outcomes: [
      'Digraphs, vowel teams, silent-e',
      'Magic E + long vowel patterns',
      'Stage check-ins for fluency',
    ],
    pdf: '/curriculum'
  },
  {
    name: 'Advanced Phonics',
    outcomes: [
      'Diphthongs, bossy R, alternate vowels',
      'Multisyllabic decoding + spelling rules',
      'Fluency + comprehension practice',
    ],
    pdf: '/curriculum'
  }
];

const stages = [
  { title: 'Stage 1 • Sounds to words', duration: 'Lessons 1–10', description: 'SATPIN, blending club, AI-driven home practice.' },
  { title: 'Stage 2 • Rules & teams', duration: 'Lessons 11–24', description: 'Digraphs, magic-e, vowel teams, tricky patterns.' },
  { title: 'Stage 3 • Fluency & writing', duration: 'Lessons 25–36+', description: 'Reading passages with expression, spelling, and short paragraphs.' }
];

const oneToOnePricingCopy = `Tiny Steps Pricing: Standard Program (classes with expert Indian teachers): Starter (${ONE_TO_ONE_MONTHLY_PACKAGES[0].classes} classes) ${formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[0].monthlyFee)}/month, Growth (${ONE_TO_ONE_MONTHLY_PACKAGES[1].classes} classes) ${formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[1].monthlyFee)}/month, Intensive (${ONE_TO_ONE_MONTHLY_PACKAGES[2].classes} classes) ${formatINR(ONE_TO_ONE_MONTHLY_PACKAGES[2].monthlyFee)}/month, ${formatINR(PER_CLASS_PRICE)} per class. Ultra Premium Program (classes with native English-speaking teachers): 1:1 Personal Class ${formatINR(ULTRA_PREMIUM_PRICING[0].perClass)} per class or ${formatINR(ULTRA_PREMIUM_PRICING[0].package12)} for 12 classes.`;

const groupPricingCopy = GROUP_MONTHLY_FEES.filter((row) => row.ratio !== '1:1')
  .map((row) => {
    const ultraRow = ULTRA_PREMIUM_PRICING.find((item) => item.ratio === row.ratio);
    const ultraCopy = ultraRow
      ? `${formatINR(ultraRow.package12)} for 12 classes / child`
      : 'Available on request';
    return `${row.ratio} ${formatINR(row.monthlyFee)} (Standard) / ${ultraCopy} (Ultra Premium)`;
  })
  .join(', ');

const faqItems = [
  {
    question: 'What age should a child start phonics?',
    answer:
      'Most children can begin phonics at ages 3-4 with playful, guided sound work. In live classes, many children start blending first words within 4-6 lessons when practice is consistent.',
  },
  {
    question: 'Are online phonics classes effective for kids?',
    answer:
      'Yes. Live online phonics classes are effective when lessons are structured, interactive, and matched to the child’s level. Tiny Steps uses guided blending, decodable reading, and parent updates to keep progress visible.',
  },
  {
    question: 'My child knows letters but cannot read words. Will phonics help?',
    answer:
      'Yes. This usually means the child needs stronger sound-to-word blending, not more alphabet memorization. A systematic phonics pathway helps children move from letter knowledge to accurate reading.',
  },
  {
    question: 'How much do phonics classes cost in India?',
    answer:
      `${oneToOnePricingCopy} Group options are also available: ${groupPricingCopy}. Choose the plan based on your child’s support needs and learning pace, not only price.`,
  },
];
const PHONICS_RESEARCH_GUIDE_PATH = '/blog/phonics-for-parents-guide';
const PHONICS_SEO_KEYWORDS = [
  'phonics for kids',
  'phonics for parents',
  'what is phonics',
  'why phonics is important',
  'how to teach phonics at home',
  'online phonics classes for kids',
  'phonics classes in India',
  'SATPIN phonics',
];

type PhonicsSeoOverrides = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  breadcrumbName?: string;
};

type PhonicsPageProps = {
  seoOverrides?: PhonicsSeoOverrides;
  heroTitleOverride?: string;
  heroSubtitleOverride?: string;
  introCopy?: string;
  afterHeroContent?: React.ReactNode;
  afterContent?: React.ReactNode;
  extraJsonLd?: object[];
};

export default function PhonicsPage({
  seoOverrides,
  heroTitleOverride,
  heroSubtitleOverride,
  introCopy,
  afterHeroContent,
  afterContent,
  extraJsonLd,
}: PhonicsPageProps) {
  const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0]);
  const canonicalPath = seoOverrides?.canonicalPath ?? "/phonics";
  const registry = getRouteConfig(canonicalPath);
  const title = seoOverrides?.title ?? registry?.title ?? "Online Phonics Classes for Kids | Tiny Steps Learning";
  const description =
    seoOverrides?.description ??
    registry?.description ??
    "Live online phonics classes for kids with SATPIN blending, decodable reading, and stage-based parent updates.";
  const breadcrumbName = seoOverrides?.breadcrumbName ?? "Phonics";
  const canonicalUrl = `https://tinystepslearning.com${canonicalPath}`;
  const heroTitle = heroTitleOverride ?? "Phonics Classes for Kids";
  const heroSubtitle = heroSubtitleOverride ?? "Multi-sensory phonics taught live with stage-based parent updates. Most children blend their first words within 4-6 lessons.";
  const aeoCopy =
    introCopy ??
    'Online phonics classes for kids at Tiny Steps help ages 3-12 build sound awareness, blending, and accurate early reading through live guided teaching. Most children begin blending first words within 4-6 lessons and then progress to fluent decodable reading with stage-based parent updates.';
  const allFaqOpen = openFaqIndexes.length === faqItems.length;

  const toggleFaq = (index: number) => {
    setOpenFaqIndexes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    );
  };

  const expandAllFaq = () => setOpenFaqIndexes(faqItems.map((_, index) => index));
  const collapseAllFaq = () => setOpenFaqIndexes([]);

  useEffect(() => {
    const baseJsonLd = [
      createCourseSchema({
        name: "Online Phonics Classes for Kids",
        description: "Systematic, multi-sensory phonics taught live with stage-based parent insights. SATPIN to advanced decoding in a lesson-by-lesson path.",
        url: canonicalUrl,
        courseMode: 'online',
        ageRange: 'Ages 3-12',
        educationalLevel: 'Beginner to Advanced'
      }),
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tinystepslearning.com/" },
          { "@type": "ListItem", "position": 2, "name": breadcrumbName, "item": canonicalUrl }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map((item) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      }
    ];

    applySeo({
      title,
      description,
      keywords: PHONICS_SEO_KEYWORDS,
      canonicalPath,
      ogType: "website",
      jsonLd: extraJsonLd?.length ? [...baseJsonLd, ...extraJsonLd] : baseJsonLd,
    });
  }, [title, description, canonicalPath, breadcrumbName, canonicalUrl, extraJsonLd]);

  return (
    <div>
      <PageHero
        eyebrow="Tiny Steps Phonics"
        title={heroTitle}
        description={heroSubtitle}
        badges={['Ages 3–12', 'Live 1:1 or pods', '35-minute classes']}
        actions={(
          <Link
            to="/?book=1"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Free Assessment
          </Link>
        )}
      />

      {/* Answer Block for AEO */}
      <div className="max-w-4xl mx-auto my-8 rounded-2xl border border-sky-100 bg-gradient-to-r from-slate-50 to-sky-50 p-6 shadow-sm">
        <p className="text-lg font-semibold text-gray-900">
          {aeoCopy}
        </p>
        <p className="mt-3 text-sm text-gray-700">
          Looking for <Link to="/phonics" className="text-slate-900 underline hover:text-sky-700">phonics classes for kids</Link>? Start here.
        </p>
      </div>

      {/* Program Facts */}
      <ProgramFacts
        ageRange="Ages 3-12"
        format="Live 1:1 or small group online"
        duration="35-minute classes, 2-3x per week"
        structure="3 levels, 36+ lessons with stage-based progression"
        outcomes={[
          'Master letter sounds and blending—typically within 4-6 lessons',
          'Read CVC words and simple sentences with confidence',
          'Build fluency with digraphs, vowel teams, and tricky words',
          'Progress from individual sounds to reading full passages with comprehension',
        ]}
      />

      {afterHeroContent}
      <LevelTabs levels={levels} />
      <LearningJourney stages={stages} />

      {/* Program Proof */}
      <ProgramProof
        metrics={[
          { value: '4-6', label: 'Lessons to blend first words' },
          { value: '30-40', label: 'Lessons to master basic phonics' },
          { value: 'Stage-based', label: 'Clear progress reports every 12 lessons' },
          { value: 'Live 1:1 or group', label: 'Personalized pace and feedback' },
        ]}
      />

      {/* Buyer Guide Section */}
      <section className="max-w-4xl mx-auto my-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 px-6 py-12 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Choosing the best online phonics classes in India</h2>
        <p className="text-gray-700 mb-4">
          Evaluating online phonics programs can be overwhelming. Our comprehensive buyer guide helps parents compare options using a 10-point checklist covering curriculum quality, teacher credentials, class formats (1:1 vs group), trial policies, and pricing transparency.
        </p>
        <p className="text-gray-700 mb-6">
          Whether you're looking for your first phonics program or switching from another provider, this guide includes FAQs from Indian parents and practical tips for making an informed decision.
        </p>
        <p className="text-gray-700 mb-6">
          For focused discovery, parents also explore{' '}
          <Link to="/reading-classes-for-kids" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            reading classes for kids
          </Link>
          ,{' '}
          <Link to="/reading-fluency-program" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            reading fluency program
          </Link>
          , and{' '}
          <Link to="/phonics-fees-india" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            phonics fees in India
          </Link>
          . For preschool readiness, some families also review{' '}
          <Link to="/english-classes-for-4-year-old" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            English classes for 4 year old
          </Link>{' '}
          options, while school-age families can compare{' '}
          <Link to="/english-classes-for-6-year-old" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            English classes for 6 year old
          </Link>{' '}
          and{' '}
          <Link to="/english-classes-for-7-10-year-old" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            English classes for 7 to 10 year old
          </Link>{' '}
          pathways, and if decoding is still inconsistent, they use our{' '}
          <Link to="/child-not-reading-properly" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
            child not reading properly
          </Link>{' '}
          guide.
        </p>
        <Link 
          to="/best-online-phonics-classes-india"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
        >
          Read the buyer guide: Best Online Phonics Programs in India
          <span className="text-lg">→</span>
        </Link>
      </section>

      <section className="max-w-4xl mx-auto my-8 rounded-2xl border border-amber-200/80 bg-[linear-gradient(135deg,#fff8ed_0%,#ffffff_48%,#eef7ff_100%)] px-6 py-12 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-700">For parents doing their research</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">What phonics is, why it matters, and how to teach it at home</h2>
        <p className="mt-4 text-gray-700">
          If you are still figuring out what phonics actually means, why some children struggle to blend,
          or how to support reading without pressure, start with our research guide written for parents.
        </p>
        <p className="mt-3 text-gray-700">
          It covers what phonics is, why it is important, how multilingual homes can approach it, and a
          simple 10-minute routine you can use at home.
        </p>
        <Link
          to={PHONICS_RESEARCH_GUIDE_PATH}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-900 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
        >
          Read the phonics research guide
          <span className="text-lg">→</span>
        </Link>
      </section>

      {afterContent}

      {/* Next Steps Links */}
      <NextStepsLinks
        title="Explore Tiny Steps Phonics"
        links={[
          { 
            label: 'Full Curriculum', 
            href: '/curriculum', 
            description: 'See all lesson topics across 3 levels',
            icon: '📚'
          },
          { 
            label: 'Pricing Options', 
            href: '/pricing', 
            description: '1:1 and small group packages',
            icon: '💰'
          },
          { 
            label: 'Why Tiny Steps', 
            href: '/why-tiny-steps', 
            description: 'Our approach and teaching philosophy',
            icon: '⭐'
          },
          { 
            label: 'Phonics Buyer Guide', 
            href: '/best-online-phonics-classes-india', 
            description: 'Compare programs and make an informed choice',
            icon: '🔍'
          },
          { 
            label: 'Phonics Research Guide', 
            href: PHONICS_RESEARCH_GUIDE_PATH, 
            description: 'What phonics is, why it matters, and how to teach it at home',
            icon: '🧠'
          },
          { 
            label: 'Getting Started Guide', 
            href: '/parents/getting-started', 
            description: 'How to prepare for your first assessment',
            icon: '🎓'
          },
          { 
            label: 'Daily Phonics Practice', 
            href: '/parents/phonics-mission', 
            description: '5-minute home practice routine',
            icon: '📝'
          },
          { 
            label: 'Reading at Home Tips', 
            href: '/parents/reading-at-home', 
            description: '10-minute guided reading routine',
            icon: '📖'
          },
          {
            label: 'Reading Fluency Program',
            href: '/reading-fluency-program',
            description: 'Move from slow decoding to smoother reading flow',
            icon: '🚀'
          },
          {
            label: 'Phonics Fees in India',
            href: '/phonics-fees-india',
            description: 'Compare fee-to-outcome fit before enrollment',
            icon: '₹'
          },
        ]}
      />

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAllFaq}
              disabled={allFaqOpen}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Expand all
            </button>
            <button
              type="button"
              onClick={collapseAllFaq}
              disabled={!openFaqIndexes.length}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndexes.includes(index);
            const isCostItem = item.question === 'How much do phonics classes cost in India?';
            return (
              <article key={item.question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
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
                    {isCostItem ? (
                      <>
                        {oneToOnePricingCopy} For detailed pricing comparisons and what to look for when evaluating value, see our{' '}
                        <Link to="/best-online-phonics-classes-india" className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
                          buyer guide for choosing online phonics programs in India
                        </Link>.
                      </>
                    ) : (
                      item.answer
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Parent Reassurance */}
      <ParentReassurance programName="our phonics program" />

      {/* Book Assessment CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#1f2a44] to-[#263e6d] p-8 text-center text-white">
          <p className="mb-4 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-emerald-100">
            TRUSTED BY PARENTS
          </p>
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Start Your Phonics Journey?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-100">
            Book a free 35-minute assessment session with our mentors to understand your child's current level and get a personalized phonics learning plan.
          </p>
          <Link
            to="/?book=1"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Book Free Assessment
          </Link>
        </div>
      </section>
    </div>
  );
}
