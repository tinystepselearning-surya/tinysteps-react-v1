import React, { memo } from 'react';
import { Link } from 'react-router-dom';

const HERO_IMAGE = '/blog/hero-families/Tiny_Steps_Speaking.webp';

const HERO_PROGRAMME_LINK_CLASS =
  'rounded-sm font-semibold text-[#102A43] underline decoration-[#FF7A00] decoration-2 underline-offset-[5px] transition-colors duration-150 hover:bg-[#FFF1E6] hover:text-[#9B4300] hover:decoration-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43]';

function ConversionHero() {
  return (
    <section aria-labelledby="homepage-title" className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)] lg:gap-14 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.16em] text-orange-700 sm:text-sm">
            Tiny Steps Learning <span aria-hidden="true" className="mx-1 text-slate-300">/</span> Ages 3–12
          </p>

          <h1
            id="homepage-title"
            className="max-w-3xl text-[clamp(2.7rem,6vw,5.15rem)] font-bold leading-[1.04] tracking-[-0.055em] text-[#102A43]"
          >
            Online English Classes <span className="text-[#FF7A00]">for Kids.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
            Live, personalised one-to-one online English classes for children aged 3–12. Explore{' '}
            <Link to="/phonics" className={HERO_PROGRAMME_LINK_CLASS}>phonics</Link>,{' '}
            <Link to="/reading-classes-for-kids" className={HERO_PROGRAMME_LINK_CLASS}>reading</Link>,{' '}
            <Link to="/grammar" className={HERO_PROGRAMME_LINK_CLASS}>grammar</Link>,{' '}
            <Link to="/spoken-english-classes-for-kids-online" className={HERO_PROGRAMME_LINK_CLASS}>spoken English</Link>{' '}
            and{' '}
            <Link to="/speaking" className={HERO_PROGRAMME_LINK_CLASS}>public speaking</Link>—with lessons
            tailored to your child's learning needs, current skills and pace.
          </p>

          <div className="mt-8 flex flex-wrap">
            <Link
              to="/book-demo"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#102A43] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0B2138] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
            >
              Book Free 35-Minute Demo
            </Link>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            One free, live 35-minute 1:1 demo assessment. No obligation to enrol.
          </p>
          <a
            href="#learning-pathways"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
          >
            Explore our learning pathways <span aria-hidden="true">↓</span>
          </a>
        </div>

        <figure className="relative mx-auto w-full max-w-[560px] min-w-0 lg:max-w-none">
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-[#F7F4F0] shadow-[0_16px_50px_rgba(15,23,42,0.07)]">
            <img
              src={HERO_IMAGE}
              alt="A child speaking confidently while using a laptop at home"
              width={1200}
              height={1000}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="aspect-[6/5] h-auto w-full object-cover object-[61%_center]"
            />
          </div>
          <figcaption className="sr-only">Illustration of the live online speaking experience.</figcaption>
        </figure>
      </div>
    </section>
  );
}

export default memo(ConversionHero);
