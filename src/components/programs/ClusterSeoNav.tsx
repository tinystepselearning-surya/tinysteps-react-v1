import React from 'react';
import { Link } from 'react-router-dom';

const CLUSTERS = {
  phonics: {
    hubTitle: 'Explore Phonics',
    hubHref: '/phonics',
    links: [
      { label: 'Synthetic Phonics vs Traditional', href: '/blog/synthetic-phonics-vs-traditional-reading' },
      { label: 'Why Child is Not Reading Properly', href: '/child-not-reading-properly' },
      { label: 'Phonics Blending Explained', href: '/blog/phonics-blending-activities' }
    ]
  },
  grammar: {
    hubTitle: 'Explore Grammar',
    hubHref: '/grammar',
    links: [
      { label: 'Tenses for Kids', href: '/blog/week-8-grammar-tenses' },
      { label: 'Writing Classes for Kids', href: '/writing-classes-for-kids' },
      { label: 'English Grammar & Writing', href: '/english-grammar-writing-classes' }
    ]
  },
  speaking: {
    hubTitle: 'Explore Speaking',
    hubHref: '/speaking',
    links: [
      { label: 'Helping a Shy Child Speak', href: '/shy-child-speaking-confidence' },
      { label: 'Structuring a Speech', href: '/blog/week-13-speaking-structure' },
      { label: 'Confidence Building Programs', href: '/confidence-building-program-kids' }
    ]
  }
};

export default function ClusterSeoNav({ cluster }: { cluster: 'phonics'|'grammar'|'speaking' }) {
  const data = CLUSTERS[cluster];
  if (!data) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center">
      <div className="rounded-2xl bg-slate-50 px-6 py-8 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-4">{data.hubTitle}</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to={data.hubHref}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {data.hubTitle} Hub
          </Link>
          {data.links.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
