// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedBlog?: string;
  relatedCourse?: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
};

function renderAnswer(answer: string) {
  if (answer.includes('<a')) {
    return <div className="faq-answer prose prose-sm max-w-none text-slate-600 prose-a:text-primary-700" dangerouslySetInnerHTML={{ __html: answer }} />;
  }

  return <p className="faq-answer text-sm leading-7 text-slate-600">{answer}</p>;
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>(items[0] ? [items[0].id] : []);

  useEffect(() => {
    setExpandedIds((current) => current.filter((id) => items.some((item) => item.id === id)));
  }, [items]);

  const allExpanded = items.length > 0 && expandedIds.length === items.length;

  return (
    <div>
      <div className="space-y-4">
        {items.map((item) => {
          const isOpen = expandedIds.includes(item.id);

          return (
            <article
              key={item.id}
              className={`overflow-hidden rounded-[1.75rem] border transition ${
                isOpen
                  ? 'border-slate-300 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]'
                  : 'border-slate-200/80 bg-white/88 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedIds((current) =>
                    current.includes(item.id)
                      ? current.filter((id) => id !== item.id)
                      : [...current, item.id],
                  )
                }
                className="flex w-full items-start justify-between gap-6 px-5 py-5 text-left sm:px-6"
              >
                <div className="min-w-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-700">
                    {item.category}
                  </p>
                  <h3 className="faq-question text-lg font-semibold leading-7 text-slate-900">{item.question}</h3>
                </div>
                <span
                  className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition ${
                    isOpen ? 'rotate-45 bg-slate-900 text-white border-slate-900' : 'bg-slate-50'
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6">
                  {renderAnswer(item.answer)}

                  {(item.relatedBlog || item.relatedCourse) && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {item.relatedBlog && (
                        <Link
                          className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                          to={item.relatedBlog}
                        >
                          Read related blog
                        </Link>
                      )}
                      {item.relatedCourse && (
                        <Link
                          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                          to={item.relatedCourse}
                        >
                          Explore course
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setExpandedIds(allExpanded ? [] : items.map((item) => item.id))}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
        >
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
    </div>
  );
}
