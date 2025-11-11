// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { CourseCard } from '../components/courses/CourseCard';
import { ParentReportPreview } from '../components/courses/ParentReportPreview';
import Meta from '../components/common/Meta';
import { catalogs } from '../content/courses';

type Track = 'phonics' | 'grammar' | 'speaking';

const allCourses = catalogs;

const CoursesPage: React.FC = () => {
  const [track, setTrack] = useState<Track | 'all'>('all');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'all'|'Foundation'|'Basic'|'Intermediate'|'Advanced'|'Brush‑Up'>('all');

  useEffect(() => { document.title = 'Choose Your Course | Tiny Steps'; }, []);

  const courses = useMemo(() => {
    return allCourses.filter((c) => (track==='all' || c.track===track) && (level==='all' || c.level===level) && (
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.overview.join(' ').toLowerCase().includes(query.toLowerCase())
    ));
  }, [track, level, query]);

  return (
    <div className="page-gradient relative overflow-hidden">
      <Meta
        title="Online English Courses for Kids | Phonics, Grammar, Public Speaking"
        description="Choose the perfect course for your child. 12‑week expert‑designed programs starting at ₹4,000/month. Free assessment."
        canonical="https://tinystepslearning.com/courses"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: catalogs.map((c, i) => ({
            '@type': 'ListItem',
            position: i+1,
            item: {
              '@type': 'Course',
              name: c.name,
              description: `${c.name} — ${c.overview.join(', ')}`,
              provider: { '@type': 'Organization', name: 'Tiny Steps Online School' },
              hasCourseInstance: {
                '@type': 'CourseInstance',
                courseMode: 'OnlineCoursePlatform',
                offers: {
                  '@type': 'Offer',
                  price: c.price.replace(/[^0-9]/g,'') || '0',
                  priceCurrency: 'INR',
                  availability: 'http://schema.org/InStock'
                }
              }
            }
          }))
        }}
      />
      <div className="pointer-events-none absolute -top-12 left-10 h-64 w-64 rounded-full bg-secondary-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-36 right-4 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6 pt-8 pb-10">
        <div className="glass-panel soft-grid overflow-hidden px-6 py-10 text-center">
          <div className="gradient-chip mx-auto mb-4 w-max">Live 1:1 + small groups</div>
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Choose Your Course</h1>
          <p className="mt-3 text-base text-gray-700">Phonics, grammar, and public speaking journeys mapped week-by-week with transparent pricing.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span className="rounded-full bg-white/80 px-4 py-1">Ages 3‑15</span>
            <span className="rounded-full bg-white/80 px-4 py-1">8‑12 week tracks</span>
            <span className="rounded-full bg-white/80 px-4 py-1">₹4,000+ / month</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl grid grid-cols-1 gap-8 px-6 pb-16 md:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div className="glass-panel p-4">
            <div className="mb-2 text-sm font-semibold">Track</div>
            <div className="flex flex-wrap gap-2">
              {(['all','phonics','grammar','speaking'] as const).map((t) => (
                <button key={t} onClick={() => setTrack(t)} className={`rounded-full px-3 py-1 text-sm ${track===t?'bg-primary-500 text-white':'bg-slate-100'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="glass-panel p-4">
            <div className="mb-2 text-sm font-semibold">Level</div>
            <div className="flex flex-wrap gap-2">
              {(['all','Foundation','Basic','Intermediate','Advanced','Brush‑Up'] as const).map((l) => (
                <button key={l} onClick={() => setLevel(l)} className={`rounded-full px-3 py-1 text-sm ${level===l?'bg-primary-500 text-white':'bg-slate-100'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="glass-panel p-4">
            <div className="mb-2 text-sm font-semibold">Search</div>
            <input className="interactive-input" placeholder="Search courses, levels, topics..." value={query} onChange={(e)=>setQuery(e.target.value)} />
          </div>
          <ParentReportPreview />
        </aside>

        <main className="glass-panel p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.name} {...c} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoursesPage;
