// @ts-nocheck
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { trackEvent } from '../../lib/analytics';
import { AskTinyStepsModal } from './AskTinyStepsModal';

const COLLAPSED_KEY = 'ts_floating_assistant_collapsed';
const HIDDEN_KEY = 'ts_floating_assistant_hidden';

export default function FloatingAssistant() {
  const { user } = useAuthStore();
  const [promptVisible, setPromptVisible] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === '1');
    setHidden(window.localStorage.getItem(HIDDEN_KEY) === '1');
  }, []);

  useEffect(() => {
    if (hidden) return;
    const timer = setTimeout(() => setPromptVisible(true), 6000);
    return () => clearTimeout(timer);
  }, [hidden]);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const DASHBOARD_PREFIXES = [
    '/surya',
    '/teacher',
    '/parent',
    '/kids',
    '/learning-partner/dashboard',
    '/learningpartner/dashboard',
    '/admin',
  ];

  const isDashboardRoute = DASHBOARD_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (user) {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      return null;
    }

    if (isDashboardRoute) return null;
  }

  if (hidden) return null;

  const setWidgetCollapsed = (next: boolean) => {
    setCollapsed(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    }
  };

  const hideWidget = () => {
    setHidden(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(HIDDEN_KEY, '1');
    }
  };

  const openWhatsApp = () => {
    trackEvent('floating_whatsapp_click', { source: 'floating_assistant' });
    window.open(
      'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20have%20a%20question%20about%20your%20programs.',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const content = (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-[99999] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 sm:bottom-4 sm:right-4">
      {promptVisible && !collapsed ? (
        <motion.div
          className="max-w-[280px] rounded-2xl border border-gray-100 bg-white/95 p-3 text-sm text-gray-800 shadow-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">💬</span>
            <div>
              <p className="font-semibold text-gray-900">Need help choosing a program?</p>
              <p className="mt-1 text-xs text-gray-600">Ask Tiny Steps here or open WhatsApp if you prefer.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                  onClick={() => {
                    trackEvent('floating_ask_tinysteps_click', { source: 'floating_assistant_prompt' });
                    setAskOpen(true);
                    setPromptVisible(false);
                  }}
                >
                  Leave a message
                </button>
                <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => setPromptVisible(false)}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white/96 p-2 shadow-2xl backdrop-blur">
        <div className="mb-2 flex items-center justify-end gap-1">
          <button
            type="button"
            className="rounded-full px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => setWidgetCollapsed(!collapsed)}
          >
            {collapsed ? 'Open' : 'Collapse'}
          </button>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={hideWidget}
          >
            Hide
          </button>
        </div>

        <div className={`flex flex-col gap-2 ${collapsed ? 'hidden' : ''}`}>
          <motion.button
            type="button"
            className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow ring-1 ring-gray-100 sm:text-sm"
            whileHover={{ y: -1 }}
            onClick={() => {
              trackEvent('floating_ask_tinysteps_click', { source: 'floating_assistant' });
              setAskOpen(true);
              setPromptVisible(false);
            }}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8f5c] to-[#59c3ff] text-white">
              🤖
            </span>
            Leave a message
          </motion.button>

          <motion.button
            type="button"
            className="flex items-center gap-2 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white shadow-lg sm:text-sm"
            whileHover={{ scale: 1.03 }}
            onClick={openWhatsApp}
          >
            Chat on WhatsApp - opens new window
          </motion.button>
        </div>
      </div>

      <AskTinyStepsModal open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
