import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

export default function EnglishGrammarWritingClassesPage() {
  useEffect(() => {
    applySeo({
      title: "Online English Grammar & Writing Classes (Ages 5–12) | Tiny Steps",
      description: "Online grammar and writing classes for kids (Ages 5–12). Clear explanations, games, sentence building, and guided writing—plus weekly progress updates. Book a free assessment.",
      canonicalPath: "/english-grammar-writing-classes",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "Online English Grammar & Writing Classes",
          "description": "1:1 online grammar and writing instruction for ages 5–12. Master sentence structure, punctuation, parts of speech, and creative writing with live mentors and interactive practice.",
          "provider": {
            "@type": "Organization",
            "name": "Tiny Steps Learning",
            "sameAs": "https://tinystepslearning.com"
          },
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "OnlineCoursePlatform"
          }
        }
      ]
    });
  }, []);

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      {/* Header Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#2d5016] mb-4">
          Online English Grammar & Writing Classes
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          1:1 personalized instruction for ages 5–12. Master sentence structure, punctuation, and creative writing.
        </p>
        <p className="text-gray-600 mb-8">
          Taught by experienced mentors using clear explanations, fun activities, and guided practice. Weekly progress reports for parents.
        </p>
        <Link
          to="/contact"
          className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Book a Free Assessment
        </Link>
      </section>

      {/* Who is this for? */}
      <section id="who" className="mb-12 bg-blue-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Who is this for?</h2>
        <ul className="text-gray-700 space-y-3">
          <li>✓ Are learning to write sentences with confidence and clarity</li>
          <li>✓ Need help with grammar, punctuation, and sentence structure</li>
          <li>✓ Benefit from 1:1 attention and personalized pacing</li>
          <li>✓ Love writing stories, but need guidance on grammar rules and style</li>
        </ul>
      </section>

      {/* What your child will learn */}
      <section id="learn" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">What your child will learn</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">📝 Sentence Building Skills</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Parts of speech (nouns, verbs, adjectives, prepositions)</li>
              <li>• Subject-verb agreement</li>
              <li>• Simple, compound, and complex sentences</li>
              <li>• Sentence combining and variety</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">✍️ Writing Skills</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Punctuation mastery (periods, commas, apostrophes, question marks)</li>
              <li>• Paragraph structure and organization</li>
              <li>• Descriptive and creative writing techniques</li>
              <li>• Editing and proofreading strategies</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How our classes work */}
      <section id="how" className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">How our online classes work</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-bold text-lg mb-2">1:1 Live Sessions</h3>
            <p>
              Interactive 30–40 minute lessons with a live mentor. Each session focuses on grammar rules, writing practice, and personalized feedback.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Clear Explanations & Examples</h3>
            <p>
              We break down tricky grammar concepts into simple, memorable rules. Real-world examples and relatable stories make learning stick.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Guided Writing Practice</h3>
            <p>
              Your child writes while their mentor gives live feedback. They practice with prompts, story-building, and grammar exercises tailored to their level.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Weekly Progress Updates</h3>
            <p>
              Detailed reports show grammar mastery, writing improvements, areas to focus on, and actionable tips for practicing at home.
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Path */}
      <section id="curriculum" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">Curriculum path</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 1: Grammar Foundations</h3>
            <p className="text-gray-700 text-sm">
              Parts of speech, basic sentence structure, and punctuation rules. Build a solid understanding of how sentences work.
            </p>
          </div>
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 2: Sentence Mastery</h3>
            <p className="text-gray-700 text-sm">
              Simple, compound, and complex sentences. Subject-verb agreement. Combining sentences creatively and avoiding run-ons.
            </p>
          </div>
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 3: Writing & Proofreading</h3>
            <p className="text-gray-700 text-sm">
              Paragraph writing, essay structure, and editing techniques. Develop confidence in creative and academic writing.
            </p>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section id="outcomes" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Outcomes parents can expect</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="text-2xl mr-3">✨</span>
            <span><strong>Writing confidence:</strong> Your child will feel proud writing clear, grammatically correct sentences and short paragraphs</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">🎯</span>
            <span><strong>Grammar mastery:</strong> Deep understanding of rules, not just memorization—knowing why sentences are structured the way they are</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">📚</span>
            <span><strong>Creative expression:</strong> The tools and confidence to express ideas clearly in writing, whether for school or personal projects</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">📈</span>
            <span><strong>Academic advantage:</strong> Improved grades in English, better essays, and stronger communication skills across all subjects</span>
          </li>
        </ul>
      </section>

      {/* FAQs */}
      <section id="faqs" className="mb-12 bg-purple-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-bold text-lg mb-1">My child hates grammar. Will they enjoy this?</h3>
            <p>Grammar feels boring when it's just rules and worksheets. Our approach is different: we show how grammar helps express ideas better. When kids see the purpose, they engage—and enjoy the a-ha moments when things click.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">How often should we take classes?</h3>
            <p>We recommend 2–3 classes per week for best results. Consistent practice helps grammar become automatic. Most children see noticeable improvement in writing clarity within 4–6 weeks.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">What if my child struggles with writing?</h3>
            <p>Writing challenges often stem from weak grammar foundations or unclear thinking. Our 1:1 approach lets us diagnose the issue and build skills gradually. We celebrate small wins and build momentum.</p>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/faq"
            className="text-[#4a7c2c] hover:underline font-semibold"
          >
            View full FAQ →
          </Link>
        </div>
      </section>

      {/* Cross-links to other programs */}
      <section className="mb-12 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-[#2d5016] mb-4">Part of the Tiny Steps learning journey</h2>
        <p className="text-gray-700 mb-6">
          Build a complete foundation in English language skills:
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/phonics" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Explore Phonics & Reading →
          </Link>
          <Link to="/speaking" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Explore Public Speaking →
          </Link>
          <Link to="/grammar" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Full Grammar Program →
          </Link>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-[#2d5016] text-white p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to help your child master writing?</h2>
        <p className="mb-6 text-lg">
          Book a free assessment to discuss your child's needs and get started.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            to="/contact"
            className="bg-white text-[#2d5016] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/pricing"
            className="border-2 border-white text-white hover:bg-white hover:text-[#2d5016] font-bold py-3 px-8 rounded-lg transition"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
