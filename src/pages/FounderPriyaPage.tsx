import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';

const CANONICAL_PATH = '/team/vannala-ravali-priya';
const SEO_TITLE = 'Vannala Ravali Priya | Founder of Tiny Steps Learning';
const SEO_DESCRIPTION =
  'Meet Vannala Ravali Priya, Founder of Tiny Steps Learning. Learn about her work in phonics, English curriculum development, teacher development and academic quality.';
const ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const FOUNDER_IMAGE = '/priya-founder-tiny-steps-learning.webp';

export default function FounderPriyaPage() {
  useEffect(() => {
    applySeo({
      title: SEO_TITLE,
      description: SEO_DESCRIPTION,
      canonicalPath: CANONICAL_PATH,
      robots: ROBOTS,
      ogType: 'website',
      ogImage: FOUNDER_IMAGE,
    });
  }, []);

  return (
    <div className="overflow-x-clip bg-[#fffdf9] text-slate-950">
      <section className="relative isolate overflow-hidden border-b border-orange-100 bg-[#fffaf3] px-5 pb-16 pt-10 sm:px-6 sm:pb-20 md:pt-12 lg:px-8 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute -right-28 top-8 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-orange-200/55 blur-3xl sm:h-96 sm:w-96" />
        </div>

        <div className="mx-auto w-full max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-10 text-sm font-medium text-slate-500 lg:mb-14">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link className="transition hover:text-slate-900" to="/">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link className="transition hover:text-slate-900" to="/team">
                  Team
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-slate-700">
                Vannala Ravali Priya
              </li>
            </ol>
          </nav>

          <div className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16 xl:gap-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-700">
                  Founder &amp; Academic Leadership
                </span>
              </div>

              <h1 className="mt-6 font-heading text-[2.65rem] font-bold leading-[1.04] tracking-[-0.045em] text-[#10243e] sm:text-5xl lg:text-[3.8rem] xl:text-[4.25rem]">
                Vannala Ravali Priya
              </h1>

              <p className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl">
                Founder, Tiny Steps Learning
              </p>

              <p className="mt-2 text-base font-semibold text-slate-500 sm:text-lg">
                Known to families and learners as Priya
              </p>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl sm:leading-9">
                Vannala Ravali Priya is the Founder of Tiny Steps Learning, an online English learning school for
                children ages 3–12. She leads the academic direction of Tiny Steps across phonics, reading, grammar,
                writing and public speaking.
              </p>

              <div className="mt-8 max-w-2xl rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Academic direction across</p>
                <div className="mt-4 flex flex-wrap gap-2.5" aria-label="Academic programme areas">
                  {['Phonics & Reading', 'Grammar & Writing', 'Public Speaking'].map((area) => (
                    <span
                      key={area}
                      className="rounded-full border border-orange-100 bg-[#fff8ef] px-4 py-2 text-sm font-bold text-slate-800"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px] lg:mx-0 lg:justify-self-end">
              <div className="absolute -inset-4 -z-10 rotate-2 rounded-[38px] bg-[#dbeafe]" aria-hidden="true" />
              <div className="absolute -bottom-5 -left-5 -z-10 h-36 w-36 rounded-full bg-orange-200/80 blur-2xl" aria-hidden="true" />

              <figure className="relative overflow-hidden rounded-[34px] border-[10px] border-white bg-slate-100 shadow-[0_28px_80px_rgba(15,23,42,0.20)]">
                <img
                  src={FOUNDER_IMAGE}
                  alt="Vannala Ravali Priya, Founder of Tiny Steps Learning"
                  width={1024}
                  height={1024}
                  loading="eager"
                  decoding="async"
                  className="aspect-square h-auto w-full object-cover object-center"
                />

                <figcaption className="absolute inset-x-4 bottom-4 rounded-[22px] border border-white/60 bg-white/92 p-4 shadow-xl backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Founder-led academic direction</p>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="font-heading text-xl font-bold text-slate-950 sm:text-2xl">Priya</p>
                      <p className="mt-1 text-sm font-medium text-slate-600">Founder, Tiny Steps Learning</p>
                    </div>
                    <span className="rounded-full bg-[#10243e] px-3 py-1.5 text-xs font-bold text-white">
                      Tiny Steps Learning
                    </span>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
