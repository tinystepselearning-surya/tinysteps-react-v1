import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useState } from 'react';
import { trackEvent } from '../../lib/analytics';
import { useAuthStore } from '../../store/useAuthStore';
const ProgramLeadForm = ({ program }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [status, setStatus] = useState('idle');
    const { user } = useAuthStore();
    const handleSubmit = (e) => {
        e.preventDefault();
        const msg = encodeURIComponent(`Hi Tiny Steps! I am ${name}. I'd like details about ${program}.\nChild age: ${age}\nWhatsApp: ${whatsapp}`);
        if (!user) {
            window.open(`https://wa.me/919618398383?text=${msg}`, '_blank');
        }
        trackEvent('program_lead', { program, childAge: age });
        setName('');
        setAge('');
        setWhatsapp('');
        setStatus('success');
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-3", children: [_jsx("input", { className: "interactive-input", placeholder: "Parent name", value: name, onChange: (e) => setName(e.target.value), required: true }), _jsx("input", { className: "interactive-input", placeholder: "Child age", value: age, onChange: (e) => setAge(e.target.value), required: true }), _jsx("input", { className: "interactive-input", placeholder: "WhatsApp number", value: whatsapp, onChange: (e) => setWhatsapp(e.target.value), required: true }), !user && (_jsx("button", { className: "w-full rounded-2xl bg-gradient-to-r from-[#ff8f5c] via-[#ffb347] to-[#59c3ff] py-3 font-semibold text-white shadow", type: "submit", children: "WhatsApp me the plan" })), status === 'success' && (_jsx("p", { className: "text-xs text-tiny-green-600", children: user ? "Thanks! We'll reach out to you shortly." : 'Thanks! WhatsApp opened in a new tab.' }))] }));
};
export default ProgramLeadForm;
