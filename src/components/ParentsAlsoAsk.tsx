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
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">
        Common questions parents ask about this topic
      </p>
      
      <div className="mt-6 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between gap-3 hover:bg-gray-50"
            >
              <span className="font-medium text-gray-900">{item.question}</span>
              <ChevronDown
                size={20}
                className={`flex-shrink-0 text-gray-500 transition ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {openIndex === index && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <p className="text-sm text-gray-700 leading-relaxed">
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
