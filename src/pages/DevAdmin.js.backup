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
import useAuthStore from '../store/useAuthStore';
import { useEnrollments, useInvoices } from '../hooks/useData';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
export default function DevAdmin() {
    var _a, _b;
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const clearUser = useAuthStore((s) => s.clearUser);
    const [parentId, setParentId] = useState('');
    const [lastError, setLastError] = useState(null);
    const [lastIndexLink, setLastIndexLink] = useState(null);
    const [teacherIdCheck, setTeacherIdCheck] = useState('');
    const enrollments = useEnrollments(parentId);
    const invoices = useInvoices(parentId);
    function seedAuth() {
        var _a;
        // Dev-only helper: sets an in-memory auth user for local testing. Hidden in builds
        // unless VITE_ENABLE_DEV_SEED is set to 'true'. This avoids accidental distribution
        // of sample auth users in production builds.
        const enableSeed = ((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.VITE_ENABLE_DEV_SEED) === 'true';
        if (!enableSeed) {
            console.warn('Dev seeding disabled. To enable set VITE_ENABLE_DEV_SEED=true in .env');
            return;
        }
        const u = {
            uid: 'dev-user-1',
            email: 'dev@example.com',
            displayName: 'Dev User',
            role: 'admin',
        };
        setUser(u);
    }
    function clearAll() {
        clearUser();
        try {
            localStorage.clear();
        }
        catch (e) {
            // ignore
        }
        // reload to ensure persisted stores cleared
        window.location.reload();
    }
    return (_jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-semibold mb-4", children: "Dev / Admin Debug Page" }), _jsxs("section", { className: "mb-6 p-4 bg-white rounded shadow", children: [_jsx("h2", { className: "font-medium", children: "Auth Store" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Current user: ", user ? user.email : '—'] }), _jsxs("div", { className: "mt-2 flex gap-2", children: [((_a = import.meta.env) === null || _a === void 0 ? void 0 : _a.VITE_ENABLE_DEV_SEED) === 'true' && (_jsx("button", { className: "px-3 py-1 bg-blue-600 text-white rounded", onClick: seedAuth, children: "Seed Auth" })), _jsx("button", { className: "px-3 py-1 bg-gray-200 rounded", onClick: () => clearUser(), children: "Clear Auth" }), _jsx("button", { className: "px-3 py-1 bg-red-500 text-white rounded", onClick: clearAll, children: "Clear Storage & Reload" })] })] }), _jsxs("section", { className: "mb-6 p-4 bg-white rounded shadow", children: [_jsx("h2", { className: "font-medium", children: "Enrollments / Invoices" }), _jsxs("div", { className: "flex gap-2 items-center mb-3", children: [_jsx("input", { value: parentId, onChange: (e) => setParentId(e.target.value), placeholder: "Enter parentId", className: "border p-2 rounded flex-1" }), _jsx("button", { className: "px-3 py-1 bg-green-600 text-white rounded", onClick: () => enrollments.refetch(), children: "Refetch" })] }), _jsxs("div", { className: "flex gap-2 items-center mb-3", children: [_jsx("input", { value: teacherIdCheck, onChange: (e) => setTeacherIdCheck(e.target.value), placeholder: "TeacherId for sessions check", className: "border p-2 rounded flex-1" }), _jsx("button", { className: "px-3 py-1 bg-indigo-600 text-white rounded", onClick: () => __awaiter(this, void 0, void 0, function* () {
                                    setLastError(null);
                                    try {
                                        if (!teacherIdCheck)
                                            throw new Error('Enter a teacherId to check');
                                        const q = query(collection(db, 'sessions'), where('teacherId', '==', teacherIdCheck), where('status', 'in', ['scheduled', 'in_progress']), orderBy('date', 'asc'));
                                        yield getDocs(q);
                                        setLastError('Query succeeded — no index error returned');
                                        setLastIndexLink(null);
                                    }
                                    catch (err) {
                                        const msg = (err === null || err === void 0 ? void 0 : err.message) || String(err);
                                        setLastError(msg);
                                        // try to extract firebase console link
                                        const urlMatch = msg.match(/https?:\/\/console\.firebase\.google\.com\S+/i);
                                        if (urlMatch) {
                                            setLastIndexLink(urlMatch[0]);
                                        }
                                        else {
                                            // sometimes error contains a direct createIndex link with escaped chars
                                            const altMatch = msg.match(/https?:\/\/[^\s]*firebase\.google\.com[^\s]*/i);
                                            setLastIndexLink(altMatch ? altMatch[0] : null);
                                        }
                                    }
                                }), children: "Check sessions index" })] }), _jsxs("div", { className: "mb-3", children: [_jsx("h3", { className: "font-medium", children: "Enrollments" }), enrollments.isLoading && _jsx("p", { children: "Loading..." }), enrollments.isError && _jsxs("p", { className: "text-red-600", children: ["Error: ", (_b = enrollments.error) === null || _b === void 0 ? void 0 : _b.message] }), enrollments.data && enrollments.data.length === 0 && _jsx("p", { className: "text-sm text-gray-500", children: "No enrollments" }), enrollments.data && enrollments.data.map((e) => (_jsxs("div", { className: "border p-2 my-2 rounded", children: [_jsxs("div", { className: "text-sm", children: ["Enrollment: ", e.id] }), _jsxs("div", { className: "text-xs text-gray-600", children: ["Kids: ", (e.kids || []).map((k) => k.id).join(', ')] })] }, e.id)))] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Invoices" }), invoices.isLoading && _jsx("p", { children: "Loading..." }), invoices.data && invoices.data.map((inv) => (_jsxs("div", { className: "border p-2 my-2 rounded", children: [_jsxs("div", { className: "text-sm", children: ["Invoice: ", inv.id, " \u2014 ", inv.amount || '—'] }), _jsxs("div", { className: "text-xs text-gray-600", children: ["Status: ", inv.status] })] }, inv.id)))] })] }), _jsxs("section", { className: "mb-6 p-4 bg-white rounded shadow", children: [_jsx("h2", { className: "font-medium", children: "Index Check Output" }), _jsx("p", { className: "text-sm text-gray-600", children: "Last runtime error / message from Firestore:" }), _jsx("pre", { className: "mt-2 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap", children: lastError || 'No messages yet' }), lastIndexLink && (_jsx("div", { className: "mt-2", children: _jsx("a", { href: lastIndexLink, target: "_blank", rel: "noreferrer", className: "text-blue-600 underline", children: "Open suggested index in Firebase Console" }) })), _jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx("button", { className: "px-3 py-1 bg-blue-600 text-white rounded", onClick: () => {
                                    if (!lastError)
                                        return;
                                    navigator.clipboard.writeText(lastError);
                                }, children: "Copy Error Text" }), lastIndexLink && (_jsx("button", { className: "px-3 py-1 bg-green-600 text-white rounded", onClick: () => {
                                    navigator.clipboard.writeText(lastIndexLink);
                                }, children: "Copy Console Link" }))] }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: "If Firestore requires an index, the error message contains a Console link you can click/copy to create it." })] }), _jsxs("section", { className: "p-4 bg-white rounded shadow", children: [_jsx("h2", { className: "font-medium", children: "Quick Utilities" }), _jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx("button", { className: "px-3 py-1 bg-yellow-500 rounded", onClick: () => window.location.reload(), children: "Reload" }), _jsx("button", { className: "px-3 py-1 bg-indigo-600 text-white rounded", onClick: () => console.clear(), children: "Clear Console" }), _jsx("button", { className: "px-3 py-1 bg-gray-300 rounded", onClick: () => {
                                    try {
                                        if (globalThis.__enrollmentsCache)
                                            globalThis.__enrollmentsCache.clear();
                                    }
                                    catch (e) { }
                                    alert('Enrollments cache cleared');
                                }, children: "Clear Enrollments Cache" })] })] })] }));
}
