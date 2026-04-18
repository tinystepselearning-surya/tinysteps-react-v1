import React, { useEffect, useMemo, useRef, useState } from 'react';
import { trackDemoBookingComplete, trackLeadFormStart, trackLeadFormSubmit, trackWhatsappClick } from '../../lib/conversionTracking';

const WHATSAPP_NUMBER = '919618398383';
const SUN_ORANGE = '#ff6a00';
const PREFILL_STORAGE_KEY = 'ts_public_assessment_prefill_v1';

type InterestOption = 'Phonics' | 'Reading' | 'Grammar' | 'Speaking';
type AgeOption = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

type PublicAssessmentFormState = {
  parentName: string;
  whatsapp: string;
  childAge: string;
  interest: InterestOption;
  details: string;
};

type PublicAssessmentFormProps = {
  defaultInterest?: InterestOption;
  source?: string;
  autoFocusFirstField?: boolean;
  onSuccess?: () => void;
};

const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-[0_24px_70px_rgba(15,23,42,0.18)] ${className}`}
  >
    {children}
  </div>
);

export default function PublicAssessmentForm({
  defaultInterest = 'Phonics',
  source,
  autoFocusFirstField = false,
  onSuccess,
}: PublicAssessmentFormProps) {
  const ageOptions: AgeOption[] = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const interestOptions: InterestOption[] = ['Phonics', 'Reading', 'Grammar', 'Speaking'];

  const initialState: PublicAssessmentFormState = {
    parentName: '',
    whatsapp: '',
    childAge: '',
    interest: defaultInterest,
    details: '',
  };

  const [form, setForm] = useState<PublicAssessmentFormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [lastOpenedWaLink, setLastOpenedWaLink] = useState('');
  const [errors, setErrors] = useState<{ parentName?: string; whatsapp?: string; childAge?: string; interest?: string }>({});
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const hasTrackedFormStartRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFILL_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { parentName?: string; whatsapp?: string };
      setForm((prev) => ({
        ...prev,
        parentName: typeof parsed.parentName === 'string' ? parsed.parentName.slice(0, 80) : prev.parentName,
        whatsapp: typeof parsed.whatsapp === 'string' ? parsed.whatsapp.slice(0, 20) : prev.whatsapp,
      }));
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PREFILL_STORAGE_KEY,
        JSON.stringify({
          parentName: form.parentName,
          whatsapp: form.whatsapp,
        })
      );
    } catch {
      return;
    }
  }, [form.parentName, form.whatsapp]);

  useEffect(() => {
    if (!autoFocusFirstField) return;
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [autoFocusFirstField]);

  const trackFormStartOnce = () => {
    if (hasTrackedFormStartRef.current) return;
    hasTrackedFormStartRef.current = true;
    trackLeadFormStart({
      form_name: 'public_assessment_form',
      source_context: source || 'public_assessment_form',
    });
  };

  const waLink = useMemo(() => {
    const lines = [
      'Hello Tiny Steps,',
      '',
      'I would like to book a free assessment class.',
      '',
      `Parent name: ${form.parentName || '-'}`,
      `WhatsApp number: ${form.whatsapp || '-'}`,
      `Child age: ${form.childAge || '-'}`,
      `Interest: ${form.interest || '-'}`,
      '',
    ];

    if (form.details.trim()) {
      lines.push(form.details.trim(), '');
    }

    lines.push('Please share available slots. Thank you.');

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  }, [form]);

  const validate = () => {
    const nextErrors: { parentName?: string; whatsapp?: string; childAge?: string; interest?: string } = {};

    if (!form.parentName.trim()) {
      nextErrors.parentName = 'Please enter parent name.';
    }

    if (!form.whatsapp.trim()) {
      nextErrors.whatsapp = 'Please enter WhatsApp number.';
    }

    if (!form.childAge) {
      nextErrors.childAge = 'Please select child age.';
    }

    if (!form.interest) {
      nextErrors.interest = 'Please select one interest.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(false);

    if (!validate()) return;

    trackLeadFormSubmit({
      form_name: 'public_assessment_form',
      source_context: source || 'public_assessment_form',
    });
    trackDemoBookingComplete({
      booking_type: 'whatsapp_assessment_request',
      source_context: source || 'public_assessment_form',
    });
    trackWhatsappClick('public_assessment_form');

    const popup = window.open(waLink, '_blank', 'noopener,noreferrer');
    if (!popup) {
      const link = document.createElement('a');
      link.href = waLink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setLastOpenedWaLink(waLink);
    setSubmitted(true);
    onSuccess?.();
  };

  return (
    <GlassCard className="border-slate-200 p-5 shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-slate-100" />

      <div className="relative mb-6 sm:mb-7">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Book Assessment</h2>
        <p className="mt-2 text-sm text-slate-700">Share a few details and we will confirm available slots on WhatsApp.</p>
      </div>

      <form onSubmit={handleSubmit} onFocusCapture={trackFormStartOnce} className="relative space-y-4">
        <div className="group space-y-1">
          <label htmlFor="assessment-parent-name" className="text-[11px] font-bold uppercase text-slate-700 transition-colors group-focus-within:text-orange-700">
            Parent Name *
          </label>
          <input
            ref={firstFieldRef}
            id="assessment-parent-name"
            name="parentName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Priya Sharma"
            value={form.parentName}
            onChange={(e) => {
              setForm((p) => ({ ...p, parentName: e.target.value }));
              if (errors.parentName) setErrors((prev) => ({ ...prev, parentName: undefined }));
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            required
            aria-invalid={Boolean(errors.parentName)}
          />
          {errors.parentName ? <p className="text-xs text-rose-600">{errors.parentName}</p> : null}
        </div>

        <div className="group space-y-1">
          <label htmlFor="assessment-whatsapp" className="text-[11px] font-bold uppercase text-slate-700 transition-colors group-focus-within:text-orange-700">
            WhatsApp Number *
          </label>
          <input
            id="assessment-whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+91 00000 00000"
            value={form.whatsapp}
            onChange={(e) => {
              setForm((p) => ({ ...p, whatsapp: e.target.value }));
              if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            required
            aria-invalid={Boolean(errors.whatsapp)}
          />
          {errors.whatsapp ? <p className="text-xs text-rose-600">{errors.whatsapp}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="group space-y-1">
            <label htmlFor="assessment-child-age" className="text-[11px] font-bold uppercase text-slate-700">
              Child Age *
            </label>
            <select
              id="assessment-child-age"
              name="childAge"
              value={form.childAge}
              onChange={(e) => {
                setForm((p) => ({ ...p, childAge: e.target.value }));
                if (errors.childAge) setErrors((prev) => ({ ...prev, childAge: undefined }));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              required
              aria-invalid={Boolean(errors.childAge)}
            >
              <option value="" disabled>
                Select age
              </option>
              {ageOptions.map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
            {errors.childAge ? <p className="text-xs text-rose-600">{errors.childAge}</p> : null}
          </div>

          <div className="group space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-700">
              Interest *
            </label>
            <div
              className="grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Interest"
              aria-invalid={Boolean(errors.interest)}
            >
              {interestOptions.map((option) => {
                const isSelected = form.interest === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setForm((p) => ({ ...p, interest: option }));
                      if (errors.interest) setErrors((prev) => ({ ...prev, interest: undefined }));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setForm((p) => ({ ...p, interest: option }));
                        if (errors.interest) setErrors((prev) => ({ ...prev, interest: undefined }));
                      }
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-orange-200 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-800 shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/60'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {errors.interest ? <p className="text-xs text-rose-600">{errors.interest}</p> : null}
          </div>
        </div>

        <div className="group space-y-1">
          <label htmlFor="assessment-details" className="text-[11px] font-bold uppercase text-slate-700 transition-colors group-focus-within:text-orange-700">
            Optional Details
          </label>
          <textarea
            id="assessment-details"
            name="details"
            rows={2}
            placeholder="Reading help, shy speaker, preferred time, etc."
            value={form.details}
            onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <button
          type="submit"
          aria-label="Get Free Assessment on WhatsApp"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/30 px-6 py-4 text-base font-bold text-white shadow-lg shadow-orange-200/70 transition-all hover:shadow-orange-300/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 sm:py-6 md:text-lg"
          style={{
            background: `linear-gradient(90deg, ${SUN_ORANGE} 0%, #ff7a1a 55%, #ff6a00 100%)`,
          }}
        >
          Get Free Assessment on WhatsApp
        </button>

        <p className="text-center text-xs text-slate-700">Takes 20–30 seconds • No commitment • Get slots instantly on WhatsApp</p>

        {submitted ? (
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status" aria-live="polite">
            <p className="font-medium">WhatsApp opened in a new tab.</p>
            <p>If it did not open, click below.</p>
            <a
              href={lastOpenedWaLink || waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Open WhatsApp again
            </a>
          </div>
        ) : null}
      </form>
    </GlassCard>
  );
}
