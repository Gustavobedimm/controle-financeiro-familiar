"use client";

import { CheckCircle2, Circle, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CategorySelect } from "@/components/forms/category-select";
import { DatePicker } from "@/components/forms/date-picker";
import { FloatingFormCard } from "@/components/forms/floating-form-card";
import { MoneyInput } from "@/components/forms/money-input";
import { MonthSelector } from "@/components/forms/month-selector";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StateMessage } from "@/components/feedback/state-message";
import {
  createExpense,
  deleteExpense,
  markExpenseAsOpen,
  markExpenseAsPaid,
  markExpenseMonthAsOpen,
  markExpenseMonthAsPaid,
  updateExpense
} from "@/features/expenses/services/expense-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { expenseDueDateInMonth, expenseOccursInMonth, isExpensePaidInMonth } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { currentMonthReference, todayIso } from "@/lib/utils/dates";
import type { Expense, ExpenseCategory, ExpensePayment, ExpenseType, MonthReference } from "@/types/finance";

const blank = { description: "", amount: 0, categoryId: "", type: "fixed" as ExpenseType, dueDate: todayIso(), isPaid: false, isRecurring: true, notes: "" };

function referenceFromIso(date: string): MonthReference {
  const parsedDate = new Date(`${date}T00:00:00`);
  return { month: parsedDate.getMonth() + 1, year: parsedDate.getFullYear() };
}

export default function ExpensesPage() {
  const [reference, setReference] = useState(currentMonthReference());
  const expenses = usePersonalCollection<Expense>("expenses");
  const payments = usePersonalCollection<ExpensePayment>("expensePayments");
  const categories = usePersonalCollection<ExpenseCategory>("expenseCategories");
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const monthItems = useMemo(() => expenses.data.filter((expense) => expenseOccursInMonth(expense, reference)), [expenses.data, reference]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!expenses.householdId || !expenses.ownerUid) return;
    const categoryId = form.categoryId || categories.data[0]?.id || "";
    const payload = {
      ...form,
      categoryId,
      amount: Number(form.amount),
      isPaid: form.isRecurring ? false : form.isPaid,
      recurrenceDay: new Date(`${form.dueDate}T00:00:00`).getDate()
    };
    if (editingId) {
      await updateExpense(editingId, payload);
      const expense = expenses.data.find((item) => item.id === editingId);
      if (expense?.isRecurring || form.isRecurring) {
        const updatedExpense = {
          ...expense,
          ...payload,
          id: editingId,
          householdId: expense?.householdId || expenses.householdId,
          ownerUid: expense?.ownerUid || expenses.ownerUid
        } as Expense;
        if (form.isPaid) await markExpenseMonthAsPaid({ expense: updatedExpense, reference });
        else await markExpenseMonthAsOpen({ expense: updatedExpense, reference });
      } else if (form.isPaid) await markExpenseAsPaid(editingId);
      else await markExpenseAsOpen(editingId);
    } else {
      const expenseId = await createExpense({
        householdId: expenses.householdId,
        ownerUid: expenses.ownerUid,
        ...payload,
        ...(!form.isRecurring && form.isPaid ? { paidAt: todayIso() } : {})
      });
      if (form.isRecurring && form.isPaid) {
        await markExpenseMonthAsPaid({
          expense: {
            id: expenseId,
            householdId: expenses.householdId,
            ownerUid: expenses.ownerUid,
            ...payload,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          reference: referenceFromIso(form.dueDate)
        });
      }
    }
    setForm(blank);
    setEditingId(null);
    setFormOpen(false);
    await Promise.all([expenses.reload(), payments.reload()]);
  }

  async function togglePaid(expense: Expense) {
    const isPaid = isExpensePaidInMonth(expense, reference, payments.data);
    if (expense.isRecurring) {
      if (isPaid) await markExpenseMonthAsOpen({ expense, reference });
      else await markExpenseMonthAsPaid({ expense, reference, paidAt: expenseDueDateInMonth(expense, reference) });
      await payments.reload();
      return;
    }

    if (isPaid) await markExpenseAsOpen(expense.id);
    else await markExpenseAsPaid(expense.id);
    await expenses.reload();
  }

  return (
    <ProtectedPage>
      <PageHeader title="Despesas" description="Controle gastos fixos e do dia a dia.">
        <div className="flex flex-wrap gap-2">
          <MonthSelector value={reference} onChange={setReference} />
          <Button type="button" onClick={() => { setEditingId(null); setForm(blank); setFormOpen(true); }}>
            <Plus size={18} /> Nova despesa
          </Button>
        </div>
      </PageHeader>
      <FloatingFormCard title={editingId ? "Editar despesa" : "Nova despesa"} open={formOpen} onOpenChange={setFormOpen}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
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
      </FloatingFormCard>

      <div className="grid gap-6">
        <section className="rounded-lg border border-border bg-card p-4">
          {expenses.loading || payments.loading ? <StateMessage title="Carregando despesas..." /> : null}
          {!expenses.loading && !payments.loading && monthItems.length === 0 ? <StateMessage title="Nenhuma despesa neste mês." /> : null}
          <div className="grid gap-3">
            {monthItems.map((expense) => {
              const isPaid = isExpensePaidInMonth(expense, reference, payments.data);
              const dueDate = expenseDueDateInMonth(expense, reference);

              return (
                <div key={expense.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong>{expense.description}</strong>
                    <p className="text-sm text-muted-foreground">{formatCurrency(expense.amount)} · {dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={isPaid ? "good" : "warn"}>{isPaid ? "Pago" : "Aberto"}</Badge>
                    <Button variant="ghost" onClick={() => togglePaid(expense)}>
                      {isPaid ? <Circle size={16} /> : <CheckCircle2 size={16} />}
                      {isPaid ? "Abrir" : "Pagar"}
                    </Button>
                    <Button variant="ghost" onClick={() => { setEditingId(expense.id); setForm({ description: expense.description, amount: expense.amount, categoryId: expense.categoryId, type: expense.type, dueDate: expense.dueDate, isPaid, isRecurring: expense.isRecurring, notes: expense.notes || "" }); setFormOpen(true); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" onClick={async () => { await deleteExpense(expense.id); await expenses.reload(); }}><Trash2 size={16} /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}
