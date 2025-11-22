import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
const TodaySessionsView = () => {
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Today's Sessions" }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Today's Schedule" }) }), _jsx(CardContent, { children: _jsx("p", { children: "Today's sessions will be displayed here." }) })] })] }));
};
export default TodaySessionsView;
