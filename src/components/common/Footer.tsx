// React default import removed (not needed with new JSX transform)
import { useAuthStore } from '../../store/useAuthStore';

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', icon: '📸' },
  { label: 'YouTube', href: 'https://youtube.com', icon: '▶️' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: '💼' }
];

const courseLinks = [
  { label: 'Phonics Foundation', href: '/courses/phonics-foundation' },
  { label: 'Phonics Advanced', href: '/courses/phonics-advanced' },
  { label: 'Grammar Essentials', href: '/courses/grammar-essentials' },
  { label: 'Grammar Mastery', href: '/courses/grammar-mastery' },
  { label: 'Public Speaking Foundations', href: '/courses/public-speaking-foundations' },
  { label: 'Public Speaking Excellence', href: '/courses/public-speaking-excellence' }
];

const resourceLinks = [
  { label: 'Curriculum', href: '/curriculum' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' }
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Refund & Guarantee', href: '/guarantee' }
];

const Footer = () => {
  const { user } = useAuthStore();
  return (
    <footer className="bg-[#060a16] text-gray-200">
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        <div className="rounded-3xl bg-gradient-to-r from-tiny-blue-600 to-tiny-purple-600 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-white text-xl font-semibold">Get the Tiny Steps parent newsletter</div>
              <p className="text-white/80 text-sm">Weekly phonics, grammar, and speaking tips plus printable resources.</p>
              <p className="text-white/60 text-xs">Join 3500+ families who love our tips!</p>
            </div>
            <form className="flex w-full max-w-md gap-2">
              <input className="flex-1 rounded-xl px-4 py-2 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-tiny-blue-500" placeholder="Enter your email" aria-label="Email address" />
              <button className="rounded-xl bg-tiny-blue-600 px-4 py-2 text-white font-semibold hover:bg-tiny-blue-700 transition">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-tiny-blue-500 to-tiny-purple-500 flex items-center justify-center font-bold">TS</div>
              <div>
                <div className="font-semibold text-white">Tiny Steps • Foundations Forever</div>
                <p className="text-sm text-gray-500">
                  Tiny Steps • Foundations Forever<br />
                  Hyderabad • Serving families across the globe
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/80">Live 1:1 phonics, grammar, and public speaking programs for ages 3–12. 3500+ families across 9 countries, 95% satisfaction. Foundations today, confidence forever.</p>
            <div className="mt-4 flex gap-4">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-white/70 hover:text-white transition" aria-label={link.label}>
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Courses</h3>
            <ul className="space-y-2 text-sm">
              {courseLinks.map((link) => (
                <li key={link.label}><a href={link.href} className="hover:text-tiny-blue-300 transition">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Explore</h3>
            <ul className="space-y-2 text-sm">
              {resourceLinks.map((link) => (
                <li key={link.label}><a href={link.href} className="hover:text-tiny-blue-300 transition">{link.label}</a></li>
              ))}
            </ul>
            <h3 className="font-semibold text-white mt-6 mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.label}><a href={link.href} className="hover:text-tiny-blue-300 transition">{link.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="tel:+919618398383" className="hover:text-tiny-green-300 transition">Call: +91-96183-98383</a></li>
              {!user && (
                <li><a href="https://wa.me/919618398383" className="hover:text-tiny-green-300 transition">WhatsApp: Chat with advisor</a></li>
              )}
              <li><a href="mailto:hello@tinystepslearning.com" className="hover:text-tiny-blue-300 transition">Email: hello@tinystepslearning.com</a></li>
              <li className="text-xs text-white/60">Hours: Mon–Fri 9 AM–6 PM • Sat 10 AM–2 PM</li>
            </ul>
            <p className="mt-2 text-sm text-gray-500">
              Made with ❤️ by Surya
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80">
          <span>🔒 SSL Secure</span>
          <span>💳 UPI / Cards / Netbanking</span>
          <span>🛡️ Data protection compliant</span>
          <span>✅ Satisfaction guarantee</span>
        </div>

        <div className="text-center text-xs text-white/70">
          © {new Date().getFullYear()} Tiny Steps Online School. Built for joyful learning in India.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
