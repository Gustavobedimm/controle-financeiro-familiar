"use client";

import { createHouseholdDoc, deleteHouseholdDoc, updateHouseholdDoc } from "@/lib/firebase/firestore";
import type { SavingsBox, SavingsContribution } from "@/types/finance";

export async function createSavingsBox(data: Omit<SavingsBox, "id" | "createdAt" | "updatedAt">) {
  return createHouseholdDoc("savingsBoxes", data);
}

export async function updateSavingsBox(id: string, data: Partial<SavingsBox>) {
  return updateHouseholdDoc<SavingsBox>("savingsBoxes", id, data);
}

export async function deleteSavingsBox(id: string) {
  return deleteHouseholdDoc("savingsBoxes", id);
}

export async function createSavingsContribution(data: Omit<SavingsContribution, "id" | "createdAt" | "updatedAt">) {
  return createHouseholdDoc("savingsContributions", data);
}

export async function updateSavingsContribution(id: string, data: Partial<SavingsContribution>) {
  return updateHouseholdDoc<SavingsContribution>("savingsContributions", id, data);
}

export async function deleteSavingsContribution(id: string) {
  return deleteHouseholdDoc("savingsContributions", id);
}
