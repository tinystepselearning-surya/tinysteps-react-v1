import { useState } from 'react';

type AdvisorContactFormProps = {
  topic?: string;
  compact?: boolean;
  title?: string;
  description?: string;
};

const initialValues = {
  name: '',
  email: '',
  message: '',
};

export default function AdvisorContactForm({
  topic = 'General inquiry',
  compact = false,
  title = 'Prefer email or a callback?',
  description = 'Share a few details and we will follow up by email.',
}: AdvisorContactFormProps) {
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof typeof initialValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setValues(initialValues);
  };

  return (
    <div className={`rounded-3xl border border-slate-200 bg-white/90 shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Contact Form</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Send message
        </button>
      </form>

      {submitted ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status" aria-live="polite">
          Thanks. We received your {topic.toLowerCase()} request and will reply by email.
        </div>
      ) : null}
    </div>
  );
}
