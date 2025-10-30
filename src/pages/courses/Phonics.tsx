import PricingCard from "../../components/PricingCard";
import Accordion from "../../components/ui/Accordion"; // ✅ shared Accordion component

export default function Phonics() {
  return (
    <div className="px-4 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Phonics Classes for Kids (Online)</h1>
      <p className="text-gray-700 mb-8">
        Systematic phonics that connects letter–sound mastery to confident, expressive reading.
        SATPIN, Magic-E, digraphs and more.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Curriculum & methodology</h2>
        <ul className="grid md:grid-cols-2 gap-4 text-gray-700">
          <li className="p-4 rounded-xl bg-gray-50">
            Sound-to-symbol mastery: multi-sensory drills, actions, and stories.
          </li>
          <li className="p-4 rounded-xl bg-gray-50">
            Guided blending labs with decodable readers and fluency runs.
          </li>
          <li className="p-4 rounded-xl bg-gray-50">
            Digraphs & long vowels with word-sorting games.
          </li>
          <li className="p-4 rounded-xl bg-gray-50">
            Fluency & comprehension with weekly retell prompts.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Age groups & schedules</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border">3.5–5 yrs — 40 mins × 2 / week</div>
          <div className="p-4 rounded-xl border">Grade 1–2 — 45 mins × 2 / week</div>
          <div className="p-4 rounded-xl border">Grade 3+ — 60 mins × 1 / week + guided reading</div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Pricing</h2>
        <PricingCard
          title="Phonics"
          price="₹2,999"
          blurb="8 live sessions, decodable e-books, printable packs, progress snapshots."
          features={[
            "SATPIN → digraphs → long vowels",
            "Fluency runs & comprehension prompts",
            "Weekly parent summary",
          ]}
          ctaText="Book Phonics Demo"
          ctaHref="/main/book-demo/?programme=phonics"
          accent="orange"
        />
      </section>

      {/* FAQs */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Phonics FAQs</h2>
        <Accordion
          items={[
            {
              question: "How do you teach blending?",
              answer:
                "With sound-tapping, word ladders, and decodable readers for fluent blending.",
            },
            {
              question: "Do you give home practice?",
              answer:
                "Yes — 2 short, fun tasks per week with audio guidance and a quick parent note.",
            },
            {
              question: "What if my child is a beginner?",
              answer:
                "We begin with sound awareness and scaffold up gradually to reading sentences.",
            },
          ]}
        />
      </section>
    </div>
  );
}
