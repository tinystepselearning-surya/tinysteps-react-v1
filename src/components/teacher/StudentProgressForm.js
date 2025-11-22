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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';
export default function StudentProgressForm({ studentId, topicId }) {
    const { user } = useAuthStore();
    const [mastery, setMastery] = useState('emerging');
    const [nextAction, setNextAction] = useState('practice');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const handleUpdate = () => __awaiter(this, void 0, void 0, function* () {
        setIsSaving(true);
        setError(null);
        try {
            const docRef = doc(db, 'progress', `${studentId}_${topicId}`);
            yield setDoc(docRef, {
                studentId,
                topicId,
                mastery,
                nextAction,
                updatedAt: serverTimestamp(),
                updatedBy: user === null || user === void 0 ? void 0 : user.uid,
            }, { merge: true });
            // optional: show success feedback
        }
        catch (err) {
            setError((err === null || err === void 0 ? void 0 : err.message) || 'Save failed');
        }
        finally {
            setIsSaving(false);
        }
    });
    return (_jsxs("div", { className: "space-y-4", children: [error && _jsx("div", { className: "text-red-600", children: error }), _jsxs("label", { className: "block", children: [_jsx("div", { className: "text-sm text-gray-700 mb-1", children: "Mastery" }), _jsxs("select", { value: mastery, onChange: (e) => setMastery(e.target.value), className: "w-full p-2 border rounded", children: [_jsx("option", { value: "not_started", children: "not_started" }), _jsx("option", { value: "emerging", children: "emerging" }), _jsx("option", { value: "developing", children: "developing" }), _jsx("option", { value: "proficient", children: "proficient" }), _jsx("option", { value: "mastered", children: "mastered" })] })] }), _jsxs("label", { className: "block", children: [_jsx("div", { className: "text-sm text-gray-700 mb-1", children: "Next action" }), _jsxs("select", { value: nextAction, onChange: (e) => setNextAction(e.target.value), className: "w-full p-2 border rounded", children: [_jsx("option", { value: "practice", children: "practice" }), _jsx("option", { value: "reteach", children: "reteach" }), _jsx("option", { value: "advance", children: "advance" }), _jsx("option", { value: "review", children: "review" })] })] }), _jsx("button", { onClick: handleUpdate, disabled: isSaving, className: `w-full px-4 py-2 rounded ${isSaving ? 'bg-gray-400' : 'bg-blue-600 text-white'}`, children: isSaving ? 'Saving...' : 'Save Progress' })] }));
}
