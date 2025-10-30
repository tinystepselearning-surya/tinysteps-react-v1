import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const stories = [
  {
    lead: "“Within a month of joining, Kavya started blending sounds on her own. The weekly notes helped us practise exactly what she learnt in class.”",
    name: "Anita Rao",
    place: "Bengaluru · Kavya, Grade 1",
    body:
      "When we enrolled in Phonics Foundations, Kavya recognised only a few sounds. The teacher’s diagnostic report mapped her starting point clearly. Every week we receive a short WhatsApp summary, and Kavya loves repeating the playful drills that arrive in our parent portal. We now see her picking up library books without prompting.",
  },
  {
    lead: "“The grammar roadmap gave us clarity on milestones. Aarav’s teacher keeps us in the loop after every project, so we know exactly where he shines and where to support.”",
    name: "Rahul & Sneha Sharma",
    place: "Pune · Aarav, Grade 4",
    body:
      "Grammar & Writing Lab has a mix of creative and analytical tasks. Aarav uploads his drafts, receives voice notes, and we see the rubric scores update in real time. The personalised homework suggestions are realistic, which makes practising at home actually doable.",
  },
  {
    lead: "“Riya went from whispering her speeches to presenting confidently in two terms. The speaking rubrics and videos on the portal make progress visible.”",
    name: "Meera Joshi",
    place: "Mumbai · Riya, Grade 5",
    body:
      "Public Speaking Studio gave Riya a safe environment to experiment. Teachers share annotated videos and coaching notes after every session. Watching her growth on the portal has been the best motivation for our family.",
  },
];

export default function Testimonials() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useScrollReveal<HTMLElement>({ variant: "right" });

  useEffect(() => {
    if (!open) return;
    contentRef.current?.focus();
  }, [open]);

  return (
    <section ref={sectionRef} id="testimonials" className="mx-auto max-w-6xl px-4 my-16">
      <div className="text-center mx-auto max-w-2xl">
        <h2 data-reveal-child className="text-[#e05c0a] text-2xl md:text-3xl font-extrabold">What parents are saying</h2>
        <p data-reveal-child style={{ "--reveal-child-delay": "80ms" } as CSSProperties} className="text-gray-600 mt-1">
          Families across India trust Tiny Steps to make literacy joyful. Hear how our teachers, routines, and parent updates build
          lasting confidence.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8" role="list">
        {stories.map((s, idx) => (
          <article
            key={idx}
            role="listitem"
            data-reveal-child
            style={{ "--reveal-child-delay": `${160 + idx * 90}ms` } as CSSProperties}
            className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4"
          >
            <blockquote className="m-0 text-[1.05rem] font-semibold leading-7 text-gray-900">{s.lead}</blockquote>
            <footer className="mt-auto">
              <cite className="not-italic font-extrabold text-[#e05c0a]">{s.name}</cite>
              <span className="block text-gray-600 text-sm mt-0.5">{s.place}</span>
            </footer>
            <button
              onClick={() => {
                setI(idx);
                setOpen(true);
              }}
              className="self-start rounded-full px-3 py-2 text-sm font-extrabold bg-[#ffefe6] text-[#e05c0a]"
            >
              Read full story
            </button>
          </article>
        ))}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur" onClick={() => setOpen(false)} />
          <div
            ref={contentRef}
            tabIndex={-1}
            className="relative bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-[min(720px,92vw)] max-h-[90svh] overflow-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-extrabold text-[#e05c0a]">Parent stories</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl leading-none px-2 rounded-lg text-gray-500 hover:bg-[#fff3ec]"
                aria-label="Close testimonials"
              >
                &times;
              </button>
            </div>

            <p className="mt-4 text-lg font-semibold text-gray-900">{stories[i].lead}</p>
            <p className="mt-3 text-gray-700">{stories[i].body}</p>
            <footer className="mt-4 text-gray-600">
              <strong className="block text-[#e05c0a]">{stories[i].name}</strong>
              <span className="text-sm">{stories[i].place}</span>
            </footer>

            <div className="mt-6 flex items-center justify-between">
              <button
                className="rounded-full px-4 py-2 bg-[#ffd9c6] text-[#e05c0a] font-extrabold disabled:opacity-50"
                onClick={() => setI((p) => (p - 1 + stories.length) % stories.length)}
              >
                ‹ Prev
              </button>
              <div className="flex gap-2">
                {stories.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setI(idx)}
                    className={`w-3 h-3 rounded-full ${i === idx ? "bg-[#ff751f]" : "bg-gray-200"}`}
                    aria-label={`Story ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                className="rounded-full px-4 py-2 bg-[#ffd9c6] text-[#e05c0a] font-extrabold disabled:opacity-50"
                onClick={() => setI((p) => (p + 1) % stories.length)}
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
