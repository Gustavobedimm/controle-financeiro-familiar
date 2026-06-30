"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, listPersonalByHousehold } from "@/lib/firebase/firestore";
import { registerWithEmail } from "@/lib/firebase/auth";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import type { AppUser, ExpenseCategory } from "@/types/finance";

export interface CreateUserHouseholdResult {
  credential: Awaited<ReturnType<typeof registerWithEmail>>;
  setupWarning?: string;
}

export async function createUserHousehold(params: {
  name: string;
  email: string;
  password: string;
  householdName?: string;
}): Promise<CreateUserHouseholdResult> {
  const credential = await registerWithEmail(params.name, params.email, params.password);
  const householdId = crypto.randomUUID();
  const now = serverTimestamp();

  await setDoc(doc(db, "households", householdId), {
    name: params.householdName || `Casa de ${params.name}`,
    ownerUid: credential.user.uid,
    createdAt: now,
    updatedAt: now
  });

  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    name: params.name,
    email: params.email,
    householdId,
    role: "owner",
    createdAt: now,
    updatedAt: now
  });

  try {
    await Promise.all(
      DEFAULT_CATEGORIES.map((category) =>
        setDoc(doc(db, "expenseCategories", crypto.randomUUID()), {
          householdId,
          ownerUid: credential.user.uid,
          ...category,
          createdAt: now,
          updatedAt: now
        })
      )
    );

    return { credential };
  } catch {
    return {
      credential,
      setupWarning:
        "A conta foi criada, mas as categorias iniciais não puderam ser salvas. Confira as regras do Firestore e crie as categorias depois."
    };
  }
}

export async function ensureUserProfile(user: User) {
  const name = user.displayName || user.email?.split("@")[0] || "Usuário";
  const householdId = crypto.randomUUID();
  const now = serverTimestamp();

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      name,
      email: user.email || "",
      householdId,
      role: "owner",
      createdAt: now,
      updatedAt: now
    },
    { merge: true }
  );
}

export async function ensurePersonalDefaultCategories(user: AppUser) {
  const existing = await listPersonalByHousehold<ExpenseCategory>("expenseCategories", user.householdId, user.uid);
  if (existing.length > 0) return;

  const now = serverTimestamp();
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      setDoc(doc(db, "expenseCategories", crypto.randomUUID()), {
        householdId: user.householdId,
        ownerUid: user.uid,
        ...category,
        createdAt: now,
        updatedAt: now
      })
    )
  );
}
