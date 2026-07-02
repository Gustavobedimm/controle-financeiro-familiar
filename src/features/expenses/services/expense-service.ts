"use client";

import { deleteField } from "firebase/firestore";
import { createHouseholdDoc, deleteHouseholdDoc, updateHouseholdDoc } from "@/lib/firebase/firestore";
import { todayIso } from "@/lib/utils/dates";
import type { Expense } from "@/types/finance";

export async function createExpense(data: Omit<Expense, "id" | "createdAt" | "updatedAt">) {
  return createHouseholdDoc("expenses", data);
}

export async function updateExpense(id: string, data: Partial<Expense>) {
  return updateHouseholdDoc<Expense>("expenses", id, data);
}

export async function markExpenseAsPaid(id: string, paidAt = todayIso()) {
  return updateHouseholdDoc<Expense>("expenses", id, { isPaid: true, paidAt });
}

export async function markExpenseAsOpen(id: string) {
  return updateHouseholdDoc<Expense>("expenses", id, {
    isPaid: false,
    paidAt: deleteField()
  } as unknown as Partial<Expense>);
}

export async function deleteExpense(id: string) {
  return deleteHouseholdDoc("expenses", id);
}
