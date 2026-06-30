"use client";

import { createHouseholdDoc, deleteHouseholdDoc, updateHouseholdDoc } from "@/lib/firebase/firestore";
import type { Income } from "@/types/finance";

export async function createIncome(data: Omit<Income, "id" | "createdAt" | "updatedAt">) {
  return createHouseholdDoc("incomes", data);
}

export async function updateIncome(id: string, data: Partial<Income>) {
  return updateHouseholdDoc<Income>("incomes", id, data);
}

export async function deleteIncome(id: string) {
  return deleteHouseholdDoc("incomes", id);
}
