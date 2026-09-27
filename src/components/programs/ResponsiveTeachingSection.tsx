type ResponsiveTeachingSectionProps = {
  id: string;
  program: string;
  introduction: string;
  steps: Array<{ title: string; detail: string }>;
  observation: string;
  appearance?: 'default' | 'premium';
};

export default function ResponsiveTeachingSection({
  id,
  program,
  introduction,
  steps,
  observation,
  appearance = 'default',
}: ResponsiveTeachingSectionProps) {
  const headingId = `${id}-heading`;
  const premium = appearance === 'premium';

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      data-program-delivery={program.toLowerCase()}
      data-programme-teaching-appearance={appearance}
      className={premium ? 'px-4 py-7 sm:px-5 md:py-9 lg:px-6' : 'px-4 py-10 sm:px-5 md:py-14 lg:px-6'}
    >
      <div
        className={
          premium
            ? 'mx-auto max-w-6xl border-y border-slate-200/80 py-6 md:py-8'
            : 'mx-auto max-w-6xl rounded-[30px] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/45 to-sky-50/55 p-6 shadow-sm md:p-8'
        }
      >
        <div className={premium ? 'grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10' : ''}>
          <div>
            <p className={premium ? 'text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500' : 'text-xs font-bold uppercase tracking-[0.18em] text-emerald-800'}>
              Responsive teaching in practice
            </p>
            <h2 id={headingId} className={premium ? 'mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl' : 'mt-3 text-2xl font-bold text-slate-950 sm:text-3xl'}>
              How teachers deliver this course
            </h2>
            <p className={premium ? 'mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-[15px]' : 'mt-4 max-w-4xl text-sm leading-7 text-slate-700 md:text-base'}>
              {introduction}
            </p>
          </div>

          <div>
            <ol className={premium ? 'grid gap-3 md:grid-cols-3' : 'mt-7 grid gap-4 md:grid-cols-3'}>
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className={
                    premium
                      ? 'border-l border-slate-200 pl-4 first:border-l-0 first:pl-0 md:first:border-l md:first:pl-4'
                      : 'rounded-2xl border border-slate-200 bg-white/90 p-5'
                  }
                >
                  <span className={premium ? 'text-[10px] font-bold tracking-[0.16em] text-orange-600' : 'text-xs font-black tracking-[0.16em] text-orange-600'}>
                    0{index + 1}
                  </span>
                  <h3 className={premium ? 'mt-2 text-base font-semibold text-slate-950' : 'mt-3 text-lg font-bold text-slate-950'}>{step.title}</h3>
                  <p className={premium ? 'mt-1.5 text-sm leading-6 text-slate-600' : 'mt-2 text-sm leading-6 text-slate-700'}>{step.detail}</p>
                </li>
              ))}
            </ol>

            <p className={premium ? 'mt-5 text-sm leading-6 text-slate-600' : 'mt-6 rounded-2xl border border-emerald-200 bg-white/80 p-4 text-sm leading-6 text-slate-700'}>
              <strong className="text-slate-950">What the teacher watches:</strong> {observation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
