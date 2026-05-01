"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "ADMIN" | "LEADER" | "COLLABORATOR" | null;
  dbId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  simulateUser: (role: AuthUser["role"], email: string, name: string, dbId?: string) => void;
  resetSimulation: () => void;
  isSimulated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  simulateUser: () => {},
  resetSimulation: () => {},
  isSimulated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [realUser, setRealUser] = useState<AuthUser | null>(null);
  const [simulatedUser, setSimulatedUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", firebaseUser.email));
        const querySnapshot = await getDocs(q);

        let role: any = null;
        let dbId: string | undefined;

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          role = userData.role;
          dbId = querySnapshot.docs[0].id;
        }

        setRealUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role,
          dbId
        });
      } else {
        setRealUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const simulateUser = (role: AuthUser["role"], email: string, name: string, dbId?: string) => {
    setSimulatedUser({
      uid: "simulated-id",
      email,
      displayName: name,
      role,
      dbId
    });
  };

  const resetSimulation = () => setSimulatedUser(null);
  const logout = () => {
    setSimulatedUser(null);
    return auth.signOut();
  };

  const activeUser = simulatedUser || realUser;

  return (
    <AuthContext.Provider value={{ 
      user: activeUser, 
      loading, 
      logout, 
      simulateUser, 
      resetSimulation,
      isSimulated: !!simulatedUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
