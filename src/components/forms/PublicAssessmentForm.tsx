import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  trackDemoBookingComplete,
  trackLeadFormView,
  trackGenerateLead,
  trackLeadFormError,
  trackLeadFormStart,
  trackLeadFormSubmit,
  trackWhatsappClick,
} from '../../lib/conversionTracking';
import { db } from '../../lib/firebaseConfig';
import {
  buildPublicLeadPayload,
  buildPublicWhatsappMessage,
  getPublicLeadAttribution,
  type InterestOption,
  type MainConcernOption,
  type PublicAssessmentFormState,
} from '../../lib/publicLeadForm';

const WHATSAPP_NUMBER = '919618398383';
const SUN_ORANGE = '#ff6a00';
const PREFILL_STORAGE_KEY = 'ts_public_assessment_prefill_v1';
const NAVY_TEXT_OUTLINE = '[text-shadow:-0.7px_-0.7px_0_rgba(255,255,255,0.78),0.7px_-0.7px_0_rgba(255,255,255,0.78),-0.7px_0.7px_0_rgba(255,255,255,0.78),0.7px_0.7px_0_rgba(255,255,255,0.78)]';
const NAVY_TEXT = `text-[#182B57] ${NAVY_TEXT_OUTLINE}`;
const NAVY_TEXT_STRONG = `text-[#142449] ${NAVY_TEXT_OUTLINE}`;

type AgeOption = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

