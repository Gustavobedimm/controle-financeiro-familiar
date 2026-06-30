import type {
  CreditCardInstallment,
  CreditCardPurchase,
  Expense,
  Income,
  MonthReference,
  MonthlySummary
} from "@/types/finance";
import { addMonthsToReference, dateBelongsToMonth, isoDateForMonthDay, isPastDate, monthKey } from "./dates";
import { roundMoney } from "./currency";

function recurringStartedBefore(date: string, reference: MonthReference): boolean {
  return monthKey({
    month: new Date(`${date}T00:00:00`).getMonth() + 1,
    year: new Date(`${date}T00:00:00`).getFullYear()
  }) <= monthKey(reference);
}

export function incomeOccursInMonth(income: Income, reference: MonthReference): boolean {
  if (dateBelongsToMonth(income.receivedAt, reference)) return true;
  return income.isRecurring && recurringStartedBefore(income.receivedAt, reference);
}

export function expenseOccursInMonth(expense: Expense, reference: MonthReference): boolean {
  if (dateBelongsToMonth(expense.dueDate, reference)) return true;
  return expense.isRecurring && recurringStartedBefore(expense.dueDate, reference);
}

export function generateInstallments(input: {
  purchase: CreditCardPurchase;
  dueDay: number;
  createdAt: Date;
  markPastDueAsPaid?: boolean;
}): CreditCardInstallment[] {
  const baseAmount = Math.floor((input.purchase.totalAmount / input.purchase.installments) * 100) / 100;
  const remainder = roundMoney(input.purchase.totalAmount - baseAmount * input.purchase.installments);
  const [year, month] = input.purchase.firstInstallmentMonth.split("-").map(Number);

  return Array.from({ length: input.purchase.installments }, (_, index) => {
    const reference = addMonthsToReference({ month, year }, index);
    const amount = index === input.purchase.installments - 1 ? roundMoney(baseAmount + remainder) : baseAmount;
    const dueDate = isoDateForMonthDay(reference, input.dueDay);
    const isPaid = Boolean(input.markPastDueAsPaid && isPastDate(dueDate));

    return {
      id: `${input.purchase.id}-${index + 1}`,
      householdId: input.purchase.householdId,
      ownerUid: input.purchase.ownerUid,
      cardId: input.purchase.cardId,
      purchaseId: input.purchase.id,
      description: input.purchase.description,
      installmentNumber: index + 1,
      totalInstallments: input.purchase.installments,
      amount,
      invoiceMonth: reference.month,
      invoiceYear: reference.year,
      dueDate,
      isPaid,
      ...(isPaid ? { paidAt: dueDate } : {}),
      categoryId: input.purchase.categoryId,
      createdAt: input.createdAt,
      updatedAt: input.createdAt
    };
  });
}

export function calculateMonthlySummary(params: {
  reference: MonthReference;
  incomes: Income[];
  expenses: Expense[];
  installments: CreditCardInstallment[];
}): MonthlySummary {
  const monthIncomes = params.incomes.filter((income) => incomeOccursInMonth(income, params.reference));
  const monthExpenses = params.expenses.filter((expense) => expenseOccursInMonth(expense, params.reference));
  const monthInstallments = params.installments.filter(
    (installment) => installment.invoiceMonth === params.reference.month && installment.invoiceYear === params.reference.year
  );

  const totalIncome = roundMoney(monthIncomes.reduce((total, income) => total + income.amount, 0));
  const totalFixedExpenses = roundMoney(
    monthExpenses.filter((expense) => expense.type === "fixed").reduce((total, expense) => total + expense.amount, 0)
  );
  const totalVariableExpenses = roundMoney(
    monthExpenses.filter((expense) => expense.type === "variable").reduce((total, expense) => total + expense.amount, 0)
  );
  const totalCreditCardExpenses = roundMoney(monthInstallments.reduce((total, item) => total + item.amount, 0));
  const expectedBalance = roundMoney(totalIncome - totalFixedExpenses - totalVariableExpenses - totalCreditCardExpenses);
  const paidExpenses = monthExpenses.filter((expense) => expense.isPaid).reduce((total, expense) => total + expense.amount, 0);
  const paidInstallments = monthInstallments
    .filter((installment) => installment.isPaid)
    .reduce((total, installment) => total + installment.amount, 0);
  const realBalance = roundMoney(totalIncome - paidExpenses - paidInstallments);

  return {
    month: params.reference.month,
    year: params.reference.year,
    totalIncome,
    totalFixedExpenses,
    totalVariableExpenses,
    totalCreditCardExpenses,
    expectedBalance,
    realBalance
  };
}
