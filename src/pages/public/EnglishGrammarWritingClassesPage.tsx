import { useEffect } from 'react';
import { applySeo } from '../../lib/seo';
import { Link } from 'react-router-dom';

// Single source of truth for FAQ data
const FAQS = [
  {
    question: 'What is the right age to start grammar classes?',
    answer: 'Children as young as 5 can start with simple parts of speech (nouns, verbs) and sentence basics. Ages 7–9 dive deeper into punctuation and sentence structure. Ages 10+ work on complex sentences, editing, and essay writing. We assess your child\'s level during the free trial and start where they\'re ready—not just based on age or grade.'
  },
  {
    question: 'How do you teach tenses to young children?',
    answer: 'We use visual timelines, relatable stories, and simple examples kids can connect to their daily lives. For example: "Yesterday I played" (past), "Today I play" (present), "Tomorrow I will play" (future). We practice through games and writing activities until tense usage becomes natural—not just memorized rules.'
  },
  {
    question: 'My child hates grammar. Will they enjoy these classes?',
    answer: 'Grammar feels boring when it\'s just rules and worksheets. Our approach is different: we use games, real-world examples, and show how grammar helps express ideas better. When kids see the purpose and experience success, they engage—and many actually start enjoying the "a-ha" moments.'
  },
  {
    question: 'How often should my child take grammar classes?',
    answer: 'We recommend 2–3 classes per week for consistent progress. Grammar skills build on each other, so regular practice helps concepts become automatic. Most children see noticeable improvements in writing clarity and confidence within 4–6 weeks.'
  },
  {
    question: 'Will this help with my child\'s school writing assignments?',
    answer: 'Absolutely. Strong grammar is the foundation of all good writing. Our students typically see better grades in English, improved essay scores, and more confidence in written assignments across all subjects. Parents often tell us teachers notice the improvement within weeks.'
  },
  {
    question: 'My child struggles with spelling and punctuation. Can you help?',
    answer: 'Yes! Spelling and punctuation are core parts of our curriculum. We teach rules systematically (not just memorization) and practice through guided writing. Our 1:1 format lets us address specific weak spots and build confidence step-by-step.'
  },
  {
    question: 'Do you teach creative writing or just grammar rules?',
    answer: 'Both! We teach grammar through writing practice—not in isolation. Kids write stories, descriptions, and essays while applying grammar rules. This makes learning meaningful and helps them see how grammar improves their creative expression.'
  },
  {
    question: 'Can grammar classes help with reading comprehension?',
    answer: 'Yes! Understanding sentence structure and grammar helps children decode complex sentences when reading. They can identify subjects, verbs, and clauses, which makes comprehension easier—especially with academic texts and literature.'
  },
  {
    question: 'What if my child is ahead or behind their grade level?',
    answer: 'Our 1:1 approach is perfect for this. We assess your child\'s current skills during the free trial and customize lessons to their level—whether they need foundational support or advanced challenges. No one is held back or pushed too fast.'
  },
  {
    question: 'How long until I see improvement in my child\'s writing?',
    answer: 'Most parents notice clearer sentences and fewer basic errors within 3–4 weeks of consistent classes (2–3 times per week). Deeper skills like paragraph organization and complex sentence structure develop over 8–12 weeks. Every child progresses at their own pace.'
  },
  {
    question: 'How will I know if my child is making progress?',
    answer: 'Every week, you receive a detailed progress report showing what grammar concepts your child mastered, writing samples with feedback, areas to focus on next, and tips for home practice. You\'ll see concrete improvement in their writing over time.'
  },
  {
    question: 'How do you track progress in grammar and writing?',
    answer: 'We track mastery of specific grammar concepts (parts of speech, tenses, punctuation), writing clarity, sentence variety, and error patterns. Weekly reports show skills mastered, writing samples, and next steps. You see exactly where your child is improving and what to practice at home.'
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
  '@id': 'https://tinystepslearning.com/english-grammar-writing-classes#breadcrumb',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tinystepslearning.com/' },
    { '@type': 'ListItem', position: 2, name: 'Grammar & Writing Classes', item: 'https://tinystepslearning.com/english-grammar-writing-classes' },
  ],
};

const courseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  '@id': 'https://tinystepslearning.com/english-grammar-writing-classes#course',
  name: 'Online English Grammar & Writing Classes',
  description: '1:1 online grammar and writing instruction for ages 5–12. Master sentence structure, punctuation, parts of speech, and creative writing with live mentors and interactive practice.',
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
  '@id': 'https://tinystepslearning.com/english-grammar-writing-classes#faqpage',
  mainEntity: FAQS.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};

