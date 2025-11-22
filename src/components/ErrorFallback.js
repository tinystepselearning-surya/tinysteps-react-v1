import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@components/ui/button';
export function ErrorFallback() {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Something went wrong" }), _jsx("p", { className: "text-gray-600 mb-6", children: "We've been notified and will fix it soon." }), _jsx(Button, { onClick: () => window.location.reload(), children: "Reload Page" })] }) }));
}
