import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <span className="font-bold text-lg">Tiny Steps</span>
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              Empowering young minds through personalized online learning. Building confident readers, writers, and speakers for tomorrow.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C8.396 0 7.966.021 6.675.049c-1.272.028-2.143.14-2.902.403a5.77 5.77 0 00-2.093.913 5.77 5.77 0 00-.913 2.093c-.263.759-.375.63-.403 2.902C.021 7.966 0 8.396 0 12.017s.021 4.051.049 5.342c.028 1.272.14 2.143.403 2.902a5.77 5.77 0 00.913 2.093 5.77 5.77 0 002.093.913c.759.263 1.63.375 2.902.403 1.291.028 1.721.049 5.342.049s4.051-.021 5.342-.049c1.272-.028 2.143-.14 2.902-.403a5.77 5.77 0 002.093-.913 5.77 5.77 0 00.913-2.093c.263-.759.375-1.63.403-2.902.028-1.291.049-1.721.049-5.342s-.021-4.051-.049-5.342c-.028-1.272-.14-2.143-.403-2.902a5.77 5.77 0 00-.913-2.093 5.77 5.77 0 00-2.093-.913c-.759-.263-1.63-.375-2.902-.403C16.068.021 15.638 0 12.017 0zm0 1.446c3.583 0 4.005.014 5.416.04 1.263.024 1.956.135 2.417.28a4.32 4.32 0 011.632.67 4.32 4.32 0 01.67 1.632c.145.461.256 1.154.28 2.417.026 1.411.04 1.833.04 5.416s-.014 4.005-.04 5.416c-.024 1.263-.135 1.956-.28 2.417a4.32 4.32 0 01-.67 1.632 4.32 4.32 0 01-1.632.67c-.461.145-1.154.256-2.417.28-1.411.026-1.833.04-5.416.04s-4.005-.014-5.416-.04c-1.263-.024-1.956-.135-2.417-.28a4.32 4.32 0 01-1.632-.67 4.32 4.32 0 01-.67-1.632c-.145-.461-.256-1.154-.28-2.417-.026-1.411-.04-1.833-.04-5.416s.014-4.005.04-5.416c.024-1.263.135-1.956.28-2.417a4.32 4.32 0 01.67-1.632 4.32 4.32 0 011.632-.67c.461-.145 1.154-.256 2.417-.28 1.411-.026 1.833-.04 5.416-.04zm0 3.635a8.381 8.381 0 100 16.762 8.381 8.381 0 000-16.762zm0 1.446a6.935 6.935 0 110 13.87 6.935 6.935 0 010-13.87zm8.482-1.69a1.94 1.94 0 11-3.88 0 1.94 1.94 0 013.88 0z"/>
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-slate-300 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-slate-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link></li>
              <li><a href="/phonics" className="text-slate-300 hover:text-white transition-colors">Phonics & Reading</a></li>
              <li><a href="/grammar" className="text-slate-300 hover:text-white transition-colors">Grammar & Writing</a></li>
              <li><a href="/speaking" className="text-slate-300 hover:text-white transition-colors">Public Speaking</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="/help" className="text-slate-300 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="/privacy" className="text-slate-300 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-slate-300 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="https://wa.me/919666095553" className="text-slate-300 hover:text-white transition-colors">WhatsApp Support</a></li>
              <li><a href="mailto:support@tinysteps.com" className="text-slate-300 hover:text-white transition-colors">Email Support</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-400">
            © {new Date().getFullYear()} Tiny Steps Learning Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;