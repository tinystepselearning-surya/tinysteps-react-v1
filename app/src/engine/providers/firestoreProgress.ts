import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import type { Session } from "../types";

export async function writeSession(studentId: string, session: Session) {
  const ref = doc(db, `students/${studentId}/sessions/${session.id}`);
  await setDoc(ref, session, { merge: true });
}
