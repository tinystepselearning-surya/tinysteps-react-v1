// @ts-nocheck
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { trackEvent } from '../../lib/analytics';
import { trackConversionEvent, buildBaseConversionParams } from '../../lib/conversionTracking';
import { normalizePathname, shouldShowPublicSupportWidgets } from '../../utils/publicRouteGuards';
import { AskTinyStepsModal } from './AskTinyStepsModal';
import useAuthStore from '../../store/useAuthStore';

const WHATSAPP_URL =
  'https://wa.me/919618398383?text=Hi%20Tiny%20Steps!%20I%20have%20a%20question%20about%20your%20programs.';
const EXPAND_COLLAPSE_INTERVAL_MS = 10000;

export default function FloatingAssistant() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [askOpen, setAskOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || askOpen) return;
    const timer = window.setInterval(() => {
      setIsExpanded((previous) => !previous);
    }, EXPAND_COLLAPSE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [askOpen]);

  const pathname = normalizePathname(location.pathname || '');
  if (user) return null;
  if (!shouldShowPublicSupportWidgets(pathname)) return null;

  const openWhatsApp = () => {
    trackConversionEvent('whatsapp_click', {
      ...buildBaseConversionParams(pathname || '/'),
      cta_label: 'Chat on WhatsApp',
      destination_path: WHATSAPP_URL,
    });
    trackEvent('floating_whatsapp_click', { source: 'floating_assistant' });
    window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
  };

  const openAskTinySteps = () => {
    trackEvent('floating_ask_tinysteps_click', { source: 'floating_assistant_dock' });
    setAskOpen(true);
  };

  const content = (
    <div
      data-floating-assistant="1"
      className="pointer-events-auto fixed bottom-[5.25rem] right-3 z-[99999] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 sm:bottom-4 sm:right-4"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isExpanded ? (
          <motion.button
            key="ask-expanded"
            type="button"
            className="relative flex h-12 w-[220px] items-center gap-2 overflow-hidden rounded-full border border-indigo-200/70 bg-white/90 pl-2 pr-3 text-left text-white backdrop-blur"
            initial={{ opacity: 0.9, scale: 0.97 }}
            animate={{
              opacity: 1,
              scale: 1,
              boxShadow: [
                '0 0 0 0 rgba(99,102,241,0.36)',
                '0 0 0 8px rgba(99,102,241,0.12)',
                '0 0 0 0 rgba(99,102,241,0.36)',
              ],
            }}
            exit={{ opacity: 0.92, scale: 0.97 }}
            transition={{
              opacity: { duration: 0.22, ease: 'easeInOut' },
              scale: { duration: 0.22, ease: 'easeInOut' },
              boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileTap={{ scale: 0.98 }}
            onClick={openAskTinySteps}
            aria-label="Ask TinySteps AI"
          >
            <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-xs font-bold">
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-300/40 opacity-55" />
              AI
            </span>
            <span className="min-w-0 leading-tight text-slate-900">
              <span className="block truncate text-sm font-semibold">Ask TinySteps AI</span>
              <span className="block truncate text-[11px] font-medium text-slate-500">Live assistant</span>
            </span>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
          </motion.button>
        ) : (
          <motion.button
            key="ask-collapsed"
            type="button"
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-indigo-200/70 bg-white/90 text-white backdrop-blur"
            initial={{ opacity: 0.88, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              boxShadow: [
                '0 0 0 0 rgba(99,102,241,0.36)',
                '0 0 0 8px rgba(99,102,241,0.12)',
                '0 0 0 0 rgba(99,102,241,0.36)',
              ],
            }}
            exit={{ opacity: 0.88, scale: 0.95 }}
            transition={{
              opacity: { duration: 0.2, ease: 'easeInOut' },
              scale: { duration: 0.2, ease: 'easeInOut' },
              boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileTap={{ scale: 0.98 }}
            onClick={openAskTinySteps}
            aria-label="Ask TinySteps AI"
          >
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-xs font-bold">
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-300/40 opacity-55" />
              AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

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

      <AskTinyStepsModal open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
