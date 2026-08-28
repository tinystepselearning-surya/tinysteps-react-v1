import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { BlogConversionAction, BlogConversionConfig } from '../../content/blog/shared/conversionFamilies';
import {
  buildBlogDemoPath,
  captureBlogCtaContext,
} from '../../lib/blogLeadAttribution';
import {
  trackBlogCtaClick,
  trackBlogCtaImpression,
  trackBlogProgramClick,
} from '../../lib/blogConversionTracking';

type BlogConversionCardProps = {
  slug: string;
  config: BlogConversionConfig;
};

const CTA_POSITION = 'article_end';

export default function BlogConversionCard({ slug, config }: BlogConversionCardProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const impressionTrackedRef = useRef(false);

  const eventBase = useMemo(() => ({
    article_slug: slug,
    conversion_family: config.family,
    intent_cluster: config.intentCluster,
    authority_cluster: config.authorityCluster,
    program: config.program,
    cta_position: CTA_POSITION,
  }), [config, slug]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || impressionTrackedRef.current) return;

    const recordImpression = () => {
      if (impressionTrackedRef.current) return;
      impressionTrackedRef.current = true;
      trackBlogCtaImpression(eventBase);
    };

    if (typeof IntersectionObserver === 'undefined') {
      recordImpression();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          recordImpression();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [eventBase]);

  const resolveDestination = (action: BlogConversionAction) => (
    action.kind === 'demo'
      ? buildBlogDemoPath({ slug, family: config.family, ctaPosition: CTA_POSITION })
      : action.to
  );

  const handleClick = (action: BlogConversionAction) => {
    const destinationPath = resolveDestination(action);
    captureBlogCtaContext({
      slug,
      family: config.family,
      intentCluster: config.intentCluster,
      ctaLabel: action.label,
      ctaPosition: CTA_POSITION,
      destinationPath,
    });
    const event = {
      ...eventBase,
      cta_label: action.label,
      destination_path: destinationPath,
    };
    trackBlogCtaClick(event);
    if (action.kind === 'program' || action.kind === 'schools') {
      trackBlogProgramClick(event);
    }
  };

  const renderAction = (action: BlogConversionAction, primary: boolean) => (
    <Link
      key={`${action.kind}-${action.to}`}
      to={resolveDestination(action)}
      onClick={() => handleClick(action)}
      className={
        primary
          ? 'inline-flex max-w-full items-center justify-center rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          : 'inline-flex max-w-full items-center justify-center rounded-full border border-white/25 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
      }
    >
      {action.label}
    </Link>
  );

  return (
    <section
      ref={rootRef}
      data-blog-conversion-family={config.family}
      className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#101828,#1b2a46)] px-6 py-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:px-8"
      aria-labelledby={`blog-conversion-${slug}`}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">{config.eyebrow}</p>
          <h2 id={`blog-conversion-${slug}`} className="mt-3 text-3xl font-black tracking-tight">
            {config.heading}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">{config.description}</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          {renderAction(config.primaryAction, true)}
          {config.secondaryAction ? renderAction(config.secondaryAction, false) : null}
        </div>
      </div>
    </section>
  );
}
