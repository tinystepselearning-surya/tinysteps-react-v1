import React, { memo } from 'react';
import { Link } from 'react-router-dom';

const HERO_IMAGE = '/blog/hero-families/Tiny_Steps_Speaking.webp';

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
            className="max-w-3xl text-[clamp(2.7rem,6vw,5.15rem)] font-bold leading-[1.04] tracking-[-0.055em] text-slate-950"
          >
            Online English Classes <span className="text-orange-600">for Kids.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
            Live 1:1 and small-group learning in phonics, reading, grammar and communication.
            We find the right starting point for your child, then build skills step by step.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/book-demo"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
            >
              Book Free 35-Minute Demo
            </Link>
            <Link
              to="/book-demo#assessment-form"
              data-no-booking-intercept="1"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
            >
              Open Assessment Form
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
