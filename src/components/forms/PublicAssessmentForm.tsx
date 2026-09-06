import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  trackDemoBookingComplete,
  trackLeadFormView,
  trackGenerateLead,
  trackLeadFormError,
  trackLeadFormStart,
  trackLeadFormSubmit,
  trackWhatsappClick,
} from '../../lib/conversionTracking';
import {
  PUBLIC_MAIN_CONCERN_OPTIONS,
  buildLeadAttributionEnrichment,
  buildPublicLeadPayload,
  buildPublicWhatsappMessage,
  getPublicLeadAttribution,
  type MainConcernOption,
  type PublicAssessmentFormState,
} from '../../lib/publicLeadForm';

const WHATSAPP_NUMBER = '919618398383';
const SUN_ORANGE = '#ff6a00';
const PREFILL_STORAGE_KEY = 'ts_public_assessment_prefill_v1';
const PENDING_LEAD_ID_STORAGE_KEY = 'ts_public_assessment_pending_lead_id_v1';
const NAVY_TEXT_OUTLINE = '[text-shadow:-0.7px_-0.7px_0_rgba(255,255,255,0.78),0.7px_-0.7px_0_rgba(255,255,255,0.78),-0.7px_0.7px_0_rgba(255,255,255,0.78),0.7px_0.7px_0_rgba(255,255,255,0.78)]';
const NAVY_TEXT = `text-[#182B57] ${NAVY_TEXT_OUTLINE}`;
const NAVY_TEXT_STRONG = `text-[#142449] ${NAVY_TEXT_OUTLINE}`;

const readPendingLeadId = (): string | null => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage.getItem(PENDING_LEAD_ID_STORAGE_KEY);
  } catch {
    return null;
  }
};

type AgeOption = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

type PublicAssessmentFormProps = {
  source?: string;
  autoFocusFirstField?: boolean;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  submitAriaLabel?: string;
  appearance?: 'default' | 'embedded';
  helperText?: string;
  secondaryHelperText?: string | null;
};

