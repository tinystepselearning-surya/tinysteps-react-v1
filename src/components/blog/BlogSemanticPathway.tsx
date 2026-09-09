import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getGrammarWritingSemanticInternalLinksForPath,
  type ResolvedGrammarWritingSemanticLink,
} from '../../lib/grammarWritingSemanticJourneyGraph.js';

type BlogSemanticPathwayProps = {
  slug: string;
};

const RELATION_LABELS: Record<string, string> = {
  hub: 'Explore',
  prerequisite: 'Review first',
  next: 'Next skill',
  related: 'Related guide',
  diagnostic: 'Check this gap',
  practice: 'Practise',
  assessment: 'Assessment',
  programme: 'Programme',
};

export default function BlogSemanticPathway({ slug }: BlogSemanticPathwayProps) {
  const links = useMemo(
    () => getGrammarWritingSemanticInternalLinksForPath(`/blog/${slug}`, {
      limit: 4,
      excludeRelations: ['assessment', 'programme'],
    }),
    [slug],
  );

  if (!links.length) return null;

  return (
    <section
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8"
      aria-labelledby={`semantic-pathway-${slug}`}
      data-semantic-internal-links="true"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Continue the learning path</p>
      <h2 id={`semantic-pathway-${slug}`} className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
        Choose the next useful step
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        These links follow the skill relationship for this topic rather than publication order.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {links.map((link: ResolvedGrammarWritingSemanticLink) => (
          <Link
            key={`${link.relation}-${link.targetTopicId}`}
            to={link.to}
            data-semantic-relation={link.relation}
            data-semantic-target-topic={link.targetTopicId}
            className="group rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
          >
            <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
              {RELATION_LABELS[link.relation] || 'Related'}
            </span>
            <span className="mt-2 block text-sm font-bold leading-6 text-slate-950 group-hover:text-primary-700">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
