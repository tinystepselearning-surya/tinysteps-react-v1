import { useRef, useState } from 'react';
import { PUBLIC_CONTACT_EMAIL } from '../../constants/publicContact';
import { buildLeadAttributionPayload, trackGenerateLead, trackLeadFormError, trackLeadFormStart, trackLeadFormSubmit } from '../../lib/conversionTracking';

type AdvisorContactFormProps = {
  topic?: string;
  compact?: boolean;
  title?: string;
  description?: string;
  surface?: 'card' | 'plain';
};

const initialValues = {
  name: '',
  email: '',
  phone: '',
  message: '',
};

export default function AdvisorContactForm({
  topic = 'General inquiry',
  compact = false,
  title = 'Prefer email or a callback?',
  description = 'Share a few details and we will follow up by email.',
  surface = 'card',
}: AdvisorContactFormProps) {
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedFormStartRef = useRef(false);

  const trackFormStartOnce = () => {
    if (hasTrackedFormStartRef.current) return;
    hasTrackedFormStartRef.current = true;
    trackLeadFormStart({
      form_name: 'advisor_contact_form',
      source_context: topic,
    });
  };

  const handleChange = (field: keyof typeof initialValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          topic,
          pagePath: typeof window !== 'undefined' ? window.location.pathname : '',
          submittedAt: new Date().toISOString(),
          ...buildLeadAttributionPayload(),
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to submit contact form');
      }

      const result = await response.json().catch(() => null);

      trackLeadFormSubmit({
        form_name: 'advisor_contact_form',
        source_context: topic,
      });
      trackGenerateLead({
        form_name: 'advisor_contact_form',
        source_context: topic,
        lead_channel: 'contact_form',
        lead_type: 'parent_inquiry',
        submission_id: typeof result?.submissionId === 'string' ? result.submissionId : undefined,
      });

      setSubmitted(true);
      setValues(initialValues);
    } catch {
      trackLeadFormError({
        form_name: 'advisor_contact_form',
        source_context: topic,
        error_message: 'network_submit_failed',
      });
      setError(`We could not send your message right now. Please email ${PUBLIC_CONTACT_EMAIL}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={
        surface === 'plain'
          ? ''
          : `rounded-3xl border border-slate-200 bg-white/90 shadow-sm ${compact ? 'p-4' : 'p-6'}`
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Contact Form</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} onFocusCapture={trackFormStartOnce} className="mt-4 space-y-3">
        <input
          type="text"
          value={values.name}
          onChange={(event) => handleChange('name', event.target.value)}
          placeholder="Parent name"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          required
        />
        <input
          type="email"
          value={values.email}
          onChange={(event) => handleChange('email', event.target.value)}
          placeholder="Email address"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          required
        />
        <input
          type="tel"
          value={values.phone}
          onChange={(event) => handleChange('phone', event.target.value)}
          placeholder="Phone or WhatsApp number"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          required
        />
        <textarea
          value={values.message}
          onChange={(event) => handleChange('message', event.target.value)}
          placeholder="Tell us what you need help with"
          rows={compact ? 3 : 4}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {isSubmitting ? 'Sending...' : 'Send message'}
        </button>
      </form>

      {submitted ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status" aria-live="polite">
          Thank you! We&apos;ll get back to you soon.
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
