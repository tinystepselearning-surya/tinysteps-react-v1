import React, { useState } from 'react';
import { HoverDetailsCard } from '../common/HoverDetailsCard';
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

const CoursesSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Our Three Core Courses</h2>
          <p className="mt-2 text-base text-gray-700">Hover or tap to explore levels</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div key={c.id} onClick={() => setOpenId((v) => (v === c.id ? null : c.id))} className="cursor-pointer">
              <HoverDetailsCard
                className="card"
                header={
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{c.icon}</span>
                    <span>{c.title}</span>
                  </div>
                }
                preview={
                  <div className="space-y-1">
                    <div>{c.subtitle}</div>
                    <div>{c.age}</div>
                    <div>{c.duration}</div>
                    <div className="pt-2 text-primary-600">Explore Levels →</div>
                  </div>
                }
                details={
                  <div>
                    <div className="mb-2 font-semibold">✨ {c.title} — 4 LEVELS</div>
                    <div className="space-y-3">
                      {levelDetails[c.id as keyof typeof levelDetails].map((lvl) => (
                        <div key={lvl.name}>
                          <div className="font-medium">{lvl.name}</div>
                          <div className="text-xs text-gray-600">Duration: {lvl.duration}</div>
                          <ul className="list-disc pl-5 text-sm">
                            {lvl.points.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Button size="sm" variant="outline">View Full Curriculum</Button>
                    </div>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;

