"use client";

import { deleteField, doc, serverTimestamp } from "firebase/firestore";
import { createBatch, createHouseholdDoc, db, deleteHouseholdDoc, updateHouseholdDoc } from "@/lib/firebase/firestore";
import { generateInstallments } from "@/lib/utils/calculations";
import { addMonthsToReference, firstInvoiceMonthFromPurchase, isoDateForMonthDay, isPastDate, monthKey } from "@/lib/utils/dates";
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
  markPastDueAsPaid?: boolean;
}) {
  const purchaseId = crypto.randomUUID();
  const createdAt = new Date();
  const purchase: CreditCardPurchase = {
    ...params.purchase,
    id: purchaseId,
    createdAt,
    updatedAt: createdAt
  };
  const installments = generateInstallments({
    purchase,
    dueDay: params.card.dueDay,
    createdAt,
    markPastDueAsPaid: params.markPastDueAsPaid
  });
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

export async function updatePurchaseWithInstallments(params: {
  purchaseId: string;
  purchase: Omit<CreditCardPurchase, "id" | "createdAt" | "updatedAt">;
  card: CreditCard;
  installments: CreditCardInstallment[];
  markPastDueAsPaid?: boolean;
}) {
  const updatedAt = new Date();
  const purchase: CreditCardPurchase = {
    ...params.purchase,
    id: params.purchaseId,
    createdAt: updatedAt,
    updatedAt
  };
  const generatedInstallments = generateInstallments({
    purchase,
    dueDay: params.card.dueDay,
    createdAt: updatedAt,
    markPastDueAsPaid: params.markPastDueAsPaid
  });
  const existingInstallments = params.installments.filter((item) => item.purchaseId === params.purchaseId);
  const existingByNumber = new Map(existingInstallments.map((item) => [item.installmentNumber, item]));
  const generatedNumbers = new Set(generatedInstallments.map((item) => item.installmentNumber));
  const batch = createBatch();
  const timestamp = serverTimestamp();

  batch.update(doc(db, "creditCardPurchases", params.purchaseId), {
    ...params.purchase,
    updatedAt: timestamp
  });

  generatedInstallments.forEach((installment) => {
    const existing = existingByNumber.get(installment.installmentNumber);
    const isPaid = Boolean(existing?.isPaid || installment.isPaid);
    const paidAt = existing?.paidAt || installment.paidAt;
    const payloadBase = {
      ...installment,
      id: existing?.id || installment.id,
      isPaid,
      updatedAt: timestamp
    };
    delete (payloadBase as Record<string, unknown>).createdAt;

    if (existing) {
      batch.update(doc(db, "creditCardInstallments", existing.id), {
        ...payloadBase,
        ...(isPaid && paidAt ? { paidAt } : { paidAt: deleteField() })
      });
    } else {
      batch.set(doc(db, "creditCardInstallments", installment.id), {
        ...payloadBase,
        ...(isPaid && paidAt ? { paidAt } : {}),
        createdAt: timestamp
      });
    }
  });

  existingInstallments
    .filter((installment) => !generatedNumbers.has(installment.installmentNumber))
    .forEach((installment) => batch.delete(doc(db, "creditCardInstallments", installment.id)));

  await batch.commit();
  return generatedInstallments.length;
}

export async function updateInstallment(id: string, data: Partial<CreditCardInstallment>) {
  return updateHouseholdDoc<CreditCardInstallment>("creditCardInstallments", id, data);
}

export async function markPastDueInstallmentsAsPaid(installments: CreditCardInstallment[], todayIso: string) {
  const batch = createBatch();
  const items = installments.filter((item) => !item.isPaid && item.dueDate < todayIso);

  items.forEach((item) => {
    batch.update(doc(db, "creditCardInstallments", item.id), {
      isPaid: true,
      paidAt: item.dueDate,
      updatedAt: serverTimestamp()
    });
  });

  if (items.length > 0) await batch.commit();
  return items.length;
}

export async function recalculatePurchaseInstallmentsFromPurchaseDate(params: {
  purchase: CreditCardPurchase;
  card: CreditCard;
  installments: CreditCardInstallment[];
}) {
  const firstInvoice = firstInvoiceMonthFromPurchase(params.purchase.purchaseDate, params.card.closingDay, params.card.dueDay);
  const orderedInstallments = [...params.installments]
    .filter((item) => item.purchaseId === params.purchase.id)
    .sort((a, b) => a.installmentNumber - b.installmentNumber);
  const batch = createBatch();
  const timestamp = serverTimestamp();

  batch.update(doc(db, "creditCardPurchases", params.purchase.id), {
    firstInstallmentMonth: monthKey(firstInvoice),
    updatedAt: timestamp
  });

  orderedInstallments.forEach((installment) => {
    const reference = addMonthsToReference(firstInvoice, installment.installmentNumber - 1);
    const dueDate = isoDateForMonthDay(reference, params.card.dueDay);
    const shouldBePaid = isPastDate(dueDate);

    batch.update(doc(db, "creditCardInstallments", installment.id), {
      invoiceMonth: reference.month,
      invoiceYear: reference.year,
      dueDate,
      isPaid: shouldBePaid,
      paidAt: shouldBePaid ? dueDate : deleteField(),
      updatedAt: timestamp
    });
  });

  await batch.commit();
  return orderedInstallments.length;
}
