import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FAQItem = {
  question: string;
  answer: string;
};

type ParentsAlsoAskProps = {
  items: FAQItem[];
  title?: string;
};

export const ParentsAlsoAsk: React.FC<ParentsAlsoAskProps> = ({
  items = [],
  title = 'Parents Also Ask',
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Parents also ask</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Common questions parents ask about this topic
      </p>
      
      <div className="mt-6 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50/70 transition hover:border-slate-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/70"
            >
              <span className="font-semibold text-slate-900">{item.question}</span>
              <ChevronDown
                size={20}
                className={`flex-shrink-0 text-slate-500 transition ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {openIndex === index && (
              <div className="border-t border-slate-200 bg-white/80 px-5 py-4">
                <p className="text-sm leading-7 text-slate-700">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ParentsAlsoAsk;
