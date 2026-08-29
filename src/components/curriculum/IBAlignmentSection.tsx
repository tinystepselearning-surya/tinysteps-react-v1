const schoolContexts = [
  {
    title: 'Transferable reading foundations',
    detail:
      'Decoding, fluency, vocabulary, and sentence-level understanding are useful across school systems because they support the child’s ability to access English text independently.',
  },
  {
    title: 'Grammar used in real language',
    detail:
      'Children practise grammar through complete sentences, correction, writing, and speaking so rules become usable rather than isolated definitions.',
  },
  {
    title: 'Communication and reflection',
    detail:
      'Speaking tasks include idea building, explanation, storytelling, feedback, and reflection so children learn to organise and express meaning clearly.',
  },
];

const IBAlignmentSection = () => (
  <section className="px-6 pb-10" aria-labelledby="school-context-heading">
    <div className="mx-auto max-w-6xl rounded-[32px] border border-white/40 bg-white/85 p-6 shadow-card-hover md:p-8">
      <div className="text-center">
        <div className="gradient-chip mx-auto w-max">School-system flexibility</div>
        <h2 id="school-context-heading" className="mt-3 text-3xl font-semibold text-gray-900">How the roadmap supports different school contexts</h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-gray-700 md:text-base">
          Tiny Steps teaches transferable English skills that can support children studying in CBSE, ICSE, IB, Cambridge, and other school environments. Tiny Steps Learning is an independent learning provider; these references describe learner backgrounds and skill transfer, not formal affiliation or accreditation.
        </p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {schoolContexts.map((item) => (
          <article key={item.title} className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-slate-50 to-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-700">{item.detail}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default IBAlignmentSection;
