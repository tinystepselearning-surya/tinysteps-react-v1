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
import { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { useTeacherSessions } from '../../hooks/useTeacherSessions';
import { SessionCard } from './SessionCard';
import { AttendanceForm } from './AttendanceForm';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, functions } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';
import { toast } from '@components/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
export const TodaySessionsList = ({ teacherId }) => {
    const { user } = useAuthStore();
    const { sessions, isLoading, error } = useTeacherSessions(teacherId);
    const [selectedSession, setSelectedSession] = useState(null);
    const handleComplete = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield updateDoc(doc(db, 'sessions', sessionId), {
                status: 'completed',
                updatedAt: serverTimestamp(),
                updatedBy: user === null || user === void 0 ? void 0 : user.uid,
            });
            toast({ title: 'Session updated', description: 'Session marked as completed.' });
        }
        catch (err) {
            console.error(err);
            toast({
                title: 'Unable to update session',
                description: err instanceof Error ? err.message : 'Please try again later.',
                variant: 'destructive',
            });
        }
    });
    const handleAttendanceSubmit = (data) => __awaiter(void 0, void 0, void 0, function* () {
        if (!selectedSession)
            return;
        try {
            yield updateDoc(doc(db, 'sessions', selectedSession.id), {
                attendance: data.attendance,
                notes: data.sessionNotes,
                status: 'completed',
                updatedAt: serverTimestamp(),
                updatedBy: user === null || user === void 0 ? void 0 : user.uid,
            });
            try {
                const markComplete = httpsCallable(functions, 'onSessionComplete');
                yield markComplete({ sessionId: selectedSession.id });
            }
            catch (fnErr) {
                console.warn('onSessionComplete callable unavailable', fnErr);
                const message = fnErr instanceof Error
                    ? fnErr.message
                    : (fnErr === null || fnErr === void 0 ? void 0 : fnErr.message) || 'Background processing failed.';
                toast({
                    title: 'Post-processing failed',
                    description: message,
                    variant: 'destructive',
                });
            }
            toast({ title: 'Attendance saved', description: 'All attendance entries stored.' });
        }
        catch (err) {
            console.error(err);
            toast({
                title: 'Unable to save attendance',
                description: err instanceof Error ? err.message : 'Please try again later.',
                variant: 'destructive',
            });
        }
    });
    const orderedSessions = useMemo(() => sessions, [sessions]);
    if (isLoading) {
        return (_jsx(Card, { className: "p-6", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "Loading today\u2019s sessions..." }) }));
    }
    if (error) {
        return (_jsx(Card, { className: "p-6", children: _jsx("p", { className: "text-sm text-red-500", children: error.message }) }));
    }
    if (!orderedSessions.length) {
        return (_jsx(Card, { className: "p-6 text-center", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "No sessions scheduled for today." }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [orderedSessions.map((session) => (_jsx(SessionCard, { session: session, onMarkAttendance: setSelectedSession, onComplete: handleComplete }, session.id))), _jsx(AttendanceForm, { open: Boolean(selectedSession), session: selectedSession, onClose: () => setSelectedSession(null), onSubmit: handleAttendanceSubmit })] }));
};
