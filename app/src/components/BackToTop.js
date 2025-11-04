import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function BackToTop() {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const onScroll = () => {
            setVisible(window.scrollY > 280);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    if (!visible)
        return null;
    return (_jsx("button", { type: "button", onClick: scrollToTop, className: "fixed bottom-6 right-6 z-[90] inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#0ea5e9] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-[#6366f1]/40 transition hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70", "aria-label": "Back to top", children: "\u2191 Back to top" }));
}
//# sourceMappingURL=BackToTop.js.map