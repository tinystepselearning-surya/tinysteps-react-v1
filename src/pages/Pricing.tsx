import PricingCard from "../components/PricingCard";

export default function Pricing() {
  return (
    <div className="px-4 py-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Pricing</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <PricingCard
          title="Phonics"
          price="₹2,999"
          blurb="8 live sessions + decodable e-books + printable packs + progress snapshots."
          features={[
            "Systematic SATPIN, digraphs, Magic-E",
            "Guided blending labs & fluency runs",
            "Weekly parent summary",
          ]}
          ctaText="Book Phonics Demo"
          ctaHref="/main/book-demo/?programme=phonics"
          accent="orange"
        />

        <PricingCard
          title="Grammar"
          price="₹3,199"
          blurb="Live classes, writing labs, rubric-based feedback, digital journal."
          features={[
            "Parts of speech, tenses, punctuation",
            "Sentence craft & editing drills",
            "Weekly writing sprint + feedback",
          ]}
          ctaText="Schedule Grammar Trial"
          ctaHref="/main/book-demo/?programme=grammar"
          accent="teal"
        />

        <PricingCard
          title="Public Speaking"
          price="₹3,499"
          blurb="Coaching + rehearsal recordings + showcases + scorecards."
          features={[
            "Voice & diction practice",
            "Story frameworks & presence",
            "Showcase at end of cycle",
          ]}
          ctaText="Reserve Speaking Session"
          ctaHref="/main/book-demo/?programme=speaking"
          accent="violet"
        />
      </div>
    </div>
  );
}
