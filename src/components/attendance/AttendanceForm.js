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
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';
export default function AttendanceForm({ sessionId, kidIds }) {
    const { user } = useAuthStore();
    const [attendance, setAttendance] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const markAttendance = httpsCallable(functions, 'markAttendance');
    const handleSubmit = () => __awaiter(this, void 0, void 0, function* () {
        setIsSubmitting(true);
        setError(null);
        try {
            const date = new Date().toISOString().split('T')[0];
            yield markAttendance({ sessionId, date, attendance });
        }
        catch (err) {
            setError((err === null || err === void 0 ? void 0 : err.message) || 'Failed to submit attendance');
        }
        finally {
            setIsSubmitting(false);
        }
    });
    return (_jsxs("div", { className: "space-y-3", children: [error && _jsx("div", { className: "text-red-600", children: error }), kidIds.map((kidId) => (_jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("span", { className: "w-40", children: kidId }), _jsx("button", { className: `px-3 py-1 rounded ${attendance[kidId] === 'present' ? 'bg-blue-600 text-white' : 'bg-white border'}`, onClick: () => setAttendance(Object.assign(Object.assign({}, attendance), { [kidId]: 'present' })), children: "Present" }), _jsx("button", { className: `px-3 py-1 rounded ${attendance[kidId] === 'absent' ? 'bg-red-600 text-white' : 'bg-white border'}`, onClick: () => setAttendance(Object.assign(Object.assign({}, attendance), { [kidId]: 'absent' })), children: "Absent" })] }, kidId))), _jsx("button", { onClick: handleSubmit, disabled: isSubmitting, className: `w-full px-4 py-2 rounded ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 text-white'}`, children: isSubmitting ? 'Submitting...' : 'Submit Attendance' })] }));
}
