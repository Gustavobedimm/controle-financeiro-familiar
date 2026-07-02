export type TimestampLike = Date | string;

export type UserRole = "owner" | "member";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  householdId: string;
  role: UserRole;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type IncomeType = "salary" | "extra" | "other";
export type ExpenseCategoryType = "fixed" | "variable" | "card" | "other";
export type ExpenseType = "fixed" | "variable";

export interface Income {
  id: string;
  householdId: string;
  ownerUid: string;
  description: string;
  amount: number;
  type: IncomeType;
  receivedAt: string;
  isRecurring: boolean;
  recurrenceDay?: number;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface ExpenseCategory {
  id: string;
  householdId: string;
  ownerUid: string;
  name: string;
  type: ExpenseCategoryType;
  color: string;
  icon: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface Expense {
  id: string;
  householdId: string;
  ownerUid: string;
  description: string;
  amount: number;
  categoryId: string;
  type: ExpenseType;
  dueDate: string;
  paidAt?: string;
  isPaid: boolean;
  isRecurring: boolean;
  recurrenceDay?: number;
  notes?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface ExpensePayment {
  id: string;
  householdId: string;
  ownerUid: string;
  expenseId: string;
  month: number;
  year: number;
  isPaid: boolean;
  paidAt?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface CreditCard {
  id: string;
  householdId: string;
  ownerUid: string;
  name: string;
  closingDay: number;
  dueDay: number;
  limit: number;
  color: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface CreditCardPurchase {
  id: string;
  householdId: string;
  ownerUid: string;
  cardId: string;
  description: string;
  totalAmount: number;
  installments: number;
  firstInstallmentMonth: string;
  categoryId: string;
  purchaseDate: string;
  notes?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface CreditCardInstallment {
  id: string;
  householdId: string;
  ownerUid: string;
  cardId: string;
  purchaseId: string;
  description: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  invoiceMonth: number;
  invoiceYear: number;
  dueDate: string;
  isPaid: boolean;
  paidAt?: string;
  categoryId: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface MonthlyClosing {
  id: string;
  householdId: string;
  ownerUid: string;
  month: number;
  year: number;
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalCreditCardExpenses: number;
  expectedBalance: number;
  realBalance: number;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export type SavingsBoxYieldType = "none" | "cdi" | "fixed";
export type SavingsContributionType = "deposit" | "withdrawal" | "yield";

export interface SavingsBox {
  id: string;
  householdId: string;
  name: string;
  goalAmount?: number;
  targetDate?: string;
  institution?: string;
  yieldType: SavingsBoxYieldType;
  yieldPercent?: number;
  annualRate?: number;
  notes?: string;
  createdByUid: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface SavingsContribution {
  id: string;
  householdId: string;
  savingsBoxId: string;
  createdByUid: string;
  createdByName: string;
  amount: number;
  type: SavingsContributionType;
  contributedAt: string;
  notes?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface MonthReference {
  month: number;
  year: number;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalCreditCardExpenses: number;
  expectedBalance: number;
  realBalance: number;
}
