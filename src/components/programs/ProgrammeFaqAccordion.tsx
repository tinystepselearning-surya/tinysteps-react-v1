type ProgrammeFaqItem = {
  question: string;
  answer: string;
};

type ProgrammeFaqAccordionProps = {
  items: readonly ProgrammeFaqItem[];
  accent?: 'sky' | 'orange' | 'violet';
};

const accentClass = {
  sky: 'group-open:bg-sky-100 group-open:text-sky-800',
  orange: 'group-open:bg-orange-100 group-open:text-orange-800',
  violet: 'group-open:bg-violet-100 group-open:text-violet-800',
} as const;

export default function ProgrammeFaqAccordion({
  items,
  accent = 'sky',
}: ProgrammeFaqAccordionProps) {
  return (
    <div data-programme-faq-accordion className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="faq-question flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left text-[16px] font-semibold leading-6 text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-400 md:text-[17px] [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-light text-slate-500 transition duration-200 group-open:rotate-45 ${accentClass[accent]}`}
            >
              +
            </span>
          </summary>
          <p className="faq-answer max-w-5xl pb-5 pr-10 text-[15px] leading-7 text-slate-600 md:text-base">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
