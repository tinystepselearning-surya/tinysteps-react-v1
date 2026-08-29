type ResponsiveTeachingSectionProps = {
  id: string;
  program: string;
  introduction: string;
  steps: Array<{ title: string; detail: string }>;
  observation: string;
};

export default function ResponsiveTeachingSection({
  id,
  program,
  introduction,
  steps,
  observation,
}: ResponsiveTeachingSectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      data-program-delivery={program.toLowerCase()}
      className="px-4 py-10 sm:px-5 md:py-14 lg:px-6"
    >
      <div className="mx-auto max-w-6xl rounded-[30px] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/45 to-sky-50/55 p-6 shadow-sm md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">Responsive teaching in practice</p>
        <h2 id={headingId} className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">How teachers deliver this course</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">{introduction}</p>

        <ol className="mt-7 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-slate-200 bg-white/90 p-5">
              <span className="text-xs font-black tracking-[0.16em] text-orange-600">0{index + 1}</span>
              <h3 className="mt-3 text-lg font-bold text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{step.detail}</p>
            </li>
          ))}
        </ol>

        <p className="mt-6 rounded-2xl border border-emerald-200 bg-white/80 p-4 text-sm leading-6 text-slate-700">
          <strong className="text-slate-950">What the teacher watches:</strong> {observation}
        </p>
      </div>
    </section>
  );
}
