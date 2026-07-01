"use client";

import { CheckCircle2, CreditCard, Plus, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { CategorySelect } from "@/components/forms/category-select";
import { DatePicker } from "@/components/forms/date-picker";
import { MoneyInput } from "@/components/forms/money-input";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateMessage } from "@/components/feedback/state-message";
import { createPurchaseWithInstallments } from "@/features/credit-cards/services/card-service";
import { createExpense } from "@/features/expenses/services/expense-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { formatCurrency } from "@/lib/utils/currency";
import { firstInvoiceMonthFromPurchase, monthKey, todayIso } from "@/lib/utils/dates";
import type { CreditCard as CreditCardType, CreditCardInstallment, Expense, ExpenseCategory } from "@/types/finance";

type PaymentMethod = "credit" | "pix" | "debit" | "cash";

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "credit", label: "Crédito à vista" },
  { value: "pix", label: "Pix" },
  { value: "debit", label: "Débito" },
  { value: "cash", label: "Dinheiro" }
];

const methodLabels: Record<PaymentMethod, string> = {
  credit: "Crédito",
  pix: "Pix",
  debit: "Débito",
  cash: "Dinheiro"
};

const blankForm = {
  paymentMethod: "pix" as PaymentMethod,
  cardId: "",
  description: "",
  amount: 0,
  spentAt: todayIso(),
  categoryId: "",
  notes: ""
};

export default function QuickExpensesPage() {
  const cards = usePersonalCollection<CreditCardType>("creditCards");
  const categories = usePersonalCollection<ExpenseCategory>("expenseCategories");
  const expenses = usePersonalCollection<Expense>("expenses");
  const installments = usePersonalCollection<CreditCardInstallment>("creditCardInstallments");
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const directExpenses = useMemo(
    () =>
      expenses.data
        .filter((expense) => !expense.isRecurring && expense.type === "variable")
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
        .slice(0, 5),
    [expenses.data]
  );

  const creditItems = useMemo(
    () =>
      installments.data
        .filter((item) => item.totalInstallments === 1)
        .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
        .slice(0, 5),
    [installments.data]
  );

  function resetForm() {
    setForm({ ...blankForm, spentAt: todayIso() });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!cards.householdId || !cards.ownerUid) return;

    setSaving(true);
    setMessage("");

    try {
      const categoryId = form.categoryId || categories.data[0]?.id || "";
      const amount = Number(form.amount);

      if (form.paymentMethod === "credit") {
        const card = cards.data.find((item) => item.id === form.cardId) || cards.data[0];
        if (!card) {
          setMessage("Cadastre um cartão antes de lançar no crédito.");
          return;
        }

        const firstInvoice = firstInvoiceMonthFromPurchase(form.spentAt, card.closingDay, card.dueDay);
        await createPurchaseWithInstallments({
          card,
          purchase: {
            householdId: cards.householdId,
            ownerUid: cards.ownerUid,
            cardId: card.id,
            description: form.description,
            totalAmount: amount,
            installments: 1,
            firstInstallmentMonth: monthKey(firstInvoice),
            categoryId,
            purchaseDate: form.spentAt,
            notes: form.notes
          }
        });
      } else {
        await createExpense({
          householdId: cards.householdId,
          ownerUid: cards.ownerUid,
          description: form.description,
          amount,
          categoryId,
          type: "variable",
          dueDate: form.spentAt,
          paidAt: form.spentAt,
          isPaid: true,
          isRecurring: false,
          recurrenceDay: new Date(`${form.spentAt}T00:00:00`).getDate(),
          notes: [methodLabels[form.paymentMethod], form.notes].filter(Boolean).join(" · ")
        });
      }

      resetForm();
      setMessage("Lançamento registrado.");
      await Promise.all([expenses.reload(), installments.reload()]);
    } finally {
      setSaving(false);
    }
  }

  const selectedCardId = form.cardId || cards.data[0]?.id || "";
  const loading = cards.loading || categories.loading || expenses.loading || installments.loading;

  return (
    <ProtectedPage>
      <PageHeader title="Lançamentos rápidos" description="Registre gastos simples no cartão ou direto como despesa paga." />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form className="grid gap-4 rounded-lg border border-border bg-card p-4" onSubmit={handleSubmit}>
          <Select
            label="Forma de pagamento"
            value={form.paymentMethod}
            onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as PaymentMethod })}
            options={paymentOptions}
          />
          {form.paymentMethod === "credit" ? (
            <Select
              label="Cartão"
              value={selectedCardId}
              onChange={(event) => setForm({ ...form, cardId: event.target.value })}
              options={cards.data.map((card) => ({ value: card.id, label: card.name }))}
              disabled={!cards.data.length}
            />
          ) : null}
          <Input label="Descrição" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          <MoneyInput label="Valor" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} required />
          <DatePicker label="Data" value={form.spentAt} onChange={(event) => setForm({ ...form, spentAt: event.target.value })} />
          <CategorySelect label="Categoria" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} categories={categories.data} />
          <Input label="Observação" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <Button disabled={saving || (form.paymentMethod === "credit" && !cards.data.length)}>
            <Plus size={18} /> {saving ? "Salvando..." : "Registrar lançamento"}
          </Button>
          {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
        </form>

        <section className="grid gap-4">
          {loading ? <StateMessage title="Carregando lançamentos..." /> : null}

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <ReceiptText size={18} />
              <h2 className="font-bold">Despesas diretas recentes</h2>
            </div>
            {directExpenses.length === 0 ? <StateMessage title="Nenhuma despesa direta recente." /> : null}
            <div className="grid gap-2">
              {directExpenses.map((expense) => (
                <div key={expense.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong>{expense.description}</strong>
                    <p className="text-sm text-muted-foreground">{expense.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>{formatCurrency(expense.amount)}</strong>
                    <Badge tone="good">Pago</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={18} />
              <h2 className="font-bold">Crédito à vista recente</h2>
            </div>
            {creditItems.length === 0 ? <StateMessage title="Nenhuma compra no crédito à vista recente." /> : null}
            <div className="grid gap-2">
              {creditItems.map((item) => {
                const card = cards.data.find((entry) => entry.id === item.cardId);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    style={{ borderLeftColor: card?.color || undefined, borderLeftWidth: card ? 6 : undefined }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{item.description}</strong>
                        {card ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: card.color }} />
                            {card.name}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">Fatura {String(item.invoiceMonth).padStart(2, "0")}/{item.invoiceYear}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>{formatCurrency(item.amount)}</strong>
                      <Badge tone={item.isPaid ? "good" : "warn"}>{item.isPaid ? "Pago" : "Aberto"}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!loading && message ? (
            <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 p-4 text-sm font-semibold text-primary">
              <CheckCircle2 size={18} /> {message}
            </div>
          ) : null}
        </section>
      </div>
    </ProtectedPage>
  );
}
