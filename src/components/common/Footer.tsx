import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../../constants/publicContact';
import AdvisorContactForm from './AdvisorContactForm';
import NewsletterForm from './NewsletterForm';

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/tiny_steps_oel?igsh=d2p6Ym9odGlidnZ1', icon: '📸' },
  { label: 'YouTube', href: 'https://www.youtube.com/tinystepslearning', icon: '▶️' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: '💼' },
];

const courseLinks = [
  { label: 'Courses overview', href: '/courses' },
  { label: 'Phonics classes', href: '/phonics-classes-for-kids' },
  { label: 'Grammar classes', href: '/english-grammar-writing-classes' },
  { label: 'Public speaking', href: '/public-speaking-communication-kids' },
];

const exploreLinks = [
  { label: 'Why Tiny Steps', href: '/why-tiny-steps' },
  { label: 'Curriculum', href: '/curriculum' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Summer Camp', href: '/summer-camps' },
  { label: 'Contact', href: '/contact' },
  { label: 'Learning Partner', href: '/learning-partner' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Refund & Guarantee', href: '/refund-guarantee' },
];

export default function Footer() {
  const { user } = useAuthStore();

  return (
    <footer className="bg-[#060a16] text-gray-200">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="text-xl font-semibold text-white">Get the Tiny Steps parent newsletter</div>
              <p className="mt-2 text-sm text-white/85">
                Lesson-based phonics, grammar, and speaking tips plus printable resources.
              </p>
            </div>
            <div className="w-full max-w-md">
              <NewsletterForm compact />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-tiny-blue-500 to-tiny-purple-500 font-bold">
                TS
              </div>
              <div>
                <div className="font-semibold text-white">Tiny Steps Learning</div>
                <p className="text-sm text-gray-400">Live online English classes for children ages 3–12.</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/80">
              Structured phonics, grammar, and public speaking programs with live mentors, steady routines, and clear parent updates.
            </p>
            <div className="mt-4 flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white/70 transition hover:text-white"
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Programs</h3>
            <ul className="space-y-2 text-sm">
              {courseLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="transition hover:text-tiny-blue-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-white">Explore</h3>
            <ul className="space-y-2 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="transition hover:text-tiny-blue-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mb-3 mt-6 font-semibold text-white">Legal</h3>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="transition hover:text-tiny-blue-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="mb-3 font-semibold text-white">Contact</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <a href="tel:+919618398383" className="transition hover:text-tiny-green-300">
                    Call: +91-96183-98383
                  </a>
                </li>
                {!user ? (
                  <li>
                    <a
                      href="https://wa.me/919618398383"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-tiny-green-300"
                    >
                      Chat on WhatsApp - opens new window
                    </a>
                  </li>
                ) : null}
                <li>
                  <a href={PUBLIC_CONTACT_MAILTO} className="transition hover:text-tiny-blue-300">
                    Email: {PUBLIC_CONTACT_EMAIL}
                  </a>
                </li>
                <li className="text-xs text-white/60">Hours: Mon-Fri 9 AM-6 PM IST • Sat 10 AM-2 PM IST</li>
              </ul>
            </div>

            <AdvisorContactForm
              compact
              topic="Footer contact"
              title="No WhatsApp?"
              description="Use the form and our team will reply by email."
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80">
          <span>SSL Secure</span>
          <span>UPI / Cards / Netbanking</span>
          <span>Data protection aware</span>
          <span>Family-first support</span>
        </div>

        <div className="text-center text-xs text-white/70">
          © {new Date().getFullYear()} Tiny Steps Learning. Built for joyful learning in India and beyond.
        </div>
      </div>
    </footer>
  );
}
