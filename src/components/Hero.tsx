import type { CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function Hero() {
  const sectionRef = useScrollReveal<HTMLElement>({ variant: "zoom", threshold: 0.35 });
  const titleDelay: CSSProperties = { "--reveal-child-delay": "120ms" } as CSSProperties;
  const bodyDelay: CSSProperties = { "--reveal-child-delay": "200ms" } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100svh-64px)] text-white overflow-hidden"
      id="home"
      aria-labelledby="hero-title"
    >
      <div
        className="absolute inset-0 bg-center bg-cover brightness-75 will-change-transform"
        style={{ backgroundImage: "url('/assets/images/mainbg.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/45" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="max-w-2xl">
          <h1 id="hero-title" data-reveal-child style={titleDelay} className="text-4xl md:text-5xl font-extrabold leading-tight">
            Phonics, Grammar & Public Speaking for Kids <span className="whitespace-nowrap">(Ages 3–10)</span>
          </h1>
          <p data-reveal-child style={bodyDelay} className="mt-4 text-white/90 text-lg">
            Fun, engaging phonics, grammar, and speaking lessons that help every child shine with confidence.
          </p>
        </div>
      </div>
    </section>
  );
}
