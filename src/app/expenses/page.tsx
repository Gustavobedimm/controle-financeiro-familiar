"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CategorySelect } from "@/components/forms/category-select";
import { DatePicker } from "@/components/forms/date-picker";
import { MoneyInput } from "@/components/forms/money-input";
import { MonthSelector } from "@/components/forms/month-selector";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StateMessage } from "@/components/feedback/state-message";
import { createExpense, deleteExpense, updateExpense } from "@/features/expenses/services/expense-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { expenseOccursInMonth } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { currentMonthReference, todayIso } from "@/lib/utils/dates";
import type { Expense, ExpenseCategory, ExpenseType } from "@/types/finance";

const blank = { description: "", amount: 0, categoryId: "", type: "fixed" as ExpenseType, dueDate: todayIso(), isPaid: false, isRecurring: true, notes: "" };

export default function ExpensesPage() {
  const [reference, setReference] = useState(currentMonthReference());
  const expenses = usePersonalCollection<Expense>("expenses");
  const categories = usePersonalCollection<ExpenseCategory>("expenseCategories");
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const monthItems = useMemo(() => expenses.data.filter((expense) => expenseOccursInMonth(expense, reference)), [expenses.data, reference]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!expenses.householdId || !expenses.ownerUid) return;
    const categoryId = form.categoryId || categories.data[0]?.id || "";
    const payload = { ...form, categoryId, amount: Number(form.amount), paidAt: form.isPaid ? todayIso() : undefined, recurrenceDay: new Date(`${form.dueDate}T00:00:00`).getDate() };
    if (editingId) await updateExpense(editingId, payload);
    else await createExpense({ householdId: expenses.householdId, ownerUid: expenses.ownerUid, ...payload });
    setForm(blank);
    setEditingId(null);
    await expenses.reload();
  }

  return (
    <ProtectedPage>
      <PageHeader title="Despesas" description="Controle gastos fixos e do dia a dia.">
        <MonthSelector value={reference} onChange={setReference} />
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form className="grid gap-4 rounded-lg border border-black/10 bg-white p-4" onSubmit={handleSubmit}>
          <Input label="Descrição" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          <MoneyInput label="Valor" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} required />
          <Select label="Tipo" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ExpenseType })} options={[
            { value: "fixed", label: "Fixa" }, { value: "variable", label: "Variável" }
          ]} />
          <CategorySelect label="Categoria" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} categories={categories.data} />
          <DatePicker label="Vencimento/data" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isRecurring} onChange={(event) => setForm({ ...form, isRecurring: event.target.checked })} /> Recorrente</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isPaid} onChange={(event) => setForm({ ...form, isPaid: event.target.checked })} /> Pago</label>
          <Button><Plus size={18} /> {editingId ? "Salvar despesa" : "Adicionar despesa"}</Button>
        </form>
        <section className="rounded-lg border border-black/10 bg-white p-4">
          {expenses.loading ? <StateMessage title="Carregando despesas..." /> : null}
          {!expenses.loading && monthItems.length === 0 ? <StateMessage title="Nenhuma despesa neste mês." /> : null}
          <div className="grid gap-3">
            {monthItems.map((expense) => (
              <div key={expense.id} className="flex flex-col gap-3 rounded-md border border-black/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong>{expense.description}</strong>
                  <p className="text-sm text-ink/60">{formatCurrency(expense.amount)} · {expense.dueDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={expense.isPaid ? "good" : "warn"}>{expense.isPaid ? "Pago" : "Aberto"}</Badge>
                  <Button variant="ghost" onClick={() => { setEditingId(expense.id); setForm({ description: expense.description, amount: expense.amount, categoryId: expense.categoryId, type: expense.type, dueDate: expense.dueDate, isPaid: expense.isPaid, isRecurring: expense.isRecurring, notes: expense.notes || "" }); }}><Pencil size={16} /></Button>
                  <Button variant="ghost" onClick={async () => { await deleteExpense(expense.id); await expenses.reload(); }}><Trash2 size={16} /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}
