import { useEffect } from 'react';
import BookAssessmentForm from '../forms/BookAssessmentForm';

type AssessmentRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AssessmentRequestModal({ isOpen, onClose }: AssessmentRequestModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 py-5 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-md hover:bg-slate-50"
          aria-label="Close assessment form"
        >
          Close
        </button>
        <BookAssessmentForm autoFocusFirstField source="public_assessment_modal" />
      </div>
    </div>
  );
}