export default function EnglishGrammarWritingClassesPage() {
  useEffect(() => {
    applySeo({
      title: "Online English Grammar & Writing Classes (Ages 5–12) | Tiny Steps",
      description: "Online grammar and writing classes for kids (Ages 5–12). Clear explanations, games, sentence building, and guided writing—plus stage-based progress updates. Book a free assessment.",
      canonicalPath: "/english-grammar-writing-classes",
      ogType: "website",
      jsonLd: [organizationSchema, breadcrumbSchema, courseSchema, faqSchema],
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
          Help your child write clear, confident sentences and master grammar rules that stick—with 1:1 mentorship tailored to their pace (Ages 5–12).
        </p>
        <p className="text-gray-600 mb-8">
          No more confusing worksheets or boring drills. Our mentors use games, clear examples, and guided writing practice to make grammar click. Weekly progress reports show exactly what your child is mastering.
        </p>
        <Link
          to="/contact"
          className="inline-block bg-[#4a7c2c] hover:bg-[#2d5016] text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Book a Free Assessment
        </Link>
      </section>

      {/* AEO Direct Answer Block */}
      <section className="mb-12 bg-blue-50 border-l-4 border-[#4a7c2c] p-6 rounded-lg">
        <h2 className="text-lg font-bold text-[#2d5016] mb-2">What are online English grammar & writing classes?</h2>
        <p className="text-gray-700 leading-relaxed">
          Online English grammar and writing classes teach children ages 5–12 sentence structure, punctuation, parts of speech, and creative writing through live 1:1 sessions with expert mentors. Each class includes clear explanations, interactive practice, and guided writing activities tailored to your child's level—with stage-based progress updates so parents see exactly what skills are improving.
        </p>
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
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6">What your child will master</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">📝 Grammar Foundations</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Parts of speech: nouns, verbs, adjectives, adverbs, prepositions</li>
              <li>• Subject-verb agreement and proper tense usage</li>
              <li>• Simple, compound, and complex sentence structures</li>
              <li>• Understanding clauses, phrases, and sentence variety</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">✍️ Writing & Composition</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Punctuation mastery: periods, commas, apostrophes, quotation marks</li>
              <li>• Paragraph organization with topic sentences and supporting details</li>
              <li>• Descriptive writing using vivid adjectives and sensory language</li>
              <li>• Editing, proofreading, and self-correction strategies</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🎯 Practical Application</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Writing clear sentences and fixing run-ons or fragments</li>
              <li>• Building vocabulary through context and word families</li>
              <li>• Using grammar to express ideas more precisely</li>
              <li>• Applying rules in real writing (stories, essays, reports)</li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#4a7c2c] mb-3">🏆 Confidence & Fluency</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Understanding WHY rules exist (not just memorizing)</li>
              <li>• Confidence to write without constant second-guessing</li>
              <li>• Recognition of common mistakes and how to fix them</li>
              <li>• Transferring skills to all school subjects and creative projects</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          Not sure where your child should start? <Link to="/contact" className="text-[#4a7c2c] underline font-semibold">Book a free assessment</Link> and we'll recommend the perfect starting point.
        </p>
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
      <section id="faqs" className="mb-12 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-[#2d5016] mb-6 text-center">Frequently Asked Questions About Grammar Classes</h2>
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
        <h2 className="text-2xl font-bold text-[#2d5016] mb-4">Build complete English language skills</h2>
        <p className="text-gray-700 mb-6">
          Grammar is one pillar of strong English. Explore our other programs to give your child a well-rounded foundation:
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/phonics" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Phonics & Reading Program →
          </Link>
          <Link to="/public-speaking-communication-kids" className="text-[#4a7c2c] hover:underline font-semibold block">
            → Public Speaking Classes →
          </Link>
          <Link to="/courses" className="text-[#4a7c2c] hover:underline font-semibold block">
            → All Courses & Curriculum →
          </Link>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-[#2d5016] text-white p-8 md:p-12 rounded-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to help your child write with confidence?</h2>
        <p className="mb-6 text-lg max-w-2xl mx-auto">
          Book a free assessment to understand your child's current grammar level and get a personalized learning plan. See exactly how our 1:1 approach works—with no commitment required.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
          <Link
            to="/contact"
            className="bg-white text-[#2d5016] hover:bg-gray-100 font-bold py-4 px-8 rounded-lg transition text-lg"
          >
            Book Free Assessment
          </Link>
          <Link
            to="/pricing"
            className="border-2 border-white text-white hover:bg-white hover:text-[#2d5016] font-bold py-4 px-8 rounded-lg transition text-lg"
          >
            View Pricing
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <Link to="/courses" className="text-white hover:text-gray-200 underline">
            All Courses
          </Link>
          <span className="text-gray-400">•</span>
          <Link to="/curriculum" className="text-white hover:text-gray-200 underline">
            Full Curriculum
          </Link>
          <span className="text-gray-400">•</span>
          <Link to="/phonics" className="text-white hover:text-gray-200 underline">
            Phonics Program
          </Link>
          <span className="text-gray-400">•</span>
          <Link to="/public-speaking-communication-kids" className="text-white hover:text-gray-200 underline">
            Speaking Classes
          </Link>
        </div>
      </section>
    </div>
  );
}
