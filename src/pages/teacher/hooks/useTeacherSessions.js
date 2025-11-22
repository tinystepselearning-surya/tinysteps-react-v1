import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../lib/firebaseConfig';
const toTeacherSession = (doc) => ({
    id: doc.id,
    teacherId: doc.teacherId,
    courseId: doc.courseId,
    courseName: doc.courseName,
    date: doc.date,
    startTime: doc.startTime,
    endTime: doc.endTime,
    kidIds: doc.kidIds || [],
    status: doc.status || 'scheduled',
    joinUrl: doc.joinUrl,
    notes: doc.notes,
    attendance: doc.attendance,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
});
export const useTeacherSessions = (teacherId, date = format(new Date(), 'yyyy-MM-dd')) => {
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(!!teacherId);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!teacherId) {
            setIsLoading(false);
            return;
        }
        const q = query(collection(db, 'sessions'), where('teacherId', '==', teacherId), where('date', '==', date), orderBy('startTime', 'asc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((d) => toTeacherSession(Object.assign({ id: d.id }, d.data())));
            setSessions(data);
            setIsLoading(false);
        }, (err) => {
            console.error('useTeacherSessions error', err);
            setError(err);
            setIsLoading(false);
        });
        return () => unsub();
    }, [teacherId, date]);
    const sortedSessions = useMemo(() => [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime, undefined, { numeric: true })), [sessions]);
    return { sessions: sortedSessions, isLoading, error };
};
