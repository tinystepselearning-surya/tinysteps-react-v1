import { useState } from "react";

type AccordionItem = {
  question: string;
  answer: string;
};

function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const open = openIndex === idx;
        return (
          <div key={idx} className="border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : idx)}
              className="w-full text-left px-4 py-3 flex items-center justify-between"
              aria-expanded={open}
            >
              <span className="font-medium">{item.question}</span>
              <span className={`transform transition-transform ${open ? "rotate-180" : "rotate-0"}`}>
                ▾
              </span>
            </button>
            {open && (
              <div className="px-4 py-3 border-t">
                <p className="text-sm text-gray-700">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FAQ() {
  const general = [
    { question: "Are the classes live or recorded?", answer: "Live on Zoom. Recordings are shared for revision when requested." },
    { question: "What are the batch sizes?", answer: "Small groups (3–6 learners) to ensure one-on-one attention." },
    { question: "How do payments work?", answer: "Monthly plans. UPI, cards, and bank transfer supported." },
  ];

  const phonics = [
    { question: "What levels do you cover?", answer: "A–Z sounds, CVC blending, digraphs, long vowels, Magic-E, rules." },
    { question: "Do you give worksheets?", answer: "Yes—digital worksheets, decodables, and mini-games each week." },
  ];

  const grammar = [
    { question: "Is grammar taught with writing?", answer: "Yes—mini-lessons + writing labs (narrative/info/opinion)." },
    { question: "Do you share feedback?", answer: "Yes—rubric-based feedback and simple action points." },
  ];

  const speaking = [
    { question: "Will my child get stage practice?", answer: "Weekly speaking slots + monthly showcase to build confidence." },
    { question: "Do you correct accent/pronunciation?", answer: "We coach clarity, diction, pace, and expression with drills." },
  ];

  return (
    <div className="px-4 py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>

      <h2 className="text-xl font-semibold mt-8 mb-3">General</h2>
      <Accordion items={general} />

      <h2 className="text-xl font-semibold mt-8 mb-3">Phonics</h2>
      <Accordion items={phonics} />

      <h2 className="text-xl font-semibold mt-8 mb-3">Grammar</h2>
      <Accordion items={grammar} />

      <h2 className="text-xl font-semibold mt-8 mb-3">Public Speaking</h2>
      <Accordion items={speaking} />
    </div>
  );
}
