import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function NotFoundPage() {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: "404 - Page Not Found" }), _jsx("p", { className: "text-gray-600 mb-6", children: "This page doesn't exist." }), _jsx("button", { onClick: () => window.location.href = '/', className: "px-4 py-2 bg-blue-600 text-white rounded", children: "Go Home" })] }) }));
}
