// @ts-nocheck
import { BookOpen, Users, CheckCircle, Star, MessageCircle } from 'lucide-react';
import Footer from '../components/common/Footer';
import ConversionHero from '../components/Home/ConversionHero';
import WhyChooseCollapsibleSection from '../components/Home/WhyChooseCollapsibleSection';
import StepTimeline from '../components/Home/StepTimeline';
import CoursesSection from '../components/Home/CoursesSection';
import SocialProofCrispSection from '../components/Home/SocialProofCrispSection';
import PricingCrispSection from '../components/Home/PricingCrispSection';
import FAQSection from '../components/Home/FAQSection';
import FinalCTASection from '../components/Home/FinalCTASection';
import Meta from '../components/common/Meta';
import { useAuthStore } from '../store/useAuthStore';
import TrustSignals from '../components/Trust/TrustSignals';
import TestimonialsCarousel from '../components/Home/TestimonialsCarousel';
import TrialForm from '../components/forms/TrialForm';
import StatsStrip from '../components/Home/StatsStrip';
import PopularPrograms from '../components/Home/PopularPrograms';
import GlobalImpactSection from '../components/Home/GlobalImpactSection';
import DemoShowcase from '../components/Home/DemoShowcase';
import AIGuidedPracticeSection from '../components/Home/AIGuidedPracticeSection';
import InteractiveSampleActivitySection from '../components/Home/InteractiveSampleActivitySection';

const courseCards = [
  {
    id: 'phonics',
    tone: 'from-blue-600 via-blue-500 to-cyan-400',
    tag: '🔵 PHONICS (Ages 3–6)',
    points: ['Reading fundamentals', 'Letter sounds → words', 'Worksheets included'],
    link: '/phonics',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'grammar',
    tone: 'from-yellow-500 via-amber-400 to-orange-300',
    tag: '🟡 GRAMMAR (Ages 6–12)',
    points: ['Nouns → Tenses → Sentences', 'Reading comprehension', 'Worksheets included'],
    link: '/grammar',
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'speaking',
    tone: 'from-orange-500 via-amber-500 to-pink-400',
    tag: '🟧 PUBLIC SPEAKING (Ages 6–12)',
    points: ['Confidence building', 'Show & Tell sessions', 'Speech practice'],
    link: '/speaking',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
  },
];

const testimonials = [
  {
    name: 'Anita Rao',
    location: 'Bengaluru',
    quote: '“Kavya now reads bedtime stories aloud with confidence. The teachers are so warm!”',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Parent Name',
    location: 'Pune',
    quote: '“Grammar finally makes sense to Aarav. Progress reports keep us in the loop.”',
    avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Meera Patel',
    location: 'Ahmedabad',
    quote: '“Public speaking classes boosted Vihaan’s confidence for school assemblies.”',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '₹4,400 / month',
    detail: '2 live classes weekly',
    features: ['Foundational skills', 'Progress tracker', 'Parent WhatsApp updates'],
  },
  {
    name: 'Standard',
    price: '₹6,600 / month',
    detail: '3 live classes weekly',
    features: ['Personalised curriculum', 'Worksheets & games', 'Monthly growth report'],
    highlight: true,
  },
  {
    name: 'Premium',
    price: '₹8,800 / month',
    detail: '4 live classes weekly',
    features: ['Public speaking labs', 'Dedicated mentor', 'Priority support'],
  },
];

