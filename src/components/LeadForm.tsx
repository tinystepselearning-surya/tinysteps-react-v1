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
    <section ref={sectionRef} id="parents" className="py-12 bg-white text-center">
      <div className="mx-auto max-w-6xl px-4">
        <h2 data-reveal-child className="text-[#e05c0a] text-2xl md:text-3xl font-extrabold">Book a Free Trial</h2>

        <form
          onSubmit={onSubmit}
          data-reveal-child
          style={formDelay}
          className="grid gap-3 max-w-md mx-auto mt-6"
        >
          <input ref={nameRef} type="text" placeholder="Parent Name" className="border rounded-xl px-3 py-2" />
          <input ref={ageRef} type="text" placeholder="Child’s Age" className="border rounded-xl px-3 py-2" />
          <input ref={emailRef} type="email" placeholder="Email" className="border rounded-xl px-3 py-2" />
          <input ref={phoneRef} type="tel" placeholder="Phone Number" className="border rounded-xl px-3 py-2" />
          <button
            type="submit"
            className="rounded-full px-5 py-2.5 text-white font-extrabold shadow"
            style={{ backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }}
          >
            Book a Free Trial
          </button>
          <p className="text-sm text-gray-600" aria-live="polite">{msg}</p>
        </form>
      </div>
    </section>
  );
}
