import { useState } from 'react';
import type { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '../constants/publicContact';
import NavBar from './NavBar/NavBar';

export const Header: FC = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">T</div>
          <span className="text-2xl font-bold text-gray-900">TinySteps</span>
        </div>
        <NavBar />
        <button
          className="md:hidden p-2 rounded-md bg-white border border-gray-200 shadow-sm"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {!open ? (
            <svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile slide-over menu */}
      <div className={`md:hidden fixed inset-x-0 top-0 z-40 transform transition-transform duration-300 ${open ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="bg-white border-b border-gray-200 shadow">
          <div className="px-4 py-4 space-y-2">
            <Link to="/" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'text-blue-600 bg-gray-50' : 'text-gray-700 hover:bg-gray-50'}`}>Home</Link>
            <Link to="/phonics" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/phonics') ? 'text-blue-600 bg-gray-50' : 'text-gray-700 hover:bg-gray-50'}`}>Phonics</Link>
            <Link to="/grammar" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/grammar') ? 'text-blue-600 bg-gray-50' : 'text-gray-700 hover:bg-gray-50'}`}>Grammar</Link>
            <Link to="/speaking" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/speaking') ? 'text-blue-600 bg-gray-50' : 'text-gray-700 hover:bg-gray-50'}`}>Public Speaking</Link>
            <Link to="/book-demo" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Book Trial</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Footer: FC = () => (
  <footer className="bg-gray-900 text-white py-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">T</div>
            <span className="text-2xl font-bold">TinySteps</span>
          </div>
          <p className="text-gray-400">Empowering kids through fun learning.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Programs</h3>
          <ul className="space-y-2">
            <li><Link to="/phonics" className="hover:text-blue-400 transition">Phonics Foundations</Link></li>
            <li><Link to="/grammar" className="hover:text-blue-400 transition">Grammar & Writing Lab</Link></li>
            <li><Link to="/speaking" className="hover:text-blue-400 transition">Public Speaking Studio</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Explore</h3>
          <ul className="space-y-2">
            <li><a href="#pricing" className="hover:text-blue-400 transition">Pricing</a></li>
            <li><a href="#faq" className="hover:text-blue-400 transition">FAQ</a></li>
            <li><a href="#blog" className="hover:text-blue-400 transition">Blog</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Connect</h3>
          <ul className="space-y-2">
            <li><a href={PUBLIC_CONTACT_MAILTO} className="hover:text-blue-400 transition">{PUBLIC_CONTACT_EMAIL}</a></li>
            <li><a href="tel:+919666095553" className="hover:text-blue-400 transition">+91 96660 95553</a></li>
            <li><a href="#" className="hover:text-blue-400 transition">Book a Learning Call</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-gray-800 text-center">
        <p>&copy; 2025 Tiny Steps Learning. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const Layout: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen">
    <Header />
    <main>{children}</main>
    <Footer />
  </div>
);

export default Layout;
