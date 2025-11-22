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
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { Input } from '@components/ui/input';
const STATUS_OPTIONS = ['present', 'absent', 'late'];
export const AttendanceForm = ({ open, session, onClose, onSubmit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState({});
    const [sessionNotes, setSessionNotes] = useState('');
    useEffect(() => {
        if (session) {
            const defaults = {};
            session.kidIds.forEach((kidId) => {
                var _a;
                defaults[kidId] = {
                    status: ((_a = session.attendance) === null || _a === void 0 ? void 0 : _a[kidId]) || 'present',
                    notes: '',
                    mastery: 50,
                    topics: [],
                };
            });
            setFormState(defaults);
            setSessionNotes(session.notes || '');
        }
    }, [session]);
    const handleChange = (kidId, status) => {
        setFormState((prev) => (Object.assign(Object.assign({}, prev), { [kidId]: Object.assign(Object.assign({}, prev[kidId]), { status }) })));
    };
    const handleNotesChange = (kidId, value) => {
        setFormState((prev) => (Object.assign(Object.assign({}, prev), { [kidId]: Object.assign(Object.assign({}, prev[kidId]), { notes: value }) })));
    };
    const handleMasteryChange = (kidId, value) => {
        setFormState((prev) => (Object.assign(Object.assign({}, prev), { [kidId]: Object.assign(Object.assign({}, prev[kidId]), { mastery: value[0] }) })));
    };
    const handleTopicChange = (kidId, topic, checked) => {
        setFormState((prev) => (Object.assign(Object.assign({}, prev), { [kidId]: Object.assign(Object.assign({}, prev[kidId]), { topics: checked
                    ? [...(prev[kidId].topics || []), topic]
                    : (prev[kidId].topics || []).filter(t => t !== topic) }) })));
    };
    const handleSubmit = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!session)
            return;
        setIsSubmitting(true);
        try {
            yield onSubmit({ attendance: formState, sessionNotes });
            onClose();
        }
        finally {
            setIsSubmitting(false);
        }
    });
    const kids = useMemo(() => (session === null || session === void 0 ? void 0 : session.kidIds) || [], [session]);
    // Mock topics
    const topics = ['Letter A', 'Phoneme Sounds', 'Word Building'];
    return (_jsx(Dialog, { open: open, onOpenChange: (value) => !value && onClose(), children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[80vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Mark Attendance" }), _jsx(DialogDescription, { children: "Mark attendance for the selected session. Only the assigned teacher or an LP can update attendance." })] }), !session ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "Select a session to mark attendance." })) : (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { children: _jsxs("p", { className: "text-sm text-muted-foreground", children: [session.courseName, " \u00B7 ", session.startTime, " - ", session.endTime] }) }), kids.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No students assigned to this session." })) : (kids.map((kidId) => {
                            var _a, _b, _c, _d;
                            return (_jsxs("div", { className: "border rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-10 h-10 bg-gray-200 rounded-full" }), _jsx(Label, { className: "font-medium", children: kidId })] }), _jsxs(Select, { value: ((_a = formState[kidId]) === null || _a === void 0 ? void 0 : _a.status) || 'present', onValueChange: (v) => handleChange(kidId, v), children: [_jsx(SelectTrigger, { className: "w-[150px]", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: STATUS_OPTIONS.map((status) => (_jsx(SelectItem, { value: status, children: status.charAt(0).toUpperCase() + status.slice(1) }, status))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Mastery (0-100%)" }), _jsx(Input, { type: "range", min: "0", max: "100", value: ((_b = formState[kidId]) === null || _b === void 0 ? void 0 : _b.mastery) || 50, onChange: (e) => handleMasteryChange(kidId, [parseInt(e.target.value)]), className: "mt-2" }), _jsxs("span", { className: "text-sm", children: [((_c = formState[kidId]) === null || _c === void 0 ? void 0 : _c.mastery) || 50, "%"] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Topics Covered" }), _jsx("div", { className: "flex gap-2 mt-1", children: topics.map((topic) => {
                                                    var _a;
                                                    return (_jsxs("label", { className: "flex items-center gap-1", children: [_jsx("input", { type: "checkbox", checked: (((_a = formState[kidId]) === null || _a === void 0 ? void 0 : _a.topics) || []).includes(topic), onChange: (e) => handleTopicChange(kidId, topic, e.target.checked) }), topic] }, topic));
                                                }) })] }), _jsx(Textarea, { placeholder: "Notes (optional)", value: ((_d = formState[kidId]) === null || _d === void 0 ? void 0 : _d.notes) || '', onChange: (event) => handleNotesChange(kidId, event.target.value) })] }, kidId));
                        })), _jsxs("div", { children: [_jsx(Label, { children: "Session Notes" }), _jsx(Textarea, { placeholder: "How was the session? Any issues?", value: sessionNotes, onChange: (e) => setSessionNotes(e.target.value), rows: 3 })] }), _jsxs("div", { className: "flex justify-between", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", children: "Mark All Present" }), _jsx(Button, { variant: "outline", children: "Clear All" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: onClose, disabled: isSubmitting, children: "Cancel" }), _jsx(Button, { onClick: handleSubmit, disabled: isSubmitting || kids.length === 0, children: isSubmitting ? 'Saving...' : 'Save & Close' })] })] })] }))] }) }));
};
