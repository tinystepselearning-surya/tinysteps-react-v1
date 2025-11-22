import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
export const ChildDetail = ({ child }) => {
    var _a, _b, _c;
    if (!child) {
        return (_jsx(Card, { className: "p-6 text-muted-foreground text-sm", children: "Select a child to see more information." }));
    }
    return (_jsxs(Card, { className: "p-6 space-y-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: child.fullName }), _jsxs("div", { className: "text-sm text-muted-foreground space-y-1", children: [_jsxs("p", { children: ["Grade: ", child.grade || 'N/A'] }), _jsxs("p", { children: ["Status: ", child.status || 'active'] }), _jsxs("p", { children: ["Courses: ", (child.courses || []).join(', ') || '—'] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Phonics" }), _jsxs("p", { className: "text-2xl font-semibold", children: [(_a = child.phonicsMastery) !== null && _a !== void 0 ? _a : 0, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Grammar" }), _jsxs("p", { className: "text-2xl font-semibold", children: [(_b = child.grammarMastery) !== null && _b !== void 0 ? _b : 0, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Speaking" }), _jsxs("p", { className: "text-2xl font-semibold", children: [(_c = child.speakingMastery) !== null && _c !== void 0 ? _c : 0, "%"] })] })] })] }));
};
