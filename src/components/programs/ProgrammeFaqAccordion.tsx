type ProgrammeFaqItem = {
  question: string;
  answer: string;
};

type ProgrammeFaqAccordionProps = {
  items: readonly ProgrammeFaqItem[];
  accent?: 'sky' | 'orange' | 'violet';
};

const accentClasses = {
  sky: 'group-open:text-sky-700',
  orange: 'group-open:text-orange-700',
  violet: 'group-open:text-violet-700',
} as const;

export default function ProgrammeFaqAccordion({
  items,
  accent = 'sky',
}: ProgrammeFaqAccordionProps) {
  return (
    <div data-programme-faq-accordion className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="faq-question flex cursor-pointer list-none items-start justify-between gap-5 py-4 text-left [&::-webkit-details-marker]:hidden">
            <span className={`text-[16px] font-semibold leading-6 text-slate-900 transition md:text-[17px] ${accentClasses[accent]}`}>
              {item.question}
            </span>
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-medium leading-none text-slate-500 transition group-open:rotate-45 group-open:border-slate-300 group-open:text-slate-900"
            >
              +
            </span>
          </summary>
          <div className="faq-answer max-w-4xl pb-4 pr-10 text-sm leading-6 text-slate-600 md:text-[15px] md:leading-7">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
