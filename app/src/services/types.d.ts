declare module "../../services/firestore" {
  export interface FirestoreService {
    getSnapshots: (setSnapshots: (data: any[]) => void) => () => void;
    getPipeline: (setPipeline: (data: any[]) => void) => () => void;
    getCommunication: (setCommunication: (data: any[]) => void) => () => void;
    getTeacherSummary: (setTeacherSummary: (data: any[]) => void) => () => void;
    getParentFees: (setParentFees: (data: any[]) => void) => () => void;
    getChecklist: (setChecklist: (data: any[]) => void) => () => void;
  }

  export const useFirestore: () => FirestoreService;
}