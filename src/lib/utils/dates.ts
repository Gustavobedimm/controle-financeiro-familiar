import { addMonths, endOfMonth, format, isSameMonth, parseISO, setDate, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MonthReference } from "@/types/finance";

export function currentMonthReference(): MonthReference {
  const today = new Date();
  return { month: today.getMonth() + 1, year: today.getFullYear() };
}

export function monthKey({ month, year }: MonthReference): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function readableMonth({ month, year }: MonthReference): string {
  return format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });
}

export function isoDateForMonthDay({ month, year }: MonthReference, day: number): string {
  const base = new Date(year, month - 1, 1);
  const lastDay = endOfMonth(base).getDate();
  return format(setDate(base, Math.min(day, lastDay)), "yyyy-MM-dd");
}

export function dateBelongsToMonth(date: string, reference: MonthReference): boolean {
  return isSameMonth(parseISO(date), new Date(reference.year, reference.month - 1, 1));
}

export function addMonthsToReference(reference: MonthReference, amount: number): MonthReference {
  const next = addMonths(startOfMonth(new Date(reference.year, reference.month - 1, 1)), amount);
  return { month: next.getMonth() + 1, year: next.getFullYear() };
}

export function firstInvoiceMonthFromPurchase(purchaseDate: string, closingDay: number, dueDay: number): MonthReference {
  const date = parseISO(purchaseDate);
  const purchaseReference = { month: date.getMonth() + 1, year: date.getFullYear() };
  const closingReference = date.getDate() <= closingDay ? purchaseReference : addMonthsToReference(purchaseReference, 1);

  // A fatura é paga no vencimento posterior ao fechamento.
  return dueDay > closingDay ? closingReference : addMonthsToReference(closingReference, 1);
}

export function isPastDate(date: string): boolean {
  return parseISO(date) < startOfMonth(new Date()) || date < todayIso();
}

export function nextMonths(reference: MonthReference, count: number): MonthReference[] {
  return Array.from({ length: count }, (_, index) => addMonthsToReference(reference, index));
}

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}
