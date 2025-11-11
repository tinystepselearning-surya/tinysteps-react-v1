// @ts-nocheck
import React, { useMemo, useState } from 'react';

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: 'phonics' | 'grammar' | 'speaking' | 'online' | 'general';
  relatedBlog?: string;
  relatedCourse?: string;
};

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all'|FAQItem['category']>('all');
  const filtered = useMemo(() => selectedCategory === 'all' ? items : items.filter(i => i.category === selectedCategory), [items, selectedCategory]);

  const categories: { key: 'all'|FAQItem['category']; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'phonics', label: 'Phonics' },
    { key: 'grammar', label: 'Grammar' },
    { key: 'speaking', label: 'Public Speaking' },
    { key: 'online', label: 'Online' },
    { key: 'general', label: 'General' },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat.key} onClick={() => setSelectedCategory(cat.key)} className={`rounded-full px-3 py-1 text-sm ${selectedCategory===cat.key?'bg-primary-500 text-white':'bg-slate-100'}`}>{cat.label}</button>
        ))}
      </div>
      <div className="divide-y rounded-2xl bg-white shadow ring-1 ring-slate-200">
        {filtered.map((item) => (
          <div key={item.id} className="p-4">
            <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="flex w-full items-center justify-between text-left">
              <span className="font-medium text-gray-900">{item.question}</span>
              <span className={`transition-transform ${expanded===item.id?'rotate-180':''}`}>▼</span>
            </button>
            {expanded === item.id && (
              <div className="mt-3 text-sm text-gray-700">
                <p>{item.answer}</p>
                <div className="mt-2 flex items-center gap-3">
                  {item.relatedBlog && (
                    <a className="interactive-link text-primary-600" href={item.relatedBlog}>Read full article →</a>
                  )}
                  {item.relatedCourse && (
                    <a className="interactive-link text-primary-600" href={item.relatedCourse}>Explore course →</a>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span>Was this helpful?</span>
                  <button className="rounded-full border px-2 py-0.5">Yes</button>
                  <button className="rounded-full border px-2 py-0.5">No</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => setExpanded('*')} className="rounded-full border px-3 py-1 text-sm">Expand All</button>
        <button onClick={() => setExpanded(null)} className="rounded-full border px-3 py-1 text-sm">Collapse All</button>
      </div>
    </div>
  );
}

