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
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../lib/firebaseConfig";
const functions = getFunctions(app, 'asia-south1');
const setUserRole = httpsCallable(functions, 'setUserRole');
const getUidByEmail = httpsCallable(functions, 'getUidByEmail');
const AdminPanel = () => {
    const [email, setEmail] = useState('');
    const [uid, setUid] = useState('');
    const [role, setRole] = useState('teacher');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const lookupUid = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!email) {
            setMessage('Please enter an email');
            return;
        }
        setLoading(true);
        try {
            const res = yield getUidByEmail({ email });
            const data = res.data;
            setUid(data.uid);
            setMessage(`UID found: ${data.uid}`);
        }
        catch (err) {
            setMessage(`Error looking up UID: ${err.message}`);
        }
        finally {
            setLoading(false);
        }
    });
    const assignRole = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!uid) {
            setMessage('Please lookup UID first');
            return;
        }
        setLoading(true);
        try {
            const res = yield setUserRole({ uid, role });
            const data = res.data;
            setMessage(data.success ? data.message : `Error: ${data.error}`);
        }
        catch (err) {
            setMessage(`Error: ${err.message}`);
        }
        finally {
            setLoading(false);
        }
    });
    return (_jsxs("div", { className: "p-8", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Admin Panel - Assign User Role" }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "User Email" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "border p-2 w-full", placeholder: "Enter user email" }), _jsx("button", { onClick: lookupUid, disabled: loading, className: "mt-2 bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50", children: loading ? 'Looking up...' : 'Lookup UID' })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "User UID" }), _jsx("input", { type: "text", value: uid, readOnly: true, className: "border p-2 w-full bg-gray-100", placeholder: "UID will appear here after lookup" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Role" }), _jsxs("select", { value: role, onChange: (e) => setRole(e.target.value), className: "border p-2 w-full", children: [_jsx("option", { value: "admin", children: "Admin" }), _jsx("option", { value: "teacher", children: "Teacher" }), _jsx("option", { value: "parent", children: "Parent" }), _jsx("option", { value: "kid", children: "Kid" }), _jsx("option", { value: "learningPartner", children: "Learning Partner" })] })] }), _jsx("button", { onClick: assignRole, disabled: loading || !uid, className: "bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50", children: loading ? 'Assigning...' : 'Assign Role' }), message && _jsx("p", { className: "mt-4 text-green-600", children: message })] }));
};
export default AdminPanel;
