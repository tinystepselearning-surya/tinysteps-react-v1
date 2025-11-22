var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Card } from '@components/ui/card';
import { toast } from '@components/hooks/use-toast';
import * as Papa from 'papaparse';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
function parseCSV(csv) {
    const parsed = Papa.parse(csv, { skipEmptyLines: true });
    const rows = parsed.data;
    return rows.map(r => r.map(c => c === null || c === void 0 ? void 0 : c.toString().trim()));
}
export default function StudentBulkUploader() {
    const [open, setOpen] = useState(false);
    const [csvContent, setCsvContent] = useState('');
    const [headers, setHeaders] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const [mapping, setMapping] = useState({});
    const [isValidating, setIsValidating] = useState(false);
    const [validationResults, setValidationResults] = useState([]);
    const [jobId, setJobId] = useState(null);
    const [parseErrors, setParseErrors] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const onFileSelected = (e) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const f = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!f)
            return;
        const text = yield f.text();
        setCsvContent(text);
        const parsed = Papa.parse(text, { skipEmptyLines: true });
        const rows = parsed.data;
        setParseErrors(parsed.errors || []);
        if (rows.length > 0) {
            setHeaders(rows[0]);
            setPreviewRows(rows.slice(1, 6));
            // Try to auto-populate mapping heuristics
            const h = rows[0].map(x => x.toLowerCase());
            const autoMap = {};
            const findHeader = (candidates) => {
                for (const cand of candidates) {
                    const i = h.findIndex(x => x.includes(cand));
                    if (i >= 0)
                        return rows[0][i];
                }
                return undefined;
            };
            autoMap.kidId = findHeader(['kid id', 'student id', 'kidid', 'studentid', 'uid']);
            autoMap.kidEmail = findHeader(['kid email', 'student email', 'email']);
            autoMap.parentId = findHeader(['parent id', 'parentid']);
            autoMap.parentEmail = findHeader(['parent email']);
            autoMap.teacherId = findHeader(['teacher id', 'teacherid']);
            autoMap.teacherEmail = findHeader(['teacher email']);
            autoMap.sessionId = findHeader(['session id', 'sessionid', 'session']);
            setMapping(autoMap);
        }
    });
    const runValidate = () => __awaiter(this, void 0, void 0, function* () {
        if (!csvContent)
            return toast({ title: 'No CSV', description: 'Please upload a CSV first' });
        if (!headers.length)
            return toast({ title: 'Invalid CSV', description: 'CSV is missing header' });
        setIsValidating(true);
        try {
            const fn = httpsCallable(functions, 'adminProcessEnrollmentCSV');
            const res = yield fn({ csv: csvContent, mapping, validateOnly: true });
            const d = res.data;
            setValidationResults(d.results || []);
            if (d.parseErrors)
                setParseErrors(d.parseErrors || []);
            toast({ title: 'Validation complete', description: `Found ${d.rowCount} rows` });
        }
        catch (err) {
            toast({ title: 'Validation error', description: (err === null || err === void 0 ? void 0 : err.message) || String(err) });
        }
        finally {
            setIsValidating(false);
        }
    });
    const runProcess = () => __awaiter(this, void 0, void 0, function* () {
        if (!csvContent)
            return toast({ title: 'No CSV', description: 'Please upload a CSV first' });
        if (!headers.length)
            return toast({ title: 'Invalid CSV', description: 'CSV is missing header' });
        setIsProcessing(true);
        try {
            const fn = httpsCallable(functions, 'adminProcessEnrollmentCSV');
            const res = yield fn({ csv: csvContent, mapping, validateOnly: false });
            const d = res.data;
            toast({ title: 'Processed', description: `Processed ${d.rowCount} rows` });
            setValidationResults(d.results || []);
            if (d.jobId)
                setJobId(d.jobId);
            if (d.parseErrors)
                setParseErrors(d.parseErrors || []);
        }
        catch (err) {
            toast({ title: 'Processing error', description: (err === null || err === void 0 ? void 0 : err.message) || String(err) });
        }
        finally {
            setIsProcessing(false);
        }
    });
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", children: "Bulk Enroll CSV" }) }), _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Bulk Enrollment CSV" }), _jsx(DialogDescription, { children: "Upload a CSV to bulk create or update enrollments. Use the header mapping to map CSV columns to expected fields." })] }), _jsxs(Card, { className: "p-4 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "CSV File" }), _jsx("input", { type: "file", accept: ".csv", onChange: onFileSelected, className: "mt-2" }), _jsx("div", { className: "mt-2 text-xs text-gray-500", children: "CSV should contain headers: kidId/kidEmail, parentId/parentEmail, teacherId/teacherEmail, sessionId" })] }), parseErrors && parseErrors.length > 0 && (_jsxs("div", { className: "text-xs text-red-600 mt-1", children: ["CSV parse errors: ", parseErrors.length, " issue(s). Please check header/format."] })), headers.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Header mapping" }), _jsx("div", { className: "grid grid-cols-2 gap-4 mt-2", children: ['kidId', 'kidEmail', 'parentId', 'parentEmail', 'teacherId', 'teacherEmail', 'sessionId'].map(h => (_jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-600", children: h }), _jsxs(Select, { value: mapping[h] || 'unmapped', onValueChange: (val) => setMapping(prev => (Object.assign(Object.assign({}, prev), { [h]: val === 'unmapped' ? undefined : val }))), children: [_jsx(SelectTrigger, { className: "w-full", children: _jsx(SelectValue, { placeholder: "Unmapped" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "unmapped", children: "Unmapped" }), headers.map((col, i) => (_jsx(SelectItem, { value: col, children: col }, col + i)))] })] })] }, h))) })] })), previewRows.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Preview" }), _jsx("div", { className: "mt-2 text-xs overflow-x-auto border rounded p-2", children: _jsxs("table", { className: "w-full text-left text-xs", children: [_jsx("thead", { children: _jsx("tr", { children: headers.map((h, i) => _jsx("th", { className: "pr-2", children: h }, h + i)) }) }), _jsx("tbody", { children: previewRows.map((row, rIdx) => (_jsx("tr", { children: row.map((c, cIdx) => _jsx("td", { className: "pr-2", children: c }, cIdx)) }, rIdx))) })] }) })] })), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: runValidate, disabled: isValidating, children: isValidating ? 'Validating...' : 'Validate' }), _jsx(Button, { onClick: runProcess, disabled: isProcessing, children: isProcessing ? 'Processing...' : 'Apply' })] }), validationResults && validationResults.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "text-sm font-medium", children: "Results" }), _jsx("div", { className: "mt-2 text-xs overflow-y-auto max-h-40 bg-gray-50 p-2 rounded", children: validationResults.map((r, idx) => (_jsxs("div", { className: r.success ? 'text-green-700' : 'text-red-600', children: ["Row ", r.rowIndex, ": ", r.success ? 'OK' : r.message] }, idx))) }), (jobId || (validationResults && validationResults.length > 0)) && (_jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "text-xs text-gray-600", children: ["Job ID: ", _jsx("span", { className: "font-mono", children: jobId || 'validation' })] }), _jsx("div", { className: "mt-1", children: _jsx(Button, { size: "sm", variant: "outline", onClick: () => {
                                                        // Download results as CSV
                                                        const csvRows = [['rowIndex', 'success', 'message'], ...validationResults.map(r => [String(r.rowIndex), r.success ? 'OK' : 'FAILED', r.message || ''])];
                                                        const csvText = csvRows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
                                                        const blob = new Blob([csvText], { type: 'text/csv' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `bulk-upload-results-${jobId || 'validation'}.csv`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }, children: "Download Results" }) })] }))] }))] })] })] }));
}
