import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  PHONICS_PUBLISHED_RESOURCE_PAGES,
  type PhonicsPublishedResourcePage,
} from '../../lib/phonicsPublicationRegistry.js';
import {
  PHONICS_RESOURCE_DISCOVERY_CLUSTERS,
  PHONICS_RESOURCE_DISCOVERY_REVISION,
} from '../../lib/phonicsResourceDiscoveryGraph.js';

export const PHONICS_PILOT_RESOURCE_LINKS = Object.freeze(
  PHONICS_PUBLISHED_RESOURCE_PAGES.map((page) => Object.freeze({
    title: page.cardTitle,
    description: page.concept.quickAnswer,
    to: page.path,
    label: `Open ${page.cardTitle}`,
  })),
);

const GuideCard: FC<{ page: PhonicsPublishedResourcePage }> = ({ page }) => (
  <Link
    to={page.path}
    data-resource-discovery-path={page.path}
    data-resource-publication-wave={page.publicationWave}
    className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_32px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-black tracking-[-0.01em] text-slate-950 group-hover:text-sky-800">{page.cardTitle}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-slate-600">{page.concept.quickAnswer}</p>
      </div>
      <span aria-hidden="true" className="mt-0.5 text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-600">→</span>
    </div>
  </Link>
);

const PhonicsPilotGuideGrid: FC = () => (
  <section
    aria-labelledby="focused-phonics-guides"
    className="mx-auto mt-10 max-w-7xl rounded-[2rem] border border-slate-200/80 bg-slate-50/70 p-5 shadow-[0_18px_52px_rgba(15,23,42,0.045)] sm:p-7 lg:p-8"
    data-resource-discovery-revision={PHONICS_RESOURCE_DISCOVERY_REVISION}
  >
    <div className="max-w-3xl">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">Focused phonics guides</p>
      <h2 id="focused-phonics-guides" className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">Learn one spelling or sound pattern clearly</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Browse by pattern family, then open the exact guide your child needs. Every published phonics guide remains reachable directly from this hub as the library grows.</p>
    </div>

    <nav aria-label="Browse phonics guide families" className="mt-5 flex flex-wrap gap-2">
      {PHONICS_RESOURCE_DISCOVERY_CLUSTERS.map((cluster) => (
        <a key={cluster.id} href={`#${cluster.anchorId}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-black text-slate-700 transition hover:border-sky-300 hover:text-sky-800">
          {cluster.label} <span className="text-slate-400">({cluster.pages.length})</span>
        </a>
      ))}
    </nav>

    <div className="mt-7 space-y-8">
      {PHONICS_RESOURCE_DISCOVERY_CLUSTERS.map((cluster) => (
        <section key={cluster.id} id={cluster.anchorId} aria-labelledby={`${cluster.anchorId}-title`} data-resource-discovery-cluster={cluster.id} className="scroll-mt-24">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div className="max-w-3xl">
              <h3 id={`${cluster.anchorId}-title`} className="text-base font-black text-slate-900">{cluster.label}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">{cluster.description}</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{cluster.pages.length} guides</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cluster.pages.map((page) => <GuideCard key={page.path} page={page} />)}</div>
        </section>
      ))}
    </div>
  </section>
);

export default PhonicsPilotGuideGrid;
