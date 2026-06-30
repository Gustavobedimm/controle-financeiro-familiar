"use client";

import { createHouseholdDoc, deleteHouseholdDoc, updateHouseholdDoc } from "@/lib/firebase/firestore";
import type { ExpenseCategory } from "@/types/finance";

export async function createCategory(data: Omit<ExpenseCategory, "id" | "createdAt" | "updatedAt">) {
  return createHouseholdDoc("expenseCategories", data);
}

export async function updateCategory(id: string, data: Partial<ExpenseCategory>) {
  return updateHouseholdDoc<ExpenseCategory>("expenseCategories", id, data);
}

export async function deleteCategory(id: string) {
  return deleteHouseholdDoc("expenseCategories", id);
}
