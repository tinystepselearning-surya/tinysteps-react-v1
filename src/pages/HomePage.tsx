// @ts-nocheck
import React from "react";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import { ModernCard } from "../components/ui/ModernCard";
import Footer from "../components/common/Footer";

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
      <section className="bg-gradient-to-b from-white via-sky-50/30 to-white pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-100">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"/>
              Live 1:1 & Small Group Classes
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
              Tiny Steps:<br/>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Confident Readers & Speakers
              </span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Engaging lessons, interactive games, and progress dashboards—built for busy parents and curious kids.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium">Small groups or 1:1</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-medium">Parent-loved lessons</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-medium">Expert teachers</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Center-aligned course links */}
      <section className="py-16 bg-gradient-to-b from-white to-slate-50/50">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Explore Our Courses</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Choose the perfect learning path for your child's development journey</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link to="/phonics" className="group relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 min-w-[200px] justify-center">
                <BookOpen className="h-6 w-6" />
                <span className="text-lg">Phonics & Reading</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link to="/grammar" className="group relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 min-w-[200px] justify-center">
                <PenSquare className="h-6 w-6" />
                <span className="text-lg">Grammar & Writing</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Link to="/speaking" className="group relative overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 inline-flex items-center gap-3 min-w-[200px] justify-center">
                <Mic2 className="h-6 w-6" />
                <span className="text-lg">Public Speaking</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Why Choose Us"
            title="Why Parents Love Tiny Steps"
            subtitle="Discover what makes our online learning platform the perfect choice for your child's education."
          />

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
          >
            <motion.div
              variants={item}
              className="group bg-white rounded-3xl p-8 shadow-lg border border-slate-200/60 hover:shadow-2xl hover:border-slate-300/60 transition-all duration-300"
              whileHover={{ y: -8 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Expert Teachers</h3>
              <p className="text-slate-600 leading-relaxed">Certified educators with years of experience in early childhood education, creating engaging and supportive learning environments.</p>
            </motion.div>
            <motion.div
              variants={item}
              className="group bg-white rounded-3xl p-8 shadow-lg border border-slate-200/60 hover:shadow-2xl hover:border-slate-300/60 transition-all duration-300"
              whileHover={{ y: -8 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Personalized Learning</h3>
              <p className="text-slate-600 leading-relaxed">Adaptive curriculum that grows with your child at their own pace, ensuring optimal challenge and confidence-building.</p>
            </motion.div>
            <motion.div
              variants={item}
              className="group bg-white rounded-3xl p-8 shadow-lg border border-slate-200/60 hover:shadow-2xl hover:border-slate-300/60 transition-all duration-300"
              whileHover={{ y: -8 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Interactive Games</h3>
              <p className="text-slate-600 leading-relaxed">Fun, educational games that make learning engaging and memorable, turning practice into playtime.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What Parents Say */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50/30">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Testimonials"
            title="What Parents Say About Us"
            subtitle="Hear from parents who have seen their children thrive with Tiny Steps."
          />

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
          >
            <motion.div
              variants={item}
              className="group bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-indigo-50/80 rounded-3xl p-8 border border-blue-200/50 shadow-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-8 text-lg leading-relaxed italic">"My daughter went from struggling with reading to devouring books. The teachers are amazing and so patient with her."</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-blue-700 font-bold text-lg">SM</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">Sarah M.</p>
                  <p className="text-slate-600">Parent of 7-year-old</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              variants={item}
              className="group bg-gradient-to-br from-emerald-50/80 via-emerald-100/60 to-teal-50/80 rounded-3xl p-8 border border-emerald-200/50 shadow-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-8 text-lg leading-relaxed italic">"The progress tracking is fantastic. I can see exactly what my son is learning each week and celebrate his achievements."</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-emerald-700 font-bold text-lg">RJ</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">Rajesh J.</p>
                  <p className="text-slate-600">Parent of 6-year-old</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              variants={item}
              className="group bg-gradient-to-br from-purple-50/80 via-purple-100/60 to-pink-50/80 rounded-3xl p-8 border border-purple-200/50 shadow-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-8 text-lg leading-relaxed italic">"Flexible scheduling and excellent communication. Perfect for our busy family schedule and lifestyle."</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-purple-700 font-bold text-lg">AK</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">Anita K.</p>
                  <p className="text-slate-600">Parent of 5-year-old</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LRSW Methodology */}
      <section className="py-24 bg-gradient-to-b from-slate-50/30 to-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <SectionHeader
            eyebrow="Our Methodology"
            title="LRSW: Listen, Read, Speak, Write"
            subtitle="Our proven 4-step methodology ensures comprehensive language development."
          />

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16"
          >
            {[
              {
                letter: 'L',
                title: 'Listen',
                description: 'Active listening skills and comprehension through engaging audio activities and interactive stories.',
                color: 'from-blue-400 to-blue-600',
                glow: 'shadow-blue-500/30'
              },
              {
                letter: 'R',
                title: 'Read',
                description: 'Phonics, vocabulary, and reading fluency with personalized practice and progress tracking.',
                color: 'from-emerald-400 to-emerald-600',
                glow: 'shadow-emerald-500/30'
              },
              {
                letter: 'S',
                title: 'Speak',
                description: 'Clear communication and public speaking through confidence-building activities and presentations.',
                color: 'from-purple-400 to-purple-600',
                glow: 'shadow-purple-500/30'
              },
              {
                letter: 'W',
                title: 'Write',
                description: 'Grammar, creative writing, and expression through structured lessons and fun writing projects.',
                color: 'from-orange-400 to-orange-600',
                glow: 'shadow-orange-500/30'
              }
            ].map((step, index) => (
              <motion.div
                key={step.letter}
                variants={item}
                className={`relative bg-white rounded-3xl p-8 shadow-xl border border-slate-200/60 hover:shadow-2xl hover:border-slate-300/60 transition-all duration-300 group ${step.glow}`}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`} />
                <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center text-white font-bold text-3xl mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {step.letter}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed text-center">{step.description}</p>
                <motion.div
                  className={`mt-6 h-1 bg-gradient-to-r ${step.color} rounded-full mx-auto max-w-24`}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  style={{ originX: 0 }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="py-24 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <SectionHeader
              eyebrow="Learning Journey"
              title="Here's how your child progresses"
              subtitle="Start where you are, level up with each lesson, and shine in real-world tasks."
            />
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="relative"
          >
            {/* Progress Path */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 transform -translate-y-1/2 z-0" />

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {[
                {
                  step: 1,
                  title: "Start Where You Are",
                  description: "Quick assessment and personalized placement. No pressure, just the right starting point.",
                  icon: "🎯",
                  color: "from-blue-400 to-blue-600",
                  details: ["Initial evaluation", "Skill assessment", "Custom learning path"]
                },
                {
                  step: 2,
                  title: "Level Up with Each Lesson",
                  description: "Weekly goals, interactive games, and consistent practice build confidence step by step.",
                  icon: "🚀",
                  color: "from-purple-400 to-purple-600",
                  details: ["Weekly objectives", "Engaging activities", "Progress tracking"]
                },
                {
                  step: 3,
                  title: "Shine in Real-World Tasks",
                  description: "Apply skills in presentations, reading challenges, and creative projects that matter.",
                  icon: "✨",
                  color: "from-pink-400 to-pink-600",
                  details: ["Showcase events", "Real-world application", "Celebrate achievements"]
                }
              ].map((phase, index) => (
                <motion.div
                  key={phase.step}
                  variants={item}
                  className="bg-white rounded-3xl p-10 shadow-xl border border-slate-200/60 hover:shadow-2xl hover:border-slate-300/60 transition-all duration-300 group"
                  whileHover={{ y: -10, scale: 1.02 }}
                >
                  {/* Step Number */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${phase.color} rounded-full flex items-center justify-center text-white font-bold text-2xl mb-8 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {phase.step}
                  </div>

                  {/* Icon */}
                  <div className="text-5xl mb-6">{phase.icon}</div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{phase.title}</h3>

                  {/* Description */}
                  <p className="text-slate-600 mb-8 leading-relaxed text-lg">{phase.description}</p>

                  {/* Details */}
                  <ul className="space-y-3">
                    {phase.details.map((detail, i) => (
                      <li key={i} className="flex items-center justify-center gap-3 text-base text-slate-700">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>

                  {/* Connecting Arrow (hidden on mobile) */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-20">
                      <motion.div
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-200"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.2 }}
                      >
                        <ArrowRight className="h-5 w-5 text-slate-600" />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-24 bg-gradient-to-br from-orange-50 via-white to-sky-50">
        <div className="mx-auto max-w-4xl text-center px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-4xl font-extrabold text-slate-900 mb-6">Ready to start your child's learning journey?</h3>
            <p className="text-xl text-slate-600 mb-12 leading-relaxed">Book a free trial or chat with us on WhatsApp. We'll suggest the best course and schedule for your child.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-8">
              <motion.a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Book a Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://wa.me/919666095553"
                className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-slate-200 text-slate-900 font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                WhatsApp Us
              </motion.a>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
              <p className="text-sm text-slate-600 font-medium mb-2">Flexible Payment Options</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  UPI
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Bank Transfer
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Online Autopay
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