// Adjusting mobile padding and spacing
const MobileLandingView = () => (
  <div className="lg:hidden w-full bg-gradient-to-b from-white via-blue-50 to-blue-100">
    {/* Hero */}
    <section className="px-6 pt-16 pb-10 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-sky-500 mb-4 font-semibold">Trusted by 10,000+ Indian Parents</p>
      <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
        Unlock Your Child's Potential with 1-on-1 English Classes
      </h1>
      <p className="mt-5 text-lg text-gray-700">
        Fun, personalized learning for Ages 3–12: Phonics, Grammar, and Public Speaking.
      </p>
      <a
        href="#book-trial"
        className="mt-8 inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-5 text-lg font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:scale-105 hover:shadow-xl hover:shadow-blue-600/50"
      >
        Book Free Assessment Class
      </a>
      <div className="mt-8 rounded-3xl bg-white p-4 shadow-lg shadow-slate-200/70">
        <img
          src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1000&q=80"
          alt="Happy Tiny Steps learner"
          className="w-full rounded-2xl object-cover shadow-md"
          loading="lazy"
        />
      </div>
      <p className="mt-6 text-sm font-medium text-gray-600">95% of parents see improvement within 3 months</p>
    </section>

    {/* Parent struggles */}
    <section className="px-6 py-8 space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/70">
        <p className="text-lg font-semibold text-gray-900 mb-5">Parents struggle with:</p>
        <ul className="space-y-3 text-sm text-gray-700">
          <li>• Child not reading confidently</li>
          <li>• Weak grammar foundation</li>
          <li>• Poor sentence formation</li>
          <li>• Low speaking confidence</li>
        </ul>
      </div>
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-6 shadow-lg shadow-blue-100/80">
        <p className="text-lg font-semibold text-gray-900 mb-5">Tiny Steps solves it:</p>
        <ul className="space-y-3 text-sm text-gray-700">
          <li>• 1-on-1 personalized classes</li>
          <li>• Child-friendly expert teachers</li>
          <li>• Structured curriculum</li>
          <li>• Worksheets + Games + Speaking practice</li>
        </ul>
      </div>
    </section>

    {/* Smooth scroll animation */}
    <style>
      {`
        html {
          scroll-behavior: smooth;
        }
      `}
    </style>
  </div>
);

export default function HomePage() {
  const { user } = useAuthStore();
  return (
    <>
      <Meta
        title="Tiny Steps Online English School | 1:1 Phonics, Grammar & Public Speaking for Kids (3–12)"
        description="Premium 1:1 online English classes for ages 3–12. IB-aligned phonics, grammar and public speaking with kind live mentors, AI-guided practice, and simple weekly progress updates for parents. Book a free assessment class."
        keywords="phonics classes online India, grammar classes for kids, public speaking courses children, English learning kids ages 3-12, online English tuition India, best English coaching India"
        canonical="https://tinystepslearning.com/"
      />
      <MobileLandingView />
      <ConversionHero />
      <StatsStrip />
      <PopularPrograms />
      <GlobalImpactSection />
      <TrustSignals />
      <TestimonialsCarousel />
      <DemoShowcase />
      <WhyChooseCollapsibleSection />
      <StepTimeline />
      <CoursesSection />
      <AIGuidedPracticeSection />
      <InteractiveSampleActivitySection />
      <SocialProofCrispSection />
      <section id="book-trial" className="px-6 py-12">
        <div className="mx-auto max-w-6xl grid gap-8 rounded-3xl bg-white/80 p-8 shadow-card-hover md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="gradient-chip w-max">AI-curated learning journey</div>
            <h2 className="text-3xl font-semibold text-gray-900">Empowering 3500+ students across 8 countries</h2>
            <p className="text-gray-700">Our AI engine maps your child’s current mastery, curates the weekly plan, and sends parents actionable insights every Friday.</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>🌅 Bright-sky lessons that feel joyful and calm</li>
              <li>🌍 Learners in India, US, UK, Canada, Singapore, Malaysia, Vietnam, UAE, Australia</li>
              <li>📊 Parent dashboard with AI-driven learning path insights</li>
            </ul>
          </div>
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-gray-900">Book Your Free Assessment Class</h3>
            <p className="mt-1 text-sm text-gray-600">Fill out the form below, and our team will contact you shortly. Your privacy is our priority.</p>
            <div className="mt-4">
              <TrialForm context="home_book_trial" />
            </div>
          </div>
        </div>
      </section>
      <PricingCrispSection />
      {/* Gaming subscription removed */}
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </>
  );
}
