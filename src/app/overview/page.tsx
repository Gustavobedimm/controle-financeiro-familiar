"use client";

import { CheckCircle2, Circle, CreditCard as CreditCardIcon, Receipt } from "lucide-react";
import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Badge } from "@/components/ui/badge";
import { StateMessage } from "@/components/feedback/state-message";
import { markInstallmentAsOpen, updateInstallment } from "@/features/credit-cards/services/card-service";
import {
  markExpenseAsOpen,
  markExpenseAsPaid,
  markExpenseMonthAsOpen,
  markExpenseMonthAsPaid
} from "@/features/expenses/services/expense-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { expenseDueDateInMonth, expenseOccursInMonth, isExpensePaidInMonth } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { addMonthsToReference, currentMonthReference, readableMonth, todayIso } from "@/lib/utils/dates";
import type { CreditCard, CreditCardInstallment, Expense, ExpensePayment, MonthReference } from "@/types/finance";

type OverviewRow = {
  id: string;
  kind: "expense" | "card";
  title: string;
  subtitle: string;
  color?: string;
  cells: Array<OverviewCell | null>;
};

type OverviewCell = {
  key: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  toggle: () => Promise<void>;
};

function shortMonth(reference: MonthReference) {
  return readableMonth(reference).slice(0, 3);
}

