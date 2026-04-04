import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { applySeo } from '../lib/seo';

const sections = [
  {
    title: 'Start Here',
    links: [
      { to: '/', label: 'Home' },
      { to: '/courses', label: 'Courses' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/book-demo', label: 'Book Free Assessment' },
      { to: '/contact', label: 'Contact' },
      { to: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Core Programs',
    links: [
      { to: '/phonics', label: 'Online Phonics Classes' },
      { to: '/online-phonics-reading-classes', label: 'Online Phonics and Reading Classes' },
      { to: '/phonics-classes-for-kids', label: 'Phonics Classes for Kids' },
      { to: '/grammar', label: 'Online Grammar and Writing Classes' },
      { to: '/english-grammar-writing-classes', label: 'Grammar Writing Classes' },
      { to: '/speaking', label: 'Online Spoken English and Public Speaking Classes' },
      { to: '/public-speaking-communication-kids', label: 'Public Speaking Communication Classes' },
      { to: '/summer-camps', label: 'Summer Camps' },
    ],
  },
  {
    title: 'Parent Resources',
    links: [
      { to: '/parents', label: 'Parents Hub' },
      { to: '/parents/getting-started', label: 'Getting Started' },
      { to: '/parents/choosing-course', label: 'Choosing the Right Course' },
      { to: '/parents/reading-at-home', label: 'Reading at Home' },
      { to: '/parents/speech-confidence', label: 'Speech Confidence' },
      { to: '/parents/common-mistakes', label: 'Common Learning Mistakes' },
    ],
  },
  {
    title: 'Decision Pages',
    links: [
      { to: '/best-online-phonics-classes-india', label: 'Best Online Phonics Classes in India' },
      { to: '/phonics-apps-for-preschoolers-india', label: 'Phonics Apps for Preschoolers in India' },
      { to: '/phonics-games-for-preschoolers', label: 'Phonics Games for Preschoolers' },
      { to: '/phonics-learning-games', label: 'Phonics Learning Games' },
      { to: '/class-samples', label: 'Real Class Samples' },
      { to: '/for-schools', label: 'For Schools' },
    ],
  },
  {
    title: 'Site Feeds',
    external: true,
    links: [
      { to: 'https://tinystepslearning.com/sitemap.xml', label: 'XML Sitemap Index' },
      { to: 'https://tinystepslearning.com/sitemap-static.xml', label: 'Static Pages Sitemap' },
      { to: 'https://tinystepslearning.com/sitemap-blog.xml', label: 'Blog Sitemap' },
      { to: 'https://tinystepslearning.com/sitemap-courses.xml', label: 'Courses Sitemap' },
      { to: 'https://tinystepslearning.com/sitemap-parents.xml', label: 'Parents Sitemap' },
      { to: 'https://tinystepslearning.com/llms.txt', label: 'LLMs.txt' },
      { to: 'https://tinystepslearning.com/robots.txt', label: 'Robots.txt' },
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
  name: 'Tiny Steps public sitemap',
  itemListElement: sections.flatMap((section, sectionIndex) =>
    section.links.map((link, linkIndex) => ({
      '@type': 'ListItem',
      position: sectionIndex * 10 + linkIndex + 1,
      name: link.label,
      url: link.to,
    })),
  ),
};

export default function SitemapPage() {
  useEffect(() => {
    applySeo({
      title: 'Sitemap | Tiny Steps Learning',
      description:
        'Browse the public Tiny Steps sitemap, including phonics, grammar, spoken English, parent resources, blog content, and crawl feeds.',
      canonicalPath: '/sitemap',
      ogType: 'website',
      jsonLd: [breadcrumbSchema, itemListSchema],
    });
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf2_0%,#f8fbff_45%,#ffffff_100%)] px-6 py-12 text-slate-900">
      <Meta
        title="Sitemap | Tiny Steps Learning"
        description="Browse the public Tiny Steps sitemap, including phonics, grammar, spoken English, parent resources, blog content, and crawl feeds."
        canonical="https://tinystepslearning.com/sitemap"
        jsonLd={[breadcrumbSchema, itemListSchema]}
      />

      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#2d5016]">Public Sitemap</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Tiny Steps public pages, programs, and crawl feeds
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            This page gives parents and search systems a clean view of the main public Tiny Steps pages. For
            search engines and answer engines, the XML sitemap index, `robots.txt`, and `llms.txt` are linked
            below as well.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"
            >
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                {section.links.map((link) => (
                  <li key={link.to}>
                    {section.external ? (
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#2d5016] underline-offset-4 hover:underline"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="font-medium text-[#2d5016] underline-offset-4 hover:underline">
                        {link.label}
                      </Link>
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
