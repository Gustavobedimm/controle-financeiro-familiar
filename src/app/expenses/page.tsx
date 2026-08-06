"use client";

import Link from "next/link";
import { CheckCircle2, Circle, CreditCard as CreditCardIcon, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
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
import type { CreditCard, CreditCardInstallment, Expense, ExpenseCategory, ExpensePayment, ExpenseType, MonthReference } from "@/types/finance";

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
  const installments = usePersonalCollection<CreditCardInstallment>("creditCardInstallments");
  const cards = usePersonalCollection<CreditCard>("creditCards");
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const monthItems = useMemo(() => expenses.data.filter((expense) => expenseOccursInMonth(expense, reference)), [expenses.data, reference]);
  const monthCardItems = useMemo(
    () => installments.data.filter((item) => item.invoiceMonth === reference.month && item.invoiceYear === reference.year),
    [installments.data, reference]
  );
  const directTotal = monthItems.reduce((total, expense) => total + expense.amount, 0);
  const cardTotal = monthCardItems.reduce((total, item) => total + item.amount, 0);

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
      <PageHeader title="Todas as despesas" description="Resumo geral de gastos diretos, recorrentes e do cartão de crédito.">
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

      <div className="grid gap-4">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Despesas diretas</p><strong className="mt-1 block text-xl">{formatCurrency(directTotal)}</strong></div>
          <div className="rounded-lg border border-border bg-card p-3"><p className="text-xs text-muted-foreground">Cartão de crédito</p><strong className="mt-1 block text-xl">{formatCurrency(cardTotal)}</strong></div>
          <div className="col-span-2 rounded-lg border border-primary/25 bg-primary/10 p-3 lg:col-span-1"><p className="text-xs text-muted-foreground">Total do mês</p><strong className="mt-1 block text-xl text-primary">{formatCurrency(directTotal + cardTotal)}</strong></div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2"><Receipt size={18} /><h2 className="font-bold">Despesas diretas e recorrentes</h2></div>
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

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2"><CreditCardIcon size={18} /><h2 className="font-bold">Despesas no cartão</h2></div>
            <Link href="/invoices" className="text-sm font-semibold text-primary hover:underline">Ver fatura completa</Link>
          </div>
          {installments.loading || cards.loading ? <StateMessage title="Carregando despesas do cartão..." /> : null}
          {!installments.loading && monthCardItems.length === 0 ? <StateMessage title="Nenhuma despesa de cartão neste mês." /> : null}
          <div className="grid gap-3">
            {monthCardItems.map((item) => {
              const card = cards.data.find((entry) => entry.id === item.cardId);
              return (
                <div key={item.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderLeftColor: card?.color || undefined, borderLeftWidth: card ? 6 : undefined }}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><strong>{item.description}</strong><Badge>{card?.name || "Cartão"}</Badge></div>
                    <p className="text-sm text-muted-foreground">{item.totalInstallments > 1 ? `Parcela ${item.installmentNumber}/${item.totalInstallments}` : "Compra à vista do mês"} · vence {item.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2"><strong>{formatCurrency(item.amount)}</strong><Badge tone={item.isPaid ? "good" : "warn"}>{item.isPaid ? "Pago" : "Na fatura"}</Badge></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}
