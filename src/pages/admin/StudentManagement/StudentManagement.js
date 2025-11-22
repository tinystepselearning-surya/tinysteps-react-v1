import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// React default import removed
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import StudentBulkUploader from './StudentBulkUploader';
export default function StudentManagement() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Student Management" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(StudentBulkUploader, {}), _jsx(Button, { children: "Create New Student" })] })] }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "text-center text-gray-500", children: [_jsx("p", { children: "Student list will be displayed here" }), _jsx("p", { className: "text-sm mt-2", children: "Assign courses, view relationships, and manage enrollments" })] }) })] }));
}
