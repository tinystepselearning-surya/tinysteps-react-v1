import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

export default function PublicSpeakingCommunicationKidsPage() {
  useEffect(() => {
    applySeo({
      title: "Public Speaking & Communication Classes for Kids (Ages 4–12) | Tiny Steps",
      description: "Online public speaking and communication classes for kids (Ages 4–12). Build confidence, eye contact, posture, storytelling, and presentation skills with friendly mentors. Book a free assessment.",
      canonicalPath: "/public-speaking-communication-kids",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "Public Speaking & Communication Classes",
          "description": "1:1 online public speaking and communication instruction for ages 4–12. Master confidence, voice clarity, body language, storytelling, and presentation skills with live mentors and supportive practice.",
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
          Public Speaking & Communication Classes
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          1:1 personalized instruction for ages 4–12. Build confidence, voice clarity, and presentation skills.
        </p>
        <p className="text-gray-600 mb-8">
          Taught by friendly mentors using proven techniques, games, and encouragement. Your child will learn at their own pace in a safe, pressure-free environment.
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
          <li>✓ Are shy or anxious about speaking in front of others</li>
          <li>✓ Need help with school presentations, show & tell, or class participation</li>
          <li>✓ Want to build confidence and communication skills</li>
          <li>✓ Learn best with encouragement, practice, and positive feedback</li>
        </ul>
      </section>

      {/* What your child will learn */}
      <section id="learn" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">What your child will learn</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🎤 Confidence & Body Language</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Eye contact and smiling naturally</li>
              <li>• Standing posture and hand gestures</li>
              <li>• Managing nervousness and self-doubt</li>
              <li>• Building belief in their voice and ideas</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🗣️ Voice & Storytelling</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Clear, confident voice and pronunciation</li>
              <li>• Pace, tone, and vocal variety</li>
              <li>• Storytelling and descriptive language</li>
              <li>• Answering questions and thinking on their feet</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How our classes work */}
      <section id="how" className="mb-12 bg-green-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">How our online classes work</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-bold text-lg mb-2">1:1 Live Sessions with a Friendly Mentor</h3>
            <p>
              Interactive 30–40 minute lessons in a safe, supportive environment. No judgment, no pressure—just encouragement and practice.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Structured Practice Activities</h3>
            <p>
              Show & tell, storytelling games, impromptu speaking, mock presentations, and fun voice activities. Each activity builds skills step by step.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Gentle, Constructive Feedback</h3>
            <p>
              Your child receives positive feedback on what went well, plus specific tips to improve. We celebrate effort and progress, not perfection.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Weekly Progress Reports</h3>
            <p>
              Parents receive detailed notes on what your child practiced, strengths they showed, and areas to work on. Tips for practicing at home included.
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Path */}
      <section id="curriculum" className="mb-12">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">Curriculum path</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 1: Confidence Foundations</h3>
            <p className="text-gray-700 text-sm">
              Posture, eye contact, and voice warmups. Micro-speaks (15-45 seconds). Building comfort with speaking while feeling supported.
            </p>
          </div>
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 2: Structure & Expression</h3>
            <p className="text-gray-700 text-sm">
              Hook-body-close framework. Storytelling and descriptive language. Hand gestures and vocal variety. Prepared and impromptu speaking.
            </p>
          </div>
          <div className="border-l-4 border-[#4a7c2c] pl-6 py-2">
            <h3 className="font-bold text-lg text-[#2d5016]">Stage 3: Presentations & Performance</h3>
            <p className="text-gray-700 text-sm">
              Creating and delivering presentations. Q&A practice. Building stage confidence. Recording speeches and celebrating accomplishments.
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
            <span><strong>Visible confidence:</strong> Your child will speak in full sentences, volunteer in class, and participate without fear</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">🎤</span>
            <span><strong>Clear communication:</strong> Better voice clarity, eye contact, posture, and ability to organize their thoughts</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">📚</span>
            <span><strong>Improved school performance:</strong> Stronger presentation skills lead to better grades, more class participation, and friendships</span>
          </li>
          <li className="flex items-start">
            <span className="text-2xl mr-3">💪</span>
            <span><strong>Lasting confidence:</strong> Skills that transfer to all areas of life—school, sports, social situations, future job interviews</span>
          </li>
        </ul>
      </section>

      {/* FAQs */}
      <section id="faqs" className="mb-12 bg-purple-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-bold text-lg mb-1">My child is very shy. Will they be forced to speak?</h3>
            <p>No. We never force speaking or put pressure on kids. Our mentors create a warm, safe space where your child controls the pace. We start small (micro-speaks) and gradually build confidence at their speed.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">How often should we take classes?</h3>
            <p>We recommend 2–3 classes per week for best results. Consistent practice helps confidence grow quickly. Most children see noticeable improvement in confidence and communication within 4–6 weeks.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Will my child be recorded?</h3>
            <p>Optional. We can record sessions for your child's portfolio or to review feedback, but only with parent and child consent. Many parents love having recordings to celebrate their child's progress.</p>
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
          Build complete English skills across reading, writing, and speaking:
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/phonics" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Explore Phonics & Reading →
          </Link>
          <Link to="/grammar" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Explore Grammar & Writing →
          </Link>
          <Link to="/speaking" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Full Speaking Program →
          </Link>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-[#2d5016] text-white p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to help your child find their confident voice?</h2>
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
