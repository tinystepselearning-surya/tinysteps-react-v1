import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../Button/Button";

// Constants
const WHATSAPP_NUMBER = "919618398383";
const CALL_DISPLAY = "+91 96183 98383";
const CALL_HREF = `tel:+${WHATSAPP_NUMBER}`;
const SUN_ORANGE = "#ff6a00";

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

  return (
    <GlassCard className="border-white/80 p-8 shadow-[0_26px_70px_rgba(15,23,42,0.10)]">
      {/* subtle inner ring for premium feel */}
      <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-orange-200/30" />

      <div className="relative mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Book Assessment</h2>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
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
          <label className="text-[10px] font-bold uppercase text-slate-400 transition-colors group-focus-within:text-orange-600">
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
          <label className="text-[10px] font-bold uppercase text-slate-400 transition-colors group-focus-within:text-orange-600">
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
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Child's Age
            </label>
            <select
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
            <label className="text-[10px] font-bold uppercase text-slate-400">
              Interest
            </label>
            <select
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
                  <label className="text-[10px] font-bold uppercase text-slate-400 transition-colors group-focus-within:text-orange-600">
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
                  <label className="text-[10px] font-bold uppercase text-slate-400 transition-colors group-focus-within:text-orange-600">
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

        <p className="text-center text-[10px] text-slate-400">
          🔒 We value your privacy. No spam, ever.
        </p>
      </form>
    </GlassCard>
  );
};

export default BookAssessmentForm;
