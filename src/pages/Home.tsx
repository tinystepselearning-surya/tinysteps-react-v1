import Hero from "../components/Hero";
import Why from "../components/Why";
import CoursesSection from "../components/CoursesSection";
import Testimonials from "../components/Testimonials";
import AboutCard from "../components/AboutCard";
import LeadForm from "../components/LeadForm";

export default function Home() {
  return (
    <div className="bg-white">
      <main>
        <Hero />
        <Why />
        <CoursesSection />
        <Testimonials />
        <AboutCard />
        <LeadForm />
      </main>
    </div>
  );
}
