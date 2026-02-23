import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../Button/Button";

// Constants
const WHATSAPP_NUMBER = "919618398383";
const CALL_DISPLAY = "+91 96183 98383";
const CALL_HREF = `tel:+${WHATSAPP_NUMBER}`;
const SUN_ORANGE = "#ff6a00";
const GOOGLE_FORM_EMBED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeYc-E_L_SAyEijZJBVFCrU2OGdiSTYVTug5MaXr4Jm8jiZAA/viewform?embedded=true";
const GOOGLE_FORM_DIRECT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeYc-E_L_SAyEijZJBVFCrU2OGdiSTYVTug5MaXr4Jm8jiZAA/viewform";

export type BookAssessmentFormState = {
  parentName: string;
  whatsapp: string;
  childAgeGrade: string;
  interest: "Phonics" | "Grammar" | "Public Speaking" | "Not sure yet";
  preferredTime: string;
  note: string;
};

interface BookAssessmentFormProps {
  defaultInterest?: "Phonics" | "Grammar" | "Public Speaking" | "Not sure yet";
  source?: string;
}

const GlassCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`relative overflow-hidden rounded-[24px] border border-white/55 bg-white/45 backdrop-blur-xl shadow-[0_10px_40px_rgba(15,23,42,0.08)] ${className}`}
  >
    {children}
  </div>
);

