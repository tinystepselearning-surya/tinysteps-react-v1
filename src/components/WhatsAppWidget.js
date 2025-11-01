import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export default function WhatsAppWidget() {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const dismissed = sessionStorage.getItem("waDismissed");
        if (!dismissed) {
            const t = setTimeout(() => setOpen(true), 3000);
            return () => clearTimeout(t);
        }
    }, []);
    return (_jsxs("div", { className: "fixed right-4 bottom-4 z-[70] flex flex-col items-end", children: [open && (_jsxs("div", { className: "mb-2 w-[min(86vw,320px)] rounded-xl bg-white shadow-xl border p-3", children: [_jsx("button", { className: "absolute right-2 top-1 text-gray-500 text-xl", "aria-label": "Close", onClick: () => {
                            setOpen(false);
                            sessionStorage.setItem("waDismissed", "1");
                        }, children: "\u00D7" }), _jsxs("p", { className: "text-sm", children: [_jsx("strong", { children: "\uD83D\uDC4B Welcome to TinySteps!" }), _jsx("br", {}), "Need help choosing a course or booking a free trial? We reply fastest on WhatsApp (9am\u20139pm)."] }), _jsx("a", { href: "https://wa.me/919666095553", target: "_blank", rel: "noreferrer", className: "mt-2 inline-flex w-full justify-center rounded-xl px-3 py-2 font-extrabold text-white", style: { backgroundImage: "linear-gradient(135deg,#25D366,#128C7E)" }, children: "Chat on WhatsApp" })] })), _jsx("button", { onClick: () => setOpen((v) => !v), "aria-label": "Open WhatsApp Chat", className: "h-14 w-14 rounded-full shadow-xl text-white text-xl", style: { backgroundImage: "linear-gradient(135deg,#25D366,#128C7E)" }, children: "\uD83D\uDCAC" })] }));
}
//# sourceMappingURL=WhatsAppWidget.js.map