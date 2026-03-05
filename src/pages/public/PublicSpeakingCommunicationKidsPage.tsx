import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

// Single source of truth for FAQ data
const FAQS = [
  {
    question: 'What age is best to start public speaking classes?',
    answer: 'Children as young as 4 can start with simple confidence-building activities like show & tell and mini-stories. Ages 6–9 work on structured speaking, voice clarity, and storytelling. Ages 10+ tackle presentations, debates, and impromptu speaking. We tailor lessons to your child\'s readiness and comfort level.'
  },
  {
    question: 'My child is very shy. Will they be forced to speak?',
    answer: 'Absolutely not. We never force speaking or put pressure on kids. Our mentors create a warm, safe space where your child controls the pace. We start with micro-speaks (15-45 seconds) and gradually build confidence at their speed. Many of our most confident speakers started extremely shy.'
  },
  {
    question: 'Is it 1:1 or group classes?',
    answer: 'Primarily 1:1 live classes for personalized attention and a pressure-free environment. This lets shy children build confidence safely and advanced speakers get targeted feedback. Small group sessions (2-4 children) may be available on request for specific workshops or practice.'
  },
  {
    question: 'What happens in a typical speaking class?',
    answer: 'Each 30-40 minute session includes: warm-up activities (voice exercises, posture check), a speaking challenge (show & tell, storytelling, prepared or impromptu speech), gentle feedback on what went well and one tip to improve, and celebration of effort. We keep it fun, supportive, and low-pressure.'
  },
  {
    question: 'How do you improve pronunciation and voice clarity?',
    answer: 'We use tongue twisters, breathing exercises, and slow-paced repetition to improve pronunciation. Mentors model clear speech and gently correct common mistakes. We record progress so your child can hear their own improvement, which builds confidence and motivation.'
  },
  {
    question: 'Will this help with school presentations and class participation?',
    answer: 'Yes! School presentations, show & tell, and class discussions are exactly what we practice. Children learn to organize thoughts, speak clearly, make eye contact, and handle Q&A. Parents and teachers typically notice improved confidence and participation within a few lessons.'
  },
  {
    question: 'How often should my child take speaking classes?',
    answer: 'We recommend 2–3 classes per week for consistent progress. Speaking confidence grows with regular practice—like a muscle. Most children show noticeable improvement in confidence, clarity, and willingness to speak within 8–12 lessons.'
  },
  {
    question: 'How do you track progress in speaking skills?',
    answer: 'We track confidence level, voice clarity, eye contact, body language, sentence fluency, storytelling ability, and willingness to volunteer answers. Stage-based updates show specific improvements, strengths, areas to practice, and tips for home. You\'ll see measurable growth over time.'
  },
  {
    question: 'How long until I see my child\'s confidence improve?',
    answer: 'Most parents notice small changes within 4–6 lessons: speaking in full sentences at home, volunteering more at school, or trying new speaking activities. Deeper confidence (public speaking comfort, presentations without anxiety) develops over 20–30 lessons with consistent practice.'
  },
  {
    question: 'Can speaking classes help children who mumble or speak too softly?',
    answer: 'Yes! We work on voice projection, breathing techniques, and confidence. Many children speak softly due to shyness or habit—not physical issues. With encouragement, practice, and feedback, they learn to project their voice naturally. We celebrate every improvement.'
  },
  {
    question: 'Will my child be recorded during classes?',
    answer: 'Optional. We can record sessions for your child\'s portfolio or to review feedback together, but only with parent and child consent. Many parents love having recordings to celebrate their child\'s progress and share milestones with family.'
  },
  {
    question: 'Do you teach debate skills or just basic speaking?',
    answer: 'Both! Beginners focus on confidence, clarity, and storytelling. Advanced learners tackle structured speeches, debate basics, persuasive speaking, and handling opposing viewpoints. We adapt to your child\'s level and interests.'
  }
];

// Schemas with entity linking
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://tinystepslearning.com/#organization',
  name: 'Tiny Steps Learning',
  url: 'https://tinystepslearning.com',
  logo: 'https://tinystepslearning.com/logo.png',
  sameAs: [
    'https://www.facebook.com/tinystepslearning',
    'https://www.instagram.com/tinystepslearning'
  ]
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': 'https://tinystepslearning.com/public-speaking-communication-kids#breadcrumb',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Public Speaking Classes', item: 'https://tinystepslearning.com/public-speaking-communication-kids' },
  ],
};

const courseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  '@id': 'https://tinystepslearning.com/public-speaking-communication-kids#course',
  name: 'Public Speaking Classes for Kids',
  description: '1:1 public speaking classes for kids ages 4–12. Build confidence, voice clarity, storytelling, and presentation skills with live mentors and supportive practice.',
  provider: {
    '@id': 'https://tinystepslearning.com/#organization'
  },
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online'
  }
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': 'https://tinystepslearning.com/public-speaking-communication-kids#faqpage',
  mainEntity: FAQS.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};

export default function PublicSpeakingCommunicationKidsPage() {
  useEffect(() => {
    applySeo({
      title: "Public Speaking Classes for Kids (Ages 4–12) | Tiny Steps Learning",
      description: "1:1 public speaking classes for kids ages 4–12. Confidence, voice clarity, storytelling, presentations, and communication skills. Free assessment.",
      canonicalPath: "/public-speaking-communication-kids",
      ogType: "website",
      jsonLd: [organizationSchema, breadcrumbSchema, courseSchema, faqSchema],
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

      <section className="mb-6 text-center">
        <p className="text-sm text-gray-700">
          Tiny Steps Learning runs <strong>public speaking classes for kids</strong> that build confidence and
          communication skills through supportive, step-by-step practice.
        </p>
      </section>

      {/* AEO Direct Answer Block */}
      <section className="mb-12 bg-blue-50 border-l-4 border-[#4a7c2c] p-6 rounded-lg">
        <h2 className="text-lg font-bold text-[#2d5016] mb-2">What are public speaking classes for kids?</h2>
        <p className="text-gray-700 leading-relaxed">
          Public speaking classes for kids teach children ages 4–12 to speak confidently in front of others through live 1:1 sessions with supportive mentors. Each class builds voice clarity, eye contact, body language, storytelling skills, and presentation techniques using games, gentle feedback, and practice tailored to your child's comfort level.
        </p>
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
            <h3 className="font-bold text-lg mb-2">Stage Progress Updates</h3>
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
      <section id="faqs" className="mb-12 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6 text-center">Frequently Asked Questions About Speaking Classes</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          {FAQS.map((faq, index) => (
            <div key={index}>
              <h3 className="font-bold text-lg mb-2 text-gray-900">{faq.question}</h3>
              <p className="text-gray-700 text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">More questions?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/faq"
              className="inline-block border-2 border-[#4a7c2c] text-[#4a7c2c] font-semibold py-3 px-6 rounded-lg hover:bg-[#4a7c2c] hover:text-white transition"
            >
              View Full FAQ
            </Link>
            <Link
              to="/contact"
              className="inline-block bg-[#4a7c2c] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#2d5016] transition"
            >
              Book Free Assessment
            </Link>
          </div>
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
