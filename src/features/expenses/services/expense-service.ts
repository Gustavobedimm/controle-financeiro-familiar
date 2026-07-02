"use client";

import { deleteField, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { createHouseholdDoc, db, deleteHouseholdDoc, updateHouseholdDoc } from "@/lib/firebase/firestore";
import { todayIso } from "@/lib/utils/dates";
import type { Expense, MonthReference } from "@/types/finance";

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

function expensePaymentId(expenseId: string, reference: MonthReference) {
  return `${expenseId}-${reference.year}-${String(reference.month).padStart(2, "0")}`;
}

export async function markExpenseMonthAsPaid(params: {
  expense: Expense;
  reference: MonthReference;
  paidAt?: string;
}) {
  const paidAt = params.paidAt || todayIso();
  const id = expensePaymentId(params.expense.id, params.reference);

  await setDoc(
    doc(db, "expensePayments", id),
    {
      householdId: params.expense.householdId,
      ownerUid: params.expense.ownerUid,
      expenseId: params.expense.id,
      month: params.reference.month,
      year: params.reference.year,
      isPaid: true,
      paidAt,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function markExpenseMonthAsOpen(params: {
  expense: Expense;
  reference: MonthReference;
}) {
  const id = expensePaymentId(params.expense.id, params.reference);

  await setDoc(
    doc(db, "expensePayments", id),
    {
      householdId: params.expense.householdId,
      ownerUid: params.expense.ownerUid,
      expenseId: params.expense.id,
      month: params.reference.month,
      year: params.reference.year,
      isPaid: false,
      paidAt: deleteField(),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function deleteExpense(id: string) {
  return deleteHouseholdDoc("expenses", id);
}
