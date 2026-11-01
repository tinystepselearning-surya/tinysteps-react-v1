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
    <section aria-labelledby="teacher-quality-audits" className="bg-[#f4f8ff] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Teaching standards and ongoing reviews</p>
        <h2 id="teacher-quality-audits" className="mt-3 max-w-4xl font-heading text-3xl font-bold tracking-tight text-[#10243e] sm:text-4xl">
          Teacher training is only the beginning. We keep reviewing classroom quality.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Tiny Steps combines teacher selection, curriculum-led training, academic observation and professional-conduct reviews.
          We use what we learn to give teachers actionable feedback and maintain consistent learning expectations.
        </p>
        <div className="mt-9 grid gap-5 md:grid-cols-2">
          {qualityChecks.map((check, index) => (
            <article key={check.title} className="rounded-[24px] border border-blue-100 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C2410C]">Quality checkpoint {String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 font-heading text-xl font-bold text-slate-900">{check.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{check.detail}</p>
            </article>
          ))}
        </div>
        <p className="mt-7 max-w-3xl text-sm leading-6 text-slate-600">
          Reviews are ongoing and targeted; this is not a claim that every class is individually audited or that external accreditation has been awarded.
          Read more about our{' '}
          <Link to="/curriculum" className="font-semibold text-blue-800 underline underline-offset-4">structured curriculum</Link>.
        </p>
      </div>
    </section>
  );
}