type PublicAssessmentFormProps = {
  defaultInterest?: InterestOption;
  source?: string;
  autoFocusFirstField?: boolean;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  submitAriaLabel?: string;
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
  title = 'Book Assessment',
  description = 'Share a few details and we will confirm available slots on WhatsApp.',
  submitLabel = 'Get Free Assessment on WhatsApp',
  submitAriaLabel = 'Get Free Assessment on WhatsApp',
}: PublicAssessmentFormProps) {
  const ageOptions: AgeOption[] = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const interestOptions: InterestOption[] = ['Phonics', 'Reading', 'Grammar', 'Speaking'];
  const mainConcernOptions: MainConcernOption[] = [
    'Knows ABC but cannot read words',
    'Struggles with blending',
    'Reads slowly',
    'Makes grammar mistakes',
    'Gives one-word answers',
    'Hesitates to speak English',
    'Needs public speaking confidence',
    'Not sure where to start',
  ];
  const initialState: PublicAssessmentFormState = {
    parentName: '',
    childName: '',
    whatsapp: '',
    childAge: '',
    interest: defaultInterest,
    mainConcern: '',
    urgency: '',
    details: '',
  };

  const [form, setForm] = useState<PublicAssessmentFormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastOpenedWaLink, setLastOpenedWaLink] = useState('');
  const [errors, setErrors] = useState<{ parentName?: string; childName?: string; whatsapp?: string; childAge?: string; interest?: string; mainConcern?: string }>({});
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const hasTrackedFormStartRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFILL_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { parentName?: string; childName?: string; whatsapp?: string };
      setForm((prev) => ({
        ...prev,
        parentName: typeof parsed.parentName === 'string' ? parsed.parentName.slice(0, 80) : prev.parentName,
        childName: typeof parsed.childName === 'string' ? parsed.childName.slice(0, 80) : prev.childName,
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
          childName: form.childName,
          whatsapp: form.whatsapp,
        })
      );
    } catch {
      return;
    }
  }, [form.parentName, form.childName, form.whatsapp]);

  useEffect(() => {
    if (!autoFocusFirstField) return;
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [autoFocusFirstField]);

  useEffect(() => {
    const attribution = getPublicLeadAttribution();
    trackLeadFormView({
      form_name: 'public_assessment_form',
      source_context: source || 'public_assessment_form',
      sourcePath: attribution.sourcePath,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      interest: form.interest,
      urgency: form.urgency,
    });
    // mount-only event
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trackFormStartOnce = () => {
    if (hasTrackedFormStartRef.current) return;
    hasTrackedFormStartRef.current = true;
    const attribution = getPublicLeadAttribution();
    trackLeadFormStart({
      form_name: 'public_assessment_form',
      source_context: source || 'public_assessment_form',
      sourcePath: attribution.sourcePath,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      childAge: form.childAge,
      interest: form.interest,
      mainConcern: form.mainConcern,
      urgency: form.urgency,
    });
  };

  const waLink = useMemo(() => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildPublicWhatsappMessage(form))}`;
  }, [form]);

  const validate = () => {
    const nextErrors: { parentName?: string; childName?: string; whatsapp?: string; childAge?: string; interest?: string; mainConcern?: string } = {};

    if (!form.parentName.trim()) {
      nextErrors.parentName = 'Please enter parent name.';
    }

    if (!form.childName.trim()) {
      nextErrors.childName = 'Please enter child name.';
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

    if (!form.mainConcern) {
      nextErrors.mainConcern = 'Please select the main concern.';
    }

    setErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(false);
    setSubmitError('');

    const { isValid, nextErrors } = validate();
    if (!isValid) {
      const errorFields = Object.keys(nextErrors).filter(Boolean);
      trackLeadFormError({
        form_name: 'public_assessment_form',
        source_context: source || 'public_assessment_form',
        error_fields: errorFields,
        error_message: 'validation_failed',
      });
      return;
    }

    const attribution = getPublicLeadAttribution();
    const trackingPayload = {
      form_name: 'public_assessment_form',
      source_context: source || 'public_assessment_form',
      sourcePath: attribution.sourcePath,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      childAge: form.childAge,
      interest: form.interest,
      mainConcern: form.mainConcern,
      urgency: form.urgency,
    };

    trackLeadFormSubmit({
      ...trackingPayload,
    });

    setIsSubmitting(true);
    try {
      const payload = buildPublicLeadPayload(form, {
        source,
        attribution,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      const leadRef = await addDoc(collection(db, 'leads'), {
        ...payload,
        createdAt: serverTimestamp(),
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      trackGenerateLead({
        ...trackingPayload,
        page_path: window.location.pathname,
        lead_channel: 'assessment_form',
        lead_type: 'parent_assessment_request',
        form_id: 'public_assessment_form',
        source: source || 'public_assessment_form',
        submission_id: leadRef.id,
        value: 1,
      });
      trackDemoBookingComplete({
        booking_type: 'whatsapp_assessment_request',
        source_context: source || 'public_assessment_form',
      });

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

      trackWhatsappClick(source || 'public_assessment_form', trackingPayload);
      setLastOpenedWaLink(waLink);
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      console.error('[PublicAssessmentForm] lead save failed', error);
      trackLeadFormError({
        ...trackingPayload,
        error_fields: ['save'],
        error_message: 'lead_save_failed',
      });
      setSubmitError('We could not save your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="border-slate-200 p-5 shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-slate-100" />

      <div className="relative mb-6 sm:mb-7">
        <h2 className={`text-xl font-bold sm:text-2xl ${NAVY_TEXT_STRONG}`}>{title}</h2>
        <p className={`mt-2 text-sm ${NAVY_TEXT}`}>{description}</p>
      </div>

      <form onSubmit={handleSubmit} onFocusCapture={trackFormStartOnce} className="relative space-y-4 pb-6 sm:space-y-5 sm:pb-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="group space-y-1">
            <label htmlFor="assessment-parent-name" className="sr-only">
              Parent Name *
            </label>
            <input
              ref={firstFieldRef}
              id="assessment-parent-name"
              name="parentName"
              type="text"
              autoComplete="name"
              aria-label="Parent Name"
              placeholder="Parent Name"
              value={form.parentName}
              onChange={(e) => {
                setForm((p) => ({ ...p, parentName: e.target.value }));
                if (errors.parentName) setErrors((prev) => ({ ...prev, parentName: undefined }));
              }}
              className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-all placeholder:text-[#44597f] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${NAVY_TEXT}`}
              required
              aria-invalid={Boolean(errors.parentName)}
            />
            {errors.parentName ? <p className="text-xs text-rose-600">{errors.parentName}</p> : null}
          </div>

          <div className="group space-y-1">
            <label htmlFor="assessment-child-name" className="sr-only">
              Child Name *
            </label>
            <input
              id="assessment-child-name"
              name="childName"
              type="text"
              autoComplete="off"
              aria-label="Child Name"
              placeholder="Child Name"
              value={form.childName}
              onChange={(e) => {
                setForm((p) => ({ ...p, childName: e.target.value }));
                if (errors.childName) setErrors((prev) => ({ ...prev, childName: undefined }));
              }}
              className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-all placeholder:text-[#44597f] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${NAVY_TEXT}`}
              required
              aria-invalid={Boolean(errors.childName)}
            />
            {errors.childName ? <p className="text-xs text-rose-600">{errors.childName}</p> : null}
          </div>
        </div>

        <div className="group space-y-1">
          <label htmlFor="assessment-whatsapp" className="sr-only">
            WhatsApp Number *
          </label>
          <input
            id="assessment-whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            aria-label="WhatsApp Number"
            placeholder="WhatsApp Number"
            value={form.whatsapp}
            onChange={(e) => {
              setForm((p) => ({ ...p, whatsapp: e.target.value }));
              if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
            }}
            className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-all placeholder:text-[#44597f] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${NAVY_TEXT}`}
            required
            aria-invalid={Boolean(errors.whatsapp)}
          />
          {errors.whatsapp ? <p className="text-xs text-rose-600">{errors.whatsapp}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
          <div className="space-y-4">
            <div className="group space-y-1">
              <label htmlFor="assessment-child-age" className="sr-only">
                Child Age *
              </label>
              <select
                id="assessment-child-age"
                name="childAge"
                aria-label="Child Age"
                value={form.childAge}
                onChange={(e) => {
                  setForm((p) => ({ ...p, childAge: e.target.value }));
                  if (errors.childAge) setErrors((prev) => ({ ...prev, childAge: undefined }));
                }}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${NAVY_TEXT}`}
                required
                aria-invalid={Boolean(errors.childAge)}
              >
                <option value="" disabled>
                  Child Age
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
              <label htmlFor="assessment-main-concern" className="sr-only">
                What is your child struggling with most? *
              </label>
              <select
                id="assessment-main-concern"
                name="mainConcern"
                aria-label="What is your child struggling with most?"
                value={form.mainConcern}
                onChange={(e) => {
                  setForm((p) => ({ ...p, mainConcern: e.target.value as MainConcernOption }));
                  if (errors.mainConcern) setErrors((prev) => ({ ...prev, mainConcern: undefined }));
                }}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${NAVY_TEXT}`}
                required
                aria-invalid={Boolean(errors.mainConcern)}
              >
                <option value="" disabled>
                  What is your child struggling with?
                </option>
                {mainConcernOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.mainConcern ? <p className="text-xs text-rose-600">{errors.mainConcern}</p> : null}
            </div>

          </div>

          <div className="group space-y-1">
            <label className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${NAVY_TEXT}`}>
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
                        ? `border-orange-500 bg-orange-50 text-orange-800 shadow-sm ${NAVY_TEXT_STRONG}`
                        : `border-slate-300 bg-white hover:border-orange-300 hover:bg-orange-50/60 ${NAVY_TEXT}`
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
          <label htmlFor="assessment-details" className="sr-only">
            Optional Details
          </label>
          <textarea
            id="assessment-details"
            name="details"
            rows={2}
            aria-label="Optional Details"
            placeholder="Optional details: reading help, shy speaker, preferred time, etc."
            value={form.details}
            onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))}
            className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition-all placeholder:text-[#44597f] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${NAVY_TEXT}`}
          />
        </div>

        <button
          type="submit"
          aria-label={submitAriaLabel}
          disabled={isSubmitting}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/30 px-6 py-4 text-base font-bold text-white shadow-lg shadow-orange-200/70 transition-all hover:shadow-orange-300/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 sm:py-6 md:text-lg"
          style={{
            background: `linear-gradient(90deg, ${SUN_ORANGE} 0%, #ff7a1a 55%, #ff6a00 100%)`,
          }}
        >
          {isSubmitting ? 'Saving your request...' : submitLabel}
        </button>

        <p className={`text-center text-xs ${NAVY_TEXT}`}>Takes 20–30 seconds • No commitment • Get slots instantly on WhatsApp</p>

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {submitError}
          </div>
        ) : null}

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
