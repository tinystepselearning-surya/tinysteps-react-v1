import { db } from "../firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where
} from "firebase/firestore";
import type { Parent, ChildLink } from "../types/parent";
import type { Student } from "../types/student";

/**
 * Get parent document by userId
 */
export async function getParent(userId: string): Promise<Parent | null> {
  try {
    const parentDoc = await getDoc(doc(db, "parents", userId));
    if (!parentDoc.exists()) {
      return null;
    }
    return {
      id: parentDoc.id,
      ...parentDoc.data(),
    } as Parent;
  } catch (error) {
    console.error("Error fetching parent:", error);
    throw error;
  }
}

/**
 * Get all children linked to a parent
 */
export async function getParentChildren(parentId: string): Promise<ChildLink[]> {
  try {
    const childrenRef = collection(db, "parents", parentId, "children");
    const childrenSnapshot = await getDocs(childrenRef);
    
    return childrenSnapshot.docs.map(doc => ({
      id: doc.id,
      parentId,
      ...doc.data(),
    })) as ChildLink[];
  } catch (error) {
    console.error("Error fetching parent children:", error);
    throw error;
  }
}

/**
 * Get full student data for all children of a parent
 */
export async function getParentChildrenWithDetails(parentId: string): Promise<Student[]> {
  try {
    const childLinks = await getParentChildren(parentId);
    
    if (childLinks.length === 0) {
      return [];
    }

    // Fetch all student documents
    const students = await Promise.all(
      childLinks.map(async (link) => {
        const studentDoc = await getDoc(doc(db, "students", link.studentId));
        if (!studentDoc.exists()) {
          return null;
        }
        return {
          id: studentDoc.id,
          ...studentDoc.data(),
        } as Student;
      })
    );

    // Filter out any null values
    return students.filter((student): student is Student => student !== null);
  } catch (error) {
    console.error("Error fetching children with details:", error);
    throw error;
  }
}

/**
 * Get primary child for a parent (used for single-child parents)
 */
export async function getPrimaryChild(parentId: string): Promise<Student | null> {
  try {
    const childrenRef = collection(db, "parents", parentId, "children");
    const q = query(childrenRef, where("isPrimary", "==", true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // If no primary child, get first child
      const allChildren = await getParentChildren(parentId);
      if (allChildren.length === 0) {
        return null;
      }
      const firstChild = allChildren[0];
      const studentDoc = await getDoc(doc(db, "students", firstChild.studentId));
      if (!studentDoc.exists()) {
        return null;
      }
      return {
        id: studentDoc.id,
        ...studentDoc.data(),
      } as Student;
    }

    const primaryLink = snapshot.docs[0];
    const studentDoc = await getDoc(doc(db, "students", primaryLink.data().studentId));
    
    if (!studentDoc.exists()) {
      return null;
    }

    return {
      id: studentDoc.id,
      ...studentDoc.data(),
    } as Student;
  } catch (error) {
    console.error("Error fetching primary child:", error);
    throw error;
  }
}
