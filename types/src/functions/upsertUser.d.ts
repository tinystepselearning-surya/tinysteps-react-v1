import { User } from '../types/User';
/**
 * Creates or updates a user document in Firestore.
 * @param uid - The Firebase Auth UID of the user.
 * @param userData - The user data to store.
 */
export declare function upsertUser(uid: string, userData: Partial<User>): Promise<void>;
