import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase";

export type UserRole = "parent" | "student" | "teacher" | "learning-partner" | "admin";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: () => boolean;
  isRM: () => boolean;
  isTeacher: () => boolean;
  isParent: () => boolean;
  isStudent: () => boolean;
  isStaff: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the latest token to ensure we have fresh claims
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const userRole = idTokenResult.claims.role as UserRole | undefined;
        
        setUser(firebaseUser);
        setRole(userRole || null);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // Force token refresh to get latest claims
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      const idTokenResult = await auth.currentUser.getIdTokenResult();
      setRole(idTokenResult.claims.role as UserRole);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setRole(null);
    localStorage.removeItem("adminAuth");
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const isAdmin = () => role === "admin";
  const isRM = () => role === "learning-partner";
  const isTeacher = () => role === "teacher";
  const isParent = () => role === "parent";
  const isStudent = () => role === "student";
  const isStaff = () => role === "admin" || role === "learning-partner" || role === "teacher";
  const hasRole = (roles: UserRole[]) => role !== null && roles.includes(role);

  const value: AuthContextType = {
    user,
    role,
    loading,
    signIn,
    signOut,
    resetPassword,
    isAdmin,
    isRM,
    isTeacher,
    isParent,
    isStudent,
    isStaff,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
