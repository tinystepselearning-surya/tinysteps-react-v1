import { Link } from "react-router-dom";
import PricingCard from "../../components/PricingCard";
import Accordion from "../../components/ui/Accordion"; // ✅ shared Accordion component

export default function Phonics() {
  return (
    <div className="px-4 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Phonics Classes for Kids (Online)</h1>
      <p className="text-gray-700 mb-3">
        Systematic phonics that connects letter–sound mastery to confident, expressive reading.
        SATPIN, Magic-E, digraphs and more.
      </p>
      <p className="text-base text-gray-600 mb-8">
        Communication sits at the centre of every lesson—children learn to decode, discuss stories, and share reflections so
        they can compete and collaborate with confidence in school.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Curriculum & methodology</h2>
        <ul className="grid md:grid-cols-2 gap-4 text-gray-700">
          <li className="p-4 rounded-xl bg-gray-50">
            Sound-to-symbol mastery: Jolly Phonics sequencing with multi-sensory drills, actions, and stories.
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
        <p className="mt-4 text-sm text-[#6366f1]">
          <Link to="/curriculum#phonics" className="font-semibold hover:underline">
            View the full Phonics mastery roadmap →
          </Link>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Age groups & schedules</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border">Early readers (3.5–5 yrs) · 35 mins × 3 / week</div>
          <div className="p-4 rounded-xl border">Grade 1–2 · 35 mins × 3 / week</div>
          <div className="p-4 rounded-xl border">Grade 3+ · 35 mins × 3 / week + reading journal</div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Pricing</h2>
        <PricingCard
          title="Phonics"
          price="₹4,200"
          blurb="12 one-to-one sessions · 35 mins · ₹350 per session (weekly 3 classes)."
          features={[
            "SATPIN → digraphs → long vowels",
            "Fluency runs & comprehension prompts",
            "Weekly parent summary",
            "Digital worksheets • Wordwall & web games • Minimal parent prep",
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
              question: "What batch size options do you offer?",
              answer:
                "Families can choose the best fit—1:1 coaching, paired batches (1 teacher : 2 learners), small groups of 4, or collaborative pods of 6. Even in shared batches we use breakout rooms and individual feedback so every child gets personal attention.",
            },
            {
              question: "Do you share digital worksheets or will I need to print homework?",
              answer:
                "We share interactive worksheets, Wordwall games, and web-based blends so children practise on screens with joyful activities. Printing is optional; most families complete homework digitally within minutes.",
            },
            {
              question: "Will 35-minute one-to-one sessions clash with school homework?",
              answer:
                "We schedule around your child’s school day and keep each session laser-focused. The teacher recaps the school phonics list, reinforces tricky sounds, and closes with a two-minute plan so your child finishes homework faster, not slower.",
            },
            {
              question: "My child is in a CBSE/ICSE board. Will this align with the school sequence?",
              answer:
                "Yes. We follow the Jolly Phonics order to build decoding muscle and then align weekly lists with the school reader. Teachers flag tricky spellings on your dashboard so you can communicate with class teachers confidently.",
            },
            {
              question: "How much support do you need from parents between sessions?",
              answer:
                "Very little. Teachers send a two-minute activity with digital worksheets or a Wordwall link. Children can complete it independently with a quick emoji-style check-in so busy parents stay in the loop without printing or manual effort.",
            },
            {
              question: "How do you involve parents between classes?",
              answer:
                "Communication is the cornerstone. After every session you'll receive updates on the skill covered and a focus indicator. A quick two-minute activity keeps the momentum without overwhelming working parents.",
            },
            {
              question: "What if my child already recognises letters?",
              answer:
                "We begin with a diagnostic. If letter-sound recall is strong, we jump straight into digraphs, Magic-E, and vocabulary building. The idea is to respect existing mastery and move toward fluent reading and expressive communication.",
            },
            {
              question: "How soon will we see a change in reading fluency?",
              answer:
                "Most families notice smoother blending by week three because we meet thrice a week. You’ll see the growth on the dashboard through recorded reading clips and the mastery bar that moves from emerging to proficient.",
            },
            {
              question: "What happens if we miss a class due to school events?",
              answer:
                "Just pick a new slot in the calendar—make-ups are part of your plan. We refresh the previous concept during the next class so your child never feels left behind.",
            },
          ]}
        />
      </section>
    </div>
  );
}
