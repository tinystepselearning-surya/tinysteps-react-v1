import { useState, type FormEvent } from 'react';
import { submitPublicTestimonial } from '../../lib/testimonials';

type TestimonialSubmissionFormProps = {
  pageTag: string;
  title?: string;
  description?: string;
  defaultCourseTag?: string;
  compact?: boolean;
};

type FormState = {
  parentName: string;
  childName: string;
  childAge: string;
  city: string;
  reviewText: string;
  rating: string;
  courseTag: string;
  consentToPublish: boolean;
};

const INITIAL_FORM: FormState = {
  parentName: '',
  childName: '',
  childAge: '',
  city: '',
  reviewText: '',
  rating: '',
  courseTag: '',
  consentToPublish: false,
};

const PROGRAM_OPTIONS = [
  { value: 'phonics', label: 'Phonics' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'speaking', label: 'Public Speaking' },
];

const RATING_OPTIONS = ['1', '2', '3', '4', '5'];

export default function TestimonialSubmissionForm({
  pageTag,
  title = "Share your child's Tiny Steps experience",
  description = 'Your feedback helps other parents understand what classes feel like. Every submission is reviewed before publishing.',
  defaultCourseTag,
  compact = false,
}: TestimonialSubmissionFormProps) {
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL_FORM,
    courseTag: defaultCourseTag || '',
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setSingleSelectField = (field: 'courseTag' | 'rating', value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'courseTag' && prev[field] === value ? '' : value,
    }));
  };

  const validate = (): string | null => {
    if (form.parentName.trim().length < 2) return 'Please enter a valid parent name.';
    if (!form.rating.trim()) return 'Please select a star rating.';
    if (!form.consentToPublish) return 'Please provide consent before submitting.';
    if (form.childAge.trim()) {
      const age = Number(form.childAge);
      if (!Number.isFinite(age) || age < 2 || age > 18) return 'Child age should be between 2 and 18.';
    }
    const rating = Number(form.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return 'Rating must be between 1 and 5.';
    return null;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPublicTestimonial({
        parentName: form.parentName,
        childName: form.childName,
        childAge: form.childAge ? Number(form.childAge) : undefined,
        city: form.city,
        reviewText: form.reviewText,
        rating: Number(form.rating),
        courseTag: form.courseTag || defaultCourseTag,
        pageTag,
        consentToPublish: form.consentToPublish,
      });

      setForm({
        ...INITIAL_FORM,
        courseTag: defaultCourseTag || '',
      });
      setSuccess('Thank you for sharing. Your review has been submitted for moderation.');
    } catch (submitError) {
      console.error('[TestimonialSubmissionForm] submission failed', submitError);
      setError('We could not submit your review right now. Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={compact ? 'px-4 py-4' : 'px-6 py-8'}>
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Share Feedback</p>
        <h3 className="mt-1.5 text-2xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-600">{description}</p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.parentName}
              onChange={(e) => setField('parentName', e.target.value)}
              placeholder="Parent name *"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              required
            />
            <input
              type="text"
              value={form.childName}
              onChange={(e) => setField('childName', e.target.value)}
              placeholder="Child name (optional)"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
            <input
              type="number"
              min={2}
              max={18}
              value={form.childAge}
              onChange={(e) => setField('childAge', e.target.value)}
              placeholder="Child age (optional)"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
            <input
              type="text"
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="City (optional)"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Program (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {PROGRAM_OPTIONS.map((option) => {
                    const isSelected = form.courseTag === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSingleSelectField('courseTag', option.value)}
                        aria-pressed={isSelected}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rating *</p>
                <div className="flex items-center gap-1">
                  {RATING_OPTIONS.map((value) => {
                    const ratingNumber = Number(value);
                    const selectedRating = Number(form.rating) || 0;
                    const isFilled = ratingNumber <= selectedRating;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSingleSelectField('rating', value)}
                        aria-pressed={form.rating === value}
                        aria-label={`Rate ${ratingNumber} star${ratingNumber > 1 ? 's' : ''}`}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          isFilled
                            ? 'border-amber-300 bg-amber-50 text-amber-500'
                            : 'border-slate-200 bg-white text-slate-300 hover:border-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <span className="text-lg leading-none">★</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <textarea
            value={form.reviewText}
            onChange={(e) => setField('reviewText', e.target.value)}
            rows={compact ? 4 : 5}
            placeholder="Share your experience (optional)"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.consentToPublish}
              onChange={(e) => setField('consentToPublish', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              required
            />
            <span>I allow Tiny Steps to publish this review if approved.</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit review for approval'}
          </button>
        </form>

        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status" aria-live="polite">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
