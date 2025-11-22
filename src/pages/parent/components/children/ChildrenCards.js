import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
export const ChildrenCards = ({ childrenData, onSelectChild }) => {
    const [selectedId, setSelectedId] = useState(null);
    const handleSelect = (child) => {
        setSelectedId(child.id);
        onSelectChild(child);
    };
    if (!childrenData.length) {
        return (_jsx(Card, { className: "p-6 text-center", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "No children linked to your account yet." }) }));
    }
    return (_jsx("div", { className: "grid gap-4 md:grid-cols-2", children: childrenData.map((child) => {
            var _a, _b, _c, _d;
            return (_jsxs(Card, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: child.fullName }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Grade ", child.grade || 'N/A'] })] }), _jsx(Badge, { variant: child.status === 'on_break' ? 'secondary' : 'default', className: "capitalize", children: ((_a = child.status) === null || _a === void 0 ? void 0 : _a.replace('_', ' ')) || 'Active' })] }), _jsxs("div", { className: "text-sm text-muted-foreground space-y-1", children: [_jsxs("p", { children: ["Courses: ", (child.courses || []).join(', ') || '—'] }), _jsxs("p", { children: ["Phonics ", (_b = child.phonicsMastery) !== null && _b !== void 0 ? _b : 0, "% \u00B7 Grammar ", (_c = child.grammarMastery) !== null && _c !== void 0 ? _c : 0, "% \u00B7 Speaking ", (_d = child.speakingMastery) !== null && _d !== void 0 ? _d : 0, "%"] })] }), _jsx(Button, { variant: selectedId === child.id ? 'default' : 'secondary', className: "w-full", onClick: () => handleSelect(child), children: selectedId === child.id ? 'Viewing details' : 'View Details' })] }, child.id));
        }) }));
};
