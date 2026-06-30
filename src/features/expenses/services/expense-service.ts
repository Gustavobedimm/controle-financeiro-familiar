"use client";

import { createHouseholdDoc, deleteHouseholdDoc, updateHouseholdDoc } from "@/lib/firebase/firestore";
import type { Expense } from "@/types/finance";

export async function createExpense(data: Omit<Expense, "id" | "createdAt" | "updatedAt">) {
  return createHouseholdDoc("expenses", data);
}

export async function updateExpense(id: string, data: Partial<Expense>) {
  return updateHouseholdDoc<Expense>("expenses", id, data);
}

export async function deleteExpense(id: string) {
  return deleteHouseholdDoc("expenses", id);
}
