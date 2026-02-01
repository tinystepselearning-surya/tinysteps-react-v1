import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import Meta from '../../components/common/Meta';
import { Link } from 'react-router-dom';

// TODO: Add Event schema once camp dates, pricing, and schedule are finalized

export default function SummerCamp2026Page() {
  useEffect(() => {
    applySeo({
      title: "Summer English Camp 2026 | Phonics, Grammar & Public Speaking (Ages 5–12) | Tiny Steps",
      description: "Online summer English camp for kids (Ages 5–12). Phonics + grammar + public speaking with live mentors, fun activities, and weekly progress updates. Limited seats.",
      canonicalPath: "/summer-english-camp-2026",
      ogType: "website"
      // jsonLd will be added once event details are confirmed
    });
  }, []);

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      {/* Header Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#2d5016] mb-4">
          Summer English Camp 2026
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          Intensive 7-week online program for ages 5–12: <strong>Phonics • Grammar • Public Speaking</strong>
        </p>
        <p className="text-gray-600 mb-8">
          Live mentors, daily practice, capstone projects, and weekly parent progress updates.
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
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Who is this camp for?</h2>
        <p className="text-gray-700 mb-4">
          Summer Camp 2026 is designed for children ages 5–12 who want to:
        </p>
        <ul className="space-y-2 text-gray-700 ml-4">
          <li>✓ Build strong phonics foundations or move to fluency</li>
          <li>✓ Master grammar rules and improve writing</li>
          <li>✓ Gain confidence in public speaking and presentations</li>
          <li>✓ Enjoy structured, fun online learning with peer interaction</li>
        </ul>
      </section>

      {/* What will they learn? */}
      <section id="learn" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">What your child will learn</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Phonics Card */}
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-xl font-bold text-[#4a7c2c] mb-3">📖 Phonics</h3>
            <p className="text-gray-700 mb-3">
              SATPIN sounds, blending, digraphs, vowel teams, and fluency building.
            </p>
            <Link to="/phonics" className="text-[#4a7c2c] hover:underline font-semibold">
              Learn more →
            </Link>
          </div>

          {/* Grammar Card */}
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-xl font-bold text-[#4a7c2c] mb-3">✏️ Grammar & Writing</h3>
            <p className="text-gray-700 mb-3">
              Nouns, verbs, tenses, sentence construction, and short paragraph writing.
            </p>
            <Link to="/grammar" className="text-[#4a7c2c] hover:underline font-semibold">
              Learn more →
            </Link>
          </div>

          {/* Speaking Card */}
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-xl font-bold text-[#4a7c2c] mb-3">🎤 Public Speaking</h3>
            <p className="text-gray-700 mb-3">
              Storytelling, presentations, confidence building, and Q&A skills.
            </p>
            <Link to="/speaking" className="text-[#4a7c2c] hover:underline font-semibold">
              Learn more →
            </Link>
          </div>
        </div>
      </section>

      {/* How the camp works */}
      <section id="how" className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">How the camp works</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-bold text-lg mb-2">📅 Live Sessions</h3>
            <p>
              Interactive daily lessons with live mentors in small groups (max 4 students). Each session builds on the previous week.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">🎯 Daily Practice</h3>
            <p>
              Students complete AI-guided practice activities and homework to reinforce learning between sessions.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">📊 Weekly Updates</h3>
            <p>
              Parents receive progress reports showing skills mastered, challenges, and recommendations for home practice.
            </p>
          </div>
          <div className="text-center mt-6 p-4 bg-yellow-100 rounded border border-yellow-300">
            <p className="font-semibold text-gray-800">📋 Schedule & Pricing</p>
            <p className="text-gray-700">Details coming soon. Check back or contact us to reserve your spot!</p>
          </div>
        </div>
      </section>

      {/* Expected outcomes */}
      <section id="outcomes" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Outcomes parents can expect</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="text-2xl mr-3">✨</span>
            <span><strong>Reading fluency:</strong> Smooth, confident reading of age-appropriate texts</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">💪</span>
            <span><strong>Grammar confidence:</strong> Understanding of sentence structure and written expression</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">🗣️</span>
            <span><strong>Speaking poise:</strong> Increased confidence presenting ideas in front of others</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">📈</span>
            <span><strong>Progress momentum:</strong> Demonstrated growth in all three areas with documented milestones</span>
          </li>
        </ul>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faqs" className="mb-12 bg-purple-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-bold text-lg mb-1">What if my child is a beginner in English?</h3>
            <p>We welcome beginners! Our mentors assess each child's level and provide targeted lessons and practice.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">How many hours per week is the camp?</h3>
            <p>Details coming soon. Contact us to discuss schedule options that fit your family's needs.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Can I enroll in just one skill (phonics, grammar, or speaking)?</h3>
            <p>Contact us to discuss flexible enrollment options and pricing.</p>
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

      {/* Pricing Section */}
      <section id="schedule" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Schedule & Pricing</h2>
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-700 mb-4">
            Exact dates, session times, and pricing will be announced soon.
          </p>
          <Link
            to="/pricing"
            className="inline-block text-[#4a7c2c] hover:underline font-semibold"
          >
            View our standard pricing →
          </Link>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-[#2d5016] text-white p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to give your child a summer full of learning?</h2>
        <p className="mb-6 text-lg">
          Limited seats available. Book a free assessment today to reserve your spot.
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
