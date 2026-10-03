const schoolContexts = [
  {
    title: 'Reading foundations',
    detail:
      'Decoding, fluency, vocabulary, and sentence-level understanding support a child’s ability to access English text across school contexts.',
  },
  {
    title: 'Language control',
    detail:
      'Grammar is practised through complete sentences, correction, writing, and speaking so rules become usable rather than isolated definitions.',
  },
  {
    title: 'Communication',
    detail:
      'Speaking tasks include idea building, explanation, storytelling, feedback, and reflection so children learn to organise and express meaning clearly.',
  },
];

const IBAlignmentSection = () => (
  <section className="border-y border-slate-200 bg-[#f7f8fa]" aria-labelledby="school-context-heading">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            School-system flexibility
          </p>
          <h2
            id="school-context-heading"
            className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl"
          >
            Transferable English skills across school contexts
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
            Tiny Steps teaches transferable English skills that can support children studying in CBSE, ICSE, IB,
            Cambridge, and other school environments. Tiny Steps Learning is an independent learning provider;
            these references describe learner backgrounds and skill transfer, not formal affiliation or
            accreditation.
          </p>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {schoolContexts.map((item, index) => (
            <article key={item.title} className="grid gap-3 py-5 sm:grid-cols-[46px_180px_1fr] sm:items-start sm:gap-5">
              <span className="text-xs font-black text-orange-600">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="text-base font-bold text-slate-950">{item.title}</h3>
              <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default IBAlignmentSection;
