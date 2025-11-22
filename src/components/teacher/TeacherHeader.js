import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Button } from '../ui/button';
import { Bell, Search, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
const TeacherHeader = () => {
    var _a;
    const { user } = useAuth();
    return (_jsxs("header", { className: "bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between", children: [_jsx("div", { className: "flex items-center space-x-4", children: _jsxs("h1", { className: "text-lg font-semibold text-gray-900", children: ["Welcome back, ", (user === null || user === void 0 ? void 0 : user.displayName) || 'Teacher'] }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Button, { variant: "ghost", size: "sm", children: _jsx(Search, { className: "w-4 h-4" }) }), _jsxs(Button, { variant: "ghost", size: "sm", className: "relative", children: [_jsx(Bell, { className: "w-4 h-4" }), _jsx("span", { className: "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center", children: "3" })] }), _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(Settings, { className: "w-4 h-4" }) }), _jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold", children: ((_a = user === null || user === void 0 ? void 0 : user.displayName) === null || _a === void 0 ? void 0 : _a.charAt(0)) || 'T' })] })] }));
};
export default TeacherHeader;
