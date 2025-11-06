import { Link } from "react-router-dom";
import PricingCard from "../../components/PricingCard";
import Accordion from "../../components/ui/Accordion"; // ✅ shared component

export default function PublicSpeaking() {
  return (
    <div className="px-4 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Public Speaking for Kids (Online)</h1>
      <p className="text-gray-700 mb-3">
        Coaching that transforms hesitant speakers into storytellers with presence and poise.
      </p>
      <p className="text-base text-gray-600 mb-8">
        Communication is a career superpower—these sessions help children hold a room today and stand out tomorrow in
        interviews, leadership roles, and global teams.
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
        <p className="mt-4 text-sm text-[#6366f1]">
          <Link to="/curriculum#speaking" className="font-semibold hover:underline">
            See the full Public Speaking progression →
          </Link>
        </p>
      </section>

      {/* Age groups */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Age groups & schedules</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border">Age 6–8 · 35 mins × 3 / week</div>
          <div className="p-4 rounded-xl border">Age 9–11 · 35 mins × 3 / week</div>
          <div className="p-4 rounded-xl border">Age 12+ · 35 mins × 3 / week + showcase prep</div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">Pricing</h2>
        <PricingCard
          title="Public Speaking"
          price="₹4,200"
          blurb="12 coached sessions · 35 mins · ₹350 per session (weekly 3 classes)."
          features={[
            "Voice & diction drills",
            "Story frameworks & delivery",
            "Monthly showcase with feedback",
            "Pronunciation lab + digital practice hub",
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
            {
              question: "What batch size options are available?",
              answer:
                "Select what suits your child—1:1 spotlight coaching, dynamic pairs (1 teacher : 2 learners), intimate groups of 4, or collaborative pods of 6. Even in shared batches, each child records solo clips and receives individual feedback.",
            },
            {
              question: "My child is shy. How do you draw them out in a 35-minute session?",
              answer:
                "We start with micro speaking tasks—hello circle, prop show-and-tell, and guided sentence builders. As confidence grows we add storytelling, debate, and showcase rehearsals. Because classes are one-to-one, the entire session is your child’s spotlight.",
            },
            {
              question: "How does public speaking coaching help with school competitions and interviews?",
              answer:
                "Every unit covers hooks, transitions, voice modulation, and audience connection. We record clips, critique them together, and share pointers with parents so children can represent themselves powerfully in assemblies, MUNs, and scholarship interviews.",
            },
            {
              question: "Will you also focus on pronunciation for Indian English speakers?",
              answer:
                "Yes, we run a dedicated pronunciation lab. Teachers correct common Indian English sound slips (v/w, silent letters, stress patterns) so communication stays authentic yet clear internationally.",
            },
            {
              question: "How do parents stay updated about progress?",
              answer:
                "After each class, you get a video snippet, a 5-star confidence score, and the next action. Strong communication between teacher, parent, and learner ensures skills move from the Zoom room to real life.",
            },
            {
              question: "What if my child misses a session due to exams or events?",
              answer:
                "We reschedule without fuss. The Learning Partner sends a calendar link, and the teacher posts a short catch-up video so your child can rehearse before the next class.",
            },
            {
              question: "Will public speaking also help everyday English communication?",
              answer:
                "Definitely. Students build vocabulary ladders, conversation scaffolds, and quick-thinking drills so they can communicate ideas clearly in class discussions, group projects, and future workplaces.",
            },
            {
              question: "How much parent support is required between classes?",
              answer:
                "Homework is lightweight: a digital worksheet or Wordwall challenge plus a short reflection prompt. Most children complete it independently in 5–7 minutes; parents simply watch the progress clip or respond with a quick emoji update.",
            },
          ]}
        />
      </section>
    </div>
  );
}
