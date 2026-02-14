import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applySeo } from '../lib/seo';
import ProgramHero from '../components/programs/ProgramHero';
import LevelTabs from '../components/programs/LevelTabs';
import LearningJourney from '../components/programs/LearningJourney';
import BookAssessmentForm from '../components/forms/BookAssessmentForm';

const levels = [
  {
    name: 'Beginner',
    outcomes: ['SATPIN mastery & blending routines', 'Tricky words set A', 'Daily AI reading prompts'],
    pdf: '/curriculum'
  },
  {
    name: 'Intermediate',
    outcomes: ['Digraphs, vowel teams, silent-e', 'Dictation + spelling rules', 'Weekly fluency recordings'],
    pdf: '/curriculum'
  },
  {
    name: 'Advanced',
    outcomes: ['Multisyllabic decoding & morphology', 'Comprehension questions + writing', 'Capstone: 150-word reading video'],
    pdf: '/curriculum'
  }
];

const stages = [
  { title: 'Weeks 1-4 • Sounds to words', duration: 'Month 1', description: 'SATPIN, blending club, AI-driven home practice.' },
  { title: 'Weeks 5-8 • Rules & teams', duration: 'Month 2', description: 'Digraphs, magic-e, vowel teams, tricky words set B.' },
  { title: 'Weeks 9-12 • Fluency & writing', duration: 'Month 3', description: 'Reading passages with expression, spelling, and short paragraphs.' }
];

