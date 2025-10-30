import PricingCard from "../../components/PricingCard";
import Accordion from "../../components/ui/Accordion"; // ✅ shared component

export default function PublicSpeaking() {
  return (
    <div className="px-4 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Public Speaking for Kids (Online)</h1>
      <p className="text-gray-700 mb-8">
        Coaching that transforms hesitant speakers into storytellers with presence and poise.
      </p>

      {/* Curriculum */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Curriculum & methodology</h2>
        <ul className="grid md:grid-cols-2 gap-4 text-gray-700">
          <li className="p-4 rounded-xl bg-gray-50">Voice & diction drills (breathing, articulation, pace).</li>
          <li className="p-4 rounded-xl bg-gray-50">Story frameworks (clear openings, flow, closings).</li>
          <li className="p-4 rounded-xl bg-gray-50">Body language coaching (stance, gestures, eye contact).</li>
          <li className="p-4 rounded-xl bg-gray-50">Audience engagement labs (Q&A, impromptu, debates).</li>
        </ul>
      </section>

      {/* Age groups */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Age groups & schedules</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border">Age 6–8 — 45 mins × 1 / week</div>
          <div className="p-4 rounded-xl border">Age 9–11 — 60 mins × 1 / week</div>
          <div className="p-4 rounded-xl border">Age 12+ — 60 mins × 2 / week</div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Pricing</h2>
        <PricingCard
          title="Public Speaking"
          price="₹3,499"
          blurb="Coaching + rehearsal recordings + showcases + scorecards."
          features={[
            "Voice & diction drills",
            "Story frameworks & delivery",
            "Monthly showcase with feedback",
          ]}
          ctaText="Reserve Speaking Session"
          ctaHref="/main/book-demo/?programme=speaking"
          accent="violet"
        />
      </section>

      {/* FAQs */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Speaking FAQs</h2>
        <Accordion
          items={[
            { question: "Will my child speak every class?", answer: "Yes—rotating spotlight + impromptu warm-ups ensure everyone speaks." },
            { question: "Do you fix stage fear?", answer: "We build comfort with micro-tasks, supportive peer feedback, and gradual challenge." },
            { question: "Do you correct pronunciation?", answer: "We coach clarity, diction, pace, and expression with focused drills." },
          ]}
        />
      </section>
    </div>
  );
}
