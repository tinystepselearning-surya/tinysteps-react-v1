// @ts-nocheck
import React from "react";
import { motion } from "framer-motion";

// Inline SVG icon components (small, self-contained) to avoid an external dependency.
const Svg = ({ children, className }: { children: any; className?: string }) => (
  <span className={className} aria-hidden>
    {children}
  </span>
);

const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l8-4V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10l8 4z" />
  </svg>
);

const PenSquare = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 20h4l10-10-4-4L4 16v4z" />
  </svg>
);

const Mic2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 1v11m4 4H8a4 4 0 008 0z" />
  </svg>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M12 22a10 10 0 100-20 10 10 0 000 20z" />
  </svg>
);

const Star = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .587l3.668 7.431L23.4 9.75l-5.6 5.458L18.736 24 12 19.897 5.264 24l1.0-8.792L.664 9.75l7.732-1.732L12 .587z" />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" strokeWidth={1.5} />
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87" />
  </svg>
);

const UserCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" />
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M6 21v-2a4 4 0 014-4h.88" />
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M20 8l-3 3-1.5-1.5" />
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 3l1.5 3L10 8l-3.5 2L5 13 3 10 0 8l3-2L5 3z" />
  </svg>
);

type CardProps = {
  icon: React.ReactNode;
  title: string;
  tag?: string;
  desc: string;
  bullets: string[];
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-10">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-xs font-medium text-sky-700 shadow ring-1 ring-black/5">
        <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-slate-600 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

function CourseCard({ icon, title, tag, desc, bullets, ctaPrimary, ctaSecondary }: CardProps) {
  return (
    <motion.div
      variants={item}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm hover:shadow-xl transition-all">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-transparent to-sky-50/70 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-6">
        <div className="flex items-center gap-3">
          <div className="grid place-content-center h-12 w-12 rounded-xl bg-orange-100 text-orange-700">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {tag && (
              <span className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-wide text-sky-700 bg-sky-50 rounded px-2 py-0.5">
                {tag}
              </span>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">{desc}</p>
        <ul className="mt-4 space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {b}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {ctaPrimary && (
            <a
              href={ctaPrimary.href}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {ctaPrimary.label} <ArrowRight className="h-4 w-4" />
            </a>
          )}
          {ctaSecondary && (
            <a
              href={ctaSecondary.href}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold border border-slate-200 hover:bg-slate-50"
            >
              {ctaSecondary.label}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <main className="relative">
      {/* Hero */}
      <section className="bg-gradient-to-b from-white via-sky-50/40 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse"/> Live 1:1 & Group Classes
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Tiny Steps: Confident Readers & Speakers
              </h1>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Engaging lessons, interactive games, and progress dashboards—built for busy parents and curious kids.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#phonics" className="rounded-xl bg-slate-900 text-white px-5 py-2.5 font-semibold">Explore Phonics</a>
                <a href="#grammar" className="rounded-xl bg-white px-5 py-2.5 font-semibold border border-slate-200 hover:bg-slate-50">Grammar</a>
                <a href="#speaking" className="rounded-xl bg-white px-5 py-2.5 font-semibold border border-slate-200 hover:bg-slate-50">Public Speaking</a>
              </div>
              <div className="mt-6 flex items-center gap-6 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2"><Users className="h-4 w-4"/> Small groups or 1:1</div>
                <div className="inline-flex items-center gap-2"><Star className="h-4 w-4"/> Parent-loved lessons</div>
                <div className="inline-flex items-center gap-2"><UserCheck className="h-4 w-4"/> Expert teachers</div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-sky-100 via-white to-orange-100 ring-1 ring-black/5 shadow-xl"/>
              <p className="mt-3 text-xs text-center text-slate-500">(Hero illustration / kids image placeholder)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky mini-nav like Vedantu */}
      <div className="sticky top-0 z-20 border-t border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto no-scrollbar py-3 text-sm font-semibold">
            <a href="#phonics" className="px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50">Phonics & Reading</a>
            <a href="#grammar" className="px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50">Grammar & Writing</a>
            <a href="#speaking" className="px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50">Public Speaking</a>
          </div>
        </div>
      </div>

      {/* PHONICS & READING */}
      <section id="phonics" className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Phonics & Reading"
            title="Build strong decoding skills and a love for reading"
            subtitle="From A–Z sounds and CVC blending to digraphs, long vowels, and reading fluency."
          />

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <CourseCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Early Phonics Foundations"
              tag="Ages 3–6"
              desc="Letter–sound mastery, blending, and first words."
              bullets={[
                "A–Z sounds, SATPIN order",
                "CVC decoding & Elkonin boxes",
                "Games, tracing, and sound stories",
              ]}
              ctaPrimary={{ label: "Try a free class", href: "/#contact" }}
              ctaSecondary={{ label: "See curriculum", href: "/courses/phonics#early" }}
            />
            <CourseCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Advanced Phonics & Spelling"
              tag="Ages 6–10"
              desc="Digraphs, Magic‑E, long vowels, alternate spellings."
              bullets={[
                "CK / Rabbit / Floss rules",
                "Digraphs & diphthongs (sh, ch, ai, ee, oi...)",
                "Reading sentences & dictation practice",
              ]}
              ctaPrimary={{ label: "Enroll now", href: "/#contact" }}
              ctaSecondary={{ label: "View topics", href: "/courses/phonics#advanced" }}
            />
            <CourseCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Reading Fluency & Comprehension"
              tag="Grades 1–4"
              desc="Move from decoding to confident, expressive reading."
              bullets={[
                "Sight words & tricky words",
                "Pace, phrasing, and expression",
                "Short passages & question sets",
              ]}
              ctaPrimary={{ label: "Get timetable", href: "/#contact" }}
              ctaSecondary={{ label: "Sample lesson", href: "/courses/phonics#fluency" }}
            />
          </motion.div>
        </div>
      </section>

      {/* GRAMMAR & WRITING */}
      <section id="grammar" className="py-14 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Grammar & Writing"
            title="Think clearly. Write clearly."
            subtitle="Simple rules, engaging practice, and real writing tasks."
          />

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <CourseCard
              icon={<PenSquare className="h-6 w-6" />}
              title="Grammar Level 1"
              tag="Ages 6–9"
              desc="Must‑know building blocks for young writers."
              bullets={[
                "Nouns, verbs, adjectives, articles",
                "Prepositions of place & time, punctuation",
                "Sentence building games & worksheets",
              ]}
              ctaPrimary={{ label: "Try a free class", href: "/#contact" }}
              ctaSecondary={{ label: "See curriculum", href: "/courses/grammar#level1" }}
            />
            <CourseCard
              icon={<PenSquare className="h-6 w-6" />}
              title="Grammar Level 2"
              tag="Ages 9–12"
              desc="From tenses to strong sentence structure."
              bullets={[
                "Present / Past / Future tenses",
                "Adverbs, conjunctions, S‑V agreement",
                "Editing drills and paragraph practice",
              ]}
              ctaPrimary={{ label: "Enroll now", href: "/#contact" }}
              ctaSecondary={{ label: "View topics", href: "/courses/grammar#level2" }}
            />
            <CourseCard
              icon={<PenSquare className="h-6 w-6" />}
              title="Creative Writing Lab"
              tag="Grades 2–6"
              desc="Write sentences, stories, and short essays with voice."
              bullets={[
                "Hooks, details, and endings",
                "Story maps & mind‑mapping",
                "Peer‑read alouds and feedback",
              ]}
              ctaPrimary={{ label: "Get timetable", href: "/#contact" }}
              ctaSecondary={{ label: "Sample lesson", href: "/courses/grammar#writing" }}
            />
          </motion.div>
        </div>
      </section>

      {/* PUBLIC SPEAKING */}
      <section id="speaking" className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Public Speaking"
            title="Confident on camera and on stage"
            subtitle="Fun practice with eye contact, voice, and structure—perfect for shy and bold kids alike."
          />

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <CourseCard
              icon={<Mic2 className="h-6 w-6" />}
              title="Early Speaker"
              tag="Ages 5–8"
              desc="Short talks that build comfort and joy."
              bullets={[
                "Introduce yourself in many settings",
                "Look‑move‑smile eye contact habit",
                "Picture talk & show‑and‑tell",
              ]}
              ctaPrimary={{ label: "Try a free class", href: "/#contact" }}
              ctaSecondary={{ label: "See curriculum", href: "/courses/speaking#early" }}
            />
            <CourseCard
              icon={<Mic2 className="h-6 w-6" />}
              title="Confident Speaker"
              tag="Ages 8–11"
              desc="Structure ideas and speak with expression."
              bullets={[
                "S.P.E.A.K. rule + delivery drills",
                "Storytelling & impromptu topics",
                "Voice, pace, and emphasis games",
              ]}
              ctaPrimary={{ label: "Enroll now", href: "/#contact" }}
              ctaSecondary={{ label: "View topics", href: "/courses/speaking#confident" }}
            />
            <CourseCard
              icon={<Mic2 className="h-6 w-6" />}
              title="Superstar Speaker"
              tag="Ages 10–13"
              desc="Polish speeches, debates, and hosting skills."
              bullets={[
                "Persuasive speeches & debates",
                "Pause, gesture, and rhetorical devices",
                "Recording practice & feedback reels",
              ]}
              ctaPrimary={{ label: "Get timetable", href: "/#contact" }}
              ctaSecondary={{ label: "Sample lesson", href: "/courses/speaking#superstar" }}
            />
          </motion.div>
        </div>
      </section>

      {/* Progress strip (Vedantu-style) */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Here’s how your child progresses</h3>
              <p className="mt-2 text-slate-600">Start where you are, level up with each lesson, and shine in real‑world tasks.</p>
            </div>
            <ol className="grid md:grid-cols-3 gap-4">
              {["Begin at current level", "Progress fast, level up", "Go beyond & be a star"].map((t, i) => (
                <li key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="grid place-content-center h-6 w-6 rounded-full bg-slate-900 text-white text-[11px]">{i + 1}</span>
                    {t}
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{i===0?"Quick evaluation & placement":i===1?"Weekly goals, games, and practice":"Showcases, debates, and reading reels"}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-16 bg-gradient-to-br from-orange-50 via-white to-sky-50">
        <div className="mx-auto max-w-3xl text-center px-4">
          <h3 className="text-3xl font-extrabold text-slate-900">Ready to start?</h3>
          <p className="mt-2 text-slate-600">Book a free trial or chat with us on WhatsApp. We’ll suggest the best course and schedule for your child.</p>
          <div className="mt-6 flex justify-center gap-3">
            <a href="/contact" className="rounded-xl bg-slate-900 text-white px-5 py-2.5 font-semibold">Book a Free Trial</a>
            <a href="https://wa.me/919666095553" className="rounded-xl bg-white border border-slate-200 px-5 py-2.5 font-semibold hover:bg-slate-50">WhatsApp Us</a>
          </div>
          <p className="mt-3 text-xs text-slate-500">Payments: UPI • Bank Transfer (manual) • Online Autopay (subscription)</p>
        </div>
      </section>
    </main>
  );
}
