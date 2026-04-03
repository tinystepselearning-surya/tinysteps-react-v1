// @ts-nocheck
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { trackEvent } from '../../lib/analytics';
import { AskTinyStepsModal } from './AskTinyStepsModal';

const LEGACY_COLLAPSED_KEY = 'ts_floating_assistant_collapsed';
const LEGACY_HIDDEN_KEY = 'ts_floating_assistant_hidden';
const PANEL_DISMISSED_KEY = 'ts_floating_assistant_panel_dismissed';
const WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20have%20a%20question%20about%20your%20programs.';
const APP_ROUTE_PREFIXES = [
  '/surya',
  '/teacher',
  '/parent',
  '/kids',
  '/learning-partner/dashboard',
  '/learningpartner/dashboard',
  '/admin',
];
const AUTH_ENTRY_ROUTES = new Set([
  '/login',
  '/surya/login',
  '/admin/login',
  '/teacher/login',
  '/parent/login',
  '/learning-partner/login',
  '/learningpartner/login',
  '/kid/login',
]);

const normalizePathname = (pathname: string): string => {
  const lower = pathname.toLowerCase();
  if (lower !== '/' && lower.endsWith('/')) return lower.replace(/\/+$/, '');
  return lower;
};

const readPanelDismissedState = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PANEL_DISMISSED_KEY) === '1';
};

