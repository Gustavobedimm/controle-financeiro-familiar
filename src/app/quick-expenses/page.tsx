"use client";

import { CheckCircle2, Plus, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { CategorySelect } from "@/components/forms/category-select";
import { DatePicker } from "@/components/forms/date-picker";
import { FloatingFormCard } from "@/components/forms/floating-form-card";
import { MoneyInput } from "@/components/forms/money-input";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateMessage } from "@/components/feedback/state-message";
import { createExpense, markExpenseAsOpen, markExpenseAsPaid } from "@/features/expenses/services/expense-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { formatCurrency } from "@/lib/utils/currency";
import { todayIso } from "@/lib/utils/dates";
import type { Expense, ExpenseCategory } from "@/types/finance";

type PaymentMethod = "pix" | "debit" | "cash";

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "debit", label: "Débito" },
  { value: "cash", label: "Dinheiro" }
];

const methodLabels: Record<PaymentMethod, string> = { pix: "Pix", debit: "Débito", cash: "Dinheiro" };
const blankForm = { paymentMethod: "pix" as PaymentMethod, description: "", amount: 0, spentAt: todayIso(), isPaid: true, categoryId: "", notes: "" };

export default function QuickExpensesPage() {
  const categories = usePersonalCollection<ExpenseCategory>("expenseCategories");
  const expenses = usePersonalCollection<Expense>("expenses");
  const [form, setForm] = useState(blankForm);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const recentExpenses = useMemo(
    () => expenses.data.filter((expense) => !expense.isRecurring && expense.type === "variable").sort((a, b) => b.dueDate.localeCompare(a.dueDate)).slice(0, 8),
    [expenses.data]
  );

  function resetForm() {
    setForm({ ...blankForm, spentAt: todayIso() });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!expenses.householdId || !expenses.ownerUid) return;
    setSaving(true);
    setMessage("");
    try {
      await createExpense({
        householdId: expenses.householdId,
        ownerUid: expenses.ownerUid,
        description: form.description,
        amount: Number(form.amount),
        categoryId: form.categoryId || categories.data[0]?.id || "",
        type: "variable",
        dueDate: form.spentAt,
        ...(form.isPaid ? { paidAt: form.spentAt } : {}),
        isPaid: form.isPaid,
        isRecurring: false,
        recurrenceDay: new Date(`${form.spentAt}T00:00:00`).getDate(),
        notes: [methodLabels[form.paymentMethod], form.notes].filter(Boolean).join(" · ")
      });
      resetForm();
      setFormOpen(false);
      setMessage("Despesa registrada.");
      await expenses.reload();
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(expense: Expense) {
    if (expense.isPaid) await markExpenseAsOpen(expense.id);
    else await markExpenseAsPaid(expense.id);
    await expenses.reload();
  }

  return (
    <ProtectedPage>
      <PageHeader title="Lançar Pix ou dinheiro" description="Use esta tela somente para despesas pagas fora do cartão de crédito.">
        <Button type="button" onClick={() => { resetForm(); setFormOpen(true); }}><Plus size={18} /> Nova despesa</Button>
      </PageHeader>

      <FloatingFormCard title="Nova despesa direta" open={formOpen} onOpenChange={setFormOpen}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Select label="Forma de pagamento" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as PaymentMethod })} options={paymentOptions} />
          <Input label="Descrição" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          <MoneyInput label="Valor" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} required />
          <DatePicker label="Data" value={form.spentAt} onChange={(event) => setForm({ ...form, spentAt: event.target.value })} />
          <Select label="Status" value={form.isPaid ? "paid" : "open"} onChange={(event) => setForm({ ...form, isPaid: event.target.value === "paid" })} options={[{ value: "paid", label: "Pago" }, { value: "open", label: "Em aberto" }]} />
          <CategorySelect label="Categoria" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} categories={categories.data} />
          <Input label="Observação" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <Button disabled={saving}><Plus size={18} /> {saving ? "Salvando..." : "Registrar despesa"}</Button>
        </form>
      </FloatingFormCard>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2"><ReceiptText size={18} /><h2 className="font-bold">Despesas diretas recentes</h2></div>
        {expenses.loading ? <StateMessage title="Carregando despesas..." /> : null}
        {!expenses.loading && recentExpenses.length === 0 ? <StateMessage title="Nenhuma despesa direta recente." /> : null}
        <div className="grid gap-2">
          {recentExpenses.map((expense) => (
            <div key={expense.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div><strong>{expense.description}</strong><p className="text-sm text-muted-foreground">{expense.dueDate} · {expense.notes?.split(" · ")[0] || "Despesa direta"}</p></div>
              <div className="flex items-center gap-2"><strong>{formatCurrency(expense.amount)}</strong><Badge tone={expense.isPaid ? "good" : "warn"}>{expense.isPaid ? "Pago" : "Aberto"}</Badge><Button variant="ghost" onClick={() => togglePaid(expense)}>{expense.isPaid ? "Abrir" : "Pagar"}</Button></div>
            </div>
          ))}
        </div>
      </section>

      {message ? <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 p-4 text-sm font-semibold text-primary"><CheckCircle2 size={18} /> {message}</div> : null}
    </ProtectedPage>
  );
}
