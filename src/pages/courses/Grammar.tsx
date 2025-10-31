import PricingCard from "../../components/PricingCard";
import Accordion from "../../components/ui/Accordion"; // ✅ use shared component

export default function Grammar() {
  return (
    <div className="px-4 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Grammar Classes for Kids (Online)</h1>
      <p className="text-gray-700 mb-8">
        Parts of speech, tenses, punctuation and sentence building—taught with mini-lessons and writing studios.
      </p>

      {/* Curriculum */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Curriculum & methodology</h2>
        <ul className="grid md:grid-cols-2 gap-4 text-gray-700">
          <li className="p-4 rounded-xl bg-gray-50">Grammar mini-lessons (interactive, 15-minute bursts).</li>
          <li className="p-4 rounded-xl bg-gray-50">Sentence construction & editing drills.</li>
          <li className="p-4 rounded-xl bg-gray-50">Weekly writing sprints (narrative/info/opinion).</li>
          <li className="p-4 rounded-xl bg-gray-50">Targeted feedback loops with rubrics.</li>
        </ul>
      </section>

      {/* Age groups */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Age groups & schedules</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border">Grade 2–3 · 35 mins × 3 / week</div>
          <div className="p-4 rounded-xl border">Grade 4–5 · 35 mins × 3 / week</div>
          <div className="p-4 rounded-xl border">Grade 6+ · 35 mins × 3 / week + writing lab</div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Pricing</h2>
        <PricingCard
          title="Grammar"
          price="₹4,200"
          blurb="12 one-to-one writing studios · 35 mins · ₹350 per session (weekly 3 classes)."
          features={[
            "Parts of speech, tenses, punctuation",
            "Sentence craft & editing drills",
            "Weekly writing sprint + feedback",
          ]}
          ctaText="Schedule Grammar Trial"
          ctaHref="/main/book-demo/?programme=grammar"
          accent="teal"
        />
      </section>

      {/* FAQs */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Grammar FAQs</h2>
        <Accordion
          items={[
            {
              question: "Is grammar taught with actual writing?",
              answer:
                "Yes—mini-lessons lead into writing labs (narrative/info/opinion) with short drafts and edits.",
            },
            {
              question: "Do you share feedback?",
              answer:
                "Yes—rubric-based comments and simple action points the child can fix next session.",
            },
            {
              question: "What if my child finds grammar boring?",
              answer:
                "We keep it active: sentence races, fix-it challenges, and peer review moments.",
            },
          ]}
        />
      </section>
    </div>
  );
}
