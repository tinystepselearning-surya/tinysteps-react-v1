// @ts-nocheck
import React, { useEffect, useState } from 'react';
import type { FC } from 'react';
import { WeekAccordion } from '../components/curriculum/WeekAccordion';
import Meta from '../components/common/Meta';
import { loadCurriculumOverrides, type CurriculumOverride } from '../content/curriculumLoader';
import { curriculumBySlug } from '../content/courses';
import type { WeekItem } from '../components/curriculum/WeekAccordion';
import { CollapsibleCard } from '../components/common/CollapsibleCard';
import SmartCard from '../components/ui/SmartCard';
import IBAlignmentSection from '../components/curriculum/IBAlignmentSection';

type Tab = 'phonics' | 'grammar' | 'speaking';

const CurriculumPage: FC = () => {
  const [tab, setTab] = useState<Tab>('phonics');
  const [curriculumData, setCurriculumData] = useState<CurriculumOverride | null>(null);

  useEffect(() => {
    loadCurriculumOverrides()
      .then((data) => setCurriculumData(data))
      .catch(() => null);
  }, []);

  const getWeeks = (courseSlug: string): WeekItem[] => {
    const overrideWeeks = curriculumData?.courses?.[courseSlug]?.weeks ?? [];
    const baseWeeks = curriculumBySlug[courseSlug]?.weeks ?? [];

    console.log('[CurriculumPage:getWeeks]', {
      courseSlug,
      overrideCount: overrideWeeks.length,
      baseCount: baseWeeks.length,
    });

    return (overrideWeeks.length ? overrideWeeks : baseWeeks) as WeekItem[];
  };

  return (
    <div className="page-gradient relative overflow-hidden">
      <Meta
        title="Online English Classes for Kids (Ages 3–12) | Tiny Steps"
        description="Premium 1:1 online English school for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors and weekly parent progress insights."
      />

      <div className="mx-auto max-w-6xl px-6 pt-8 pb-10">
        <div className="glass-panel soft-grid overflow-hidden px-6 py-10 text-center">
          <div className="gradient-chip mx-auto mb-4 w-max">Cambridge-aligned • Ages 3-15</div>
          <h1 className="font-heading text-3xl md:text-4xl">1-on-1 Online English Classes for Kids (Ages 3–12)</h1>
          <p className="mt-3 text-base text-gray-700">Scannable tabs, IB Approaches to Learning call-outs, and immersive week-by-week details so parents know exactly what’s next.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span className="rounded-full bg-white/80 px-4 py-1">Phonics mastery</span>
            <span className="rounded-full bg-white/80 px-4 py-1">Grammar confidence</span>
            <span className="rounded-full bg-white/80 px-4 py-1">Public speaking courage</span>
          </div>
        </div>
      </div>

      <section aria-labelledby="programs-heading" className="mx-auto max-w-6xl px-6 py-12">
        <h2 id="programs-heading" className="text-3xl font-semibold text-center">Our Programs</h2>
        <p className="mt-2 text-center text-gray-700">Live 1-on-1 classes in phonics, grammar and public speaking—tailored to your child's level.</p>

        <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-3">
          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Phonics (Ages 3–7)</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Alphabet & letter sounds</li>
              <li>• Blending & digraphs</li>
              <li>• Early reading fluency</li>
              <li>• Fun games & songs</li>
            </ul>
            <div className="mt-4">
              <a href="#signup" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</a>
            </div>
          </article>

          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Grammar (Ages 6–12)</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Parts of speech & sentence building</li>
              <li>• Tenses & punctuation</li>
              <li>• Creative writing practice</li>
              <li>• School-aligned reinforcement</li>
            </ul>
            <div className="mt-4">
              <a href="#signup" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</a>
            </div>
          </article>

          <article className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-medium">Public Speaking (Ages 8–12)</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Storytelling & speech structure</li>
              <li>• Voice, clarity & projection</li>
              <li>• Presentation practice & Q&A</li>
              <li>• Confidence-building activities</li>
            </ul>
            <div className="mt-4">
              <a href="#signup" className="inline-block rounded bg-primary-500 px-4 py-2 text-white">Book Free Assessment Class</a>
            </div>
          </article>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-6 grid gap-4 md:grid-cols-3">
        <SmartCard title="Phonics pathways" description="Early, Advanced, and Foundations" badge="Ages 3-12">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>SATPIN → vowel teams → multisyllabic strategies</li>
            <li>Weekly mastery checks + decodable reading</li>
          </ul>
        </SmartCard>
        <SmartCard title="Grammar roadmap" description="Basic + Mastery modules" badge="Ages 5-15">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>Parts of speech → complex tenses</li>
            <li>Paragraphs, editing drills, rubric-based outputs</li>
          </ul>
        </SmartCard>
        <SmartCard title="Speaking journey" description="Confidence to commanding stage" badge="Ages 4-15">
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>S.P.E.A.K. habits, debates, visual aids</li>
            <li>Recorded feedback + capstone speeches</li>
          </ul>
        </SmartCard>
      </div>

      <IBAlignmentSection />

      <div className="sticky top-28 z-20 border-y border-white/40 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap gap-3">
          {(['phonics','grammar','speaking'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pointer-events-auto hover-highlight rounded-full px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg':'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              {t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
        {tab === 'phonics' && (
          <div key="phonics" className="space-y-10">
            <CollapsibleCard icon={<span>📚</span>} title="Phonics: From Sounds to Fluent Reading" subtext="Cambridge-aligned | Ages 3-12 | Three Tracks" className="glass-panel">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="font-semibold">EARLY PHONICS (Ages 3-7, 12 weeks)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Letters & Sounds → Blending → Core Rules</li>
                    <li>CVC reading from sound recognition</li>
                    <li>Perfect for ages 3-7 with no reading</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">ADVANCED PHONICS (Ages 6-12, 12 weeks)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Long vowels → R-controlled → Multisyllabic</li>
                    <li>From decoding to fluent novel reading</li>
                    <li>Perfect for ages 6-12 with reading base</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">PHONICS FOUNDATIONS (Ages 5-10, 8-12 weeks)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Customized gap-filling program</li>
                    <li>Targets specific phonics weaknesses</li>
                    <li>Brush-up / On-ramp track</li>
                  </ul>
                </div>
              </div>
            </CollapsibleCard>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Early Phonics (12 weeks)</h3>
              <WeekAccordion key="phonics-foundation" items={getWeeks('phonics-foundation')} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Phonics (12 weeks)</h3>
              <WeekAccordion key="phonics-advanced" items={getWeeks('phonics-advanced')} />
            </div>
          </div>
        )}

        {tab === 'grammar' && (
          <div key="grammar" className="space-y-10">
            <CollapsibleCard icon={<span>📝</span>} title="Grammar: Speaking & Writing Mastery" subtext="Parts of speech → Sentences → Tenses | Ages 5-15" className="glass-panel">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="font-semibold">BASIC GRAMMAR (Ages 5-10, 12 weeks)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Nouns → Verbs → Adjectives → Tenses</li>
                    <li>Foundation for clear communication</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">ADVANCED GRAMMAR (Ages 8-15, 12 weeks)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>All 12 tenses → Complex sentences → Advanced punctuation</li>
                    <li>Essay/presentation ready</li>
                  </ul>
                </div>
              </div>
            </CollapsibleCard>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Basic Grammar (12 weeks)</h3>
              <WeekAccordion key="grammar-essentials" items={getWeeks('grammar-essentials')} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Grammar (12 weeks)</h3>
              <WeekAccordion key="grammar-mastery" items={getWeeks('grammar-mastery')} />
            </div>
          </div>
        )}

        {tab === 'speaking' && (
          <div key="speaking" className="space-y-10">
            <CollapsibleCard icon={<span>🎤</span>} title="Public Speaking: Confidence to Expertise" subtext="Find your voice → Speak with structure | Ages 4-15" className="glass-panel">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="font-semibold">BASIC PUBLIC SPEAKING (Ages 4-7, 12 weeks)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Confidence → Clear voice & body language</li>
                    <li>From 15–45s talks to structured stories</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold">ADVANCED PUBLIC SPEAKING (Ages 7-15, 12 weeks)</div>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    <li>Hook‑Body‑Close → Persuade & debate</li>
                    <li>From 60–120s speeches to presentations</li>
                  </ul>
                </div>
              </div>
            </CollapsibleCard>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Basic Public Speaking (12 weeks)</h3>
              <WeekAccordion key="public-speaking-foundations" items={getWeeks('public-speaking-foundations')} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Public Speaking (12 weeks)</h3>
              <WeekAccordion key="public-speaking-excellence" items={getWeeks('public-speaking-excellence')} />
            </div>
          </div>
        )}

      </div>

      <section className="bg-gray-50 py-10 px-4" aria-labelledby="curriculum-breakdown">
        <div className="max-w-4xl mx-auto">
          <h2 id="curriculum-breakdown" className="text-2xl font-semibold">Curriculum Breakdown</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            <li><strong>Phonics (3–7):</strong> Letter recognition, phonemic awareness, blends & digraphs, early decoding.</li>
            <li><strong>Grammar (6–12):</strong> Parts of speech, tenses, sentence structure, punctuation, creative writing.</li>
            <li><strong>Public Speaking (8–12):</strong> Story structure, voice control, audience engagement, presentation skills.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">Aligned to foundational literacy goals and supporting school curricula.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-semibold">Frequently asked questions</h2>
        <div className="mt-6 space-y-4">
          <details className="p-4 border rounded">
            <summary className="font-medium">Do you offer a free trial class?</summary>
            <div className="mt-2 text-gray-700">Yes — book one free 1-on-1 trial to evaluate fit and teacher interaction.</div>
          </details>
          <details className="p-4 border rounded">
            <summary className="font-medium">What age groups do you teach?</summary>
            <div className="mt-2 text-gray-700">We teach ages 3–12, with program tracks tuned to developmental milestones in each range.</div>
          </details>
        </div>
      </section>

      {/* Sticky CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden z-50">
        <a href="#signup" className="block w-full text-center bg-primary-500 text-white py-3 rounded font-semibold">Book Free Assessment Class</a>
      </div>

    </div>
  );
};

export default CurriculumPage;
