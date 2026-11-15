import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  trackDemoRequestReceived,
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
  type ClassFormatPreference,
  type PublicAssessmentFormState,
} from '../../lib/publicLeadForm';

const WHATSAPP_NUMBER = '919618398383';
const PHONE_URL = 'tel:+919618398383';
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
  preferredFormat?: ClassFormatPreference;
  preferredMainConcern?: MainConcernOption;
  autoFocusFirstField?: boolean;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  submitAriaLabel?: string;
  appearance?: 'default' | 'embedded' | 'heroCompact';
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
  preferredFormat = 'one_to_one',
  preferredMainConcern,
  autoFocusFirstField = false,
  onSuccess,
  title = 'Book Assessment',
  description = 'Share a few details and we will confirm available slots on WhatsApp.',
  submitLabel = 'Book Free 35-Minute Demo on WhatsApp',
  submitAriaLabel = 'Book Free 35-Minute Demo on WhatsApp',
  appearance = 'default',
  helperText = 'Free demo • No commitment • We’ll confirm available slots',
  secondaryHelperText = 'After you submit, we will reply on WhatsApp with the recommended starting path, available slots, and pricing clarity.',
}: PublicAssessmentFormProps) {
  const ageOptions: AgeOption[] = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const mainConcernOptions = PUBLIC_MAIN_CONCERN_OPTIONS;
  const initialState: PublicAssessmentFormState = {
    parentName: '',
    childName: '',
    whatsapp: '',
    childAge: '',
    mainConcern: preferredMainConcern || '',
    classFormatPreference: preferredFormat,
    contactPreference: '',
    urgency: '',
  };

  const [form, setForm] = useState<PublicAssessmentFormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappHandoffAttempted, setWhatsappHandoffAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastOpenedWaLink, setLastOpenedWaLink] = useState('');
  const [errors, setErrors] = useState<{ parentName?: string; childName?: string; whatsapp?: string; childAge?: string; mainConcern?: string; contactPreference?: string }>({});
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
    if (!autoFocusFirstField) return;
    // Avoid opening the on-screen keyboard before parents can see the form on mobile.
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 639px)').matches) return;
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
      mainConcern: form.mainConcern,
      urgency: form.urgency,
      class_format_preference: form.classFormatPreference,
    });
  };

  const waLink = useMemo(() => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildPublicWhatsappMessage(form))}`;
  }, [form]);

  const openWhatsappPopup = () => {
    try {
      const popup = window.open('about:blank', 'tinyStepsAssessmentWhatsApp');
      if (popup) {
        try {
          popup.opener = null;
        } catch {
          // Ignore cross-browser opener assignment differences.
        }
      }

      return popup;
    } catch {
      return null;
    }
  };

  // The lead must remain visibly confirmed on our website even if a browser
  // blocks WhatsApp. A same-tab redirect can hide confirmation and the call fallback.
  // This only reports an attempted handoff, never WhatsApp login, send or delivery.
  const navigateToWhatsapp = (popup: Window | null, url: string): boolean => {
    if (!popup || popup.closed) return false;
    try {
      if (typeof popup.location.replace === 'function') {
        popup.location.replace(url);
        return true;
      }
    } catch {
      // The parent's browser may deny popup navigation.
    }
    try {
      popup.location.href = url;
      return true;
    } catch {
      return false;
    }
  };

  const validate = () => {
    const nextErrors: { parentName?: string; childName?: string; whatsapp?: string; childAge?: string; mainConcern?: string; contactPreference?: string } = {};

    if (!form.parentName.trim()) {
      nextErrors.parentName = 'Please enter parent name.';
    }

    if (!form.childName.trim()) {
      nextErrors.childName = 'Please enter child name.';
    }

    const contactNumber = form.whatsapp.trim();
    const contactDigits = contactNumber.replace(/\D/g, '');
    if (!contactNumber) {
      nextErrors.whatsapp = 'Please enter a mobile number so we can reach you.';
    } else if (
      !/^\+?[0-9\s()-]+$/.test(contactNumber) ||
      contactDigits.length < 8 || contactDigits.length > 15 ||
      contactNumber.length > 24
    ) {
      nextErrors.whatsapp = 'Enter a valid mobile number (8–15 digits, including country code where needed).';
    }

    if (!form.childAge) {
      nextErrors.childAge = 'Please select child age.';
    }

    if (!form.mainConcern) {
      nextErrors.mainConcern = 'Please select the support area.';
    }
    if (!form.contactPreference) {
      nextErrors.contactPreference = 'Please choose how Tiny Steps may reply about this enquiry.';
    }

    setErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      nextErrors,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    setSubmitted(false);
    setWhatsappHandoffAttempted(false);
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

    submitLockRef.current = true;

    const submittedForm = { ...form };
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildPublicWhatsappMessage(submittedForm))}`;
    // A phone callback does not require the parent to open or install WhatsApp.
    const whatsappWindow = submittedForm.contactPreference === 'phone' ? null : openWhatsappPopup();

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
      childAge: submittedForm.childAge,
      mainConcern: submittedForm.mainConcern,
      urgency: submittedForm.urgency,
      class_format_preference: submittedForm.classFormatPreference,
    };

    trackLeadFormSubmit({
      ...trackingPayload,
    });

    setIsSubmitting(true);
    try {
      const [
        { collection, doc, serverTimestamp, setDoc },
        { db },
      ] = await Promise.all([
        import('firebase/firestore'),
        import('../../lib/firebaseConfig'),
      ]);
      const payload = buildPublicLeadPayload(submittedForm, {
        source,
        attribution,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      const leadRef = pendingLeadIdRef.current
        ? doc(db, 'leads', pendingLeadIdRef.current)
        : doc(collection(db, 'leads'));
      pendingLeadIdRef.current = leadRef.id;
      try {
        window.sessionStorage.setItem(PENDING_LEAD_ID_STORAGE_KEY, leadRef.id);
      } catch {
        // The in-memory id still makes same-page retries idempotent.
      }
      await setDoc(leadRef, {
        ...payload,
        createdAt: serverTimestamp(),
        requestedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Attribution enrichment is server-side so anonymous Firestore create rules remain strict.
      // A failure here must never lose the lead or prevent the parent from reaching WhatsApp.
      void (async () => {
        try {
          const [{ httpsCallable }, { functions }] = await Promise.all([
            import('firebase/functions'),
            import('../../lib/firebaseConfig'),
          ]);
          const enrichPublicLeadAttribution = httpsCallable<
            { leadId: string; attribution: ReturnType<typeof buildLeadAttributionEnrichment> },
            { ok: boolean; alreadyEnriched?: boolean; acquisitionChannel?: string }
          >(functions, 'enrichPublicLeadAttribution');
          await enrichPublicLeadAttribution({
            leadId: leadRef.id,
            attribution: buildLeadAttributionEnrichment(attribution),
          });
        } catch (attributionError) {
          console.warn('[PublicAssessmentForm] attribution enrichment failed', attributionError);
        }
      })();

      pendingLeadIdRef.current = null;
      try {
        window.sessionStorage.removeItem(PENDING_LEAD_ID_STORAGE_KEY);
      } catch {
        // Storage may be disabled; the in-memory id has already been cleared.
      }

      // Keep conversion events tied to a successfully saved public lead.
      trackGenerateLead({
        ...trackingPayload,
        page_path: window.location.pathname,
        lead_channel: 'assessment_form',
        lead_type: submittedForm.classFormatPreference === 'small_group' ? 'group_interest_request' : 'parent_assessment_request',
        form_id: 'public_assessment_form',
        source: source || 'public_assessment_form',
        submission_id: leadRef.id,
        value: 1,
      });
      if (submittedForm.classFormatPreference !== 'small_group' && submittedForm.classFormatPreference !== 'unsure') {
        trackDemoRequestReceived({
          request_type: submittedForm.contactPreference === 'phone' ? 'callback_assessment_request' : 'whatsapp_assessment_request',
          submission_id: leadRef.id,
          source_context: source || 'public_assessment_form',
        });
      }
      const handoffAttempted = submittedForm.contactPreference !== 'phone'
        && navigateToWhatsapp(whatsappWindow, whatsappUrl);
      setWhatsappHandoffAttempted(handoffAttempted);
      if (handoffAttempted) {
        trackWhatsappClick(source || 'public_assessment_form', trackingPayload);
      }
      setLastOpenedWaLink(whatsappUrl);
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      console.error('[PublicAssessmentForm] lead save failed', error);
      trackLeadFormError({
        ...trackingPayload,
        error_fields: ['save'],
        error_message: 'lead_save_failed',
      });
      const handoffAttempted = navigateToWhatsapp(whatsappWindow, whatsappUrl);
      setWhatsappHandoffAttempted(handoffAttempted);
      if (handoffAttempted) {
        trackWhatsappClick(source || 'public_assessment_form', trackingPayload);
      }
      setLastOpenedWaLink(whatsappUrl);
      setSubmitError('We could not confirm that your enquiry was saved. Please retry the form or contact Tiny Steps directly using the options below.');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const displayedSubmitLabel = !form.contactPreference
    ? form.classFormatPreference === 'small_group' ? 'Send Group-Class Enquiry'
      : form.classFormatPreference === 'unsure' ? 'Request Class Guidance'
      : 'Request Free 35-Minute Demo'
    : form.contactPreference === 'phone'
    ? form.classFormatPreference === 'small_group' ? 'Request Group-Class Callback'
      : form.classFormatPreference === 'unsure' ? 'Request Guidance by Phone'
      : 'Request a Phone Callback'
    : form.classFormatPreference === 'small_group'
    ? 'Register Group Interest on WhatsApp'
    : form.classFormatPreference === 'unsure'
      ? 'Request Class-Format Guidance on WhatsApp'
      : preferredFormat === 'small_group'
        ? 'Book Free 35-Minute 1:1 Assessment on WhatsApp'
        : submitLabel;
  const displayedTitle = title === 'Book Assessment' && form.classFormatPreference === 'small_group'
    ? 'Group Class Enquiry'
    : title === 'Book Assessment' && form.classFormatPreference === 'unsure'
      ? 'Find the Right Class Format'
      : title;
  const displayedDescription = form.contactPreference === 'phone'
    ? 'Share your child’s details. Our team can contact you by phone about the next steps.'
    : form.classFormatPreference === 'small_group'
    ? 'Share your child’s details. We will contact you when a suitable group and timing can be arranged.'
    : form.classFormatPreference === 'unsure'
      ? 'Tell us about your child and we will help you choose a suitable learning format.'
      : description;
  const displayedHelperText = form.contactPreference === 'phone'
    ? 'Your request is saved before we contact you; no WhatsApp account is needed.'
    : form.classFormatPreference === 'small_group'
    ? 'Group demos are arranged after suitable learners and schedules are matched.'
    : form.classFormatPreference === 'unsure'
      ? 'Our team will discuss the most suitable format with you.'
      : helperText;

  const isHeroCompact = appearance === 'heroCompact';
  const cardClassName = appearance === 'embedded'
    ? 'border-white/90 p-4 shadow-[0_22px_60px_rgba(15,23,42,0.12)] sm:p-7'
    : isHeroCompact
      ? 'border-slate-200 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.12)] sm:p-6'
      : 'border-slate-200 p-4 shadow-[0_26px_70px_rgba(15,23,42,0.18)] sm:p-8';

  const headerClassName = isHeroCompact ? 'relative mb-3 sm:mb-4' : 'relative mb-4 sm:mb-7';
  const formClassName = isHeroCompact
    ? 'relative space-y-3 pb-1 sm:space-y-3.5 sm:pb-2'
    : 'relative space-y-3 pb-4 sm:space-y-5 sm:pb-8';
  const fieldGridClassName = isHeroCompact
    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
    : 'grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2';
  const selectGridClassName = isHeroCompact
    ? 'grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:items-start'
    : 'grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:items-start';
  const submitClassName = isHeroCompact
    ? 'mt-3 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/30 px-5 py-3 text-base font-bold text-white shadow-md shadow-orange-200/60 transition-all hover:shadow-orange-300/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2'
    : 'mt-3 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-white/30 px-4 py-3 text-center text-base font-bold leading-snug text-white shadow-lg shadow-orange-200/70 transition-all hover:shadow-orange-300/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 sm:mt-5 sm:px-6 sm:py-4 md:text-lg';

  return (
    <GlassCard className={cardClassName}>
      <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-slate-100" />

      <div className={headerClassName}>
        <h2 className={`text-xl font-bold sm:text-2xl ${NAVY_TEXT_STRONG}`}>{displayedTitle}</h2>
        <p className={`mt-1.5 text-sm leading-5 sm:mt-2 sm:leading-6 ${NAVY_TEXT}`}>{displayedDescription}</p>
      </div>

      <form onSubmit={handleSubmit} onFocusCapture={trackFormStartOnce} className={formClassName}>
        <div className={fieldGridClassName}>
          <div className="group space-y-1">
            <label htmlFor="assessment-parent-name" className="block text-xs font-semibold text-[#142449]">
              Parent name *
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
              className={`min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition-all placeholder:text-[#44597f] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-sm ${NAVY_TEXT}`}
              required
              aria-invalid={Boolean(errors.parentName)}
            />
            {errors.parentName ? <p className="text-xs text-rose-600">{errors.parentName}</p> : null}
          </div>

          <div className="group space-y-1">
            <label htmlFor="assessment-child-name" className="block text-xs font-semibold text-[#142449]">
              Child name *
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
              className={`min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition-all placeholder:text-[#44597f] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-sm ${NAVY_TEXT}`}
              required
              aria-invalid={Boolean(errors.childName)}
            />
            {errors.childName ? <p className="text-xs text-rose-600">{errors.childName}</p> : null}
          </div>
        </div>

        <div className="group space-y-1">
          <label htmlFor="assessment-whatsapp" className="block text-xs font-semibold text-[#142449]">
            Mobile number (WhatsApp optional) *
          </label>
          <input
            id="assessment-whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            aria-label="Mobile number (WhatsApp optional)"
            placeholder="Mobile number (WhatsApp optional)"
            value={form.whatsapp}
            onChange={(e) => {
              setForm((p) => ({ ...p, whatsapp: e.target.value }));
              if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
            }}
            className={`min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition-all placeholder:text-[#44597f] focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-sm ${NAVY_TEXT}`}
            required
            aria-invalid={Boolean(errors.whatsapp)}
          />
          {errors.whatsapp ? <p className="text-xs text-rose-600">{errors.whatsapp}</p> : null}
        </div>

        <div className={selectGridClassName}>
          <div className="group space-y-1">
            <label htmlFor="assessment-child-age" className="block text-xs font-semibold text-[#142449]">
              Child age *
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
              className={`min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-sm ${NAVY_TEXT}`}
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
            <label htmlFor="assessment-main-concern" className="block text-xs font-semibold text-[#142449]">
              Where does your child need help? *
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
              className={`min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100 sm:text-sm ${NAVY_TEXT}`}
              required
              aria-invalid={Boolean(errors.mainConcern)}
            >
              <option value="" disabled>
                Choose a learning need
              </option>
              {mainConcernOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {form.mainConcern ? <p className="break-words text-xs leading-4 text-slate-600">Selected: {form.mainConcern}</p> : null}
            {errors.mainConcern ? <p className="text-xs text-rose-600">{errors.mainConcern}</p> : null}
          </div>
        </div>

        <fieldset className="space-y-2" aria-label="Preferred class format">
          <legend className="text-sm font-semibold text-[#142449]">Preferred class format *</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Choose a class format">
            {([
              { value: 'one_to_one', label: 'One-to-One Classes' },
              { value: 'small_group', label: 'Group Classes' },
              { value: 'unsure', label: 'Help Me Choose' },
            ] as const).map((option) => {
              const selected = (form.classFormatPreference || 'one_to_one') === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    trackFormStartOnce();
                    setForm((previous) => ({ ...previous, classFormatPreference: option.value as ClassFormatPreference }));
                  }}
                  className={`min-h-[48px] min-w-0 rounded-xl border px-2 py-2.5 text-center text-xs font-semibold leading-4 transition-colors ${option.value === 'unsure' ? 'col-span-2 sm:col-span-1' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:px-3 sm:text-sm ${
                    selected
                      ? 'border-[#142449] bg-[#142449] text-white shadow-sm'
                      : 'border-slate-300 bg-white text-[#142449] hover:border-[#759CC2] hover:bg-sky-50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {form.classFormatPreference === 'small_group' ? (
            <p className="text-xs leading-5 text-slate-600">Group interest is collected first; a group demo is arranged when suitable children and timings are matched.</p>
          ) : null}
        </fieldset>

        <fieldset className="space-y-2" aria-label="How Tiny Steps may contact you">
          <legend className="text-sm font-semibold text-[#142449]">How should we contact you about this enquiry? *</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Choose your contact preference">
            {([
              { value: 'phone', label: 'Call me' },
              { value: 'whatsapp', label: 'Reply on WhatsApp' },
              { value: 'either', label: 'Either is fine' },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={form.contactPreference === option.value}
                onClick={() => {
                  trackFormStartOnce();
                  setForm((previous) => ({ ...previous, contactPreference: option.value }));
                  if (errors.contactPreference) setErrors((previous) => ({ ...previous, contactPreference: undefined }));
                }}
                className={`min-h-[48px] min-w-0 rounded-xl border px-2 py-2.5 text-sm font-semibold leading-5 transition-colors ${option.value === 'either' ? 'col-span-2 sm:col-span-1' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${form.contactPreference === option.value
                  ? 'border-[#142449] bg-[#142449] text-white'
                  : 'border-slate-300 bg-white text-[#142449] hover:border-sky-300 hover:bg-sky-50'}`}
              >{option.label}</button>
            ))}
          </div>
          {errors.contactPreference && <p className="text-xs text-rose-600">{errors.contactPreference}</p>}
          <p className="text-xs leading-5 text-slate-600">
            By submitting, you request contact about this enquiry only. WhatsApp is optional, and you are not subscribing to marketing.
          </p>
        </fieldset>

        <button
          type="submit"
          aria-label={!form.contactPreference || form.contactPreference === 'phone' ? displayedSubmitLabel : form.classFormatPreference === 'one_to_one' && preferredFormat === 'one_to_one' ? submitAriaLabel : displayedSubmitLabel}
          disabled={isSubmitting}
          className={submitClassName}
          style={{
            background: `linear-gradient(90deg, ${SUN_ORANGE} 0%, #ff7a1a 55%, #ff6a00 100%)`,
          }}
        >
          {isSubmitting ? 'Saving your request...' : displayedSubmitLabel}
        </button>

        <div className="space-y-1 text-center">
          <p className={`text-xs ${NAVY_TEXT}`}>{displayedHelperText}</p>
          <p className="text-xs leading-4 text-slate-600">
            {form.contactPreference === 'phone'
              ? 'Your enquiry is saved for a phone callback. WhatsApp is not required.'
              : 'Your enquiry is saved before WhatsApp opens. We can contact you even if it does not work.'}
          </p>
          {secondaryHelperText && form.classFormatPreference === 'one_to_one' && form.contactPreference !== 'phone' ? (
            <p className="hidden text-xs text-slate-600 sm:block">{secondaryHelperText}</p>
          ) : null}
        </div>

        {submitError ? (
          <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            <p>{submitError}</p>
            <div className="flex flex-wrap gap-2">
              <a href={lastOpenedWaLink || waLink} target="_blank" rel="noopener noreferrer"
                onClick={() => trackWhatsappClick(source || 'public_assessment_form')}
                className="inline-flex items-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800">
                Send enquiry on WhatsApp
              </a>
              <a href={PHONE_URL}
                className="inline-flex items-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800">
                Call Tiny Steps
              </a>
            </div>
          </div>
        ) : null}

        {submitted ? (
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status" aria-live="polite">
            <p className="font-medium">
              Thank you! Tiny Steps has received your enquiry. You do not need to send a WhatsApp message for us to receive it.
            </p>
            <p>
              {form.contactPreference === 'phone'
                ? 'You requested a phone callback. We did not open WhatsApp; our team can follow up using your saved contact number.'
                : whatsappHandoffAttempted
                  ? 'We tried to open WhatsApp in a new tab. If you cannot log in or send a message, you can use the options below.'
                  : 'WhatsApp was not opened automatically. Your enquiry is saved; use the options below if you would like to contact us directly.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={lastOpenedWaLink || waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsappClick(source || 'public_assessment_form')}
                className="inline-flex items-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Open WhatsApp again
              </a>
              <a
                href={PHONE_URL}
                className="inline-flex items-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Call Tiny Steps
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
