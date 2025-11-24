import { Timestamp } from 'firebase/firestore';
export interface User {
    id: string;
    uid: string;
    name: string;
    email: string;
    phone?: string;
    role: 'admin' | 'teacher' | 'parent' | 'learningPartner' | 'kid';
    status: 'active' | 'suspended' | 'archived';
    childIds?: string[];
    assignedKids?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: User['role'];
    status: User['status'];
    qualification?: string;
    specialization?: string;
    yearsExperience?: number;
    bio?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    communicationLanguage?: string;
    sessionTime?: string;
    paymentMethods?: string;
    childIds?: string[];
    region?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankAccountHolderName?: string;
    isKidProfile?: boolean;
}
export interface UpdateUserData extends Partial<CreateUserData> {
    uid: string;
}
