"use client";

import { doc, serverTimestamp } from "firebase/firestore";
import { createBatch, createHouseholdDoc, db, deleteHouseholdDoc, updateHouseholdDoc } from "@/lib/firebase/firestore";
import { generateInstallments } from "@/lib/utils/calculations";
import type { CreditCard, CreditCardInstallment, CreditCardPurchase } from "@/types/finance";

export async function createCreditCard(data: Omit<CreditCard, "id" | "createdAt" | "updatedAt">) {
  return createHouseholdDoc("creditCards", data);
}

export async function updateCreditCard(id: string, data: Partial<CreditCard>) {
  return updateHouseholdDoc<CreditCard>("creditCards", id, data);
}

export async function deleteCreditCard(id: string) {
  return deleteHouseholdDoc("creditCards", id);
}

export async function createPurchaseWithInstallments(params: {
  purchase: Omit<CreditCardPurchase, "id" | "createdAt" | "updatedAt">;
  card: CreditCard;
}) {
  const purchaseId = crypto.randomUUID();
  const createdAt = new Date();
  const purchase: CreditCardPurchase = {
    ...params.purchase,
    id: purchaseId,
    createdAt,
    updatedAt: createdAt
  };
  const installments = generateInstallments({ purchase, dueDay: params.card.dueDay, createdAt });
  const batch = createBatch();
  const timestamp = serverTimestamp();

  batch.set(doc(db, "creditCardPurchases", purchaseId), {
    ...params.purchase,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  installments.forEach((installment) => {
    batch.set(doc(db, "creditCardInstallments", installment.id), {
      ...installment,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  });

  await batch.commit();
  return purchaseId;
}

export async function deletePurchaseAndInstallments(purchaseId: string, installments: CreditCardInstallment[]) {
  const batch = createBatch();
  batch.delete(doc(db, "creditCardPurchases", purchaseId));
  installments.filter((item) => item.purchaseId === purchaseId).forEach((item) => batch.delete(doc(db, "creditCardInstallments", item.id)));
  await batch.commit();
}

export async function updateInstallment(id: string, data: Partial<CreditCardInstallment>) {
  return updateHouseholdDoc<CreditCardInstallment>("creditCardInstallments", id, data);
}
