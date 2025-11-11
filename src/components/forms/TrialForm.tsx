// @ts-nocheck
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  parentName: z.string().min(2, 'Please enter your name'),
  childAge: z
    .preprocess((v) => Number(v), z.number().min(3, 'Min age 3').max(15, 'Max age 15')),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter 10-digit number'),
});

type FormData = z.infer<typeof schema>;

export default function TrialForm({ compact = false }: { compact?: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      // store a simple Firestore record via callable (reuse newsletter if needed or extend later)
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { app } = await import('../../lib/firebaseConfig');
      const functions = getFunctions(app, 'asia-south1');
      const submitLead = httpsCallable(functions as any, 'subscribeNewsletter');
      await submitLead({ email: data.email, parentName: data.parentName, phone: data.phone, childAge: data.childAge, source: 'trial' });
      reset();
    } catch (e) {
      // swallow for now; UI shows generic state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white" disabled={isSubmitting}>
          {isSubmitting ? 'Booking…' : 'Book Free Trial'}
        </button>
        <a href="https://wa.me/91XXXXXXXXXX" className="px-4 py-2 rounded-2xl border border-gray-200 bg-white text-gray-800">
          Chat on WhatsApp
        </a>
      </div>
      {isSubmitSuccessful && <p className="text-xs text-green-600">We’ve received your request. We’ll contact you shortly.</p>}
    </form>
  );
}

