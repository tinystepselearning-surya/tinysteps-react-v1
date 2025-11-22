import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useMemo, useState } from 'react';
export default function FAQAccordion({ items }) {
    const [expanded, setExpanded] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const filtered = useMemo(() => selectedCategory === 'all' ? items : items.filter(i => i.category === selectedCategory), [items, selectedCategory]);
    const categories = [
        { key: 'all', label: 'All' },
        { key: 'phonics', label: 'Phonics' },
        { key: 'grammar', label: 'Grammar' },
        { key: 'speaking', label: 'Public Speaking' },
        { key: 'online', label: 'Online' },
        { key: 'general', label: 'General' },
    ];
    return (_jsxs("div", { children: [_jsx("div", { className: "mb-4 flex flex-wrap gap-2", children: categories.map((cat) => (_jsx("button", { onClick: () => setSelectedCategory(cat.key), className: `rounded-full px-3 py-1 text-sm ${selectedCategory === cat.key ? 'bg-primary-500 text-white' : 'bg-slate-100'}`, children: cat.label }, cat.key))) }), _jsx("div", { className: "divide-y rounded-2xl bg-white shadow ring-1 ring-slate-200", children: filtered.map((item) => (_jsxs("div", { className: "p-4", children: [_jsxs("button", { onClick: () => setExpanded(expanded === item.id ? null : item.id), className: "flex w-full items-center justify-between text-left", children: [_jsx("span", { className: "font-medium text-gray-900", children: item.question }), _jsx("span", { className: `transition-transform ${expanded === item.id ? 'rotate-180' : ''}`, children: "\u25BC" })] }), expanded === item.id && (_jsxs("div", { className: "mt-3 text-sm text-gray-700", children: [_jsx("p", { children: item.answer }), _jsxs("div", { className: "mt-2 flex items-center gap-3", children: [item.relatedBlog && (_jsx("a", { className: "interactive-link text-primary-600", href: item.relatedBlog, children: "Read full article \u2192" })), item.relatedCourse && (_jsx("a", { className: "interactive-link text-primary-600", href: item.relatedCourse, children: "Explore course \u2192" }))] }), _jsxs("div", { className: "mt-3 flex items-center gap-2 text-xs text-gray-500", children: [_jsx("span", { children: "Was this helpful?" }), _jsx("button", { className: "rounded-full border px-2 py-0.5", children: "Yes" }), _jsx("button", { className: "rounded-full border px-2 py-0.5", children: "No" })] })] }))] }, item.id))) }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx("button", { onClick: () => setExpanded('*'), className: "rounded-full border px-3 py-1 text-sm", children: "Expand All" }), _jsx("button", { onClick: () => setExpanded(null), className: "rounded-full border px-3 py-1 text-sm", children: "Collapse All" })] })] }));
}
