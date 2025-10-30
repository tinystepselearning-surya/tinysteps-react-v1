import type { CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const courses = [
  {
    img: "/assets/images/phonics.jpg",
    h: "Phonics Foundations",
    p: "Sound, blend, and read through play and songs.",
    href: "/main/courses/phonics/",
  },
  {
    img: "/assets/images/grammar.jpg",
    h: "Grammar & Writing",
    p: "Creative writing and grammar made fun and interactive.",
    href: "/main/courses/grammar/",
  },
  {
    img: "/assets/images/speaking.jpg",
    h: "Public Speaking",
    p: "Build stage presence, confidence, and clarity in speech.",
    href: "/main/courses/public-speaking/",
  },
];

export default function Courses() {
  const sectionRef = useScrollReveal<HTMLElement>({ variant: "up" });

  return (
    <section ref={sectionRef} id="kids" className="mx-auto max-w-6xl px-4 my-16 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 data-reveal-child className="text-[#e05c0a] text-2xl md:text-3xl font-extrabold">
          Explore Our Programs
        </h2>
        <p data-reveal-child style={{ "--reveal-child-delay": "80ms" } as CSSProperties} className="text-gray-600 mt-1">
          Short, playful lessons that make learning joyful and meaningful.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-5 mt-8">
        {courses.map((c, idx) => (
          <article
            key={c.h}
            data-reveal-child
            style={{ "--reveal-child-delay": `${180 + idx * 90}ms` } as CSSProperties}
            className="relative h-72 rounded-2xl overflow-hidden shadow"
          >
            <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70" />
            <div className="absolute inset-0 p-4 mt-auto flex flex-col justify-end text-left text-white">
              <h3 className="text-xl font-extrabold">{c.h}</h3>
              <p className="text-white/90 text-sm mt-1">{c.p}</p>
              <a href={c.href} className="inline-block mt-2 px-3 py-2 rounded-full text-sm font-extrabold bg-white/90 text-gray-900">
                Learn More
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
