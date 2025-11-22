// React default import removed (using new JSX transform)
import { Link } from 'react-router-dom';
import CountUp from '@components/CountUp'; // Use alias for consistency
import WhyChooseUs from '@components/WhyChooseUs';
import Layout from '@components/Layout';
import FounderArticleCard from '@components/FounderArticleCard';

// Hero Component
const Hero = () => (
  <section id="home" className="relative py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-pulse"></div>
    <div className="container mx-auto px-4 relative z-10">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 animate-fade-in">Phonics, Grammar & Public Speaking</h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-4 animate-fade-in delay-200">Crafted for Ages 3–10</p>
          <p className="text-lg text-gray-600 mb-8 animate-fade-in delay-400">Purposeful teaching, playful classrooms, measurable progress</p>
          <div className="flex items-center justify-center md:justify-start gap-4">
            <a href="#book-trial" className="min-h-[50px] px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 text-lg font-semibold">Book a Free Trial</a>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 underline">Admin Login</Link>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4">
          <div className="inline-flex flex-wrap gap-3 items-center">
            <Link to="/phonics" className="px-3 py-1.5 rounded-full bg-white/90 text-slate-900 font-semibold shadow-sm hover:shadow-md border border-slate-100 text-sm">Phonics</Link>
            <Link to="/grammar" className="px-3 py-1.5 rounded-full bg-white/90 text-slate-900 font-semibold shadow-sm hover:shadow-md border border-slate-100 text-sm">Grammar</Link>
            <Link to="/speaking" className="px-3 py-1.5 rounded-full bg-white/90 text-slate-900 font-semibold shadow-sm hover:shadow-md border border-slate-100 text-sm">Public Speaking</Link>
          </div>
          <p className="mt-2 text-sm text-slate-600 text-center md:text-right">Explore each course page for curriculum details, schedules, and sample lessons.</p>
        </div>
      </div>
    </div>
  </section>
);

// Why Section
const WhySection = () => (
  <section id="why" className="py-20 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Why Tiny Steps Works</h2>
      <p className="text-xl text-center text-gray-700 mb-12 max-w-3xl mx-auto">
        Every Tiny Steps session blends research-backed pedagogy with joyful rituals so kids feel energised, parents stay informed, and communication skills grow term after term.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Joyful Learning</h3>
          <p className="text-gray-700">Children thrive in an environment filled with stories, play, and creativity.</p>
        </div>
        <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">One-to-One Guidance</h3>
          <p className="text-gray-700">Personal attention helps every child feel seen, supported, and celebrated.</p>
        </div>
        <div className="bg-gradient-to-br from-pink-100 to-red-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-2">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Professional Teachers</h3>
          <p className="text-gray-700">Certified educators bring patience, expertise, and warmth to every class.</p>
        </div>
      </div>
    </div>
  </section>
);

