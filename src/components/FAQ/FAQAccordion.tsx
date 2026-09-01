// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export type FAQLink = {
  to: string;
  label: string;
  emphasis?: 'primary' | 'secondary';
};

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  searchTerms?: string[];
  shortAnswer?: string;
  links?: FAQLink[];
  relatedBlog?: string;
  relatedBlogLabel?: string;
  relatedCourse?: string;
  relatedCourseLabel?: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
  categoryLabels?: Record<string, string>;
  onToggle?: (item: FAQItem, isOpen: boolean) => void;
};

function renderAnswer(answer: string) {
  if (answer.includes('<a')) {
    return (
      <div
        className="faq-answer prose prose-sm max-w-none text-slate-600 prose-a:text-primary-700"
        dangerouslySetInnerHTML={{ __html: answer }}
      />
    );
  }

  return <p className="faq-answer text-sm leading-7 text-slate-600">{answer}</p>;
}

function resolveLinks(item: FAQItem): FAQLink[] {
  if (item.links?.length) return item.links;

  const fallbackLinks: FAQLink[] = [];
  if (item.relatedBlog) {
    fallbackLinks.push({
      to: item.relatedBlog,
      label: item.relatedBlogLabel || 'Read related guide',
      emphasis: 'secondary',
    });
  }
  if (item.relatedCourse) {
    fallbackLinks.push({
      to: item.relatedCourse,
      label: item.relatedCourseLabel || 'Explore learning options',
      emphasis: 'primary',
    });
  }
  return fallbackLinks;
}

export default function FAQAccordion({ items, categoryLabels = {}, onToggle }: FAQAccordionProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>(items[0] ? [items[0].id] : []);

  useEffect(() => {
    setExpandedIds((current) => {
      const visible = current.filter((id) => items.some((item) => item.id === id));
      if (items.length > 0 && visible.length === 0) return [items[0].id];
      return visible;
    });
  }, [items]);

  const allExpanded = items.length > 0 && expandedIds.length === items.length;

  return (
    <div>
      <div className="space-y-4">
        {items.map((item) => {
          const isOpen = expandedIds.includes(item.id);
          const questionId = `faq-question-${item.id}`;
          const answerId = `faq-answer-${item.id}`;
          const links = resolveLinks(item);

          return (
            <article
              id={`faq-${item.id}`}
              key={item.id}
              className={`scroll-mt-28 overflow-hidden rounded-[1.75rem] border transition ${
                isOpen
                  ? 'border-slate-300 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]'
                  : 'border-slate-200/80 bg-white/88 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <h3 className="m-0">
                <button
                  id={questionId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => {
                    const nextOpen = !isOpen;
                    setExpandedIds((current) =>
                      current.includes(item.id)
                        ? current.filter((id) => id !== item.id)
                        : [...current, item.id],
                    );
                    onToggle?.(item, nextOpen);
                  }}
                  className="flex w-full items-start justify-between gap-6 px-5 py-5 text-left sm:px-6"
                >
                  <span className="min-w-0">
                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-700">
                      {categoryLabels[item.category] || item.category}
                    </span>
                    <span className="faq-question block text-lg font-semibold leading-7 text-slate-900">
                      {item.question}
                    </span>
                  </span>
                  <span
                    className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition ${
                      isOpen ? 'rotate-45 border-slate-900 bg-slate-900 text-white' : 'bg-slate-50'
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
              </h3>

              <div
                id={answerId}
                role="region"
                aria-labelledby={questionId}
                hidden={!isOpen}
                className="border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6"
              >
                {renderAnswer(item.answer)}

                {links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {links.map((link) => (
                      <Link
                        key={`${item.id}-${link.to}-${link.label}`}
                        className={
                          link.emphasis === 'primary'
                            ? 'inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800'
                            : 'inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
                        }
                        to={link.to}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setExpandedIds(allExpanded ? [] : items.map((item) => item.id))}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {allExpanded ? 'Collapse all answers' : 'Expand all answers'}
          </button>
        </div>
      )}
    </div>
  );
}
