var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as admin from 'firebase-admin';
/**
 * Creates or updates a user document in Firestore.
 * @param uid - The Firebase Auth UID of the user.
 * @param userData - The user data to store.
 */
export function upsertUser(uid, userData) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(uid);
        const userDoc = yield userRef.get();
        if (userDoc.exists) {
            // Update existing user
            yield userRef.update(Object.assign(Object.assign({}, userData), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        }
        else {
            // Create new user
            yield userRef.set(Object.assign(Object.assign({}, userData), { createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        }
    });
}
