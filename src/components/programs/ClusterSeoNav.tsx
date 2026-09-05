import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './phonicsBuyerPremium.css';

const CLUSTERS = {
  phonics: {
    hubTitle: 'Explore Phonics',
    hubHref: '/phonics',
    intro: 'If you are comparing phonics support, use the guide that matches the decision you are making rather than reading every article.',
    links: [
      { label: 'How to Choose a Phonics Class', href: '/blog/how-to-choose-phonics-classes' },
      { label: 'Online Phonics Classes vs School', href: '/blog/online-phonics-classes-vs-school' },
      { label: 'Are Phonics Apps Enough?', href: '/blog/are-phonics-apps-enough-for-kids' },
      { label: 'How Long Does Phonics Take?', href: '/blog/how-long-does-phonics-take' },
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
      { label: 'Structuring a Speech', href: '/blog/speaking-structure' },
      { label: 'Confidence Building Programs', href: '/confidence-building-program-kids' },
    ],
  },
};

const BUYER_GUIDE_PATH = '/best-online-phonics-classes-for-kids-in-india';

type ClusterSeoNavProps = {
  cluster: 'phonics' | 'grammar' | 'speaking';
  compact?: boolean;
};

export default function ClusterSeoNav({ cluster, compact = false }: ClusterSeoNavProps) {
  const data = CLUSTERS[cluster];
  const location = useLocation();
  const sectionRef = useRef<HTMLElement>(null);
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const isPremiumPhonicsBuyer = cluster === 'phonics' && normalizedPath === BUYER_GUIDE_PATH;

  useEffect(() => {
    if (!isPremiumPhonicsBuyer || typeof window === 'undefined') return undefined;

    document.body.classList.add('ts-phonics-buyer-premium');

    const pageNav = document.querySelector<HTMLElement>('nav[aria-label="On this page"]');
    const pageNavWrapper = pageNav?.parentElement as HTMLElement | null;
    const finalDecisionSection = sectionRef.current?.previousElementSibling as HTMLElement | null;
    const backToTop = Array.from(document.querySelectorAll<HTMLElement>('button, a')).find((element) =>
      element.textContent?.toLowerCase().includes('back to top'),
    );
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (pageNavWrapper) {
      pageNavWrapper.classList.add('ts-premium-page-nav');
      pageNavWrapper.style.transition = reduceMotion ? 'none' : 'opacity 240ms ease, transform 240ms ease';
    }

    if (backToTop) {
      backToTop.classList.add('ts-premium-back-to-top');
      backToTop.style.transition = reduceMotion ? 'none' : 'opacity 220ms ease, transform 220ms ease';
    }

    let ticking = false;
    const updateFloatingUi = () => {
      ticking = false;

      if (pageNavWrapper && finalDecisionSection) {
        const finalDecisionHasReachedGuide = finalDecisionSection.getBoundingClientRect().top <= 176;
        pageNavWrapper.style.opacity = finalDecisionHasReachedGuide ? '0' : '1';
        pageNavWrapper.style.transform = finalDecisionHasReachedGuide ? 'translateY(-110%)' : 'translateY(0)';
        pageNavWrapper.style.pointerEvents = finalDecisionHasReachedGuide ? 'none' : '';
      }

      if (backToTop) {
        const shouldShowBackToTop = window.scrollY >= 1100;
        backToTop.style.opacity = shouldShowBackToTop ? '0.88' : '0';
        backToTop.style.transform = shouldShowBackToTop ? 'translateY(0)' : 'translateY(10px)';
        backToTop.style.pointerEvents = shouldShowBackToTop ? '' : 'none';
      }
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateFloatingUi);
    };

    updateFloatingUi();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      document.body.classList.remove('ts-phonics-buyer-premium');
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);

      if (pageNavWrapper) {
        pageNavWrapper.classList.remove('ts-premium-page-nav');
        pageNavWrapper.style.opacity = '';
        pageNavWrapper.style.transform = '';
        pageNavWrapper.style.pointerEvents = '';
        pageNavWrapper.style.transition = '';
      }

      if (backToTop) {
        backToTop.classList.remove('ts-premium-back-to-top');
        backToTop.style.opacity = '';
        backToTop.style.transform = '';
        backToTop.style.pointerEvents = '';
        backToTop.style.transition = '';
      }
    };
  }, [isPremiumPhonicsBuyer]);

  if (!data) return null;

  if (compact) {
    return (
      <section ref={sectionRef} className="mx-auto max-w-6xl px-4 py-5">
        <nav
          aria-label={`${data.hubTitle} resources`}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-200 pt-5 text-sm"
        >
          <span className="font-bold text-slate-950">{data.hubTitle}:</span>
          <Link to={data.hubHref} className="font-semibold text-sky-700 hover:text-sky-900">
            Hub
          </Link>
          {data.links.map((link) => (
            <Link key={link.href} to={link.href} className="text-slate-600 hover:text-sky-800">
              {link.label}
            </Link>
          ))}
        </nav>
      </section>
    );
  }

  if (isPremiumPhonicsBuyer) {
    return (
      <section ref={sectionRef} className="mx-auto max-w-6xl px-4 pb-16 pt-6 text-center sm:px-5 lg:px-6">
        <div className="group relative overflow-hidden rounded-[30px] border border-[#FF9A3D] bg-[linear-gradient(135deg,#FFF8F1_0%,#FFFFFF_46%,#FFF4E8_100%)] px-6 py-9 shadow-[0_20px_52px_rgba(255,106,0,0.13)] sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-[#FF6A00]/24 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-52 w-52 rounded-full bg-[#FFB347]/22 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#FFB347_0%,#FF8800_45%,#FF6A00_100%)]" aria-hidden="true" />

          <div className="relative">
            <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-950 sm:text-[28px]">{data.hubTitle}</h2>
            <p className="mx-auto mb-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{data.intro}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to={data.hubHref}
                className="inline-flex min-h-[44px] items-center rounded-full bg-[linear-gradient(135deg,#FF8800_0%,#FF6A00_100%)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(255,106,0,0.26)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_32px_rgba(255,106,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8800] focus-visible:ring-offset-2"
              >
                {data.hubTitle} Hub
              </Link>
              {data.links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[#FFC27D] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.04)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:border-[#FF8800] hover:bg-[#FFF8F1] hover:text-[#D94A00] hover:shadow-[0_11px_26px_rgba(255,106,0,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9A3D] focus-visible:ring-offset-2"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="mx-auto max-w-4xl px-4 py-16 text-center">
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
