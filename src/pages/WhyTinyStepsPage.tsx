import type { FC } from 'react';

type Feature = {
  title: string;
  desc: string;
};

type ComparisonRow = {
  left: string;
  right: string;
};

const features: Feature[] = [
  {
    title: "Joy + Rigor in Every Class",
    desc: "Storytelling, games, and actions blend with structured teaching-so children have fun and develop powerful skills.",
  },
  {
    title: "Brain-Friendly, Age-Right Lessons",
    desc: "Activities are broken into tiny, just-right steps matched to your child's age. Never overloaded, never bored.",
  },
  {
    title: "Multisensory Phonics & Grammar",
    desc: 'Children see, hear, say, trace, act, and use their learning. Grammar is lived through stories, not dry rules.',
  },
  {
    title: "Public Speaking from the Start",
    desc: "Show & tell, picture talks, and small speeches right from the beginning-so children grow up confident and clear.",
  },
  {
    title: "Personalized Pathways",
    desc: "No \"one size fits all.\" We adapt the pace, challenge, and approach to each child's needs for real mastery.",
  },
  {
    title: "Confidence Over Perfection",
    desc: 'We gently correct, celebrate progress, and help every child see mistakes as part of the journey, not shame.',
  },
];

const highlights: ComparisonRow[] = [
  {
    left: 'Focus on finishing portions and worksheets',
    right: 'Deep, strong foundation before speed',
  },
  {
    left: 'Lecture + slides, little practice',
    right: 'Playful, multisensory (see-say-move-use)',
  },
  {
    left: 'Phonics, grammar, and speaking taught separately',
    right: 'Integrated learning-real English, real life',
  },
  {
    left: 'Success = marks + homework',
    right: 'Success = confidence, fluency, understanding',
  },
  {
    left: 'Parents must fill learning gaps',
    right: 'Classes designed for independence-minimum parent help needed',
  },
];

const testimonials: string[] = [
  '"My child now wants to read aloud and speak in English. Earlier she was scared to even try."',
  "\"The classes are structured, but my son feels like he's playing, not studying-and his phonics and reading have improved so much.\"",
  '"I finally feel like someone understands how my child learns. The teacher is patient, observant, and keeps updating me."',
];

const ctaOptions = ['Book a Free Trial Class', 'Talk to Us About Your Child', 'Explore Our Courses'];

