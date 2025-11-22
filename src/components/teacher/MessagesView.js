import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
const MessagesView = () => {
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Messages" }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Inbox" }) }), _jsx(CardContent, { children: _jsx("p", { children: "Messages will be displayed here." }) })] })] }));
};
export default MessagesView;