export default function FloatingAssistant() {
  const { user } = useAuthStore();
  const [promptVisible, setPromptVisible] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [panelDismissed, setPanelDismissed] = useState(() => readPanelDismissedState());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reset legacy persisted states that could suppress the dock entirely.
    const hadLegacyHidden = window.localStorage.getItem(LEGACY_HIDDEN_KEY);
    const hadLegacyCollapsed = window.localStorage.getItem(LEGACY_COLLAPSED_KEY);

    if (hadLegacyHidden !== null) {
      window.localStorage.removeItem(LEGACY_HIDDEN_KEY);
    }

    if (hadLegacyCollapsed !== null) {
      window.localStorage.removeItem(LEGACY_COLLAPSED_KEY);
    }

    if (hadLegacyHidden !== null || hadLegacyCollapsed !== null) {
      window.localStorage.removeItem(PANEL_DISMISSED_KEY);
      setPanelDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (panelDismissed || askOpen) return;
    const timer = setTimeout(() => setPromptVisible(true), 6000);
    return () => clearTimeout(timer);
  }, [askOpen, panelDismissed]);

  const pathname = typeof window !== 'undefined' ? normalizePathname(window.location.pathname) : '';
  const isAppRoute = APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthEntryRoute = AUTH_ENTRY_ROUTES.has(pathname);

  if (isAppRoute || isAuthEntryRoute) return null;
  if (user) return null;

  const collapsePanel = () => {
    setPromptVisible(false);
    setAskOpen(false);
  };

  const hidePanel = () => {
    collapsePanel();
    setPanelDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PANEL_DISMISSED_KEY, '1');
    }
  };

  const showAskTinySteps = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PANEL_DISMISSED_KEY, '0');
    }
    setPanelDismissed(false);
    setPromptVisible(false);
    setAskOpen(true);
  };

  const openWhatsApp = () => {
    trackEvent('floating_whatsapp_click', { source: 'floating_assistant' });
    window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
  };

  const openAskTinySteps = () => {
    trackEvent('floating_ask_tinysteps_click', {
      source: askOpen || promptVisible ? 'floating_assistant_panel' : 'floating_assistant_dock',
    });
    showAskTinySteps();
  };

  const content = (
    <div
      data-floating-assistant="1"
      className="pointer-events-auto fixed bottom-3 right-3 z-[99999] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 sm:bottom-4 sm:right-4"
    >
      {promptVisible || askOpen ? (
        <motion.div
          className="relative max-w-[285px] overflow-hidden rounded-3xl border border-cyan-100/70 bg-white/95 p-3 text-sm text-gray-800 shadow-[0_20px_60px_rgba(15,23,42,0.2)] backdrop-blur"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="pointer-events-none absolute -top-14 -right-10 h-28 w-28 rounded-full bg-cyan-200/50 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-28 w-28 rounded-full bg-orange-200/50 blur-2xl" />
          <div className="mb-2 flex items-center justify-end gap-1">
            <button
              type="button"
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={collapsePanel}
            >
              Collapse
            </button>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={hidePanel}
            >
              Hide
            </button>
          </div>

          <div className="flex items-start gap-3">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8f5c] via-[#ffb36a] to-[#59c3ff] text-base text-white shadow-sm">
              <span className="absolute inset-0 rounded-2xl border border-white/50" />
              AI
            </span>
            <div>
              <p className="font-semibold text-gray-900">Need help choosing a program?</p>
              <p className="mt-1 text-xs text-gray-600">Ask TinySteps AI here, or use WhatsApp if you prefer.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  onClick={openAskTinySteps}
                >
                  Ask TinySteps AI
                </button>
                <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => setPromptVisible(false)}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}

      <motion.div
        className="relative overflow-hidden rounded-[28px] border border-cyan-100/70 bg-white/92 p-2 shadow-[0_22px_58px_rgba(15,23,42,0.22)] backdrop-blur"
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="pointer-events-none absolute -left-10 -top-10 h-20 w-20 rounded-full bg-cyan-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -right-10 -bottom-8 h-20 w-20 rounded-full bg-orange-200/40 blur-2xl" />
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            className="group flex min-w-[182px] items-center gap-2 rounded-full bg-gradient-to-r from-white via-cyan-50 to-orange-50 px-3 py-2 text-xs font-semibold text-gray-900 shadow ring-1 ring-cyan-200/70 transition sm:text-sm"
            whileHover={{ y: -1, scale: 1.01 }}
            onClick={openAskTinySteps}
            aria-label="Ask TinySteps AI"
          >
            <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8f5c] via-[#ffb36a] to-[#59c3ff] text-white shadow-sm">
              <span className="absolute inset-0 animate-ping rounded-full bg-cyan-200/60 opacity-40" />
              AI
            </span>
            <span className="leading-tight">
              <span className="block">Ask TinySteps AI</span>
              <span className="hidden text-[10px] font-medium text-slate-500 sm:block">Live assistant</span>
            </span>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
          </motion.button>

          <motion.button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
            whileHover={{ scale: 1.05 }}
            onClick={openWhatsApp}
            aria-label="Chat on WhatsApp"
            title="Chat on WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M19.11 4.89A9.93 9.93 0 0 0 12.04 2C6.56 2 2.08 6.47 2.08 11.96c0 1.75.46 3.47 1.33 4.99L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.23h.01c5.48 0 9.95-4.47 9.95-9.95a9.9 9.9 0 0 0-2.89-7.03Zm-7.06 15.3h-.01a8.28 8.28 0 0 1-4.22-1.15l-.3-.18-3.09.81.82-3.01-.2-.31a8.24 8.24 0 0 1-1.27-4.39c0-4.56 3.71-8.27 8.28-8.27a8.2 8.2 0 0 1 5.85 2.42 8.22 8.22 0 0 1 2.42 5.85c0 4.57-3.72 8.28-8.28 8.28Zm4.54-6.2c-.25-.12-1.49-.73-1.72-.82-.23-.08-.4-.12-.57.13-.16.25-.65.81-.79.98-.15.17-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.21-.74-.66-1.25-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.21-.5-.42-.43-.57-.43l-.49-.01c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.72 2.62 4.16 3.68.58.25 1.04.4 1.39.51.58.18 1.11.15 1.53.09.47-.07 1.49-.61 1.7-1.2.21-.59.21-1.1.14-1.2-.06-.1-.23-.16-.48-.29Z" />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      <AskTinyStepsModal open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
