import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

export default function LeadForm() {
  const nameRef = useRef<HTMLInputElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const sectionRef = useScrollReveal<HTMLElement>({ variant: "up" });
  const formDelay: CSSProperties = { "--reveal-child-delay": "140ms" } as CSSProperties;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value.trim() || "";
    const age = ageRef.current?.value.trim() || "";
    const email = emailRef.current?.value.trim() || "";
    const phone = phoneRef.current?.value.trim() || "";
    if (!name || !age || !email || !phone) {
      setMsg("Please fill all the fields.");
      return;
    }
    setMsg("Opening WhatsApp…");
    const enc = encodeURIComponent;
    const text = [
      "Hello TinySteps!",
      "I’d like to book a free trial.",
      "",
      `Parent: ${name}`,
      `Child Age: ${age}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
    ]
      .map(enc)
      .join("%0A");

    const url = `https://wa.me/919666095553?text=${text}`;
    const popup = window.open(url, "_blank", "noopener");
    if (!popup) {
      window.location.href = url;
    }
    setMsg("Thanks! We opened WhatsApp with your details.");
    (e.target as HTMLFormElement).reset();
  }

  return (
    <section ref={sectionRef} id="parents" className="relative py-20">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[#fff4ec] via-white to-[#e8f9f0]/70"
      />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p data-reveal-child className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff7a45]">
            Book a Free Trial
          </p>
          <h2
            data-reveal-child
            style={{ "--reveal-child-delay": "60ms" } as CSSProperties}
            className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900"
          >
            See your child light up in their very first Tiny Steps session
          </h2>
          <p
            data-reveal-child
            style={{ "--reveal-child-delay": "120ms" } as CSSProperties}
            className="mt-3 text-gray-600 text-lg"
          >
            Share a few details and we’ll connect you with a Learning Manager, schedule a personalised class, and send a
            readiness guide straight to your inbox.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <form
            onSubmit={onSubmit}
            data-reveal-child
            style={formDelay}
            className="relative grid gap-4 rounded-3xl bg-white p-6 sm:p-8 shadow-2xl shadow-[#ff8a4c]/10 ring-1 ring-white/70"
          >
            <span className="absolute -top-10 left-6 hidden h-20 w-20 rounded-full bg-[#ffefe6] blur-2xl sm:block" aria-hidden />
            <label className="text-left">
              <span className="mb-1 block text-sm font-semibold text-gray-700">Parent Name</span>
              <input
                ref={nameRef}
                type="text"
                placeholder="Priya Sharma"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base shadow-sm focus:border-[#e05c0a] focus:outline-none focus:ring-2 focus:ring-[#ffb37a]/60"
              />
            </label>
            <label className="text-left">
              <span className="mb-1 block text-sm font-semibold text-gray-700">Child’s Age</span>
              <input
                ref={ageRef}
                type="text"
                placeholder="6 years"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base shadow-sm focus:border-[#e05c0a] focus:outline-none focus:ring-2 focus:ring-[#ffb37a]/60"
              />
            </label>
            <label className="text-left">
              <span className="mb-1 block text-sm font-semibold text-gray-700">Email</span>
              <input
                ref={emailRef}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base shadow-sm focus:border-[#e05c0a] focus:outline-none focus:ring-2 focus:ring-[#ffb37a]/60"
              />
            </label>
            <label className="text-left">
              <span className="mb-1 block text-sm font-semibold text-gray-700">Phone Number</span>
              <input
                ref={phoneRef}
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-base shadow-sm focus:border-[#e05c0a] focus:outline-none focus:ring-2 focus:ring-[#ffb37a]/60"
              />
            </label>
            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-lg shadow-[#ff8a4c]/40 transition hover:-translate-y-0.5"
              style={{ backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }}
            >
              Book my free class
            </button>
            <p className="text-sm text-gray-500" aria-live="polite">
              {msg || "We’ll reach out on WhatsApp within 24 hours."}
            </p>
          </form>

          <div className="relative rounded-3xl border border-white/70 bg-white/80 p-6 sm:p-8 shadow-xl shadow-gray-200/60 backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[#ffefe6] p-3 text-[#e05c0a] shadow-inner">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5L9 16.5L19 6.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">What happens next?</h3>
                <ul className="mt-3 space-y-3 text-sm text-gray-600">
                  <li>• A Tiny Steps Learning Manager calls to learn about your child’s goals.</li>
                  <li>• We schedule a trial slot with a specialist teacher within 48 hours.</li>
                  <li>• You receive a personalised prep kit and a follow-up progress summary.</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-[#fff4ec] p-4 text-left text-sm text-[#e05c0a]">
              “Every trial is tailored. Expect a joyful session, actionable feedback, and a roadmap you can trust.”
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
