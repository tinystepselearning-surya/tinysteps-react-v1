import { Timestamp } from 'firebase/firestore';
import type { AuthRole } from '../constants/roles';

// TypeScript interface for the `users` collection
export interface User {
  id: string; // Firestore document ID
  uid: string; // Firebase Auth UID
  name: string; // Full name of the user
  email: string; // Firebase Auth email, unique
  phone?: string; // Optional phone number
  phoneCountryCode?: string; // Optional phone country calling code (e.g. +91)
  phoneLocal?: string; // Optional local phone number without country code
  phoneNumber?: string; // Legacy optional phone field
  mobile?: string; // Legacy optional mobile field
  contactNumber?: string; // Legacy optional contact number field
  countryCode?: string; // Canonical ISO 3166-1 alpha-2 country code (e.g. IN, CA, US)
  role: AuthRole; // User role
  status: 'active' | 'suspended' | 'archived'; // User status
  childIds?: string[]; // Array of kid IDs (for parents)
  assignedKids?: string[]; // Array of kid IDs (for teachers/LPs)
  createdAt: Timestamp; // Timestamp when the user was created
  updatedAt: Timestamp; // Timestamp when the user was last updated
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  phoneCountryCode?: string;
  phoneLocal?: string;
  countryCode?: string;
  role: User['role'];
  status: User['status'];
  // Role-specific fields
  // For TEACHER:
  qualification?: string;
  specialization?: string;
  yearsExperience?: number;
  bio?: string;
  // For PARENT:
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  communicationLanguage?: string;
  sessionTime?: string;
  paymentMethods?: string;
  childIds?: string[];
  // For LP:
  region?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  // For KID:
  isKidProfile?: boolean;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  uid: string;
}
