import type { CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const items = [
  { img: "/assets/images/joyfullearning.jpg", h: "Joyful Learning", p: "Children thrive in an environment filled with stories, play, and creativity." },
  { img: "/assets/images/onetoone.jpg", h: "One-to-One Guidance", p: "Personal attention helps every child feel seen, supported, and celebrated." },
  { img: "/assets/images/professionalteachers.jpg", h: "Professional Teachers", p: "Certified educators bring patience, expertise, and warmth to every class." },
];

export default function Why() {
  const sectionRef = useScrollReveal<HTMLElement>({ variant: "up" });

  return (
    <section ref={sectionRef} id="why" className="mx-auto max-w-6xl px-4 my-16 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 data-reveal-child className="text-[#e05c0a] text-2xl md:text-3xl font-extrabold">
          Why Tiny Steps Works
        </h2>
        <p data-reveal-child style={{ "--reveal-child-delay": "80ms" } as CSSProperties} className="text-gray-600 mt-1">
          We blend fun, play, and proven methods so every child grows in confidence and skills.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        {items.map((x, idx) => (
          <article
            key={x.h}
            data-reveal-child
            style={{ "--reveal-child-delay": `${160 + idx * 80}ms` } as CSSProperties}
            className="rounded-2xl overflow-hidden text-left bg-white shadow"
          >
            <img src={x.img} alt={x.h} className="h-52 w-full object-cover" loading="lazy" />
            <div className="p-4">
              <h3 className="text-[#e05c0a] font-extrabold">{x.h}</h3>
              <p className="text-gray-600 mt-1">{x.p}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
