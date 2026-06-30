"use client";

import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { IncomeExpenseChart, BalanceLineChart } from "@/components/charts/basic-charts";
import { MonthSelector } from "@/components/forms/month-selector";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Badge } from "@/components/ui/badge";
import { StateMessage } from "@/components/feedback/state-message";
import { useHouseholdCollection } from "@/hooks/use-household-collection";
import { calculateMonthlySummary } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { currentMonthReference, nextMonths, readableMonth } from "@/lib/utils/dates";
import type { CreditCardInstallment, CreditCardPurchase, Expense, Income } from "@/types/finance";

export default function ProjectionsPage() {
  const [reference, setReference] = useState(currentMonthReference());
  const incomes = useHouseholdCollection<Income>("incomes");
  const expenses = useHouseholdCollection<Expense>("expenses");
  const installments = useHouseholdCollection<CreditCardInstallment>("creditCardInstallments");
  const purchases = useHouseholdCollection<CreditCardPurchase>("creditCardPurchases");

  const rows = useMemo(
    () =>
      nextMonths(reference, 12).map((month) =>
        calculateMonthlySummary({ reference: month, incomes: incomes.data, expenses: expenses.data, installments: installments.data })
      ),
    [expenses.data, incomes.data, installments.data, reference]
  );

  const chartData = rows.map((row) => ({
    month: readableMonth(row).slice(0, 3),
    receitas: row.totalIncome,
    despesas: row.totalFixedExpenses + row.totalVariableExpenses + row.totalCreditCardExpenses,
    saldo: row.expectedBalance
  }));

  const activePurchases = purchases.data
    .map((purchase) => {
      const last = installments.data
        .filter((item) => item.purchaseId === purchase.id)
        .sort((a, b) => a.invoiceYear - b.invoiceYear || a.invoiceMonth - b.invoiceMonth)
        .at(-1);
      return { purchase, last };
    })
    .filter((item) => item.last);

  const loading = incomes.loading || expenses.loading || installments.loading || purchases.loading;

  return (
    <ProtectedPage>
      <PageHeader title="Projeções" description="Veja os próximos 12 meses considerando recorrências e parcelas futuras.">
        <MonthSelector value={reference} onChange={setReference} />
      </PageHeader>
      {loading ? <StateMessage title="Calculando projeções..." /> : null}
      {!loading ? (
        <div className="grid gap-6">
          <section className="grid gap-4 xl:grid-cols-2">
            <IncomeExpenseChart data={chartData} />
            <BalanceLineChart data={chartData} />
          </section>
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-3">Mês</th>
                    <th className="p-3">Receitas</th>
                    <th className="p-3">Fixas</th>
                    <th className="p-3">Variáveis</th>
                    <th className="p-3">Cartão</th>
                    <th className="p-3">Saldo previsto</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.year}-${row.month}`} className="border-t border-border">
                      <td className="p-3 font-semibold capitalize">{readableMonth(row)}</td>
                      <td className="p-3">{formatCurrency(row.totalIncome)}</td>
                      <td className="p-3">{formatCurrency(row.totalFixedExpenses)}</td>
                      <td className="p-3">{formatCurrency(row.totalVariableExpenses)}</td>
                      <td className="p-3">{formatCurrency(row.totalCreditCardExpenses)}</td>
                      <td className="p-3 font-bold">{formatCurrency(row.expectedBalance)}</td>
                      <td className="p-3">
                        <Badge tone={row.expectedBalance < 0 ? "bad" : "good"}>
                          {row.expectedBalance < 0 ? "Negativo" : "Positivo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 font-bold"><AlertTriangle size={18} /> Término dos parcelamentos</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activePurchases.map(({ purchase, last }) => (
                <div key={purchase.id} className="rounded-md border border-border p-3">
                  <strong>{purchase.description}</strong>
                  <p className="text-sm text-muted-foreground">Termina em {last ? `${String(last.invoiceMonth).padStart(2, "0")}/${last.invoiceYear}` : "-"}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </ProtectedPage>
  );
}
