"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint
} from "firebase/firestore";
import { firebaseApp } from "./client";

export const db = getFirestore(firebaseApp);

export function nowFields() {
  return { createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
}

export function updatedField() {
  return { updatedAt: serverTimestamp() };
}

function withoutUndefinedFields<T extends DocumentData>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;
}

export async function listByHousehold<T extends { id: string }>(
  collectionName: string,
  householdId: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where("householdId", "==", householdId), ...constraints)
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export async function listPersonalByHousehold<T extends { id: string }>(
  collectionName: string,
  householdId: string,
  ownerUid: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const snapshot = await getDocs(
    query(
      collection(db, collectionName),
      where("householdId", "==", householdId),
      where("ownerUid", "==", ownerUid),
      ...constraints
    )
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export async function createHouseholdDoc<T extends DocumentData>(collectionName: string, data: T): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), { ...withoutUndefinedFields(data), ...nowFields() });
  return ref.id;
}

export async function updateHouseholdDoc<T extends DocumentData>(collectionName: string, id: string, data: Partial<T>) {
  await updateDoc(doc(db, collectionName, id), { ...withoutUndefinedFields(data), ...updatedField() });
}

export async function deleteHouseholdDoc(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const snapshot = await getDoc(doc(db, collectionName, id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
}

export async function setDocument<T extends DocumentData>(collectionName: string, id: string, data: T) {
  await setDoc(doc(db, collectionName, id), { ...withoutUndefinedFields(data), ...nowFields() });
}

export function createBatch() {
  return writeBatch(db);
}
