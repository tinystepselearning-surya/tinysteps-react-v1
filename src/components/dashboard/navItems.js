import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const iconClass = "h-5 w-5";
const calendarIcon = (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", className: iconClass, children: [_jsx("rect", { x: "3.5", y: "4.5", width: "17", height: "16", rx: "2.4" }), _jsx("path", { d: "M7 2.8v3.4" }), _jsx("path", { d: "M17 2.8v3.4" }), _jsx("path", { d: "M3.5 10h17" })] }));
const usersIcon = (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", className: iconClass, children: [_jsx("circle", { cx: "8", cy: "8.5", r: "3.2" }), _jsx("circle", { cx: "16.5", cy: "7.2", r: "2.8" }), _jsx("path", { d: "M3.1 19.3c.4-3.2 2.4-5.2 4.9-5.2s4.5 2 4.9 5.1" }), _jsx("path", { d: "M14.2 19.4c.3-2.5 1.8-4 3.6-4s3 1.5 3.3 3.7" })] }));
const bookIcon = (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", className: iconClass, children: [_jsx("path", { d: "M4 4.8a2.3 2.3 0 0 1 2.3-2.3h11.4A2.3 2.3 0 0 1 20 4.8v14.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" }), _jsx("path", { d: "M8 2.5v18.7" })] }));
const clipboardIcon = (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", className: iconClass, children: [_jsx("rect", { x: "5", y: "3.8", width: "14", height: "17", rx: "2.4" }), _jsx("path", { d: "M9 2.5h6" }), _jsx("path", { d: "M9 8.4h6" }), _jsx("path", { d: "M9 12.4h6" }), _jsx("path", { d: "M9 16.4h4" })] }));
const reportIcon = (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", className: iconClass, children: [_jsx("rect", { x: "3.5", y: "3.5", width: "17", height: "17", rx: "2.4" }), _jsx("path", { d: "M8 16.5h8" }), _jsx("path", { d: "M8 12h5" }), _jsx("path", { d: "M8 7.5h3" })] }));
const walletIcon = (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", className: iconClass, children: [_jsx("rect", { x: "3.5", y: "5", width: "17", height: "14", rx: "3" }), _jsx("path", { d: "M17.5 11.5h1.2" })] }));
const helpIcon = (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", className: iconClass, children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M9.4 9.5a2.6 2.6 0 1 1 4.6 1.9c-.6.6-1.2.9-1.4 1.6-.1.3-.1.5-.1.9" }), _jsx("circle", { cx: "12", cy: "17", r: ".6", fill: "currentColor" })] }));
export const DASHBOARD_NAV_ITEMS = [
    { key: "classes", label: "Teacher view", icon: calendarIcon, href: "/roles/teacher" },
    { key: "groups", label: "Learning managers", icon: usersIcon, href: "/roles/rm" },
    { key: "parents", label: "Parents", icon: reportIcon, href: "/parents" },
    { key: "kids", label: "Kids arena", icon: bookIcon, href: "/roles/kids" },
    { key: "homework", label: "Homework", icon: clipboardIcon, badge: "7" },
    { key: "payouts", label: "Payouts", icon: walletIcon },
    { key: "faqs", label: "FAQs", icon: helpIcon },
];
export function buildNavItems(activeKey, options) {
    const { overrides, includeKeys } = options ?? {};
    return DASHBOARD_NAV_ITEMS.filter((item) => {
        if (!includeKeys)
            return true;
        return includeKeys.includes(item.key);
    }).map((item) => {
        const patch = overrides?.[item.key] ?? {};
        return {
            ...item,
            ...patch,
            active: item.key === activeKey,
        };
    });
}
//# sourceMappingURL=navItems.js.map