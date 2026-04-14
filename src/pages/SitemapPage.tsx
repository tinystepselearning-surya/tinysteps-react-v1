import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { applySeo } from '../lib/seo';

const SITE_ORIGIN = 'https://tinystepslearning.com';
const toAbsoluteUrl = (to: string) => (to.startsWith('http') ? to : `${SITE_ORIGIN}${to}`);

const sections = [
  {
    title: 'Programs',
    blurb: 'Start with the core learning tracks and class formats.',
    links: [
      {
        to: '/phonics',
        label: 'Online Phonics Classes',
        description: '1:1 phonics for early readers with blending and decoding support.',
      },
      {
        to: '/grammar',
        label: 'Online Grammar and Writing Classes',
        description: 'Sentence building, grammar accuracy, and guided writing practice.',
      },
      {
        to: '/speaking',
        label: 'Online Spoken English and Public Speaking Classes',
        description: 'Confidence, speaking structure, and presentation-ready communication.',
      },
      {
        to: '/reading-classes-for-kids',
        label: 'Reading Classes for Kids',
        description: 'Reading fluency and comprehension support for primary-stage learners.',
      },
      {
        to: '/online-phonics-reading-classes',
        label: 'Online Phonics and Reading Classes',
        description: 'Early literacy track focused on sound-to-reading progression.',
      },
    ],
  },
  {
    title: 'Age Pages',
    blurb: 'Find age-specific entry pages before choosing a full program.',
    links: [
      {
        to: '/english-classes-for-4-year-old',
        label: 'English Classes for 4-Year-Old',
        description: 'Play-based listening, sounds, and first speaking routines.',
      },
      {
        to: '/english-classes-for-5-year-old',
        label: 'English Classes for 5-Year-Old',
        description: 'Early reading readiness with structured phonics and confidence building.',
      },
      {
        to: '/english-classes-for-6-year-old',
        label: 'English Classes for 6-Year-Old',
        description: 'Transition support from beginner decoding to sentence reading.',
      },
      {
        to: '/english-classes-for-7-10-year-old',
        label: 'English Classes for 7-10-Year-Old',
        description: 'Reading, grammar, and speaking outcomes for school-age children.',
      },
    ],
  },
  {
    title: 'Parent Guides',
    blurb: 'Use these guides to choose, start, and support classes at home.',
    links: [
      {
        to: '/parents',
        label: 'Parents Hub',
        description: 'Main hub for onboarding, progress, and parent help resources.',
      },
      {
        to: '/parents/getting-started',
        label: 'Getting Started',
        description: 'First-step guide for assessments, class flow, and parent expectations.',
      },
      {
        to: '/parents/choosing-course',
        label: 'Choosing the Right Course',
        description: 'Simple framework to pick phonics, grammar, or speaking tracks.',
      },
      {
        to: '/parents/reading-at-home',
        label: 'Reading at Home',
        description: 'Practical routines to support fluency and reading consistency.',
      },
      {
        to: '/parents/speech-confidence',
        label: 'Speech Confidence',
        description: 'Parent strategies for shy speakers and low-confidence communication.',
      },
    ],
  },
  {
    title: 'Summer',
    blurb: 'Seasonal pages for camp planning and track-level summer options.',
    links: [
      {
        to: '/summer-camps',
        label: 'Summer Camps',
        description: 'Main summer season page with active tracks and batch windows.',
      },
      {
        to: '/summer-camp-for-kids-india',
        label: 'Summer Camp for Kids India',
        description: 'Parent planning guide to choose the right online summer camp path.',
      },
      {
        to: '/summer-reading-program-kids',
        label: 'Summer Reading Program for Kids',
        description: 'Reading-focused summer support for fluency and comprehension readiness.',
      },
      {
        to: '/summer-speaking-camp-kids',
        label: 'Summer Speaking Camp for Kids',
        description: 'Communication-focused summer track for spoken confidence.',
      },
    ],
  },
  {
    title: 'Trust Pages',
    blurb: 'Use these pages to validate delivery quality, outcomes, and policies.',
    links: [
      {
        to: '/class-samples',
        label: 'Real Class Samples',
        description: 'Watch real lesson moments before you book an assessment.',
      },
      {
        to: '/testimonials',
        label: 'Parent Reviews',
        description: 'Read moderation-approved feedback from Tiny Steps families.',
      },
      {
        to: '/pricing',
        label: 'Pricing',
        description: 'See current plans, package options, and billing clarity.',
      },
      {
        to: '/faq',
        label: 'FAQ',
        description: 'Direct answers on classes, scheduling, pricing, and progress.',
      },
      {
        to: '/team',
        label: 'Team',
        description: 'Meet the educators and leadership behind the program.',
      },
    ],
  },
  {
    title: 'Technical Feeds',
    blurb: 'Machine-readable files used by search engines and crawlers.',
    external: true,
    links: [
      {
        to: 'https://tinystepslearning.com/sitemap.xml',
        label: 'XML Sitemap Index',
        description: 'Top-level sitemap index for all public sitemap files.',
      },
      {
        to: 'https://tinystepslearning.com/sitemap-static.xml',
        label: 'Static Pages Sitemap',
        description: 'Static marketing and policy page URLs.',
      },
      {
        to: 'https://tinystepslearning.com/sitemap-blog.xml',
        label: 'Blog Sitemap',
        description: 'Published article URLs from the Tiny Steps blog.',
      },
      {
        to: 'https://tinystepslearning.com/sitemap-courses.xml',
        label: 'Courses Sitemap',
        description: 'Program and course landing page URLs.',
      },
      {
        to: 'https://tinystepslearning.com/sitemap-parents.xml',
        label: 'Parents Sitemap',
        description: 'Parents Hub and parent guide URLs.',
      },
      {
        to: 'https://tinystepslearning.com/robots.txt',
        label: 'Robots.txt',
        description: 'Crawler directives and sitemap declarations.',
      },
      {
        to: 'https://tinystepslearning.com/llms.txt',
        label: 'LLMs.txt',
        description: 'AI-agent guidance for public content access.',
      },
    ],
  },
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Sitemap', item: 'https://tinystepslearning.com/sitemap' },
  ],
};

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Tiny Steps HTML sitemap',
  itemListElement: sections.flatMap((section, sectionIndex) =>
    section.links.map((link, linkIndex) => ({
      '@type': 'ListItem',
      position: sectionIndex * 10 + linkIndex + 1,
      name: link.label,
      url: toAbsoluteUrl(link.to),
    })),
  ),
};

