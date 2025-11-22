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
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import PracticeBuddy from '../../components/PracticeBuddy/PracticeBuddy.jsx';
import { useAuthStore } from '../../store/useAuthStore';
export default function PracticeBuddyPage() {
    const { childId } = useParams();
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();
    const [meta, setMeta] = useState(null);
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [error, setError] = useState(null);
    const isOwner = useMemo(() => {
        if (!user || !childId)
            return false;
        return user.uid === childId && user.role === 'kid';
    }, [childId, user]);
    useEffect(() => {
        const fetchMeta = () => __awaiter(this, void 0, void 0, function* () {
            if (!childId)
                return;
            try {
                const snap = yield getDoc(doc(db, 'students', childId));
                if (snap.exists()) {
                    setMeta(snap.data());
                }
            }
            catch (err) {
                setError('Failed to load student info.');
            }
            finally {
                setLoadingMeta(false);
            }
        });
        fetchMeta();
    }, [childId]);
    const logSession = (status) => __awaiter(this, void 0, void 0, function* () {
        if (!childId)
            return;
        try {
            yield addDoc(collection(db, 'ai-sessions'), {
                studentId: childId,
                teacherId: (meta === null || meta === void 0 ? void 0 : meta.teacherId) || null,
                feature: 'practice-buddy',
                status,
                createdAt: serverTimestamp(),
            });
        }
        catch (err) {
            // swallow logging errors
        }
    });
    if (isLoading || loadingMeta) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center text-sm text-gray-600", children: "Loading Practice Buddy\u2026" }));
    }
    if (!isOwner) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center text-center", children: _jsxs("div", { className: "bg-white rounded-2xl shadow p-6 max-w-md space-y-3", children: [_jsx("p", { className: "text-lg font-semibold text-gray-900", children: "Access denied" }), _jsx("p", { className: "text-sm text-gray-600", children: "This Practice Buddy is only for the logged-in child account." }), _jsx("button", { className: "px-4 py-2 rounded-lg bg-indigo-600 text-white", onClick: () => navigate('/parent/login'), children: "Go to login" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white py-6", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-indigo-600 font-semibold", children: "Kids Portal" }), _jsxs("h1", { className: "text-3xl font-bold text-gray-900", children: ["Practice Buddy ", _jsx("span", { role: "img", "aria-label": "robot", children: "\uD83E\uDD16" })] }), meta && (_jsxs("p", { className: "text-sm text-gray-600", children: ["Hi ", meta.studentName || 'there', "! Age ", meta.age || '—', " \u00B7 Level ", meta.level || '—'] }))] }), _jsx(Link, { to: `/kids/${childId}/dashboard`, className: "text-sm text-indigo-700 hover:underline font-semibold", children: "\u2190 Back to Dashboard" })] }), _jsx(PracticeBuddy, { studentId: childId, onBeforePractice: () => logSession('started'), onAfterPractice: () => logSession('completed') }), error && (_jsx("div", { className: "mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3", children: error }))] }) }));
}