const WhyTinyStepsPage: FC = () => {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="text-center py-10 px-4 max-w-4xl mx-auto">
        <p className="text-sm uppercase tracking-[0.4em] text-gray-400">How Tiny Steps Ensures Joyful, Effective Learning</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight mt-4">
          Our Child-Centered Methodology
        </h1>
        <h2 className="text-xl md:text-2xl text-gray-600 font-medium mb-6">
          Kids don't just memorize-they discover, explore, and master foundational skills through joyful, scientific teaching.
        </h2>
      </section>

      <section className="py-10 px-4 max-w-5xl mx-auto">
        <h3 className="text-2xl font-semibold mb-2">Why Parents Trust Tiny Steps</h3>
        <p className="text-gray-700 mb-6 max-w-2xl">
          Parents don't just trust us with English-they trust us with their child's confidence, voice, and future.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <TrustCard
            title="Real teachers, real connection"
            desc="Every class is live, interactive, and child-centered-never passive."
          />
          <TrustCard
            title="Clear learning plan"
            desc="Our curriculum covers phonics, grammar, and speaking-so you always know what your child is learning and why."
          />
          <TrustCard
            title="Small groups & 1:1 attention"
            desc="Your child is seen, heard, and guided-never lost in a crowd."
          />
          <TrustCard
            title="Regular parent updates"
            desc="We share what's covered, strengths, and next steps-no guessing."
          />
          <TrustCard
            title="Safe, encouraging environment"
            desc="Kindness, patience, and positivity are intentional norms-so children are free to try, err, and grow."
          />
        </div>
      </section>

      <section className="bg-gray-50 py-12 px-4 mt-10 max-w-5xl mx-auto rounded-lg shadow-sm">
        <h3 className="text-2xl font-semibold mb-4">How Tiny Steps Is Different from Typical Online Classes</h3>
        <div className="max-w-3xl mx-auto">
          <ComparisonTable highlights={highlights} />
          <div className="mt-4 text-center">
            <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-4 py-2 text-sm font-medium">
              Tiny Steps isn't just "another online tuition." It's specialised English foundation education for children.
            </span>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 max-w-5xl mx-auto">
        <h3 className="text-2xl font-semibold mb-4">What's Special About Tiny Steps for Your Child</h3>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title} desc={feature.desc} />
          ))}
        </div>
      </section>

      <section className="py-10 px-4 bg-gray-50 max-w-4xl mx-auto rounded-xl shadow-md mt-10 text-center">
        <h3 className="text-2xl font-semibold mb-2">Our Teaching Philosophy - In Simple Words</h3>
        <p className="text-gray-800 text-lg mt-2 leading-relaxed">
          Children learn best when they feel happy, safe, and capable. We mix playful activities, strong structure, and loving guidance. So your child doesn't just remember for a test-they understand, use, and enjoy English every day.
        </p>
      </section>

      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h3 className="text-2xl font-semibold mb-4">Why Tiny Steps Is a Better Choice for Online English Learning</h3>
        <ul className="list-disc list-inside space-y-2 text-base font-semibold text-gray-700">
          <li>We specialise in English only-phonics, grammar, reading, speaking.</li>
          <li>Foundation-first: strong skills before "big words" or "fancy writing."</li>
          <li>Integrated LRWS-every class covers listening, reading, writing, and speaking.</li>
          <li>Built for children in non-English-speaking homes-our classes provide the input and support needed to grow.</li>
          <li>Our aim: not to "finish 30 classes" but to raise confident, independent learners.</li>
        </ul>
      </section>

      <section className="py-10 px-4 max-w-3xl mx-auto text-center">
        <h3 className="text-2xl font-semibold mb-4">What Parents Love About Tiny Steps</h3>
        <div className="flex flex-col gap-6">
          {testimonials.map((testimonial) => (
            <blockquote
              key={testimonial}
              className="bg-gray-100 rounded-xl p-6 text-gray-800 text-lg italic shadow-sm"
            >
              {testimonial}
            </blockquote>
          ))}
        </div>
        <div className="text-gray-400 text-base mt-2">* Real testimonials coming soon *</div>
      </section>

      <section className="py-12 px-4 bg-blue-50 max-w-4xl mx-auto rounded-lg text-center shadow-lg mt-10">
        <h3 className="text-2xl font-semibold mb-4">Our Promise to You as a Parent</h3>
        <p className="text-lg mb-6 text-gray-800 leading-relaxed">
          We will treat your child's confidence and learning journey with the same care we give to our lessons. At Tiny Steps, your child will:
        </p>
        <ul className="list-disc list-inside mb-6 text-gray-700 text-base text-left max-w-xl mx-auto space-y-1.5">
          <li>Feel safe and happy in class</li>
          <li>Get personal attention and thoughtful feedback</li>
          <li>Build strong English foundations step by step</li>
          <li>Learn to use their voice proudly-in reading, writing, and speaking</li>
        </ul>
        <div className="text-xl font-semibold mb-8 text-gray-900">That's the Tiny Steps difference.</div>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          {ctaOptions.map((cta) => (
            <button
              key={cta}
              type="button"
              className="bg-gradient-to-r from-[#111827] via-[#2563eb] to-[#7c3aed] hover:from-[#0f172a] hover:via-[#1d4ed8] hover:to-[#6d28d9] text-white font-semibold py-3 px-6 rounded-full text-lg shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              {cta}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};

type TrustCardProps = Feature;

const TrustCard: React.FC<TrustCardProps> = ({ title, desc }) => (
  <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 flex flex-col">
    <span className="font-semibold text-lg mb-1">{title}</span>
    <span className="text-gray-600">{desc}</span>
  </div>
);

const FeatureCard: React.FC<Feature> = ({ title, desc }) => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 h-full flex flex-col">
    <span className="font-semibold text-lg mb-2">{title}</span>
    <span className="text-gray-600">{desc}</span>
  </div>
);

type ComparisonTableProps = {
  highlights: ComparisonRow[];
};

const ComparisonTable: React.FC<ComparisonTableProps> = ({ highlights }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
      <thead>
        <tr>
          <th className="bg-gray-100 font-semibold px-4 py-3 text-gray-800 text-left w-1/2">Many Online Classes...</th>
          <th className="bg-blue-100 font-semibold px-4 py-3 text-blue-800 text-left w-1/2">Tiny Steps...</th>
        </tr>
      </thead>
      <tbody>
        {highlights.map((row) => (
          <tr key={row.left}>
            <td className="border-t border-gray-200 px-4 py-3 align-top text-gray-700">{row.left}</td>
            <td className="border-t border-gray-200 px-4 py-3 align-top text-gray-900">{row.right}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default WhyTinyStepsPage;
