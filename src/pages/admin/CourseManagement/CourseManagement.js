import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// no React import needed in new JSX runtime
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import CourseList from './CourseList';
export default function CourseManagement() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Course Management" }), _jsx(Button, { children: "Create New Course" })] }), _jsx(Card, { className: "p-6", children: _jsx(CourseList, {}) })] }));
}
