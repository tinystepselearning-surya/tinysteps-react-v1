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
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';
export default function WorksheetGeneratorPage() {
    const { teacherId } = useParams();
    const { user, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [recentTemplates, setRecentTemplates] = useState([]);
    useEffect(() => {
        if (!teacherId)
            return;
        const fetchStudents = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const q = query(collection(db, 'students'), where('teacherId', '==', teacherId), orderBy('studentName'));
                const snap = yield getDocs(q);
                const list = [];
                snap.forEach((doc) => list.push(Object.assign({ id: doc.id }, doc.data())));
                setStudents(list);
            }
            catch (err) {
                // ignore fetch errors in UI
            }
        });
        const fetchWorksheets = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const q = query(collection(db, 'worksheets'), where('teacherId', '==', teacherId), orderBy('createdAt', 'desc'), limit(3));
                const snap = yield getDocs(q);
                const list = [];
                snap.forEach((doc) => list.push(Object.assign({ id: doc.id }, doc.data())));
                setRecentTemplates(list);
            }
            catch (err) {
                // ignore fetch errors in UI
            }
        });
        fetchStudents();
        fetchWorksheets();
    }, [teacherId]);
    useEffect(() => {
        if (isLoading)
            return;
        if (!user || user.role !== 'teacher' || user.uid !== teacherId) {
            navigate('/unauthorized', { replace: true });
        }
    }, [isLoading, navigate, teacherId, user]);
    const goWithTopic = (topic) => {
        // For now navigate to same page; hook will allow quick adjustments
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white py-6", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-indigo-600 font-semibold", children: "Teacher Portal" }), _jsxs("h1", { className: "text-3xl font-bold text-gray-900", children: ["Worksheet Generator ", _jsx("span", { role: "img", "aria-label": "sparkle", children: "\u2728" })] }), _jsx("p", { className: "text-sm text-gray-600", children: "Create worksheets, save to your library, and share with parents." })] }), _jsx(Link, { to: `/teacher/${teacherId}/dashboard`, className: "text-sm text-indigo-700 hover:underline font-semibold", children: "\u2190 Back to dashboard" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-2", children: "Assigned students" }), students.length === 0 ? (_jsx("p", { className: "text-xs text-gray-500", children: "No students found." })) : (_jsx("ul", { className: "space-y-1 text-sm text-gray-700", children: students.map((s) => (_jsxs("li", { className: "flex justify-between", children: [_jsx("span", { children: s.name || s.studentName || 'Student' }), _jsx("span", { className: "text-xs text-gray-400", children: s.classId || '' })] }, s.id))) }))] }), _jsxs("div", { className: "bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900", children: "Quick Actions" }), _jsx("span", { className: "text-xs text-gray-500", children: "Shortcuts" })] }), _jsx("button", { onClick: () => goWithTopic('Phonics'), className: "w-full px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition", children: "Generate Phonics Worksheet" }), _jsx("button", { onClick: () => goWithTopic('Grammar'), className: "w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition", children: "Generate Grammar Worksheet" }), _jsxs("div", { className: "pt-2", children: [_jsx("h4", { className: "text-xs uppercase text-gray-500 font-semibold mb-1", children: "Recent templates" }), recentTemplates.length === 0 ? (_jsx("p", { className: "text-xs text-gray-500", children: "Nothing yet." })) : (_jsx("ul", { className: "space-y-2", children: recentTemplates.map((tpl) => {
                                                        var _a;
                                                        return (_jsxs("li", { className: "p-2 border border-gray-100 rounded-lg", children: [_jsxs("div", { className: "text-sm font-semibold text-gray-900", children: [tpl.topic, " \u00B7 ", tpl.level] }), _jsx("p", { className: "text-xs text-gray-500 line-clamp-2", children: ((_a = tpl.content) === null || _a === void 0 ? void 0 : _a.slice(0, 120)) || 'No content' })] }, tpl.id));
                                                    }) }))] })] })] })] })] }) }));
}
