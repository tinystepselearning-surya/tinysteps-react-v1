import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
const CourseTopbar = ({ title, subtitle }) => {
    return (_jsx("div", { className: "bg-white border-b border-gray-200 py-4", children: _jsxs("div", { className: "container mx-auto px-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("nav", { className: "text-sm text-gray-600", children: [_jsx(Link, { to: "/", className: "hover:underline", children: "Home" }), _jsx("span", { className: "mx-2", children: "/" }), _jsx("span", { className: "font-semibold text-gray-900", children: title })] }), subtitle && _jsx("p", { className: "text-sm text-gray-600 mt-1", children: subtitle })] }), _jsx("div", { children: _jsx(Link, { to: "#book-trial", className: "inline-block px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm", children: "Book a Trial" }) })] }) }));
};
export default CourseTopbar;
