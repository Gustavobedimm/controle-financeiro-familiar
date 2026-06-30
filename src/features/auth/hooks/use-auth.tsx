"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase/auth";
import { getDocument } from "@/lib/firebase/firestore";
import type { AppUser } from "@/types/finance";

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: AppUser | null;
  householdId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  householdId: null,
  loading: true
});

async function getUserProfileWithRetry(uid: string): Promise<AppUser | null> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const profile = await getDocument<AppUser>("users", uid);
    if (profile) return profile;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAppUser(user ? await getUserProfileWithRetry(user.uid) : null);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({ firebaseUser, appUser, householdId: appUser?.householdId ?? null, loading }),
    [appUser, firebaseUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
