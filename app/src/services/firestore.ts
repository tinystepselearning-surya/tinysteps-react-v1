import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

interface FirestoreService {
  getSnapshots: (setSnapshots: (data: any[]) => void) => () => void;
  getPipeline: (setPipeline: (data: any[]) => void) => () => void;
  getCommunication: (setCommunication: (data: any[]) => void) => () => void;
  getTeacherSummary: (setTeacherSummary: (data: any[]) => void) => () => void;
  getParentFees: (setParentFees: (data: any[]) => void) => () => void;
  getChecklist: (setChecklist: (data: any[]) => void) => () => void;
}

export const useFirestore = (): FirestoreService => {
  const getSnapshots = (setSnapshots: (data: any[]) => void) => {
    const q = query(collection(db, "snapshots"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSnapshots(data);
    });
  };

  const getPipeline = (setPipeline: (data: any[]) => void) => {
    const q = query(collection(db, "pipeline"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPipeline(data);
    });
  };

  const getCommunication = (setCommunication: (data: any[]) => void) => {
    const q = query(collection(db, "communication"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCommunication(data);
    });
  };

  const getTeacherSummary = (setTeacherSummary: (data: any[]) => void) => {
    const q = query(collection(db, "teacherSummary"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTeacherSummary(data);
    });
  };

  const getParentFees = (setParentFees: (data: any[]) => void) => {
    const q = query(collection(db, "parentFees"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setParentFees(data);
    });
  };

  const getChecklist = (setChecklist: (data: any[]) => void) => {
    const q = query(collection(db, "checklist"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setChecklist(data);
    });
  };

  return {
    getSnapshots,
    getPipeline,
    getCommunication,
    getTeacherSummary,
    getParentFees,
    getChecklist,
  };
};