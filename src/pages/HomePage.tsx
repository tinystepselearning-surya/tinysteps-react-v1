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
              <div className="mt-6 flex items-center gap-6 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2"><Users className="h-4 w-4"/> Small groups or 1:1</div>
                <div className="inline-flex items-center gap-2"><Star className="h-4 w-4"/> Parent-loved lessons</div>
                <div className="inline-flex items-center gap-2"><UserCheck className="h-4 w-4"/> Expert teachers</div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-sky-100 via-white to-orange-100 ring-1 ring-black/5 shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-slate-600 font-medium">Interactive Learning Awaits</p>
                  <p className="text-sm text-slate-500 mt-2">Join thousands of happy learners</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Center-aligned course links */}
      <section className="py-8 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-6 overflow-x-auto no-scrollbar">
            <Link to="/phonics" className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transform transition-all inline-flex items-center gap-2">
              <span className="text-sm">Phonics & Reading</span>
            </Link>
            <Link to="/grammar" className="px-6 py-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold shadow-lg hover:scale-105 transform transition-all inline-flex items-center gap-2">
              <span className="text-sm">Grammar & Writing</span>
            </Link>
            <Link to="/speaking" className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 text-white font-semibold shadow-lg hover:scale-105 transform transition-all inline-flex items-center gap-2">
              <span className="text-sm">Public Speaking</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-14 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div
              variants={item}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Expert Teachers</h3>
              <p className="text-slate-600">Certified educators with years of experience in early childhood education.</p>
            </motion.div>
            <motion.div
              variants={item}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Personalized Learning</h3>
              <p className="text-slate-600">Adaptive curriculum that grows with your child at their own pace.</p>
            </motion.div>
            <motion.div
              variants={item}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Interactive Games</h3>
              <p className="text-slate-600">Fun, educational games that make learning engaging and memorable.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What Parents Say */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div
              variants={item}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-4">"My daughter went from struggling with reading to devouring books. The teachers are amazing!"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-semibold text-sm">SM</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Sarah M.</p>
                  <p className="text-sm text-slate-600">Parent of 7-year-old</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              variants={item}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-4">"The progress tracking is fantastic. I can see exactly what my son is learning each week."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold text-sm">RJ</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Rajesh J.</p>
                  <p className="text-sm text-slate-600">Parent of 6-year-old</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              variants={item}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-700 mb-4">"Flexible scheduling and excellent communication. Perfect for our busy family."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-semibold text-sm">AK</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Anita K.</p>
                  <p className="text-sm text-slate-600">Parent of 5-year-old</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LRSW Methodology */}
      <section className="py-14 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                letter: 'L',
                title: 'Listen',
                description: 'Active listening skills and comprehension',
                color: 'from-blue-400 to-blue-600',
                glow: 'shadow-blue-500/50'
              },
              {
                letter: 'R',
                title: 'Read',
                description: 'Phonics, vocabulary, and reading fluency',
                color: 'from-green-400 to-green-600',
                glow: 'shadow-green-500/50'
              },
              {
                letter: 'S',
                title: 'Speak',
                description: 'Clear communication and public speaking',
                color: 'from-purple-400 to-purple-600',
                glow: 'shadow-purple-500/50'
              },
              {
                letter: 'W',
                title: 'Write',
                description: 'Grammar, creative writing, and expression',
                color: 'from-orange-400 to-orange-600',
                glow: 'shadow-orange-500/50'
              }
            ].map((step, index) => (
              <motion.div
                key={step.letter}
                variants={item}
                className={`relative bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-2xl transition-all group ${step.glow}`}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-4 text-white font-bold text-2xl shadow-lg`}>
                  {step.letter}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
                <motion.div
                  className={`mt-4 h-1 bg-gradient-to-r ${step.color} rounded-full`}
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
      <section className="py-14 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
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

            <div className="grid md:grid-cols-3 gap-8 relative z-10">
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
                  className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 text-center relative"
                  whileHover={{ y: -10, scale: 1.02 }}
                >
                  {/* Step Number */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${phase.color} rounded-full flex items-center justify-center text-white font-bold text-xl mb-6 mx-auto shadow-lg`}>
                    {phase.step}
                  </div>

                  {/* Icon */}
                  <div className="text-4xl mb-4">{phase.icon}</div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{phase.title}</h3>

                  {/* Description */}
                  <p className="text-slate-600 mb-6">{phase.description}</p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {phase.details.map((detail, i) => (
                      <li key={i} className="flex items-center justify-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>

                  {/* Connecting Arrow (hidden on mobile) */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                      <motion.div
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-200"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.2 }}
                      >
                        <ArrowRight className="h-4 w-4 text-slate-600" />
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

      <Footer />
    </main>
  );
}
