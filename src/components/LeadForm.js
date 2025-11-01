import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
export default function LeadForm() {
    const nameRef = useRef(null);
    const ageRef = useRef(null);
    const emailRef = useRef(null);
    const phoneRef = useRef(null);
    const [msg, setMsg] = useState("");
    const sectionRef = useScrollReveal({ variant: "up" });
    const formDelay = { "--reveal-child-delay": "140ms" };
    function onSubmit(e) {
        e.preventDefault();
        const name = nameRef.current?.value.trim() || "";
        const age = ageRef.current?.value.trim() || "";
        const email = emailRef.current?.value.trim() || "";
        const phone = phoneRef.current?.value.trim() || "";
        if (!name || !age || !email || !phone) {
            setMsg("Please fill all the fields.");
            return;
        }
        setMsg("Opening WhatsApp…");
        const enc = encodeURIComponent;
        const text = [
            "Hello TinySteps!",
            "I’d like to book a free trial.",
            "",
            `Parent: ${name}`,
            `Child Age: ${age}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
        ]
            .map(enc)
            .join("%0A");
        const url = `https://wa.me/919666095553?text=${text}`;
        const popup = window.open(url, "_blank", "noopener");
        if (!popup) {
            window.location.href = url;
        }
        setMsg("Thanks! We opened WhatsApp with your details.");
        e.target.reset();
    }
    return (_jsxs("section", { ref: sectionRef, id: "book-trial", className: "relative py-20", children: [_jsx("div", { "aria-hidden": true, className: "absolute inset-0 bg-gradient-to-br from-[#fff4ec] via-white to-[#e8f9f0]/70" }), _jsxs("div", { className: "relative mx-auto max-w-6xl px-4", children: [_jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [_jsx("p", { "data-reveal-child": true, className: "text-sm font-semibold uppercase tracking-[0.2em] text-[#ff7a45]", children: "Book a Free Trial" }), _jsx("h2", { "data-reveal-child": true, style: { "--reveal-child-delay": "60ms" }, className: "mt-2 text-3xl md:text-4xl font-extrabold text-gray-900", children: "See your child light up in their very first Tiny Steps session" }), _jsx("p", { "data-reveal-child": true, style: { "--reveal-child-delay": "120ms" }, className: "mt-3 text-gray-600 text-lg", children: "Share a few details and we\u2019ll connect you with a Learning Manager, schedule a personalised class, and send a readiness guide straight to your inbox." })] }), _jsxs("div", { className: "mt-12 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]", children: [_jsxs("form", { onSubmit: onSubmit, "data-reveal-child": true, style: formDelay, className: "relative grid gap-4 rounded-3xl bg-white p-6 sm:p-8 shadow-2xl shadow-[#ff8a4c]/10 ring-1 ring-white/70", children: [_jsx("span", { className: "absolute -top-10 left-6 hidden h-20 w-20 rounded-full bg-[#ffefe6] blur-2xl sm:block", "aria-hidden": true }), _jsxs("label", { className: "text-left", children: [_jsx("span", { className: "mb-1 block text-sm font-semibold text-gray-700", children: "Parent Name" }), _jsx("input", { ref: nameRef, type: "text", placeholder: "Priya Sharma", className: "w-full rounded-xl border border-gray-200 px-3 py-2 text-base shadow-sm focus:border-[#e05c0a] focus:outline-none focus:ring-2 focus:ring-[#ffb37a]/60" })] }), _jsxs("label", { className: "text-left", children: [_jsx("span", { className: "mb-1 block text-sm font-semibold text-gray-700", children: "Child\u2019s Age" }), _jsx("input", { ref: ageRef, type: "text", placeholder: "6 years", className: "w-full rounded-xl border border-gray-200 px-3 py-2 text-base shadow-sm focus:border-[#e05c0a] focus:outline-none focus:ring-2 focus:ring-[#ffb37a]/60" })] }), _jsxs("label", { className: "text-left", children: [_jsx("span", { className: "mb-1 block text-sm font-semibold text-gray-700", children: "Email" }), _jsx("input", { ref: emailRef, type: "email", placeholder: "you@example.com", className: "w-full rounded-xl border border-gray-200 px-3 py-2 text-base shadow-sm focus:border-[#e05c0a] focus:outline-none focus:ring-2 focus:ring-[#ffb37a]/60" })] }), _jsxs("label", { className: "text-left", children: [_jsx("span", { className: "mb-1 block text-sm font-semibold text-gray-700", children: "Phone Number" }), _jsx("input", { ref: phoneRef, type: "tel", placeholder: "+91 98765 43210", className: "w-full rounded-xl border border-gray-200 px-3 py-2 text-base shadow-sm focus:border-[#e05c0a] focus:outline-none focus:ring-2 focus:ring-[#ffb37a]/60" })] }), _jsx("button", { type: "submit", className: "mt-2 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white shadow-lg shadow-[#ff8a4c]/40 transition hover:-translate-y-0.5", style: { backgroundImage: "linear-gradient(135deg,#ff751f,#e05c0a)" }, children: "Book my free class" }), _jsx("p", { className: "text-sm text-gray-500", "aria-live": "polite", children: msg || "We’ll reach out on WhatsApp within 24 hours." })] }), _jsxs("div", { className: "relative rounded-3xl border border-white/70 bg-white/80 p-6 sm:p-8 shadow-xl shadow-gray-200/60 backdrop-blur", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "rounded-full bg-[#ffefe6] p-3 text-[#e05c0a] shadow-inner", children: _jsx("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", children: _jsx("path", { d: "M5 12.5L9 16.5L19 6.5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-extrabold text-gray-900", children: "What happens next?" }), _jsxs("ul", { className: "mt-3 space-y-3 text-sm text-gray-600", children: [_jsx("li", { children: "\u2022 A Tiny Steps Learning Manager calls to learn about your child\u2019s goals." }), _jsx("li", { children: "\u2022 We schedule a trial slot with a specialist teacher within 48 hours." }), _jsx("li", { children: "\u2022 You receive a personalised prep kit and a follow-up progress summary." })] })] })] }), _jsx("div", { className: "mt-6 rounded-2xl bg-[#fff4ec] p-4 text-left text-sm text-[#e05c0a]", children: "\u201CEvery trial is tailored. Expect a joyful session, actionable feedback, and a roadmap you can trust.\u201D" })] })] })] })] }));
}
//# sourceMappingURL=LeadForm.js.map