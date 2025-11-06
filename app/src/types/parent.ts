import type { Timestamp } from "firebase/firestore";

export interface Parent {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface ChildLink {
  id: string;
  parentId: string;
  studentId: string;
  relationship: "mother" | "father" | "guardian";
  isPrimary: boolean;
  createdAt: Timestamp;
}
