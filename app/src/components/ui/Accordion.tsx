import { useState } from "react";
import type { ReactNode } from "react";

type Item = { question: string; answer: ReactNode };
type Props = { items: Item[] };

export default function Accordion({ items }: Props) {
  return (
    <div className="divide-y rounded-2xl border overflow-hidden">
      {items.map((it, i) => (
        <AccordionItem key={i} {...it} />
      ))}
    </div>
  );
}

function AccordionItem({ question, answer }: { question: string; answer: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="group"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer select-none list-none px-5 py-4 flex items-center justify-between text-lg font-medium">
        <span>{question}</span>
        <span className="ml-4 text-gray-500 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="px-5 pb-5 text-gray-700">{answer}</div>
    </details>
  );
}
