"use client";

import { updateInstallment } from "@/features/credit-cards/services/card-service";
import type { CreditCardInstallment } from "@/types/finance";
import { todayIso } from "@/lib/utils/dates";

export async function markInvoiceAsPaid(installments: CreditCardInstallment[]) {
  await Promise.all(installments.map((item) => updateInstallment(item.id, { isPaid: true, paidAt: todayIso() })));
}
