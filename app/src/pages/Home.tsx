import Hero from "../components/Hero";
import StatsBar from "../components/StatsBar";
import Why from "../components/Why";
import CoursesSection from "../components/CoursesSection";
import Testimonials from "../components/Testimonials";
import SuccessStories from "../components/SuccessStories";
import AboutCard from "../components/AboutCard";
import HowItWorks from "../components/HowItWorks";
import LeadForm from "../components/LeadForm";

export default function Home() {
  return (
    <div className="bg-white">
      <main>
        <Hero />
        <StatsBar />
        <Why />
        <CoursesSection />
        <Testimonials />
        <SuccessStories />
        <AboutCard />
        <HowItWorks />
        <LeadForm />
      </main>
    </div>
  );
}
