var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trackEvent } from '../../lib/analytics';
import { useAuthStore } from '../../store/useAuthStore';
const schema = z.object({
    parentName: z.string().min(2, 'Please enter your name'),
    childAge: z
        .preprocess((v) => Number(v), z.number().min(3, 'Min age 3').max(15, 'Max age 15')),
    email: z.string().email('Enter a valid email'),
    phone: z.string().min(10, 'Enter 10-digit number'),
});
export default function TrialForm({ compact = false, context = 'trial_form' }) {
    const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful }, reset, } = useForm({ resolver: zodResolver(schema) });
    const { user } = useAuthStore();
    const onSubmit = (data) => __awaiter(this, void 0, void 0, function* () {
        try {
            // store a simple Firestore record via callable (reuse newsletter if needed or extend later)
            const { getFunctions, httpsCallable } = yield import('firebase/functions');
            const { app } = yield import('../../lib/firebaseConfig');
            const functions = getFunctions(app, 'asia-south1');
            const submitLead = httpsCallable(functions, 'subscribeNewsletter');
            yield submitLead({ email: data.email, parentName: data.parentName, phone: data.phone, childAge: data.childAge, source: 'trial' });
            trackEvent('trial_form_submit', { context, childAge: data.childAge });
            const message = encodeURIComponent(`Hi Tiny Steps! I'm ${data.parentName}.\nChild age: ${data.childAge} \nPhone: ${data.phone} \nEmail: ${data.email} \nI'd like to book a free trial.`);
            if (!user) {
                window.open(`https://wa.me/919618398383?text=${message}`, '_blank');
            }
            reset();
        }
        catch (e) {
            // swallow for now; UI shows generic state
        }
    });
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-3", children: [_jsxs("div", { children: [_jsx("input", Object.assign({ className: "interactive-input", placeholder: "Parent name" }, register('parentName'))), errors.parentName && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.parentName.message })] }), _jsxs("div", { children: [_jsx("input", Object.assign({ className: "interactive-input", type: "number", placeholder: "Child age (3\u201315)" }, register('childAge'))), errors.childAge && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.childAge.message })] }), _jsxs("div", { children: [_jsx("input", Object.assign({ className: "interactive-input", type: "email", placeholder: "Email" }, register('email'))), errors.email && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.email.message })] }), _jsxs("div", { children: [_jsx("input", Object.assign({ className: "interactive-input", type: "tel", placeholder: "Phone" }, register('phone'))), errors.phone && _jsx("p", { className: "mt-1 text-xs text-red-600", children: errors.phone.message })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [_jsx("button", { className: "w-full rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-3 text-sm font-semibold text-white sm:flex-1", disabled: isSubmitting, children: isSubmitting ? 'Booking…' : 'Book Free Trial' }), !user && (_jsx("a", { href: "https://wa.me/919618398383", className: "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-800 sm:flex-1", children: "Chat on WhatsApp" }))] }), isSubmitSuccessful && _jsx("p", { className: "text-xs text-green-600", children: "We\u2019ve received your request. We\u2019ll contact you shortly." })] }));
}
