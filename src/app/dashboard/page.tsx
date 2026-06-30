"use client";

import { AlertTriangle, Banknote, CreditCard, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { SummaryCard } from "@/components/cards/summary-card";
import { CategoryPieChart, IncomeExpenseChart, BalanceLineChart } from "@/components/charts/basic-charts";
import { StateMessage } from "@/components/feedback/state-message";
import { MonthSelector } from "@/components/forms/month-selector";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Badge } from "@/components/ui/badge";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { calculateMonthlySummary } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { currentMonthReference, nextMonths, readableMonth } from "@/lib/utils/dates";
import type { CreditCardInstallment, Expense, ExpenseCategory, Income } from "@/types/finance";

export default function DashboardPage() {
  const [reference, setReference] = useState(currentMonthReference());
  const incomes = usePersonalCollection<Income>("incomes");
  const expenses = usePersonalCollection<Expense>("expenses");
  const installments = usePersonalCollection<CreditCardInstallment>("creditCardInstallments");
  const categories = usePersonalCollection<ExpenseCategory>("expenseCategories");

  const summary = useMemo(
    () =>
      calculateMonthlySummary({
        reference,
        incomes: incomes.data,
        expenses: expenses.data,
        installments: installments.data
      }),
    [expenses.data, incomes.data, installments.data, reference]
  );

  const projectionData = nextMonths(reference, 6).map((month) => {
    const item = calculateMonthlySummary({ reference: month, incomes: incomes.data, expenses: expenses.data, installments: installments.data });
    return {
      month: readableMonth(month).slice(0, 3),
      receitas: item.totalIncome,
      despesas: item.totalFixedExpenses + item.totalVariableExpenses + item.totalCreditCardExpenses,
      saldo: item.expectedBalance
    };
  });

  const categoryData = categories.data
    .map((category) => ({
      name: category.name,
      color: category.color,
      value:
        expenses.data.filter((expense) => expense.categoryId === category.id).reduce((total, expense) => total + expense.amount, 0) +
        installments.data.filter((item) => item.categoryId === category.id).reduce((total, item) => total + item.amount, 0)
    }))
    .filter((item) => item.value > 0);

  const committedFuture = installments.data
    .filter((item) => item.invoiceYear > reference.year || (item.invoiceYear === reference.year && item.invoiceMonth > reference.month))
    .reduce((total, item) => total + item.amount, 0);

  const loading = incomes.loading || expenses.loading || installments.loading || categories.loading;

  return (
    <ProtectedPage>
      <PageHeader title="Dashboard mensal" description="Acompanhe o saldo previsto e o que já foi pago no mês.">
        <MonthSelector value={reference} onChange={setReference} />
      </PageHeader>

      {loading ? <StateMessage title="Carregando dados financeiros..." /> : null}

      {!loading ? (
        <div className="grid gap-6">
          {summary.expectedBalance < 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-coral/25 bg-coral/10 p-4 text-coral">
              <AlertTriangle size={20} />
              <p className="text-sm font-semibold">Saldo previsto negativo para este mês.</p>
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard title="Receitas" value={summary.totalIncome} icon={Banknote} tone="good" />
            <SummaryCard title="Fixas" value={summary.totalFixedExpenses} icon={Receipt} />
            <SummaryCard title="Variáveis" value={summary.totalVariableExpenses} icon={Wallet} />
            <SummaryCard title="Cartão" value={summary.totalCreditCardExpenses} icon={CreditCard} />
            <SummaryCard title="Saldo previsto" value={summary.expectedBalance} icon={TrendingUp} tone={summary.expectedBalance < 0 ? "bad" : "good"} />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-black/10 bg-white p-4">
              <p className="text-sm text-ink/60">Saldo real</p>
              <strong className="mt-1 block text-2xl">{formatCurrency(summary.realBalance)}</strong>
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-4">
              <p className="text-sm text-ink/60">Comprometido em parcelas futuras</p>
              <strong className="mt-1 block text-2xl">{formatCurrency(committedFuture)}</strong>
            </div>
            <div className="rounded-lg border border-black/10 bg-white p-4">
              <p className="text-sm text-ink/60">Renda comprometida</p>
              <strong className="mt-1 block text-2xl">
                {summary.totalIncome ? Math.round(((summary.totalIncome - summary.expectedBalance) / summary.totalIncome) * 100) : 0}%
              </strong>
              <Badge tone={summary.expectedBalance < 0 ? "bad" : "good"}>{summary.expectedBalance < 0 ? "Atenção" : "Dentro do previsto"}</Badge>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <CategoryPieChart data={categoryData} />
            <IncomeExpenseChart data={projectionData} />
            <BalanceLineChart data={projectionData} />
          </section>
        </div>
      ) : null}
    </ProtectedPage>
  );
}
