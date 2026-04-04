import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../../constants/publicContact';
import AdvisorContactForm from './AdvisorContactForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import BrandLogo from './BrandLogo';

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/tiny_steps_oel?igsh=d2p6Ym9odGlidnZ1', icon: '📸' },
  { label: 'YouTube', href: 'https://www.youtube.com/@TinyStepsLearning-1157', icon: '▶️' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: '💼' },
];

const courseLinks = [
  { label: 'Courses overview', href: '/courses' },
  { label: 'Phonics classes', href: '/phonics' },
  { label: 'Grammar classes', href: '/grammar' },
  { label: 'Public speaking', href: '/speaking' },
];

const exploreLinks = [
  { label: 'Why Tiny Steps', href: '/why-tiny-steps' },
  { label: 'Class Samples', href: '/class-samples' },
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
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <footer className="bg-[#060a16] text-gray-200">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.82fr_0.92fr_1fr] lg:items-start lg:gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo
                alt="Tiny Steps logo"
                variant="main"
                width={44}
                height={44}
                loading="lazy"
                className="h-11 w-11 rounded-2xl bg-white p-1.5 object-contain shadow-sm ring-1 ring-white/15"
              />
              <div>
                <div className="text-lg font-semibold text-white">
                  <span className="text-orange-500">Tiny Steps</span>{" "}
                  <span className="text-white">Learning</span>
                </div>
                <p className="text-sm text-gray-400">Live online English classes for children ages 3–12.</p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/80">
              Structured phonics, grammar, and public speaking with live mentors, steady routines, and clear parent updates.
            </p>
            <div className="flex gap-4">
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

          <div className="space-y-5">
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
              <h3 className="mb-3 font-semibold text-white">Legal</h3>
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
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white">Explore</h3>
            <ul className="space-y-2 text-sm">
              {exploreLinks.map((link) => (
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
                <li className="text-xs text-white/60">Hours: Mon-Sun 7 AM-12 AM IST</li>
              </ul>
            </div>

            <div className="border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80">
            <span>SSL Secure</span>
            <span>UPI / Cards / Netbanking</span>
            <span>Data protection aware</span>
            <span>Family-first support</span>
          </div>

          <div className="text-center text-xs text-white/70">
            © 2026 Tiny Steps Learning™. Foundations Forever for joyful, confident learning — built with ❤️ by Surya. All rights reserved.
          </div>
        </div>

        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
          <DialogContent className="max-w-lg border-slate-200 bg-white p-0 sm:rounded-[28px]">
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
              <DialogTitle className="text-left text-xl font-semibold text-slate-900">
                Get in Touch
              </DialogTitle>
              <DialogDescription className="text-left text-sm text-slate-600">
                Share a few details and the Tiny Steps team will follow up by email.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 pt-5">
              <AdvisorContactForm
                compact
                topic="Footer contact"
                title="Prefer email or a callback?"
                description="Use the form and our team will reply by email."
                surface="plain"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  );
}
