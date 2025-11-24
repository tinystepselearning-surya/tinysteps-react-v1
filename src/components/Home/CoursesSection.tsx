import React, { useMemo, useState } from 'react';
import Button from '../Button/Button';

type Course = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  age: string;
  duration: string;
};

const courses: Course[] = [
  { id: 'phonics', icon: '🔤', title: 'PHONICS', subtitle: 'From Sounds to Reading', age: 'Ages: 3–8', duration: 'Duration: 8–24 weeks' },
  { id: 'grammar', icon: '✍️', title: 'GRAMMAR', subtitle: 'Speaking & Writing', age: 'Ages: 4–12', duration: 'Duration: 8–24 weeks' },
  { id: 'speaking', icon: '🎤', title: 'PUBLIC SPEAKING', subtitle: 'From Shy to Confident', age: 'Ages: 4–12', duration: 'Duration: 8–24 weeks' }
];

const levelDetails = {
  phonics: [
    { name: 'Level 1: Foundation', points: ['Sound recognition', '3–4 letter words'], duration: '8–12 weeks' },
    { name: 'Level 2: Intermediate', points: ['Digraphs & clusters', 'Fluent reading'], duration: '12–16 weeks' },
    { name: 'Level 3: Advanced', points: ['Chapter books', 'Comprehension'], duration: '16–20 weeks' },
    { name: 'Level 4: Mastery', points: ['Independent reading', 'Novel reading'], duration: '20–24 weeks' }
  ],
  grammar: [
    { name: 'Level 1: Foundations', points: ['Nouns, verbs, pronouns', 'Simple sentences'], duration: '8–12 weeks' },
    { name: 'Level 2: Building Sentences', points: ['Adjectives & prepositions', 'Tenses'], duration: '12–16 weeks' },
    { name: 'Level 3: Complex Speaking', points: ['Conjunctions & compounds', 'Degrees of comparison'], duration: '16–20 weeks' },
    { name: 'Level 4: Mastery', points: ['Active/passive', 'Academic writing'], duration: '20–24 weeks' }
  ],
  speaking: [
    { name: 'Level 1: Building Confidence', points: ['Overcome shyness', 'Pronunciation'], duration: '8–12 weeks' },
    { name: 'Level 2: Foundations', points: ['2‑minute speeches', 'Body language'], duration: '12–16 weeks' },
    { name: 'Level 3: Intermediate', points: ['5‑minute presentations', 'Debates'], duration: '16–20 weeks' },
    { name: 'Level 4: Mastery', points: ['Formal presentations', 'Leadership skills'], duration: '20–24 weeks' }
  ]
};

const palette = {
  phonics: { gradient: 'from-[#ffe4c0] via-white to-[#fff4e1]', accent: 'text-[#b45309]' },
  grammar: { gradient: 'from-[#e0f2ff] via-white to-[#edf4ff]', accent: 'text-[#0f62fe]' },
  speaking: { gradient: 'from-[#f3e8ff] via-white to-[#fef2ff]', accent: 'text-[#7c3aed]' }
};

const slugMap: Record<string, string> = {
  phonics: '/courses/phonics-foundation',
  grammar: '/courses/grammar-essentials',
  speaking: '/courses/public-speaking-foundations'
};

const CoursesSection: React.FC = () => {
  const [activeCourse, setActiveCourse] = useState<Course>(courses[0]);
  const levels = useMemo(() => levelDetails[activeCourse.id as keyof typeof levelDetails], [activeCourse]);

  return (
    <section data-animate="fade-up" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Our Three Core Courses</h2>
          <p className="mt-2 text-base text-gray-700">Tap a course tab to preview outcomes and levels.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {courses.map((course) => {
            const isActive = course.id === activeCourse.id;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => setActiveCourse(course)}
                className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] text-white shadow-lg' : 'bg-white/80 text-gray-700 ring-1 ring-gray-200'
                }`}
                aria-pressed={isActive}
              >
                <span>{course.icon}</span>
                {course.title}
              </button>
            );
          })}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={`rounded-3xl border border-white/0 bg-gradient-to-br ${palette[activeCourse.id as keyof typeof palette].gradient} p-6 shadow-card-hover`}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{activeCourse.icon}</span>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{activeCourse.subtitle}</h3>
                <p className={`text-sm font-semibold ${palette[activeCourse.id as keyof typeof palette].accent}`}>{activeCourse.title}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm text-gray-700">
              <p>{activeCourse.age}</p>
              <p>{activeCourse.duration}</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {activeCourse.subtitle && <li>• {activeCourse.subtitle}</li>}
              {activeCourse.age && <li>• Tailored for {activeCourse.age.toLowerCase()}</li>}
              <li>• Live classes with AI nudges, worksheets, and recordings.</li>
              <li>• Aligned with IB and Cambridge-style English learning outcomes.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="sm"
                onClick={() => window.location.assign(`/curriculum#${activeCourse.id}`)}
              >
                View Curriculum
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const bookTrialElement = document.getElementById('book-trial');
                  bookTrialElement?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Book Trial
              </Button>
            </div>
            <div className="mt-10">
              <p className="text-sm text-gray-500">
                Most children complete Levels 1–4 in 8–24 weeks, depending on their starting level.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-card-hover">
            <h4 className="text-lg font-semibold text-gray-900">Level Roadmap</h4>
            <div className="mt-4 space-y-4">
              {levels.map((lvl, index) => (
                <div key={lvl.name} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{lvl.name}</div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500">Step {index + 1}</span>
                  </div>
                  <div className="text-xs text-gray-500">Duration: {lvl.duration}</div>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {lvl.points.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
