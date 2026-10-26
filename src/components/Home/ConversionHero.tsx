import React, { memo } from 'react';
import { Link } from 'react-router-dom';

const HERO_IMAGE = '/blog/hero-families/Tiny_Steps_Speaking.webp';

const HERO_PROGRAMME_LINK_CLASS =
  'rounded-sm font-semibold text-[#102A43] underline decoration-[#FF7A00] decoration-2 underline-offset-[5px] transition-colors duration-150 hover:bg-[#FFF1E6] hover:text-[#9B4300] hover:decoration-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43]';

function ConversionHero() {
  return (
    <section aria-labelledby="homepage-title" className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-7 px-5 pb-10 pt-20 sm:gap-10 sm:px-8 sm:pb-20 sm:pt-28 lg:grid-cols-[minmax(0,1.03fr)_minmax(0,0.97fr)] lg:gap-14 lg:pb-24">
        <div className="min-w-0">
          <h1
            id="homepage-title"
            className="max-w-3xl text-[clamp(2.7rem,6vw,5.15rem)] font-bold leading-[1.04] tracking-[-0.055em] text-[#102A43]"
          >
            Online English Classes <span className="text-[#FF7A00]">for Kids.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-9">
            Live, personalised one-to-one online English classes for children aged 3–12. Explore{' '}
            <Link to="/phonics" className={HERO_PROGRAMME_LINK_CLASS}>phonics</Link>,{' '}
            <Link to="/reading-classes-for-kids" className={HERO_PROGRAMME_LINK_CLASS}>reading</Link>,{' '}
            <Link to="/grammar" className={HERO_PROGRAMME_LINK_CLASS}>grammar</Link>,{' '}
            <Link to="/spoken-english-classes-for-kids-online" className={HERO_PROGRAMME_LINK_CLASS}>spoken English</Link>{' '}
            and{' '}
            <Link to="/speaking" className={HERO_PROGRAMME_LINK_CLASS}>public speaking</Link>—with lessons
            tailored to your child's learning needs, current skills and pace.
          </p>

          <div className="mt-6 flex flex-col items-start gap-2 sm:mt-8 sm:flex-row sm:items-center sm:gap-5">
            <Link
              to="/book-demo"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#102A43] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0B2138] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
            >
              Book Free 35-Minute Demo
            </Link>
            <p className="max-w-[17rem] text-sm leading-6 text-slate-500">
              Live 1:1 assessment. No obligation to enrol.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-6">
            <a
              href="#learning-pathways"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#102A43] underline decoration-[#FF7A00] decoration-2 underline-offset-4 transition-colors hover:text-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102A43]"
            >
              Explore our learning pathways <span aria-hidden="true">↓</span>
            </a>
            <Link
              to="/class-samples"
              className="inline-flex items-center text-sm font-semibold text-[#102A43] underline decoration-[#FF7A00] decoration-2 underline-offset-4 hover:text-[#9B4300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102A43]"
            >
              Watch a real class
            </Link>
            <a
              href="#choose-class-format"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#175C90] underline decoration-sky-400 decoration-2 underline-offset-4 transition-colors hover:text-[#102A43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#102A43]"
            >
              Compare Group and One-to-One Classes <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-[560px] min-w-0 lg:max-w-none">
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-[#F7F4F0] shadow-[0_16px_50px_rgba(15,23,42,0.07)]">
            <img
              src={HERO_IMAGE}
              srcSet={[
                '/blog/hero-families/Tiny_Steps_Speaking_480.webp 480w',
                '/blog/hero-families/Tiny_Steps_Speaking_720.webp 720w',
                '/blog/hero-families/Tiny_Steps_Speaking_960.webp 960w',
                `${HERO_IMAGE} 1131w`,
              ].join(', ')}
              sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) min(calc(100vw - 64px), 560px), 45vw"
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
