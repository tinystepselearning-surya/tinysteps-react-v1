import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr,1fr]">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-white">
              <img src="/assets/images/logo.png" alt="" width={44} height={44} className="h-11 w-11" />
              <span className="text-2xl font-extrabold tracking-tight">Tiny Steps</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Research-backed literacy, writing, and public speaking programs crafted by Cambridge-certified educators.
              Every class is joyful, personalised, and purposeful.
            </p>
            <div className="flex gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffb37a]">
              <span>Play</span>
              <span>Progress</span>
              <span>Confidence</span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Programs</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/courses/phonics" className="hover:text-white">Phonics Foundations</Link>
                </li>
                <li>
                  <Link to="/courses/grammar" className="hover:text-white">Grammar &amp; Writing Lab</Link>
                </li>
                <li>
                  <Link to="/courses/public-speaking" className="hover:text-white">Public Speaking Studio</Link>
                </li>
                <li>
                  <Link to="/courses" className="hover:text-white">All Courses Overview</Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Explore</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/courses#pricing" className="hover:text-white">Pricing</Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white">FAQ</Link>
                </li>
                <li>
                  <Link to="/login/parents" className="hover:text-white">Parents Sign-in / Guest</Link>
                </li>
                <li>
                  <Link to="/parents" className="hover:text-white">Parents Preview</Link>
                </li>
                <li>
                  <a href="/blog/" className="hover:text-white">Blog &amp; Resources</a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Connect</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="mailto:hello@tinystepslearning.com" className="hover:text-white">hello@tinystepslearning.com</a>
                </li>
                <li>
                  <a href="tel:+919666095553" className="hover:text-white">+91 96660 95553</a>
                </li>
                <li>
                  <a href="/main/book-demo/" className="hover:text-white">Book a Learning Call</a>
                </li>
                <li>
                  <Link to="/login/learning-managers" className="hover:text-white">Learning Manager Login</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tiny Steps Learning. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/privacy-policy/" className="hover:text-white">Privacy</a>
            <a href="/terms/" className="hover:text-white">Terms</a>
            <a href="/sitemap.xml" className="hover:text-white">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
