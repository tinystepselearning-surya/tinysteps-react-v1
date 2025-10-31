const steps = [
  {
    title: "Book a free trial",
    description: "Pick a slot and share details about your child’s goals.",
    icon: "🗓️",
  },
  {
    title: "Meet your teacher",
    description: "Experience a live class and receive a personalised roadmap within 24 hours.",
    icon: "🎓",
  },
  {
    title: "Weekly digital practice",
    description: "Receive interactive worksheets, Wordwall games, and joyful home tasks.",
    icon: "💻",
  },
  {
    title: "Track progress",
    description: "Monitor dashboards, 5-star ratings, and video clips after every class.",
    icon: "📊",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-16" id="how-it-works">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7c3aed]">How it works</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-black text-[#0f172a]">A clear path from trial to transformation</h2>
          <p className="mt-3 text-lg text-gray-600">
            Parents know exactly what happens next—no surprises, just joyful learning with measurable outcomes.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-3xl border border-gray-100 bg-[#f9f7ff] p-6 text-center shadow-inner shadow-white"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl">
                {step.icon}
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.32em] text-[#7c3aed]">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#0f172a]">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
