import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../../lib/seo';
import { ORGANIZATION_ID, PUBLIC_FACTS, SITE_ORIGIN } from '../../lib/schemas';
import AboutAuthor from '../../components/AboutAuthor';
import { ACADEMIC_TEAM_BLOG_AUTHOR } from '../../content/blog/shared/editorialTrust';

const ARTICLE_SLUG = 'what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading';
const ARTICLE_PATH = `/blog/${ARTICLE_SLUG}`;
const BLOG_URL = `${SITE_ORIGIN}/blog`;
const ARTICLE_URL = `${SITE_ORIGIN}${ARTICLE_PATH}`;
const TEAM_URL = `${SITE_ORIGIN}/team`;

const faqItems = [
  {
    question: 'What is Jolly Phonics?',
    answer:
      'Jolly Phonics is a popular synthetic phonics method that teaches children to connect sounds with letters and blend them into words.',
  },
  {
    question: 'Is Jolly Phonics the only way to teach reading?',
    answer:
      'No. It is one widely used approach. What matters most is clear, structured synthetic phonics teaching with consistent blending and decoding practice.',
  },
  {
    question: 'How does Tiny Steps use this approach?',
    answer:
      'Tiny Steps uses a structured synthetic phonics approach inspired by methods such as Jolly Phonics, with level-based progression, live feedback, and parent-visible milestones.',
  },
];

export default function WhatIsJollyPhonicsBestWayPage() {
  useEffect(() => {
    applySeo({
      title: 'What is Jolly Phonics and is it the best way to teach reading? | Tiny Steps',
      description:
        'Understand what Jolly Phonics is, how it compares with other reading approaches, and how Tiny Steps uses a structured synthetic phonics method for confident reading.',
      canonicalPath: ARTICLE_PATH,
      ogType: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL },
            { '@type': 'ListItem', position: 3, name: 'What is Jolly Phonics and is it the best way to teach reading?', item: ARTICLE_URL },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: 'What is Jolly Phonics and is it the best way to teach reading?',
          description:
            'A parent-friendly guide to Jolly Phonics, synthetic phonics, and how Tiny Steps uses a structured phonics approach for reading confidence.',
          articleSection: 'Phonics',
          author: {
            '@type': 'EducationalOrganization',
            '@id': ORGANIZATION_ID,
            name: PUBLIC_FACTS.organizationName,
            url: TEAM_URL,
          },
          publisher: {
            '@id': ORGANIZATION_ID,
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': ARTICLE_URL,
          },
          datePublished: '2026-04-05',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
      ],
    });

    const metaAuthor = document.head.querySelector('meta[name="author"]');
    if (metaAuthor) metaAuthor.setAttribute('content', PUBLIC_FACTS.brandName);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tiny Steps parent guide</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
          What is Jolly Phonics and is it the best way to teach reading?
        </h1>
        <p className="mt-4 text-base text-slate-700">
          If you are comparing reading methods, this guide explains what Jolly Phonics is, what synthetic phonics means, and what actually helps children read confidently.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <Link to="/team" className="font-semibold text-slate-900 underline underline-offset-4 hover:text-primary-700">
            {PUBLIC_FACTS.brandName} · Academic Team
          </Link>
          <span>Published 5 April 2026</span>
        </div>
      </header>

      <section className="mb-8 rounded-2xl border border-sky-100 bg-sky-50 p-6">
        <h2 className="text-xl font-semibold text-slate-900">What is Jolly Phonics?</h2>
        <p className="mt-3 text-slate-700">
          Jolly Phonics is a popular synthetic phonics method that teaches children to read by connecting sounds (phonemes) with letters and blending them into words.
        </p>
        <p className="mt-3 text-slate-700">
          In simple terms, children do not memorize whole words first. They learn how print works, practise blending sounds into words, and then build phonics-based reading confidence.
        </p>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Is it the best way to teach reading?</h2>
        <p className="mt-3 text-slate-700">
          Systematic phonics has strong evidence as an early word-reading approach. Jolly Phonics is one well-known synthetic phonics programme, but it is not the only programme that can teach the underlying alphabetic code clearly and cumulatively.
        </p>
        <p className="mt-3 text-slate-700">
          A useful parent question is therefore not whether one branded method is universally “best”, but whether the teaching is systematic, explicit, well matched to the child’s stage, and connected to real decoding and reading practice.
        </p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-900">Evidence used for this section</p>
          <p className="mt-2">
            See the{' '}
            <a
              href="https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/phonics"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Education Endowment Foundation phonics summary
            </a>{' '}
            and the{' '}
            <a
              href="https://www.nichd.nih.gov/publications/pubs/nrp/findings"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              National Reading Panel findings
            </a>.
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">How Tiny Steps uses this approach</h2>
        <ul className="mt-3 space-y-2 text-slate-700">
          <li>• Tiny Steps uses a structured synthetic phonics approach inspired by methods such as Jolly Phonics.</li>
          <li>• Children learn sound-to-letter mapping, blending sounds into words, and decoding practice in a clear sequence.</li>
          <li>• Parents receive stage-based updates so progress is visible and easy to support at home.</li>
        </ul>
      </section>

      <section className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-semibold text-slate-900">Frequently asked questions</h2>
        <div className="mt-4 space-y-3">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
              <summary className="font-semibold text-slate-900">{item.question}</summary>
              <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <AboutAuthor
        author={ACADEMIC_TEAM_BLOG_AUTHOR}
        evidenceLabel="2 external evidence sources are linked in this article"
        reviewLabel="Published date only; no separate update date is claimed"
      />

      <section className="mt-10 rounded-2xl bg-slate-900 p-7 text-white">
        <h2 className="text-2xl font-bold">Want the right starting point for your child?</h2>
        <p className="mt-3 text-slate-200">
          Book one free 35-minute 1:1 online demo assessment class and we will recommend the right phonics stage based on your child’s current reading level.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/book-demo" className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900">
            Book Free 35-Minute Demo
          </Link>
          <Link to="/phonics" className="inline-flex rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white">
            Explore Phonics Program
          </Link>
        </div>
      </section>
    </div>
  );
}
