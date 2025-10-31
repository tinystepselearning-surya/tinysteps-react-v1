import type { CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const items = [
  {
    id: "01",
    img: "/assets/images/joyfullearning.jpg",
    h: "Joyful Learning",
    p: "Children thrive in an environment filled with stories, play, and creativity.",
    accent: { glow: "from-[#ff8a4c]/30 via-[#ff751f]/20 to-transparent", badge: "bg-[#ffefe6] text-[#e05c0a]" },
  },
  {
    id: "02",
    img: "/assets/images/onetoone.jpg",
    h: "One-to-One Guidance",
    p: "Personal attention helps every child feel seen, supported, and celebrated.",
    accent: { glow: "from-[#60a5fa]/25 via-[#a855f7]/25 to-transparent", badge: "bg-[#edf2ff] text-[#1d4ed8]" },
  },
  {
    id: "03",
    img: "/assets/images/professionalteachers.jpg",
    h: "Professional Teachers",
    p: "Certified educators bring patience, expertise, and warmth to every class.",
    accent: { glow: "from-[#34d399]/30 via-[#0f9d75]/25 to-transparent", badge: "bg-[#e6f9f1] text-[#047857]" },
  },
];

export default function Why() {
  const sectionRef = useScrollReveal<HTMLElement>({ variant: "up" });

  return (
    <section ref={sectionRef} id="why" className="mx-auto max-w-6xl px-4 my-20">
      <div className="mx-auto max-w-3xl text-center">
        <p
          data-reveal-child
          className="uppercase tracking-[0.26em] text-sm md:text-base font-semibold text-[#7c3aed]"
        >
          Why Tiny Steps Works
        </p>
        <h2
          data-reveal-child
          style={{ "--reveal-child-delay": "60ms" } as CSSProperties}
          className="mt-2 text-4xl md:text-5xl font-black text-gray-900 tracking-tight"
        >
          Purposeful teaching, playful classrooms, measurable progress
        </h2>
        <p
          data-reveal-child
          style={{ "--reveal-child-delay": "120ms" } as CSSProperties}
          className="mt-4 text-lg sm:text-xl text-gray-600 leading-relaxed"
        >
          Every Tiny Steps session blends research-backed pedagogy with joyful rituals so kids feel energised, parents stay
          informed, and communication skills grow term after term.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {items.map((x, idx) => (
          <article
            key={x.h}
            data-reveal-child
            style={{ "--reveal-child-delay": `${160 + idx * 80}ms` } as CSSProperties}
            className="group relative isolate overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-xl shadow-gray-200/60 transition hover:-translate-y-2 hover:shadow-2xl"
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute -top-20 left-1/2 h-44 w-[120%] -translate-x-1/2 rounded-full blur-3xl opacity-70 bg-gradient-to-br ${x.accent.glow}`}
            />
            <img
              src={x.img}
              alt={x.h}
              className="h-48 w-full object-cover transition duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="relative flex h-full flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${x.accent.badge}`}>
                  <span className="inline-flex h-2 w-2 rounded-full bg-current" aria-hidden />
                  <span>{x.id}</span>
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-300">
                  Learn
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">{x.h}</h3>
              <p className="text-gray-600 leading-relaxed">{x.p}</p>
              <div className="mt-auto pt-2 text-sm font-semibold text-[#e05c0a]/80 opacity-0 transition group-hover:opacity-100">
                Tailored lesson plans · Weekly parent updates
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
