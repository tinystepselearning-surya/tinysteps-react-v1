import React from 'react';
import { Link } from 'react-router-dom';

const CLUSTERS = {
  phonics: {
    hubTitle: 'Explore Phonics',
    hubHref: '/phonics',
    intro: 'If you are comparing phonics support, use the guide that matches the decision you are making rather than reading every article.',
    links: [
      { label: 'How to Choose a Phonics Class', href: '/blog/how-to-choose-phonics-classes' },
      { label: 'Online Phonics Classes vs School', href: '/blog/online-phonics-classes-vs-school' },
      { label: 'Are Phonics Apps Enough?', href: '/blog/are-phonics-apps-enough-for-kids' },
      { label: 'Phonics Assessment Checklist', href: '/blog/phonics-diagnostics' },
      { label: 'Why Parents Choose Online Phonics', href: '/blog/why-parents-choose-online-phonics' },
    ],
  },
  grammar: {
    hubTitle: 'Explore Grammar',
    hubHref: '/grammar',
    intro: 'Choose the grammar resource that best matches the skill your child is working on now.',
    links: [
      { label: 'Grammar Learning Path', href: '/grammar' },
      { label: 'Writing Classes for Kids', href: '/writing-classes-for-kids' },
      { label: 'English Grammar & Writing', href: '/grammar' },
    ],
  },
  speaking: {
    hubTitle: 'Explore Speaking',
    hubHref: '/speaking',
    intro: 'Choose the speaking resource that best matches the confidence or communication need you are seeing now.',
    links: [
      { label: 'Helping a Shy Child Speak', href: '/shy-child-speaking-confidence' },
      { label: 'Structuring a Speech', href: '/blog/week-13-speaking-structure' },
      { label: 'Confidence Building Programs', href: '/confidence-building-program-kids' },
    ],
  },
};

export default function ClusterSeoNav({ cluster }: { cluster: 'phonics' | 'grammar' | 'speaking' }) {
  const data = CLUSTERS[cluster];
  if (!data) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-8">
        <h2 className="mb-2 text-xl font-bold text-slate-900">{data.hubTitle}</h2>
        <p className="mx-auto mb-5 max-w-2xl text-sm leading-6 text-slate-600">{data.intro}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to={data.hubHref}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {data.hubTitle} Hub
          </Link>
          {data.links.map((link) => (
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
