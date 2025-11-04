// src/App.tsx
import Header from "./components/Header";
import Hero from "./components/Hero";
import Why from "./components/Why";
import Courses from "./components/Courses";
import Testimonials from "./components/Testimonials";
import AboutCard from "./components/AboutCard"; // ← add this import
import LeadForm from "./components/LeadForm";
import Footer from "./components/Footer";
import WhatsAppWidget from "./components/WhatsAppWidget";

export default function App() {
  return (
    <div className="bg-white">
      <Header />
      <main>
        <Hero />
        <Why />
        <Courses />
        <Testimonials />
        <AboutCard /> {/* ← Founder Note here */}
        <LeadForm />
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  );
}
