// @ts-nocheck
import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trackEvent } from '../../lib/analytics';
import { trackLeadFormStart, trackLeadFormSubmit, trackWhatsappClick } from '../../lib/conversionTracking';
import { useAuthStore } from '../../store/useAuthStore';

const schema = z.object({
  parentName: z.string().min(2, 'Please enter your name'),
  childAge: z
    .preprocess((v) => Number(v), z.number().min(3, 'Min age 3').max(15, 'Max age 15')),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter 10-digit number'),
});

type FormData = z.infer<typeof schema>;

export default function TrialForm({ compact = false, context = 'trial_form' }: { compact?: boolean; context?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const { user } = useAuthStore();
  const hasTrackedFormStartRef = useRef(false);

  const trackFormStartOnce = () => {
    if (hasTrackedFormStartRef.current) return;
    hasTrackedFormStartRef.current = true;
    trackLeadFormStart({
      form_name: 'trial_form',
      source_context: context,
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      // store a simple Firestore record via callable (reuse newsletter if needed or extend later)
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { app } = await import('../../lib/firebaseConfig');
      const functions = getFunctions(app, 'asia-south1');
      const submitLead = httpsCallable(functions as any, 'subscribeNewsletter');
      await submitLead({ email: data.email, parentName: data.parentName, phone: data.phone, childAge: data.childAge, source: 'trial' });
      trackEvent('trial_form_submit', { context, childAge: data.childAge });
      trackLeadFormSubmit({
        form_name: 'trial_form',
        source_context: context,
      });
      reset();
    } catch (e) {
      // swallow for now; UI shows generic state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} onFocusCapture={trackFormStartOnce} className="space-y-3">
      <div>
        <input className="interactive-input" placeholder="Parent name" {...register('parentName')} />
        {errors.parentName && <p className="mt-1 text-xs text-red-600">{errors.parentName.message as any}</p>}
      </div>
      <div>
        <input className="interactive-input" type="number" placeholder="Child age (3–15)" {...register('childAge')} />
        {errors.childAge && <p className="mt-1 text-xs text-red-600">{errors.childAge.message as any}</p>}
      </div>
      <div>
        <input className="interactive-input" type="email" placeholder="Email" {...register('email')} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message as any}</p>}
      </div>
      <div>
        <input className="interactive-input" type="tel" placeholder="Phone" {...register('phone')} />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message as any}</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button aria-label="Book Free Assessment Class" className="w-full rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-3 text-sm font-semibold text-white sm:flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Booking…' : 'Book Free Assessment Class'}
        </button>
  {!user && (
          <a
            href="https://wa.me/919618398383"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsappClick('trial_form')}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-800 sm:flex-1"
          >
            Chat on WhatsApp - opens new window
          </a>
        )}
      </div>
      {isSubmitSuccessful && <p className="text-xs text-green-600">We’ve received your request. We’ll contact you by email shortly.</p>}
    </form>
  );
}
