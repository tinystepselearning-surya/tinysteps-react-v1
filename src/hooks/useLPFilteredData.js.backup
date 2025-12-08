var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';
export function useLPFilteredTeachers() {
    const { user } = useAuthStore();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user || user.role !== 'learningPartner') {
            setError('Unauthorized role');
            setLoading(false);
            return;
        }
        // Get LP's assignedTeachers
        const lpDocRef = doc(db, 'users', user.uid);
        const unsubscribeLP = onSnapshot(lpDocRef, (lpSnapshot) => __awaiter(this, void 0, void 0, function* () {
            if (!lpSnapshot.exists()) {
                setError('LP profile not found');
                setLoading(false);
                return;
            }
            const lpData = lpSnapshot.data();
            const assignedTeacherIds = lpData.assignedTeachers || [];
            if (assignedTeacherIds.length === 0) {
                setTeachers([]);
                setLoading(false);
                return;
            }
            // Fetch each teacher
            const teacherQueries = assignedTeacherIds.map(teacherId => getDoc(doc(db, 'users', teacherId)));
            Promise.all(teacherQueries)
                .then((snapshots) => {
                const teachersList = snapshots
                    .filter(snap => snap.exists())
                    .map(snap => ({
                    uid: snap.id,
                    displayName: snap.data().displayName,
                    email: snap.data().email,
                    specialization: snap.data().specialization,
                    yearsExperience: snap.data().yearsExperience
                }));
                setTeachers(teachersList);
                setError(null);
            })
                .catch((err) => {
                setError(err.message);
                console.error('Error fetching teachers:', err);
            })
                .finally(() => {
                setLoading(false);
            });
        }), (err) => {
            setError(err.message);
            setLoading(false);
        });
        return () => unsubscribeLP();
    }, [user]);
    return { teachers, loading, error };
}
export function useLPFilteredParents() {
    const { user } = useAuthStore();
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user || user.role !== 'learningPartner') {
            setError('Unauthorized role');
            setLoading(false);
            return;
        }
        // Get LP's assignedParents
        const lpDocRef = doc(db, 'users', user.uid);
        const unsubscribeLP = onSnapshot(lpDocRef, (lpSnapshot) => __awaiter(this, void 0, void 0, function* () {
            if (!lpSnapshot.exists()) {
                setError('LP profile not found');
                setLoading(false);
                return;
            }
            const lpData = lpSnapshot.data();
            const assignedParentIds = lpData.assignedParents || [];
            if (assignedParentIds.length === 0) {
                setParents([]);
                setLoading(false);
                return;
            }
            // Fetch each parent with child count
            const parentQueries = assignedParentIds.map((parentId) => __awaiter(this, void 0, void 0, function* () {
                const parentSnap = yield getDoc(doc(db, 'users', parentId));
                if (parentSnap.exists()) {
                    const childrenQuery = query(collection(db, 'kids'), where('parentId', '==', parentId));
                    const childrenSnap = yield getDocs(childrenQuery);
                    const childCount = childrenSnap.size;
                    return {
                        uid: parentSnap.id,
                        displayName: parentSnap.data().displayName,
                        email: parentSnap.data().email,
                        phone: parentSnap.data().phone,
                        childCount
                    };
                }
                return null;
            }));
            Promise.all(parentQueries)
                .then((parentsList) => {
                setParents(parentsList.filter((p) => p !== null));
                setError(null);
            })
                .catch((err) => {
                setError(err.message);
                console.error('Error fetching parents:', err);
            })
                .finally(() => {
                setLoading(false);
            });
        }), (err) => {
            setError(err.message);
            setLoading(false);
        });
        return () => unsubscribeLP();
    }, [user]);
    return { parents, loading, error };
}
