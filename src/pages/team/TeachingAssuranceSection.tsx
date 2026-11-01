import { Link } from 'react-router-dom';

const qualityChecks = [
  {
    title: 'Screened before teaching',
    detail: 'We review spoken English, subject understanding, child interaction, reliability and readiness for live online classes.',
  },
  {
    title: 'Structured induction and preparation',
    detail: 'Teachers receive programme pathways, lesson resources and guidance on pacing, modelling, purposeful practice and learner participation.',
  },
  {
    title: 'Ongoing lesson and conduct reviews',
    detail: 'Our academic team reviews selected lessons and recordings against teaching expectations, including accuracy, interaction, lesson focus and professional conduct.',
  },
  {
    title: 'Feedback, coaching and follow-up',
    detail: 'Review findings and parent feedback inform individual coaching, corrections and continued teacher development.',
  },
];

export function TeachingAssuranceSection() {
  return (
    <section id="teaching-quality" aria-labelledby="teacher-quality-audits" className="border-y border-[#E4DCF8] bg-gradient-to-br from-[#FBF8FF] via-white to-[#F3FAFF] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#77518a]">Teaching standards and ongoing reviews</p>
        <h2 id="teacher-quality-audits" className="mt-3 max-w-4xl font-heading text-3xl font-bold tracking-tight text-[#102A43] sm:text-4xl">
          Training, observation and ongoing quality checks
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Tiny Steps combines teacher selection, curriculum-led training, academic observation and professional-conduct reviews.
          We use what we learn to give teachers actionable feedback and maintain consistent learning expectations.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {qualityChecks.map((check, index) => (
            <article key={check.title} className="rounded-[22px] border border-[#E4DCF8] bg-white/95 p-5 shadow-[0_8px_25px_rgba(16,36,62,0.035)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C2410C]">Quality checkpoint {String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 font-heading text-xl font-bold text-slate-900">{check.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{check.detail}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-slate-600">
          Our academic reviews focus on instructional quality and professional standards, with follow-up when improvements are needed.
          Explore our{' '}
          <Link to="/curriculum" className="font-semibold text-blue-800 underline underline-offset-4">structured curriculum</Link>.
        </p>
      </div>
    </section>
  );
}