const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white/95 backdrop-blur-xl ${className}`}
  >
    {children}
  </div>
);

export default function PublicAssessmentForm({
  source,
  autoFocusFirstField = false,
  onSuccess,
  title = 'Book Assessment',
  description = 'Share a few details and we will confirm available slots on WhatsApp.',
  submitLabel = 'Book Free 35-Minute Demo on WhatsApp',
  submitAriaLabel = 'Book Free 35-Minute Demo on WhatsApp',
  appearance = 'default',
  helperText = 'Takes 20–30 seconds • No commitment • Get slots instantly on WhatsApp',
  secondaryHelperText = 'After you submit, we will reply on WhatsApp with the recommended starting path, available slots, and pricing clarity.',
}: PublicAssessmentFormProps) {
  const ageOptions: AgeOption[] = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const mainConcernOptions = PUBLIC_MAIN_CONCERN_OPTIONS;
  const initialState: PublicAssessmentFormState = {
    parentName: '',
    childName: '',
    whatsapp: '',
    childAge: '',
    mainConcern: '',
    urgency: '',
  };

  const [form, setForm] = useState<PublicAssessmentFormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastOpenedWaLink, setLastOpenedWaLink] = useState('');
  const [errors, setErrors] = useState<{ parentName?: string; childName?: string; whatsapp?: string; childAge?: string; mainConcern?: string }>({});
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const hasTrackedFormStartRef = useRef(false);
  const submitLockRef = useRef(false);
  const pendingLeadIdRef = useRef<string | null>(readPendingLeadId());

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
    if (!autoFocusFirstField || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [autoFocusFirstField]);

  useEffect(() => {
    const trackView = () => {
      trackLeadFormView(source || 'public_assessment_form');
    };
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(trackView, 0);
    return () => window.clearTimeout(timer);
  }, [source]);

  const trackFormStartOnce = () => {
    if (hasTrackedFormStartRef.current) return;
    hasTrackedFormStartRef.current = true;
    trackLeadFormStart(source || 'public_assessment_form');
  };

  const normalizedWhatsApp = useMemo(() => form.whatsapp.replace(/\D/g, ''), [form.whatsapp]);
  const whatsappMessage = useMemo(
    () => buildPublicWhatsappMessage(form),
    [form]
  );
  const waLink = useMemo(
    () => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`,
    [whatsappMessage]
  );

  const validate = () => {
    const nextErrors: { parentName?: string; childName?: string; whatsapp?: string; childAge?: string; mainConcern?: string } = {};
    if (!form.parentName.trim()) nextErrors.parentName = 'Please enter the parent name.';
    if (!form.childName.trim()) nextErrors.childName = 'Please enter the child name.';
    if (!normalizedWhatsApp || normalizedWhatsApp.length < 8) nextErrors.whatsapp = 'Please enter a valid WhatsApp number.';
    if (!form.childAge) nextErrors.childAge = 'Please choose the child age.';
    if (!form.mainConcern) nextErrors.mainConcern = 'Please choose the area where your child needs support.';
    setErrors(nextErrors);
    return nextErrors;
  };

  const navigateToWhatsapp = (popup: Window | null, url: string) => {
    if (popup && !popup.closed) {
      popup.location.href = url;
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLockRef.current || isSubmitting) return;
    trackFormStartOnce();
    setSubmitError('');

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      trackLeadFormError(source || 'public_assessment_form', {
        error_fields: Object.keys(nextErrors),
      });
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const whatsappWindow = window.open('', '_blank');
    if (whatsappWindow) whatsappWindow.opener = null;

    const attribution = getPublicLeadAttribution();
    const attributionEnrichment = buildLeadAttributionEnrichment(attribution);
    const leadId = pendingLeadIdRef.current || crypto.randomUUID();
    pendingLeadIdRef.current = leadId;
    try {
      window.sessionStorage.setItem(PENDING_LEAD_ID_STORAGE_KEY, leadId);
    } catch {
      // Continue without session persistence when storage is unavailable.
    }

    const payload = buildPublicLeadPayload({
      form,
      leadId,
      source: source || 'public_assessment_form',
      attribution,
      attributionEnrichment,
    });

    const trackingPayload = {
      lead_id: leadId,
      main_concern: form.mainConcern,
      child_age: form.childAge,
      ...attributionEnrichment,
    };

    try {
      trackLeadFormSubmit(source || 'public_assessment_form', trackingPayload);
      const response = await fetch('/api/public-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Lead save failed with ${response.status}`);
      }

      setSubmitted(true);
      trackGenerateLead(source || 'public_assessment_form', trackingPayload);
      trackDemoBookingComplete(source || 'public_assessment_form', trackingPayload);
      if (onSuccess) onSuccess();
      navigateToWhatsapp(whatsappWindow, waLink);
      trackWhatsappClick(source || 'public_assessment_form', trackingPayload);
      setLastOpenedWaLink(waLink);
      try {
        window.sessionStorage.removeItem(PENDING_LEAD_ID_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
      pendingLeadIdRef.current = null;
      setForm(initialState);
      setErrors({});
      try {
        window.localStorage.removeItem(PREFILL_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    } catch (error) {
      console.error(error);
      trackLeadFormError(source || 'public_assessment_form', {
        ...trackingPayload,
        error_fields: ['save'],
        error_message: 'lead_save_failed',
      });
      navigateToWhatsapp(whatsappWindow, waLink);
      trackWhatsappClick(source || 'public_assessment_form', trackingPayload);
      setLastOpenedWaLink(waLink);
      setSubmitError('We could not save your request on the website, but WhatsApp is opening with your completed message. Please send it so we can help you.');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const cardClassName = appearance === 'embedded'
    ? 'border-white/90 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.12)] sm:p-7'
    : 'border-slate-200 p-5 shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:p-8';

  return (
    <GlassCard className={cardClassName}>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:items-start">
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
              Choose the area where your child needs support *
            </label>
            <select
              id="assessment-main-concern"
              name="mainConcern"
              aria-label="Choose the area where your child needs support"
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
                Choose the area where your child needs support
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

        <div className="space-y-1 text-center">
          <p className={`text-xs ${NAVY_TEXT}`}>{helperText}</p>
          {secondaryHelperText ? (
            <p className="text-xs text-slate-600">{secondaryHelperText}</p>
          ) : null}
        </div>

        {submitError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {submitError}
          </div>
        ) : null}

        {submitted ? (
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status" aria-live="polite">
            <p className="font-medium">
              Thank you! We received your request. Our team will reply on WhatsApp with the recommended starting path,
              available slots, and pricing details.
            </p>
            <p>WhatsApp should also open in a new tab now. If it did not open, use the options below.</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={lastOpenedWaLink || waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Open WhatsApp again
              </a>
              <a
                href="/class-samples"
                className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-200"
              >
                View Class Samples
              </a>
            </div>
          </div>
        ) : null}
      </form>
    </GlassCard>
  );
}