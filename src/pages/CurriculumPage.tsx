// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { CollapsibleCard } from '../components/common/CollapsibleCard';
import { WeekAccordion } from '../components/curriculum/WeekAccordion';
import Meta from '../components/common/Meta';
import { getCourseWeeksOverride } from '../content/curriculumLoader';
import SmartCard from '../components/ui/SmartCard';
import IBAlignmentSection from '../components/curriculum/IBAlignmentSection';

type Tab = 'phonics' | 'grammar' | 'speaking';

const CurriculumPage: FC = () => {
  const [tab, setTab] = useState<Tab>('phonics');
  useEffect(() => {
    document.title = 'Complete Learning Curriculum | Tiny Steps';
  }, []);

  return (
    <div className="page-gradient relative overflow-hidden">
      <Meta
        title="Online English Classes for Kids (Ages 3–12) | Tiny Steps"
        description="Premium 1:1 online English school for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice and weekly parent progress insights. Free assessment class; flexible monthly plans."
        canonical="https://tinystepslearning.com/curriculum"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Tiny Steps Learning",
            "url": "https://tinystepslearning.com",
            "logo": "https://tinystepslearning.com/images/logo.png",
            "sameAs": ["https://www.facebook.com/tinysteps", "https://www.instagram.com/tinysteps"]
          },
          {
            "@type": "Course",
            "name": "Phonics for Beginners (Ages 3–7)",
            "description": "Online phonics classes teaching letter sounds, blends, and early reading fluency.",
            "provider": {
              "@type": "Organization",
              "name": "Tiny Steps Learning",
              "sameAs": "https://tinystepslearning.com"
            }
          },
          {
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Do you offer a free trial class?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes — book one free 1-on-1 trial class to evaluate fit and teacher interaction."
                }
              },
              {
                "@type": "Question",
                "name": "What ages do you teach?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We teach children ages 3–12, across Phonics, Grammar and Public Speaking tracks."
                }
              },
              {
                "@type": "Question",
                "name": "How do online phonics classes work for kids?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Online phonics classes involve interactive games, songs, and stories that teach letter sounds and simple words. For kindergarteners, we start with alphabet recognition and progress to reading short words."
                }
              },
              {
                "@type": "Question",
                "name": "Can a 10-year-old benefit from public speaking classes?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. Our public speaking classes for kids help older children structure speeches, develop confident body language, and overcome stage fear. These skills benefit them in school presentations and beyond."
                }
              }
            ]
          }
        ]}
      />
      <div className="pointer-events-none absolute -top-10 right-6 h-60 w-60 rounded-full bg-primary-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-24 left-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />

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
              <a href="#signup" className="inline-block rounded bg-primary-500 px-4 py-2 text-white" aria-label="Try a free Phonics class">Try a free Phonics class</a>
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
              <a href="#signup" className="inline-block rounded bg-primary-500 px-4 py-2 text-white" aria-label="Try a free Grammar class">Try a free Grammar class</a>
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
              <a href="#signup" className="inline-block rounded bg-primary-500 px-4 py-2 text-white" aria-label="Try a free Speaking class">Try a free Speaking class</a>
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

      <section className="bg-gray-50 py-10 px-4" aria-labelledby="curriculum-breakdown">
        <div className="max-w-4xl mx-auto">
          <h2 id="curriculum-breakdown" className="text-2xl font-semibold">Curriculum Breakdown</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            <li><strong>Phonics (3–7):</strong> Letter recognition, phonemic awareness, blends & digraphs, early decoding.</li>
            <li><strong>Grammar (6–12):</strong> Parts of speech, tenses, sentence structure, punctuation, creative writing.</li>
            <li><strong>Public Speaking (8–12):</strong> Story structure, voice control, audience engagement, presentation skills.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">Aligned to foundational literacy goals from NEP 2020 and supporting school curricula (CBSE/ICSE/IB) through activity-based practice.</p>
        </div>
      </section>

      <div className="sticky top-28 z-10 border-y border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap gap-3">
          {(['phonics','grammar','speaking'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`hover-highlight rounded-full px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg':'bg-white/80 text-gray-700 hover:bg-white'}`}
            >
              {t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
        {tab === 'phonics' && (
          <div className="space-y-10">
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
              <WeekAccordion items={useMemo(() => ([
                { title: 'Week 1: SATPIN Set 1', focus: '/s/ /a/ /t/ /p/ /i/ /n/ — letter sounds', learns: ['Identify sounds (not letter names)', 'Sound‑motion hooks', 'Intro to blending', 'Simple words: at, in, sat, pin'], activities: ['Listen & identify each sound', 'Make sound‑motions', 'Blend sounds into words', 'Match letter cards'], homework: ['Sound recognition worksheet (5 min)', 'Listen & repeat audio (2 min)'], mastery: 'Identifies all 6 sounds ✓' },
                { title: 'Week 2: Set 2 + CK Rule', focus: '/m/ /d/ /g/ /o/ /c/ /k/ + CK rule', learns: ['6 new sounds with motions', 'CK spelling rule', 'Blend longer word families'], activities: ['Digraph Detective (find CK words)', 'Word family ladders', 'Build words with letter cards'], homework: ['List 10 words using these sounds'], mastery: 'Reads CK words ✓' },
                { title: 'Week 3: New Sounds + Blending Drill', learns: ['Add next sound set', 'Slow → fast blending'], activities: ['CVC builder game', 'Minimal pairs'], homework: ['Daily blending (5–10 min)'], mastery: 'Blends 10 CVC words ✓' },
                { title: 'Week 4: Blending Mastery + Word Families', learns: ['Onset–rime blending', 'Word families'], activities: ['Balloon Pop (minimal pairs)', 'Word ladders'], mastery: 'Reads 20 CVC words ✓' },
                { title: 'Week 5: CVC Fluency', learns: ['Accuracy → speed', 'Reading simple sentences'], activities: ['1‑sentence readers'], mastery: 'Reads short CVC sentences ✓' },
                { title: 'Week 6: Early Rules (ff/ll/ss/zz)', learns: ['Double letter endings'], activities: ['Word sort'], mastery: 'Applies end‑double rules ✓' },
                { title: 'Week 7: Intro to Digraphs (sh, ch, th, wh)', learns: ['2 letters = 1 sound'], activities: ['Digraph hunt'], mastery: 'Identifies 4 digraphs ✓' },
                { title: 'Week 8: Mixed CVC + Digraphs', learns: ['Mix patterns in readers'], activities: ['Sentence dice'], mastery: 'Reads mixed patterns ✓' },
                { title: 'Week 9: Tricky Words Set 1', learns: ['the, to, do, was, are, said, come'], activities: ['Sentence use', 'Rhyming pairs'], mastery: 'Reads 7 tricky words ✓' },
                { title: 'Week 10: Review + Fluency', learns: ['Accuracy and pace'], activities: ['1‑minute reads'], mastery: '95% accuracy ✓' },
                { title: 'Week 11: Comprehension Basics', learns: ['Answer who/what/where'], activities: ['Picture talk + read'], mastery: 'Answers 3 W‑questions ✓' },
                { title: 'Week 12: REVIEW + TRICKY WORDS', focus: 'Review all patterns + tricky words', learns: ['Full review', 'Capstone practice'], activities: ['Decodable page read'], mastery: 'Capstone: 95%+ fluent page + 5 sentences ✓' }
              ]), [])} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Phonics (12 weeks)</h3>
              <WeekAccordion items={useMemo(() => ([
                { title: 'Week 1: Diagnostic + Syllable Types', learns: ['Closed/Open/Magic‑e/R‑controlled/Vowel team'], activities: ['Passage diagnostic'], mastery: 'Identify 5 types ✓' },
                { title: 'Week 2: Long Vowels – A patterns', learns: ['ai, ay, a_e, eigh/ei'], activities: ['Pattern sort'], mastery: 'Apply A patterns ✓' },
                { title: 'Week 3: E/I patterns', learns: ['ee, ea, e_e, ie, igh, i_e, y'], mastery: 'Apply E/I patterns ✓' },
                { title: 'Week 4: O/U patterns', learns: ['oa, oe, o_e, oo, ue, ui, u_e, ew'], mastery: 'Apply O/U patterns ✓' },
                { title: 'Week 5: R‑controlled review', learns: ['ar, er, ir, or, ur'], mastery: 'Read r‑controlled words ✓' },
                { title: 'Week 6: Diphthongs', learns: ['oi/oy, ou/ow, au/aw'], mastery: 'Read diphthongs ✓' },
                { title: 'Week 7: Soft/Hard C & G + J sounds', mastery: 'Correct soft/hard usage ✓' },
                { title: 'Week 8: Schwa & reduction', mastery: 'Recognize schwa ✓' },
                { title: 'Week 9: Consonant+le + Morphology', mastery: 'Decode C+le ✓' },
                { title: 'Week 10: Prefixes', learns: ['un‑, re‑, pre‑, mis‑, dis‑'], mastery: 'Use common prefixes ✓' },
                { title: 'Week 11: Multisyllabic strategies + fluency', mastery: '150–300 word passage ✓' },
                { title: 'Week 12: Comprehensive review + CAPSTONE', mastery: 'Capstone read + paragraph ✓' }
              ]), [])} />
            </div>
          </div>
        )}

        {tab === 'grammar' && (
          <div className="space-y-10">
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
              <WeekAccordion items={useMemo(() => ([
                { title: 'Week 1: Nouns & Articles (a/an/the)', learns: ['Noun types: common vs proper', 'Articles: a vs an', 'The (specific) vs a (general)'], activities: ['Label pictures', 'Write 3 sentences', 'Noun hunt'], homework: ['Article worksheet + reading task'], mastery: 'Correct usage ✓' },
                { title: 'Week 2: Pronouns & Agreement', learns: ['I, you, he, she, it, we, they', 'Match pronouns to nouns', 'He is / They are'], mastery: 'Correct agreement ✓' },
                { title: 'Week 3: Verbs – Present Simple & Continuous', learns: ['I play / I am playing', 'Do/Does in questions'], mastery: 'Use in sentences ✓' },
                { title: 'Week 4: Verbs – Past Simple', learns: ['Regular: played', 'Irregular: go→went, eat→ate', '‑ed rules'], mastery: 'Past simple accuracy ✓' },
                { title: 'Week 5: Adjectives + Degrees', learns: ['big→bigger→biggest', 'happy→happier→happiest'], mastery: 'Correct degrees ✓' },
                { title: 'Week 6: Prepositions (time/place)', learns: ['in/on/under/beside/between', 'time: in/on/at/during/after'], mastery: 'Use in context ✓' },
                { title: 'Week 7: Conjunctions', learns: ['and/but/so/because'], mastery: 'Join sentences ✓' },
                { title: 'Week 8: Sentence Types', learns: ['Statements/Questions/Commands/Exclamations'], mastery: 'Punctuate correctly ✓' },
                { title: 'Week 9: Punctuation Rules', learns: ['., ?, !', 'Capitalization', 'Commas in lists'], mastery: 'Apply rules ✓' },
                { title: 'Week 10: Subject‑Verb Agreement', learns: ['this/that is vs these/those are', 'Singular vs plural'], mastery: 'SVA mastery ✓' },
                { title: 'Week 11: Tense Mix + Paragraph Writing', learns: ['Mix tenses in context', '4‑sentence paragraph'], mastery: 'Paragraph with structure ✓' },
                { title: 'Week 12: REVIEW + CAPSTONE', learns: ['Review 1–11', '6–8 sentence descriptive paragraph'], mastery: 'Capstone paragraph ✓' }
              ]), [])} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Grammar (12 weeks)</h3>
              <WeekAccordion items={useMemo(() => ([
                { title: 'Week 1: All 12 Tenses Overview + Timeline' },
                { title: 'Week 2: Present Perfect vs Past Simple' },
                { title: 'Week 3: Past Perfect' },
                { title: 'Week 4: Future Forms (will/going to/present continuous)' },
                { title: 'Week 5: Adverbs (frequency, manner, time)' },
                { title: 'Week 6: Prepositions & Collocations' },
                { title: 'Week 7: Clauses (independent/dependent; complex/compound)' },
                { title: 'Week 8: Modals (can, could, must, should, may, might)' },
                { title: 'Week 9: Reported Speech' },
                { title: 'Week 10: Passive Voice' },
                { title: 'Week 11: Advanced Punctuation & Cohesion' },
                { title: 'Week 12: CAPSTONE – 120–180 word informative/argument paragraph' }
              ]), [])} />
            </div>
          </div>
        )}

        {tab === 'speaking' && (
          <div className="space-y-10">
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
              <WeekAccordion items={useMemo(() => ([
                { title: 'Week 1: Classroom Promises + Introduction', learns: ['Set speaking promises', '10–15s introduction', 'Posture & eye contact'], activities: ['Promises', 'Intro practice', 'Mirror exercises'], mastery: '10–15s intro ✓' },
                { title: 'Week 2: Voice, Face, Body Language', learns: ['Appropriate volume', 'Facial expressions', 'Hand/feet positioning'], activities: ['Mirror drill game'] },
                { title: 'Week 3: Show & Tell (3 Points)', learns: ['Show object', 'Tell what + why'], mastery: 'Structured show & tell ✓' },
                { title: 'Week 4: Picture Talk (B‑M‑E)', learns: ['Beginning/Middle/End story'], mastery: '5‑sentence picture talk ✓' },
                { title: 'Week 5: Sentence Dice & Emoji Voice', learns: ['Sentence starters', 'Tone/emotion control'] },
                { title: 'Week 6: Describe a Place (5 Senses)', learns: ['Sensory details', '30–45s description'] },
                { title: 'Week 7: Story Retell with Props', learns: ['Retell key moments', 'Character voices'], mastery: 'Retell ✓' },
                { title: 'Week 8: My Opinion (with Reason)', learns: ['State opinion', 'Give reason', '20–30s talk'] },
                { title: 'Week 9: Friend or Pet (Detail Talk)', learns: ['Describe person/animal', 'What you do together'] },
                { title: 'Week 10: Capstone Practice', learns: ['Full show & tell', 'Feedback & adjustments'] },
                { title: 'Week 11: Visual Aids', learns: ['Use props/pictures effectively'] },
                { title: 'Week 12: CAPSTONE PERFORMANCE', learns: ['30–45s with prop', 'Confident delivery'], mastery: 'Capstone ✓' }
              ]), [])} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="mb-3 font-heading text-2xl font-bold">Advanced Public Speaking (12 weeks)</h3>
              <WeekAccordion items={useMemo(() => ([
                { title: 'Week 1: S.P.E.A.K. Habit Introduction', learns: ['Stand tall', 'Pace steady', 'Eye contact', 'Act natural', 'Keep clear'], mastery: 'Baseline video ✓' },
                { title: 'Week 2: Hook‑Body‑Close Framework', learns: ['Hook', '2–3 key points', 'Strong close'] },
                { title: 'Week 3: Informative Speech (How It Works)' },
                { title: 'Week 4: Persuasive Speech (I Believe...)' },
                { title: 'Week 5: Opinion with Evidence' },
                { title: 'Week 6: Visual Aids Mastery' },
                { title: 'Week 7: Debate Basics (For/Against)' },
                { title: 'Week 8: Impromptu Speaking (1‑min Prep)' },
                { title: 'Week 9: Picture & Data Prompts' },
                { title: 'Week 10: Vocal Variety & Body Language Mastery' },
                { title: 'Week 11: Full Rehearsal & Peer Feedback' },
                { title: 'Week 12: CAPSTONE PERFORMANCE' }
              ]), [])} />
            </div>
          </div>
        )}
      </div>

      <section className="bg-white py-10 px-4" aria-labelledby="testimonials-heading">
        <div className="max-w-4xl mx-auto">
          <h2 id="testimonials-heading" className="text-2xl font-semibold text-center">What Parents Say</h2>
          <div className="mt-6 space-y-4">
            <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-700">
              “My 7-year-old’s reading improved tremendously after Tiny Steps. The teachers are so patient!”<br/>
              — Parent, Location
            </blockquote>
            <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-700">
              “The public speaking course gave our son the confidence to participate in class.”<br/>
              — Amit R., Bangalore
            </blockquote>
            <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-700">
              “Amazing grammar lessons that made English fun for my daughter.”<br/>
              — Sunita K., Delhi
            </blockquote>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <img src="/images/award-2025.svg" alt="Winner of EdTech Innovation Award 2025" loading="lazy" className="h-12" />
            <img src="/images/verified.svg" alt="5-Star Rated by Parents" loading="lazy" className="h-12" />
            <span className="text-sm text-gray-600">Trusted by 10,000+ parents in India and abroad</span>
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-4xl mx-auto px-4 py-10" aria-labelledby="faq-heading">
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

          <details className="p-4 border rounded">
            <summary className="font-medium">How do online phonics classes work for kindergarten?</summary>
            <div className="mt-2 text-gray-700">Online phonics classes involve interactive games, songs, and stories that teach letter sounds and simple words. For a kindergartener, our phonics program starts with alphabet recognition and progresses to reading short words.</div>
          </details>

          <details className="p-4 border rounded">
            <summary className="font-medium">Can a 10-year-old benefit from public speaking classes?</summary>
            <div className="mt-2 text-gray-700">Absolutely. Our public speaking classes for kids help older children structure speeches, develop confident body language, and overcome stage fear. These skills benefit them in school presentations and beyond.</div>
          </details>

          <details className="p-4 border rounded">
            <summary className="font-medium">How is the curriculum aligned with Indian schools?</summary>
            <div className="mt-2 text-gray-700">Our programs support CBSE, ICSE, and NEP 2020 goals, focusing on foundational literacy and communication skills that complement classroom learning.</div>
          </details>

          <details className="p-4 border rounded">
            <summary className="font-medium">What makes Tiny Steps different from other online classes?</summary>
            <div className="mt-2 text-gray-700">We offer personalized 1-on-1 sessions with certified mentors, real-time progress tracking, and a curriculum designed for Indian children’s needs.</div>
          </details>
        </div>
      </section>

      {/* Sticky CTA for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden z-50">
        <a href="#signup" className="block w-full text-center bg-primary-500 text-white py-3 rounded font-semibold" aria-label="Book Free Trial Class">Book Free Trial Class</a>
      </div>

    </div>
  );
};

export default CurriculumPage;
