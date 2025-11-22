import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
export default function TestComponent() {
    return (_jsxs(Card, { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Tiny Steps Learning" }), _jsx(Button, { children: "Test Button" })] }));
}