export default function OverviewPage() {
  const expenses = usePersonalCollection<Expense>("expenses");
  const expensePayments = usePersonalCollection<ExpensePayment>("expensePayments");
  const installments = usePersonalCollection<CreditCardInstallment>("creditCardInstallments");
  const cards = usePersonalCollection<CreditCard>("creditCards");

  const months = useMemo(() => {
    const current = currentMonthReference();
    return [-2, -1, 0, 1, 2].map((offset) => addMonthsToReference(current, offset));
  }, []);

  const rows = useMemo<OverviewRow[]>(() => {
    const expenseRows = expenses.data
      .map((expense) => {
        const cells = months.map((reference) => {
          if (!expenseOccursInMonth(expense, reference)) return null;
          const isPaid = isExpensePaidInMonth(expense, reference, expensePayments.data);
          const dueDate = expenseDueDateInMonth(expense, reference);

          return {
            key: `${expense.id}-${reference.year}-${reference.month}`,
            amount: expense.amount,
            dueDate,
            isPaid,
            toggle: async () => {
              if (expense.isRecurring) {
                if (isPaid) await markExpenseMonthAsOpen({ expense, reference });
                else await markExpenseMonthAsPaid({ expense, reference, paidAt: dueDate });
                await expensePayments.reload();
                return;
              }

              if (isPaid) await markExpenseAsOpen(expense.id);
              else await markExpenseAsPaid(expense.id, dueDate);
              await expenses.reload();
            }
          };
        });

        return {
          id: `expense-${expense.id}`,
          kind: "expense" as const,
          title: expense.description,
          subtitle: expense.type === "fixed" ? "Despesa fixa" : "Despesa variável",
          cells
        };
      })
      .filter((row) => row.cells.some(Boolean));

    const installmentsByPurchase = new Map<string, CreditCardInstallment[]>();
    installments.data.forEach((installment) => {
      const purchaseInstallments = installmentsByPurchase.get(installment.purchaseId) || [];
      purchaseInstallments.push(installment);
      installmentsByPurchase.set(installment.purchaseId, purchaseInstallments);
    });

    const cardRows = Array.from(installmentsByPurchase.entries())
      .map(([purchaseId, purchaseInstallments]) => {
        const ordered = purchaseInstallments.sort((a, b) => a.installmentNumber - b.installmentNumber);
        const first = ordered[0];
        const card = cards.data.find((entry) => entry.id === first.cardId);
        const cells = months.map((reference) => {
          const installment = ordered.find((item) => item.invoiceMonth === reference.month && item.invoiceYear === reference.year);
          if (!installment) return null;

          return {
            key: installment.id,
            amount: installment.amount,
            dueDate: installment.dueDate,
            isPaid: installment.isPaid,
            toggle: async () => {
              if (installment.isPaid) await markInstallmentAsOpen(installment.id);
              else await updateInstallment(installment.id, { isPaid: true, paidAt: todayIso() });
              await installments.reload();
            }
          };
        });

        return {
          id: `card-${purchaseId}`,
          kind: "card" as const,
          title: first.description,
          subtitle: card ? `Cartão ${card.name}` : "Cartão de crédito",
          color: card?.color,
          cells
        };
      })
      .filter((row) => row.cells.some(Boolean));

    return [...expenseRows, ...cardRows].sort((a, b) => a.title.localeCompare(b.title));
  }, [cards.data, expensePayments, expensePayments.data, expenses, expenses.data, installments, installments.data, months]);

  const totals = months.map((_, monthIndex) =>
    rows.reduce((total, row) => total + (row.cells[monthIndex]?.amount || 0), 0)
  );
  const paidTotals = months.map((_, monthIndex) =>
    rows.reduce((total, row) => {
      const cell = row.cells[monthIndex];
      return total + (cell?.isPaid ? cell.amount : 0);
    }, 0)
  );

  const loading = expenses.loading || expensePayments.loading || installments.loading || cards.loading;

  return (
    <ProtectedPage>
      <PageHeader title="Visão rápida" description="Acompanhe pagamentos dois meses para trás e dois meses para frente." />
      {loading ? <StateMessage title="Montando visão rápida..." /> : null}
      {!loading ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="w-[280px] p-3">Pagamento</th>
                  {months.map((month) => (
                    <th key={`${month.year}-${month.month}`} className="p-3 text-center capitalize">
                      <span className="block font-bold text-foreground">{shortMonth(month)}</span>
                      <span className="text-xs">{month.year}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={months.length + 1}>
                      <StateMessage title="Nenhum pagamento encontrado nesta janela." />
                    </td>
                  </tr>
                ) : null}
                {rows.map((row) => {
                  const Icon = row.kind === "card" ? CreditCardIcon : Receipt;

                  return (
                    <tr key={row.id} className="border-t border-border">
                      <td className="p-3 align-middle">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"
                            style={row.color ? { color: row.color } : undefined}
                          >
                            <Icon size={18} />
                          </span>
                          <div className="min-w-0">
                            <strong className="block truncate">{row.title}</strong>
                            <span className="block truncate text-xs text-muted-foreground">{row.subtitle}</span>
                          </div>
                        </div>
                      </td>
                      {row.cells.map((cell, index) => (
                        <td key={`${row.id}-${months[index].year}-${months[index].month}`} className="p-2 align-middle">
                          {cell ? (
                            <button
                              type="button"
                              onClick={cell.toggle}
                              className={`grid h-24 w-full place-items-center rounded-md border p-2 text-center transition ${
                                cell.isPaid
                                  ? "border-primary/40 bg-primary/15 text-primary"
                                  : "border-border bg-background text-foreground hover:bg-accent/20"
                              }`}
                              title={cell.isPaid ? "Clique para reabrir" : "Clique para marcar como pago"}
                            >
                              <span className="grid gap-1">
                                <strong>{formatCurrency(cell.amount)}</strong>
                                <span className="text-xs text-muted-foreground">{cell.dueDate.slice(8, 10)}</span>
                                <span className="flex items-center justify-center gap-1 text-xs font-semibold">
                                  {cell.isPaid ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                  {cell.isPaid ? "Pago" : "Aberto"}
                                </span>
                              </span>
                            </button>
                          ) : (
                            <div className="h-24 rounded-md border border-dashed border-border bg-muted/30" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-border bg-muted/60">
                <tr>
                  <td className="p-3 font-bold">Total previsto</td>
                  {totals.map((total, index) => (
                    <td key={`total-${months[index].year}-${months[index].month}`} className="p-3 text-center font-bold">
                      {formatCurrency(total)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-bold">Total pago</td>
                  {paidTotals.map((total, index) => (
                    <td key={`paid-${months[index].year}-${months[index].month}`} className="p-3 text-center">
                      <Badge tone={total === totals[index] && total > 0 ? "good" : "neutral"}>{formatCurrency(total)}</Badge>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : null}
    </ProtectedPage>
  );
}
