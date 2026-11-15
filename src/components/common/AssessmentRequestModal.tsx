import { useEffect, useRef } from 'react';
import BookAssessmentForm from '../forms/BookAssessmentForm';

type AssessmentRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AssessmentRequestModal({ isOpen, onClose }: AssessmentRequestModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // On Android, the software keyboard can shrink the visual viewport without
    // changing 100dvh. Keep the scroll region above the keyboard in that case.
    const syncVisibleHeight = () => {
      const visualHeight = window.visualViewport?.height ?? window.innerHeight;
      const available = Math.max(160, Math.floor(Math.min(window.innerHeight, visualHeight) - 16));
      const maxHeight = `${available}px`;
      if (modalContentRef.current) modalContentRef.current.style.maxHeight = maxHeight;
      if (modalScrollRef.current) modalScrollRef.current.style.maxHeight = maxHeight;
    };
    syncVisibleHeight();
    window.visualViewport?.addEventListener('resize', syncVisibleHeight);
    window.visualViewport?.addEventListener('scroll', syncVisibleHeight);
    window.addEventListener('resize', syncVisibleHeight);

    // Focus the close control first, rather than triggering the mobile keyboard.
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const controls = modalContentRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], textarea:not([disabled])'
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.visualViewport?.removeEventListener('resize', syncVisibleHeight);
      window.visualViewport?.removeEventListener('scroll', syncVisibleHeight);
      window.removeEventListener('resize', syncVisibleHeight);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/70 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4 sm:py-5"
      role="dialog"
      aria-modal="true"
      aria-label="Book an assessment"
      onClick={onClose}
    >
      <div
        ref={modalContentRef}
        className="relative max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-2xl sm:max-h-[92dvh]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 min-h-[44px] rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-md hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-orange-500"
          aria-label="Close assessment form"
        >
          Close
        </button>
        <div ref={modalScrollRef} className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain scroll-pb-24 sm:max-h-[92dvh]">
          <BookAssessmentForm autoFocusFirstField source="public_assessment_modal" />
        </div>
      </div>
    </div>
  );
}
