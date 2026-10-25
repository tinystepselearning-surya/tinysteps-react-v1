// @ts-nocheck
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { buildPublicWhatsAppUrl } from '../../constants/publicContact';
import { trackEvent } from '../../lib/analytics';
import { inferProgramFromPath, trackCtaClick, trackWhatsappClick } from '../../lib/conversionTracking';
import { normalizePathname, shouldShowPublicSupportWidgets } from '../../utils/publicRouteGuards';

const AskTinyStepsModal = lazy(() =>
  import('./AskTinyStepsModal').then((module) => ({ default: module.AskTinyStepsModal })),
);

const WHATSAPP_URL = buildPublicWhatsAppUrl(
  'Hi Tiny Steps! I have a question about your programs.',
);
const EXPAND_COLLAPSE_INTERVAL_MS = 10000;
// Two brief previews are enough to reveal both help channels without endless interruptions.
const HELP_PREVIEW_FIRST_DELAY_MS = 10000;
const HELP_PREVIEW_REPEAT_DELAY_MS = 30000;
const HELP_PREVIEW_VISIBLE_MS = 4000;
const HELP_PREVIEW_MAX_COUNT = 2;

type FloatingAssistantProps = { suppressDock?: boolean };

export default function FloatingAssistant({ suppressDock = false }: FloatingAssistantProps) {
  const location = useLocation();
  const pathname = normalizePathname(location.pathname || '');
  const reduceMotion = useReducedMotion();
  // Keep the premium homepage dock compact and still, and respect OS reduced-motion elsewhere.
  const isHomePage = pathname === '/';
  const quietDock = isHomePage || Boolean(reduceMotion);
  const [askOpen, setAskOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileHelpOpen, setIsMobileHelpOpen] = useState(false);
  const helpPreviewCount = useRef(0);
  const helpInteracted = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || askOpen || quietDock) return;
    const timer = window.setInterval(() => {
      setIsExpanded((previous) => !previous);
    }, EXPAND_COLLAPSE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [askOpen, quietDock]);
  useEffect(() => {
    // Only the public homepage's phone-sized dock gets automatic discovery previews.
    // Never animate for reduced-motion visitors, during chat, or at the final CTA.
    if (
      !isHomePage || suppressDock || askOpen || reduceMotion || helpInteracted.current ||
      typeof window === 'undefined' ||
      !window.matchMedia?.('(max-width: 639px)').matches ||
      helpPreviewCount.current >= HELP_PREVIEW_MAX_COUNT
    ) return;

    let previewTimer: number | undefined;
    let collapseTimer: number | undefined;
    let active = true;

    const schedulePreview = (delay: number) => {
      previewTimer = window.setTimeout(() => {
        if (!active || helpInteracted.current || document.visibilityState !== 'visible') return;
        helpPreviewCount.current += 1;
        setIsMobileHelpOpen(true);
        collapseTimer = window.setTimeout(() => {
          if (!active || helpInteracted.current) return;
          setIsMobileHelpOpen(false);
          if (helpPreviewCount.current < HELP_PREVIEW_MAX_COUNT) {
            schedulePreview(HELP_PREVIEW_REPEAT_DELAY_MS);
          }
        }, HELP_PREVIEW_VISIBLE_MS);
      }, delay);
    };
    schedulePreview(helpPreviewCount.current === 0
      ? HELP_PREVIEW_FIRST_DELAY_MS
      : HELP_PREVIEW_REPEAT_DELAY_MS);

    return () => {
      active = false;
      window.clearTimeout(previewTimer);
      window.clearTimeout(collapseTimer);
    };
  }, [isHomePage, suppressDock, askOpen, reduceMotion]);

  useEffect(() => {
    if (suppressDock) setIsMobileHelpOpen(false);
  }, [suppressDock]);

  if (!shouldShowPublicSupportWidgets(pathname)) return null;

  const isCareersPage = pathname === '/careers';
  const isDenseSpeakingCourse =
    pathname === '/courses/public-speaking-foundations' ||
    pathname === '/courses/public-speaking-excellence';
  const showExpandedAssistant = !quietDock && isExpanded && !isCareersPage && !isDenseSpeakingCourse;

  const trackSafely = (fn: () => void) => {
    try {
      fn();
    } catch (error) {
      console.warn('FloatingAssistant tracking skipped:', error);
    }
  };

  const openWhatsApp = () => {
    helpInteracted.current = true;
    setIsMobileHelpOpen(false);
    trackSafely(() => {
      trackCtaClick({
        page_path: pathname,
        cta_label: 'Chat on WhatsApp',
        cta_location: 'floating',
        destination_path: WHATSAPP_URL,
        funnel_name: 'website_lead_funnel',
        program: inferProgramFromPath(pathname),
      });
      trackWhatsappClick('floating_button');
      trackEvent('floating_whatsapp_click', { source: 'floating_assistant' });
    });
  };

  const openAskTinySteps = () => {
    helpInteracted.current = true;
    trackSafely(() => {
      trackCtaClick({
        page_path: pathname,
        cta_label: 'Ask TinySteps AI',
        cta_location: 'floating',
        destination_path: '/ask-tinysteps',
        funnel_name: 'website_lead_funnel',
        program: inferProgramFromPath(pathname),
      });
      trackEvent('floating_ask_tinysteps_click', { source: 'floating_assistant_dock' });
    });
    setIsMobileHelpOpen(false);
    setAskOpen(true);
  };

  const content = (
    <>
      <div
        data-floating-assistant="1"
        className={`pointer-events-auto fixed right-3 z-[99999] max-w-[calc(100vw-1.5rem)] gap-2 sm:bottom-4 sm:right-4 ${isHomePage ? 'bottom-[max(1rem,env(safe-area-inset-bottom))] flex-col items-end' : 'bottom-[5.25rem] flex-row items-center'} ${suppressDock ? 'hidden' : 'flex'}`}
      >
      <div
        id={isHomePage ? 'homepage-support-actions' : undefined}
        onFocusCapture={() => { helpInteracted.current = true; }}
        className={isHomePage
          ? `${isMobileHelpOpen ? 'flex' : 'hidden'} flex-col items-end gap-2 sm:flex sm:flex-row sm:items-center`
          : 'flex items-center gap-2'}
      >
      <AnimatePresence mode="wait" initial={false}>
        {showExpandedAssistant ? (
          <motion.button
            key="ask-expanded"
            type="button"
            className="relative flex h-12 w-[220px] items-center gap-2 overflow-hidden rounded-full border border-indigo-200/70 bg-white/90 pl-2 pr-3 text-left text-white backdrop-blur"
            initial={quietDock ? false : { opacity: 0.9, scale: 0.97 }}
            animate={{
              opacity: 1,
              scale: 1,
              ...(quietDock ? {} : {
                boxShadow: [
                  '0 0 0 0 rgba(99,102,241,0.36)',
                  '0 0 0 8px rgba(99,102,241,0.12)',
                  '0 0 0 0 rgba(99,102,241,0.36)',
                ],
              }),
            }}
            exit={{ opacity: 0.92, scale: 0.97 }}
            transition={quietDock ? { duration: 0 } : {
              opacity: { duration: 0.22, ease: 'easeInOut' },
              scale: { duration: 0.22, ease: 'easeInOut' },
              boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileTap={quietDock ? undefined : { scale: 0.98 }}
            onClick={openAskTinySteps}
            aria-label="Ask TinySteps AI"
          >
            <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-xs font-bold">
              <span className={`absolute inset-0 rounded-full bg-indigo-300/40 opacity-55 ${quietDock ? '' : 'animate-ping'}`} />
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
            initial={quietDock ? false : { opacity: 0.88, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              ...(quietDock ? {} : {
                boxShadow: [
                  '0 0 0 0 rgba(99,102,241,0.36)',
                  '0 0 0 8px rgba(99,102,241,0.12)',
                  '0 0 0 0 rgba(99,102,241,0.36)',
                ],
              }),
            }}
            exit={{ opacity: 0.88, scale: 0.95 }}
            transition={quietDock ? { duration: 0 } : {
              opacity: { duration: 0.2, ease: 'easeInOut' },
              scale: { duration: 0.2, ease: 'easeInOut' },
              boxShadow: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileTap={quietDock ? undefined : { scale: 0.98 }}
            onClick={openAskTinySteps}
            aria-label="Ask TinySteps AI"
          >
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#a855f7] text-xs font-bold">
              <span className={`absolute inset-0 rounded-full bg-indigo-300/40 opacity-55 ${quietDock ? '' : 'animate-ping'}`} />
              AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {!isCareersPage ? (
        <motion.a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
          whileHover={quietDock ? undefined : { scale: 1.05 }}
          onClick={openWhatsApp}
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M19.11 4.89A9.93 9.93 0 0 0 12.04 2C6.56 2 2.08 6.47 2.08 11.96c0 1.75.46 3.47 1.33 4.99L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.23h.01c5.48 0 9.95-4.47 9.95-9.95a9.9 9.9 0 0 0-2.89-7.03Zm-7.06 15.3h-.01a8.28 8.28 0 0 1-4.22-1.15l-.3-.18-3.09.81.82-3.01-.2-.31a8.24 8.24 0 0 1-1.27-4.39c0-4.56 3.71-8.27 8.28-8.27a8.2 8.2 0 0 1 5.85 2.42 8.22 8.22 0 0 1 2.42 5.85c0 4.57-3.72 8.28-8.28 8.28Zm4.54-6.2c-.25-.12-1.49-.73-1.72-.82-.23-.08-.4-.12-.57.13-.16.25-.65.81-.79.98-.15.17-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.21-.74-.66-1.25-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.21-.5-.42-.43-.57-.43l-.49-.01c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.72 2.62 4.16 3.68.58.25 1.04.4 1.39.51.58.18 1.11.15 1.53.09.47-.07 1.49-.61 1.7-1.2.21-.59.21-1.1.14-1.2-.06-.1-.23-.16-.48-.29Z" />
          </svg>
        </motion.a>
      ) : null}
      </div>
      {isHomePage ? (
        <button
          type="button"
          aria-label={isMobileHelpOpen ? 'Close support options' : 'Open support options'}
          aria-expanded={isMobileHelpOpen}
          aria-controls="homepage-support-actions"
          onClick={() => {
            helpInteracted.current = true;
            setIsMobileHelpOpen((open) => !open);
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#102A43] px-4 text-xs font-semibold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102A43] sm:hidden"
        >
          {isMobileHelpOpen ? 'Close' : 'Need help?'}
        </button>
      ) : null}
      </div>
      {askOpen ? (
        <Suspense fallback={null}>
          <AskTinyStepsModal open={askOpen} onClose={() => setAskOpen(false)} />
        </Suspense>
      ) : null}
    </>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