export const BookAssessmentForm: React.FC<BookAssessmentFormProps> = ({
  defaultInterest = "Phonics",
  source,
}) => {
  const initialState: BookAssessmentFormState = {
    parentName: "",
    whatsapp: "",
    childAgeGrade: "3-5 Years",
    interest: defaultInterest,
    preferredTime: "",
    note: "",
  };

  const [form, setForm] = useState<BookAssessmentFormState>(initialState);
  const [showOptional, setShowOptional] = useState(false);
  const [showGoogleFormModal, setShowGoogleFormModal] = useState(false);

  const waLink = useMemo(() => {
    const msg = [
      "Hi Tiny Steps 👋",
      "I'd like to book a FREE assessment class.",
      "",
      `Parent name: ${form.parentName || "-"}`,
      `WhatsApp: ${form.whatsapp || "-"}`,
      `Child age: ${form.childAgeGrade || "-"}`,
      `Interest: ${form.interest || "-"}`,
      form.preferredTime?.trim() ? `Preferred time: ${form.preferredTime.trim()}` : "",
      form.note?.trim() ? `Note: ${form.note.trim()}` : "",
      source ? `Source: ${source}` : "",
      "",
      "Please share available slots. Thank you!",
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [form, source]);

  const handleSubmitWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.parentName.trim() || !form.whatsapp.trim()) {
      alert("Please enter Parent Name and WhatsApp Number.");
      return;
    }

    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  const handleOpenGoogleForm = () => {
    // On mobile (< 640px), open in new tab; on desktop, show modal
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    
    if (isMobile) {
      window.open(GOOGLE_FORM_DIRECT_URL, "_blank", "noopener,noreferrer");
    } else {
      setShowGoogleFormModal(true);
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    if (!showGoogleFormModal) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowGoogleFormModal(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showGoogleFormModal]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showGoogleFormModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showGoogleFormModal]);

  return (
    <>
      <GlassCard className="border-white/80 p-8 shadow-[0_26px_70px_rgba(15,23,42,0.10)]">
        {/* subtle inner ring for premium feel */}
        <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-orange-200/30" />

        <div className="relative mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Book Assessment</h2>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>Takes ~20s • Reply via WhatsApp</span>
            <span className="text-slate-300">•</span>
            <a
              href={CALL_HREF}
              className="font-semibold text-slate-700 hover:text-slate-900 underline decoration-slate-300/70 underline-offset-4"
            >
              Call {CALL_DISPLAY}
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmitWhatsApp} className="relative space-y-4">
          <div className="group space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600 transition-colors group-focus-within:text-orange-600">
              Parent Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={form.parentName}
              onChange={(e) =>
                setForm((p) => ({ ...p, parentName: e.target.value }))
              }
              className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none transition-all focus:border-orange-500"
              required
            />
          </div>

          <div className="group space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-600 transition-colors group-focus-within:text-orange-600">
              WhatsApp Number *
            </label>
            <input
              type="tel"
              placeholder="+91 00000 00000"
              value={form.whatsapp}
              onChange={(e) =>
                setForm((p) => ({ ...p, whatsapp: e.target.value }))
              }
              className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none transition-all focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group space-y-1">
              <label htmlFor="book-child-age" className="sr-only">
                Child's Age
              </label>
              <span className="text-[10px] font-bold uppercase text-slate-600">
                Child's Age
              </span>
              <select
                id="book-child-age"
                value={form.childAgeGrade}
                onChange={(e) =>
                  setForm((p) => ({ ...p, childAgeGrade: e.target.value }))
                }
                className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none"
              >
                <option>3-5 Years</option>
                <option>6-8 Years</option>
                <option>9-12 Years</option>
              </select>
            </div>

            <div className="group space-y-1">
              <label htmlFor="book-interest" className="sr-only">
                Interest
              </label>
              <span className="text-[10px] font-bold uppercase text-slate-600">
                Interest
              </span>
              <select
                id="book-interest"
                value={form.interest}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    interest: e.target.value as BookAssessmentFormState["interest"],
                  }))
                }
                className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none"
              >
                <option>Phonics</option>
                <option>Grammar</option>
                <option>Public Speaking</option>
                <option>Not sure yet</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowOptional((v) => !v)}
            className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-orange-700 underline decoration-orange-300/70 underline-offset-4 hover:text-orange-800"
          >
            <span className="text-orange-600">{showOptional ? "−" : "+"}</span>
            {showOptional ? "Hide optional details" : "Add optional details"}
          </button>

          <AnimatePresence initial={false}>
            {showOptional && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-4">
                  <div className="group space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-600 transition-colors group-focus-within:text-orange-600">
                      Preferred Time (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Weekdays 6–8 PM"
                      value={form.preferredTime}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          preferredTime: e.target.value,
                        }))
                      }
                      className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none transition-all focus:border-orange-500"
                    />
                  </div>

                  <div className="group space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-600 transition-colors group-focus-within:text-orange-600">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. shy speaker / reading help"
                      value={form.note}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, note: e.target.value }))
                      }
                      className="w-full border-b border-slate-200 bg-transparent py-2 text-sm outline-none transition-all focus:border-orange-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            className="mt-6 w-full rounded-2xl py-6 text-base font-bold shadow-lg shadow-orange-200/70 transition-all hover:shadow-orange-300/80"
            style={{
              background: `linear-gradient(90deg, ${SUN_ORANGE} 0%, #ff7a1a 55%, #ff6a00 100%)`,
            }}
          >
            Submit via WhatsApp
          </Button>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Having trouble? Open WhatsApp in a new tab →
          </a>

          {/* OR helper text */}
          <p className="text-center text-xs text-slate-600">
            Prefer a form?{" "}
            <button
              type="button"
              onClick={handleOpenGoogleForm}
              className="font-semibold text-slate-700 hover:text-slate-900 underline decoration-slate-300/70 underline-offset-4"
            >
              Submit via Google Form
            </button>
          </p>

          {/* Secondary Google Form button */}
          <button
            type="button"
            onClick={handleOpenGoogleForm}
            className="mt-4 w-full rounded-2xl border-2 border-slate-300 bg-white py-6 text-base font-bold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
          >
            Submit via Google Form
          </button>

          <p className="text-center text-[10px] text-slate-600">
            🔒 We value your privacy. No spam, ever.
          </p>
        </form>
      </GlassCard>

      {/* Google Form Modal */}
      {showGoogleFormModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowGoogleFormModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative mx-4 flex h-[85vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                Book Free Assessment (Google Form)
              </h3>
              <button
                onClick={() => setShowGoogleFormModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
                autoFocus
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body - iframe */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={GOOGLE_FORM_EMBED_URL}
                title="Book Free Assessment - Google Form"
                loading="lazy"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookAssessmentForm;
