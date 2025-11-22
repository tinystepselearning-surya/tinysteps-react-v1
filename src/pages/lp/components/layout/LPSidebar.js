import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
const MENU_ITEMS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'parents', label: 'Parents', icon: '👨‍👩‍👧‍👦' },
    { id: 'teachers', label: 'Teachers', icon: '👩‍🏫' },
    { id: 'tickets', label: 'Support Tickets', icon: '🎫' },
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'region', label: 'Regional Data', icon: '🌍' },
];
export const LPSidebar = ({ active, onSelect }) => {
    return (_jsx("aside", { className: "w-64 hidden lg:block", children: _jsx(Card, { className: "p-4", children: _jsx("nav", { className: "space-y-2", children: MENU_ITEMS.map((item) => (_jsxs(Button, { variant: active === item.id ? 'default' : 'ghost', className: "w-full justify-start", onClick: () => onSelect(item.id), children: [_jsx("span", { className: "mr-2", children: item.icon }), item.label] }, item.id))) }) }) }));
};