// Courses Section
const CoursesSection = () => (
  <section id="courses" className="py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Beautifully Crafted Learning Tracks</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300">
          <h3 className="text-2xl font-bold mb-4 text-blue-600">Phonics Foundations</h3>
          <p className="text-gray-700 mb-4">Systematic, multi-sensory lessons that turn sounds into stories your child can read aloud.</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• SATPIN mastery in 6 weeks</li>
            <li>• Weekly progress reports</li>
            <li>• Parent play sheets</li>
          </ul>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300">
          <h3 className="text-2xl font-bold mb-4 text-green-600">Grammar & Writing</h3>
          <p className="text-gray-700 mb-4">Sentence building, creative writing, and grammar games that make structure feel natural and fun.</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Story-led grammar labs</li>
            <li>• Cambridge-aligned rubrics</li>
            <li>• Peer & mentor feedback</li>
          </ul>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300">
          <h3 className="text-2xl font-bold mb-4 text-purple-600">Public Speaking</h3>
          <p className="text-gray-700 mb-4">Stage presence, storytelling, and vocal confidence coached through playful performances.</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Weekly spotlight sessions</li>
            <li>• Body & voice drills</li>
            <li>• Showcase presentation</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

// Program Highlights Section
const HighlightsSection = () => (
  <section id="highlights" className="py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Program Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300">
          <h3 className="text-2xl font-bold mb-4 text-blue-600">35-Min Sessions</h3>
          <p className="text-gray-700">Short, focused classes designed for young learners.</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300">
          <h3 className="text-2xl font-bold mb-4 text-green-600">1:1 or Group</h3>
          <p className="text-gray-700">Choose personalized or collaborative learning formats.</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300">
          <h3 className="text-2xl font-bold mb-4 text-purple-600">Weekly Reports</h3>
          <p className="text-gray-700">Track your child’s progress with detailed updates.</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition duration-300">
          <h3 className="text-2xl font-bold mb-4 text-red-600">Parent Portal</h3>
          <p className="text-gray-700">Access resources and insights anytime, anywhere.</p>
        </div>
      </div>
    </div>
  </section>
);

// Our Teachers Section
const TeachersSection = () => (
  <section id="teachers" className="py-20 bg-white">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
      <div className="md:w-1/2 mb-8 md:mb-0">
        <img src="/images/teacher.jpg" alt="Teacher" className="rounded-3xl shadow-lg" />
      </div>
      <div className="md:w-1/2 md:pl-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Teachers</h2>
        <p className="text-gray-700 text-lg">Every Tiny Steps teacher is trained in phonics, fluency, and early childhood care. They bring patience, expertise, and warmth to every class.</p>
      </div>
    </div>
  </section>
);

// Stats Section
const StatsSection = () => (
  <section className="py-20 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-4xl font-bold mb-8">Our Achievements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white text-blue-600 rounded-3xl p-8 shadow-lg">
          <h3 className="text-6xl font-extrabold mb-4">
            <CountUp from={0} to={3000} separator="," duration={2} className="count-up-text" />+
          </h3>
          <p className="text-xl font-medium">Students Educated</p>
        </div>
        <div className="bg-white text-blue-600 rounded-3xl p-8 shadow-lg">
          <h3 className="text-6xl font-extrabold mb-4">
            <CountUp from={0} to={6} duration={2} className="count-up-text" />+
          </h3>
          <p className="text-xl font-medium">Years of Excellence</p>
        </div>
      </div>
    </div>
  </section>
);

// Testimonials Section
const TestimonialsSection = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Families See Measurable Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-gray-50 rounded-3xl p-6 shadow-lg">
          <p className="text-gray-700 mb-4">"Within four weeks Kavya was decoding storybooks independently."</p>
          <p className="font-semibold text-gray-900">Anita Rao, Bengaluru</p>
        </div>
        <div className="bg-gray-50 rounded-3xl p-6 shadow-lg">
          <p className="text-gray-700 mb-4">"The SATPIN routine made reading feel like playtime for Vihaan."</p>
          <p className="font-semibold text-gray-900">Siddharth & Nisha Patel, Ahmedabad</p>
        </div>
        <div className="bg-gray-50 rounded-3xl p-6 shadow-lg">
          <p className="text-gray-700 mb-4">"Aarav finally understands grammar rules and applies them in stories."</p>
          <p className="font-semibold text-gray-900">Parent Family, Location</p>
        </div>
      </div>
    </div>
  </section>
);

// Book a Free Trial CTA Section
const FreeTrialCTA = () => (
  <section id="book-trial" className="py-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold mb-4">Book a Free Trial</h2>
      <p className="text-lg mb-8">Experience the joy of learning with Tiny Steps.</p>
      <button className="px-8 py-4 bg-white text-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition duration-300 font-semibold text-xl">Get Started</button>
    </div>
  </section>
);

// FAQ Section
const FAQSection = () => (
  <section id="faq" className="py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Frequently Asked Questions</h2>
      <div className="space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900">What age group do you teach?</h3>
          <p className="text-gray-700 mt-2">We teach children aged 3–12 years, tailoring lessons to their developmental stage.</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900">Can I pick a teacher?</h3>
          <p className="text-gray-700 mt-2">Yes, you can choose from our roster of certified educators based on availability.</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900">How are sessions scheduled?</h3>
          <p className="text-gray-700 mt-2">Sessions are scheduled flexibly to suit your family’s routine.</p>
        </div>
      </div>
    </div>
  </section>
);

// Footer and Header are now provided by Layout component (imported above)

// Main Home Component — wrapped with Layout to include header/footer
const Home = () => (
  <Layout>
    <Hero />
    <WhySection />
    <CoursesSection />
    <HighlightsSection />
    <WhyChooseUs />
    <TeachersSection />
    <StatsSection />
    <TestimonialsSection />
    <FreeTrialCTA />

    {/* Founder article card: placed above FAQ */}
    <div className="px-4">
      <FounderArticleCard />
    </div>

    <FAQSection />
  </Layout>
);

export default Home;
