import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
const ProgressReports = () => {
    var _a;
    const [selectedChild, setSelectedChild] = React.useState('');
    const [reportType, setReportType] = React.useState('monthly');
    // Do not ship demo child names; default to an empty list. Data should come from backend hooks.
    const children = [];
    const handleDownload = (type) => {
        // Implement PDF generation and download
        console.log(`Downloading ${type} report for child ${selectedChild}`);
    };
    const handleEmail = (type) => {
        // Implement email sending
        console.log(`Emailing ${type} report for child ${selectedChild}`);
    };
    const handlePrint = (type) => {
        // Implement print
        console.log(`Printing ${type} report for child ${selectedChild}`);
    };
    return (_jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Progress Reports & Downloads" }), _jsx(Card, { className: "mb-4", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex gap-4", children: [_jsxs(Select, { value: selectedChild, onValueChange: setSelectedChild, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select Child" }) }), _jsx(SelectContent, { children: children.map(child => (_jsx(SelectItem, { value: child.id, children: child.name }, child.id))) })] }), _jsxs(Select, { value: reportType, onValueChange: setReportType, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Report Type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "monthly", children: "Monthly Progress Report" }), _jsx(SelectItem, { value: "quarterly", children: "Quarterly Report" }), _jsx(SelectItem, { value: "annual", children: "Annual Report" })] })] })] }) }) }), _jsxs(Card, { className: "mb-4", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Report Preview" }) }), _jsxs(CardContent, { children: [_jsxs("p", { children: ["Child: ", ((_a = children.find(c => c.id === selectedChild)) === null || _a === void 0 ? void 0 : _a.name) || 'Select a child'] }), _jsxs("p", { children: ["Type: ", reportType.charAt(0).toUpperCase() + reportType.slice(1), " Report"] }), _jsxs("p", { children: ["Period: ", new Date().toLocaleDateString()] }), _jsx("p", { children: "Sessions: \u2014" }), _jsx("p", { children: "Attendance: \u2014" }), _jsx("p", { children: "Average Mastery: \u2014" }), _jsx("p", { children: "Per-area breakdown: \u2014" }), _jsx("p", { children: "Topics Mastered: \u2014" }), _jsx("p", { children: "Teacher Comments: \u2014" })] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx(Button, { onClick: () => handleDownload(reportType), children: "Download PDF" }), _jsx(Button, { variant: "outline", onClick: () => handleEmail(reportType), children: "Email to Parents" }), _jsx(Button, { variant: "outline", onClick: () => handlePrint(reportType), children: "Print" })] })] }));
};
export default ProgressReports;
