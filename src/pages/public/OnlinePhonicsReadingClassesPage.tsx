import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

export default function OnlinePhonicsReadingClassesPage() {
  useEffect(() => {
    applySeo({
      title: "Online Phonics & Reading Classes for Kids (Ages 3–8) | Tiny Steps",
      description: "1:1 online phonics & reading classes for kids (Ages 3–8). Letter sounds, blending, CVC reading, and confidence—taught with fun games and weekly progress updates. Book a free assessment.",
      canonicalPath: "/online-phonics-reading-classes",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "Online Phonics & Reading Classes",
          "description": "1:1 online phonics and reading instruction for ages 3–8. Master letter sounds, blending, CVC words, and tricky words with live mentors and AI-guided practice.",
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
          Online Phonics & Reading Classes
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          1:1 personalized instruction for ages 3–8. Build confidence in letter sounds, blending, and reading.
        </p>
        <p className="text-gray-600 mb-8">
          Taught by experienced mentors using proven phonics methods, fun games, and weekly progress reports for parents.
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
        <p className="text-gray-700 mb-4">
          These classes are perfect for children ages 3–8 who:
        </p>
        <ul className="space-y-2 text-gray-700 ml-4">
          <li>✓ Are ready to learn letter sounds and start reading</li>
          <li>✓ Need confident, structured phonics instruction</li>
          <li>✓ Benefit from 1:1 attention and personalized pacing</li>
          <li>✓ Learn best with games, songs, and interactive activities</li>
        </ul>
      </section>

      {/* What your child will learn */}
      <section id="learn" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">What your child will learn</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">📖 Foundation Skills</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Letter recognition (uppercase & lowercase)</li>
              <li>• Individual letter sounds (SATPIN method)</li>
              <li>• Sound sequencing</li>
              <li>• Blending basic sounds into words</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🎯 Reading Skills</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• CVC (consonant-vowel-consonant) word reading</li>
              <li>• Tricky words & sight word introduction</li>
              <li>• Reading short sentences with confidence</li>
              <li>• Pronunciation & fluency building</li>
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
              Interactive 25–30 minute lessons with a live mentor. Each session is tailored to your child's pace and learning style.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Fun Activities & Games</h3>
            <p>
              Letter songs, sound-matching games, flashcard activities, and storytelling keep learning engaging and playful.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Short Homework</h3>
            <p>
              5–10 minute practice activities between lessons to reinforce what your child learned. Easy to fit into any schedule.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Weekly Progress Updates</h3>
            <p>
              Detailed reports show what your child mastered, what's next, and tips for supporting learning at home.
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Path */}
      <section id="curriculum" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">Curriculum path</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 1: Letter Sounds (SATPIN)</h3>
            <p className="text-gray-700 text-sm">
              Master the 6 foundation sounds. Learn sound sequencing and basic blending. Build a strong phonetic foundation.
            </p>
          </div>
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 2: CVC Words & Reading</h3>
            <p className="text-gray-700 text-sm">
              Blend sounds into CVC words (mat, sit, dog). Build sight word vocabulary. Read simple sentences with confidence.
            </p>
          </div>
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 3: Digraphs & Fluency</h3>
            <p className="text-gray-700 text-sm">
              Introduction to digraphs (ch, sh, th). Increase reading fluency. Build independence and confidence.
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
            <span><strong>Reading confidence:</strong> Your child will feel proud reading simple words and sentences aloud</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">🎯</span>
            <span><strong>Sound mastery:</strong> Clear understanding of letter-to-sound connections and blending rules</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">📚</span>
            <span><strong>Love of reading:</strong> Enthusiasm for books and stories, leading to lifelong learning</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">📈</span>
            <span><strong>Progress momentum:</strong> Visible milestones each month with documented growth</span>
          </li>
        </ul>
      </section>

      {/* FAQs */}
      <section id="faqs" className="mb-12 bg-purple-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-bold text-lg mb-1">What if my child has never read before?</h3>
            <p>Perfect! We start from the very beginning. Our mentors teach letter sounds before reading, building a strong foundation step by step.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">How often should we take classes?</h3>
            <p>We recommend 2–3 classes per week for best results. Most children see noticeable progress within 4–6 weeks of consistent practice.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Can my child learn if they're shy or anxious?</h3>
            <p>Yes! 1:1 classes provide a safe, pressure-free space. Our mentors build trust and create a fun learning environment at your child's pace.</p>
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
          Once your child masters phonics and reading, they can move forward with confidence:
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/grammar" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Explore Grammar & Writing →
          </Link>
          <Link to="/speaking" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Explore Public Speaking →
          </Link>
          <Link to="/phonics" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Full Phonics Program →
          </Link>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-[#2d5016] text-white p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to help your child unlock reading?</h2>
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
