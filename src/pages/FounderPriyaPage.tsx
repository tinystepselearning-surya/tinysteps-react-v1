import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';

const CANONICAL_PATH = '/team/vannala-ravali-priya';
const SEO_TITLE = 'Vannala Ravali Priya | Founder of Tiny Steps Learning';
const SEO_DESCRIPTION =
  'Meet Vannala Ravali Priya, Founder of Tiny Steps Learning. Learn about her work in phonics, English curriculum development, teacher development and academic quality.';
const ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

export default function FounderPriyaPage() {
  useEffect(() => {
    applySeo({
      title: SEO_TITLE,
      description: SEO_DESCRIPTION,
      canonicalPath: CANONICAL_PATH,
      robots: ROBOTS,
      ogType: 'website',
    });
  }, []);

  return (
    <div className="bg-[#fffdf9] text-slate-950">
      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 md:py-14 lg:px-8 lg:py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm font-medium text-slate-500">
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

        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
            Founder &amp; Academic Leadership
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Vannala Ravali Priya
          </h1>

          <p className="mt-5 text-xl font-semibold text-slate-900 sm:text-2xl">
            Founder, Tiny Steps Learning
          </p>

          <p className="mt-2 text-base font-medium text-slate-500 sm:text-lg">
            Known to families and learners as Priya
          </p>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl sm:leading-9">
            Vannala Ravali Priya is the Founder of Tiny Steps Learning, an online English learning school for
            children ages 3–12. She leads the academic direction of Tiny Steps across phonics, reading, grammar,
            writing and public speaking.
          </p>
        </div>
      </section>
    </div>
  );
}
