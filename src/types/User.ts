import { Timestamp } from 'firebase/firestore';

// TypeScript interface for the `users` collection
export interface User {
  name: string; // Full name of the user
  email: string; // Firebase Auth email, unique
  role: 'admin' | 'teacher' | 'parent' | 'lp' | 'kid'; // User role
  childIds?: string[]; // Array of kid IDs (for parents)
  assignedKids?: string[]; // Array of kid IDs (for teachers/LPs)
  createdAt: Timestamp; // Timestamp when the user was created
  updatedAt: Timestamp; // Timestamp when the user was last updated
}