export default function SitemapPage() {
  useEffect(() => {
    applySeo({
      title: 'HTML Sitemap for Parents | Tiny Steps Learning',
      description:
        'Utility HTML sitemap for navigating Tiny Steps pages quickly. This page is noindex,follow while keeping core internal links available for crawl discovery.',
      canonicalPath: '/sitemap',
      robots: 'noindex, follow',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, itemListSchema],
    });
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf2_0%,#f8fbff_45%,#ffffff_100%)] px-6 py-12 text-slate-900">
      <Meta
        title="HTML Sitemap for Parents | Tiny Steps Learning"
        description="Utility HTML sitemap for navigating Tiny Steps pages quickly. This page is noindex,follow while keeping core internal links available for crawl discovery."
        canonical="https://tinystepslearning.com/sitemap"
        robots="noindex, follow"
        jsonLd={[breadcrumbSchema, itemListSchema]}
      />

      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2d5016]">Public Sitemap</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Tiny Steps HTML sitemap for parents
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Use this page as a quick directory to find the right Tiny Steps destination. It is designed for easy
            human navigation and internal link discovery, not as a ranking landing page.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
            >
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.blurb}</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {section.links.map((link) => (
                  <li key={link.to}>
                    {section.external ? (
                      <>
                        <a
                          href={link.to}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#2d5016] underline-offset-4 hover:underline"
                        >
                          {link.label}
                        </a>
                        <p className="mt-1 text-slate-600">{link.description}</p>
                      </>
                    ) : (
                      <>
                        <Link to={link.to} className="font-medium text-[#2d5016] underline-offset-4 hover:underline">
                          {link.label}
                        </Link>
                        <p className="mt-1 text-slate-600">{link.description}</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
