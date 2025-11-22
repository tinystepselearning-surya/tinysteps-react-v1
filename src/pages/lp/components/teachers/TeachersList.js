import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
export const TeachersList = ({ lpId }) => {
    // Mock data - in real implementation, fetch from Firestore
    const teachers = [
        {
            id: '1',
            name: 'Ms. Anjali Verma',
            email: 'anjali@example.com',
            phone: '+91 98765 43212',
            subjects: ['Phonics', 'Grammar'],
            totalStudents: 15,
            sessionsThisMonth: 45,
            averageRating: 4.8,
            status: 'active',
        },
        {
            id: '2',
            name: 'Mr. Ramesh Singh',
            email: 'ramesh@example.com',
            phone: '+91 98765 43213',
            subjects: ['Speaking', 'Grammar'],
            totalStudents: 12,
            sessionsThisMonth: 38,
            averageRating: 4.6,
            status: 'active',
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Assigned Teachers" }), _jsx(Button, { children: "Add Teacher" })] }), _jsx("div", { className: "grid gap-4", children: teachers.map((teacher) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h3", { className: "text-lg font-semibold", children: teacher.name }), _jsx(Badge, { variant: teacher.status === 'active' ? 'default' : 'secondary', children: teacher.status })] }), _jsx("p", { className: "text-muted-foreground", children: teacher.email }), _jsx("p", { className: "text-muted-foreground", children: teacher.phone }), _jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("span", { children: ["Subjects: ", teacher.subjects.join(', ')] }), _jsxs("span", { children: [teacher.totalStudents, " students"] })] }), _jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("span", { children: [teacher.sessionsThisMonth, " sessions this month"] }), _jsxs("span", { children: ["\u2B50 ", teacher.averageRating, "/5"] })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", children: "View Details" }), _jsx(Button, { variant: "outline", size: "sm", children: "Schedule" }), _jsx(Button, { variant: "outline", size: "sm", children: "Contact" })] })] }) }, teacher.id))) })] }));
};
export default TeachersList;