export default function PhonicsPage() {
  useEffect(() => {
    applySeo({
      title: "Online Phonics Classes for Kids (Ages 3-12) | Tiny Steps",
      description: "Systematic 1:1 online phonics classes for ages 3-12. SATPIN method, blending practice, decodable reading with live mentors. Weekly parent progress reports. Book free trial.",
      canonicalPath: "/phonics",
      ogType: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          "name": "Phonics Superstar Program",
          "description": "Systematic, multi-sensory phonics taught live with AI reading coaches and weekly parent insights. SATPIN to advanced decoding in 12 weeks.",
          "provider": {
            "@type": "Organization",
            "name": "Tiny Steps Online School",
            "sameAs": "https://tinystepslearning.com"
          },
          "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "OnlineCoursePlatform"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://tinystepslearning.com/" },
            { "@type": "ListItem", "position": 2, "name": "Phonics" }
          ]
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What age is best to start phonics?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ages 3-4 are ideal. Children can recognize sounds before reading. Start with SATPIN (6 sounds) using playful games, not worksheets. Expect 4-6 weeks to blend first words like 'sat' or 'pin'."
              }
            },
            {
              "@type": "Question",
              "name": "How long does it take to learn phonics?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most children master basic phonics in 12-16 weeks with consistent practice. Blending typically clicks in 4-6 weeks. Progress depends on age, frequency, and teaching method."
              }
            },
            {
              "@type": "Question",
              "name": "What is the SATPIN method?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "SATPIN teaches six sounds first: s, a, t, p, i, n. These combine into many words like sat, pin, tap. It's faster than teaching all 26 letters. Children read words within 2-3 weeks."
              }
            },
            {
              "@type": "Question",
              "name": "Is online phonics effective for kids?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. 1:1 online classes with trained teachers match in-person results. Screen-share, games, and recording tools help. Weekly parent feedback ensures accountability."
              }
            },
            {
              "@type": "Question",
              "name": "How much do phonics classes cost in India?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "1:1 live phonics classes at Tiny Steps: Starter (8 classes) ₹3,360/month, Growth (16 classes) ₹6,440/month, Intensive (24 classes) ₹9,240/month. All plans include 30% discount. Free assessment class to start."
              }
            },
            {
              "@type": "Question",
              "name": "What's the difference between 1:1 and group phonics classes?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "1:1 classes adapt to your child's pace, give instant feedback, and finish faster (12 weeks vs 20+ weeks). Group classes cost less but suit children who already follow instructions well."
              }
            },
            {
              "@type": "Question",
              "name": "Do you teach Jolly Phonics or synthetic phonics?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We use systematic synthetic phonics with SATPIN order, multisensory actions, and blending drills. We customize based on IB or CBSE school needs."
              }
            },
            {
              "@type": "Question",
              "name": "Can my 7-year-old who struggles with reading catch up?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Intensive phonics (3x/week) closes gaps in 8-12 weeks. We assess specific needs like sounds, blending, or digraphs and focus there. Consistency drives 95%+ success."
              }
            }
          ]
        }
      ]
    });
  }, []);

  return (
    <div>
      {/* Answer Block for AEO */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 max-w-4xl mx-auto my-8">
        <p className="text-lg font-semibold text-gray-900">
          Tiny Steps offers live 1:1 online phonics classes for kids ages 3-12 across India. 
          We teach systematic phonics (SATPIN method) with multisensory activities, blending practice, 
          and decodable reading. Most children read their first words within 4-6 weeks.
        </p>
      </div>

      <ProgramHero
        program="Phonics"
        title="Phonics Superstar Program"
        subtitle="Systematic, multi-sensory phonics taught live with AI reading coaches and weekly parent insights."
        badges={['Ages 3–12', 'Live 1:1 or pods', 'AI progress dashboard']}
        highlights={[
          'SATPIN + digraphs + multisyllabic decoding',
          'Recorded practice + decodable libraries',
          'Weekly feedback + WhatsApp nudges'
        ]}
      />
      <LevelTabs levels={levels} />
      <LearningJourney stages={stages} />

      {/* Buyer Guide Section */}
      <section className="max-w-4xl mx-auto px-6 py-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Choosing the best online phonics classes in India</h2>
        <p className="text-gray-700 mb-4">
          Evaluating online phonics programs can be overwhelming. Our comprehensive buyer guide helps parents compare options using a 10-point checklist covering curriculum quality, teacher credentials, class formats (1:1 vs group), trial policies, and pricing transparency.
        </p>
        <p className="text-gray-700 mb-6">
          Whether you're looking for your first phonics program or switching from another provider, this guide includes FAQs from Indian parents and practical tips for making an informed decision.
        </p>
        <Link 
          to="/best-online-phonics-classes-india"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Read the buyer guide: Best Online Phonics Classes in India
          <span className="text-lg">→</span>
        </Link>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What age is best to start phonics?</h3>
            <p className="text-gray-700">Ages 3-4 are ideal. Children can recognize sounds before reading. Start with SATPIN (6 sounds) using playful games, not worksheets. Expect 4-6 weeks to blend first words like 'sat' or 'pin'.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How long does it take to learn phonics?</h3>
            <p className="text-gray-700">Most children master basic phonics in 12-16 weeks with consistent practice. Blending typically clicks in 4-6 weeks. Progress depends on age, frequency, and teaching method.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What is the SATPIN method?</h3>
            <p className="text-gray-700">SATPIN teaches six sounds first: s, a, t, p, i, n. These combine into many words like sat, pin, tap. It's faster than teaching all 26 letters. Children read words within 2-3 weeks.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Is online phonics effective for kids?</h3>
            <p className="text-gray-700">Yes. 1:1 online classes with trained teachers match in-person results. Screen-share, games, and recording tools help. Weekly parent feedback ensures accountability.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How much do phonics classes cost in India?</h3>
            <p className="text-gray-700">Tiny Steps offers three flexible plans with 30% OFF: Starter (8 classes) ₹3,360/month, Growth (16 classes) ₹6,440/month, and Intensive (24 classes) ₹9,240/month. All plans are 1:1 live classes with free assessment to start. For detailed pricing comparisons and what to look for when evaluating value, see our <Link to="/best-online-phonics-classes-india" className="text-blue-600 hover:underline">buyer guide for choosing online phonics classes in India</Link>.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What's the difference between 1:1 and group phonics classes?</h3>
            <p className="text-gray-700">1:1 classes adapt to your child's pace, give instant feedback, and finish faster (12 weeks vs 20+ weeks). Group classes cost less but suit children who already follow instructions well.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you teach Jolly Phonics or synthetic phonics?</h3>
            <p className="text-gray-700">We use systematic synthetic phonics with SATPIN order, multisensory actions, and blending drills. We customize based on IB or CBSE school needs.</p>
          </div>
          <div className="pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Can my 7-year-old who struggles with reading catch up?</h3>
            <p className="text-gray-700">Yes. Intensive phonics (3x/week) closes gaps in 8-12 weeks. We assess specific needs like sounds, blending, or digraphs and focus there. Consistency drives 95%+ success.</p>
          </div>
        </div>
      </section>

      {/* Book Assessment Form Section */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Start Your Phonics Journey?</h2>
            <p className="text-lg text-gray-700 mb-4">
              Book a free assessment class with our experienced mentors. We'll understand your child's learning style and create a personalized phonics plan to help them read with confidence.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <span>Personalized assessment in your first class</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <span>Weekly progress tracking and parent reports</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">🎓</span>
                <span>Experienced mentors trained in SATPIN method</span>
              </li>
            </ul>
          </div>
          <div>
            <BookAssessmentForm defaultInterest="Phonics" source="/phonics" />
          </div>
        </div>
      </section>
    </div>
  );
}
