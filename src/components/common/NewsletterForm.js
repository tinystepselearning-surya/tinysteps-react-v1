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
// @ts-nocheck
import { useState } from 'react';
const endpoint = import.meta.env.VITE_NEWSLETTER_ENDPOINT || '';
const NewsletterForm = ({ compact = false }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const onSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        if (!email)
            return;
        setStatus('loading');
        setMessage('');
        try {
            if (endpoint) {
                const res = yield fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                if (!res.ok)
                    throw new Error('Subscribe failed');
            }
            else {
                const { getFunctions, httpsCallable } = yield import('firebase/functions');
                const { app } = yield import('../../lib/firebaseConfig');
                const functions = getFunctions(app);
                const subscribe = httpsCallable(functions, 'subscribeNewsletter');
                yield subscribe({ email });
            }
            setStatus('success');
            setMessage('Thanks! Please check your email to confirm.');
            setEmail('');
        }
        catch (err) {
            setStatus('error');
            setMessage('Could not subscribe. Please try again.');
        }
    });
    return (_jsxs("form", { onSubmit: onSubmit, className: `w-full ${compact ? 'flex gap-2' : ''}`, children: [_jsx("input", { className: "interactive-input", type: "email", placeholder: "Email address", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx("button", { className: "px-4 rounded-2xl bg-primary-600 text-white", disabled: status === 'loading', children: status === 'loading' ? 'Subscribing…' : 'Subscribe' }), message && _jsx("div", { className: "mt-2 text-xs text-gray-600", children: message })] }));
};
export default NewsletterForm;
