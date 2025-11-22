import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { trackEvent } from '../../lib/analytics';
const FloatingAssistant = () => {
    const { user } = useAuthStore();
    const [promptVisible, setPromptVisible] = useState(false);
    // Note: Do not return early before hooks; only check after all hooks declared
    useEffect(() => {
        const timer = setTimeout(() => setPromptVisible(true), 6000);
        return () => clearTimeout(timer);
    }, []);
    const openWhatsApp = (message = 'Hi Tiny Steps! I have a quick question.') => {
        trackEvent('floating_whatsapp_click', { source: 'floating_assistant' });
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/919618398383?text=${encoded}`, '_blank');
    };
    if (user)
        return null;
    return (_jsxs("div", { className: "fixed bottom-6 right-4 z-40 flex flex-col items-end gap-3", children: [promptVisible && (_jsx(motion.div, { className: "max-w-xs rounded-2xl border border-gray-100 bg-white/95 p-4 text-sm text-gray-800 shadow-xl", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "text-xl", children: "\uD83D\uDCAC" }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-gray-900", children: "Need help with admissions?" }), _jsx("p", { className: "text-xs text-gray-600", children: "I\u2019m your Tiny Steps advisor on WhatsApp. Ask anything\u2014schedules, pricing, curriculum." }), _jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx("button", { className: "rounded-full bg-gradient-to-r from-[#59c3ff] to-[#ff8f5c] px-3 py-1 text-xs font-semibold text-white", onClick: () => {
                                                openWhatsApp('Hi! I have a quick question about Tiny Steps admissions.');
                                                setPromptVisible(false);
                                            }, children: "Chat now" }), _jsx("button", { className: "text-xs text-gray-500", onClick: () => setPromptVisible(false), children: "Maybe later" })] })] })] }) })), _jsxs(motion.button, { className: "flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xl ring-1 ring-gray-100", whileHover: { y: -2 }, onClick: () => openWhatsApp('Hi Tiny Steps team! Can you help me choose a course?'), children: [_jsx("span", { className: "inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8f5c] to-[#59c3ff] text-white", children: "\uD83E\uDD16" }), "Ask TinySteps"] }), _jsx(motion.button, { className: "flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-2xl", whileHover: { scale: 1.05 }, onClick: () => openWhatsApp('Hi! I want to chat about Tiny Steps programs.'), children: "WhatsApp Advisor" })] }));
};
export default FloatingAssistant;
