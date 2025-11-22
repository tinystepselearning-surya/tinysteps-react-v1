import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
const NotificationsPanel = () => {
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Notifications" }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Notifications" }) }), _jsx(CardContent, { children: _jsx("p", { children: "Notifications will be displayed here." }) })] })] }));
};
export default NotificationsPanel;
