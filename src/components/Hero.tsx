import type { CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function Hero() {
  const sectionRef = useScrollReveal<HTMLElement>({ variant: "zoom", threshold: 0.35 });
  const titleDelay: CSSProperties = { "--reveal-child-delay": "120ms" } as CSSProperties;
  const bodyDelay: CSSProperties = { "--reveal-child-delay": "200ms" } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[80vh] md:min-h-[74vh] text-white overflow-hidden flex items-end md:items-center"
      id="home"
      aria-labelledby="hero-title"
    >
      <div
        className="absolute inset-0 bg-center bg-cover will-change-transform"
        style={{ backgroundImage: "url('/assets/images/mainbg.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/70" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 md:py-20 lg:py-24 w-full">
        <div className="max-w-2xl">
          <h1
            id="hero-title"
            data-reveal-child
            style={titleDelay}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.04] tracking-tight drop-shadow-[0_12px_32px_rgba(0,0,0,0.32)]"
          >
            <span className="block text-balance">Phonics, Grammar &amp; Public Speaking</span>
            <span className="block mt-3 text-balance text-2xl sm:text-3xl lg:text-4xl font-semibold text-white/95">
              Crafted for <span className="font-extrabold text-white">Ages 3–10</span>
            </span>
          </h1>
          <p
            data-reveal-child
            style={bodyDelay}
            className="mt-6 max-w-[46ch] text-white/95 text-xl sm:text-2xl leading-relaxed font-medium drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
          >
            Fun, engaging lessons that help every child communicate powerfully—on the page, on stage, and in everyday
            conversations.
          </p>
        </div>
      </div>
    </section>
  );
}
