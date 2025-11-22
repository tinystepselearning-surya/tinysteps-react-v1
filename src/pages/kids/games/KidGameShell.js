import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
export default function KidGameShell({ childId, title, subtitle, highlight, children }) {
    const { user, isLoading } = useAuthStore();
    const navigate = useNavigate();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center text-sm text-gray-600", children: "Loading kid session\u2026" }));
    }
    const allowed = !!user &&
        !!childId &&
        (user.role === 'parent' || user.role === 'kid');
    if (!allowed) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center text-center", children: _jsxs("div", { className: "bg-white rounded-2xl shadow p-6 max-w-md space-y-3", children: [_jsx("p", { className: "text-lg font-semibold text-gray-900", children: "Access denied" }), _jsx("p", { className: "text-sm text-gray-600", children: "This game is only available when accessed from a logged-in parent account (or the child account directly)." }), _jsx("button", { className: "px-4 py-2 rounded-lg bg-indigo-600 text-white", onClick: () => navigate('/parent/login'), children: "Go to login" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white py-6", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-indigo-600 font-semibold", children: "Kids Portal \u00B7 Games" }), _jsx("h1", { className: "text-3xl font-bold text-gray-900", children: title }), subtitle && _jsx("p", { className: "text-sm text-gray-600", children: subtitle }), highlight && _jsx("p", { className: "text-xs text-emerald-700 font-semibold mt-1", children: highlight })] }), _jsx(Link, { to: "/parent", className: "text-sm text-indigo-700 hover:underline font-semibold", children: "\u2190 Back to Dashboard" })] }), children] }) }));
}
