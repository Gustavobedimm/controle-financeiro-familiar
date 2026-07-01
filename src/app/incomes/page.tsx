"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { createIncome, deleteIncome, updateIncome } from "@/features/incomes/services/income-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { formatCurrency } from "@/lib/utils/currency";
import { currentMonthReference, todayIso } from "@/lib/utils/dates";
import { incomeOccursInMonth } from "@/lib/utils/calculations";
import type { Income, IncomeType } from "@/types/finance";

const blank = { description: "", amount: 0, type: "salary" as IncomeType, receivedAt: todayIso(), isRecurring: true };

export default function IncomesPage() {
  const [reference, setReference] = useState(currentMonthReference());
  const { data, loading, reload, householdId, ownerUid } = usePersonalCollection<Income>("incomes");
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);

  const monthItems = useMemo(() => data.filter((income) => incomeOccursInMonth(income, reference)), [data, reference]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!householdId || !ownerUid) return;
    const payload = { ...form, amount: Number(form.amount), recurrenceDay: new Date(`${form.receivedAt}T00:00:00`).getDate() };
    if (editingId) await updateIncome(editingId, payload);
    else await createIncome({ householdId, ownerUid, ...payload });
    setForm(blank);
    setEditingId(null);
    await reload();
  }

  return (
    <ProtectedPage>
      <PageHeader title="Receitas" description="Cadastre salários, rendas extras e receitas recorrentes.">
        <MonthSelector value={reference} onChange={setReference} />
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form className="grid gap-4 rounded-lg border border-border bg-card p-4" onSubmit={handleSubmit}>
          <Input label="Descrição" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          <MoneyInput label="Valor" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} required />
          <Select label="Tipo" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as IncomeType })} options={[
            { value: "salary", label: "Salário" }, { value: "extra", label: "Renda extra" }, { value: "other", label: "Outra" }
          ]} />
          <DatePicker label="Data de recebimento" value={form.receivedAt} onChange={(event) => setForm({ ...form, receivedAt: event.target.value })} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isRecurring} onChange={(event) => setForm({ ...form, isRecurring: event.target.checked })} /> Recorrente</label>
          <Button><Plus size={18} /> {editingId ? "Salvar receita" : "Adicionar receita"}</Button>
        </form>

        <section className="rounded-lg border border-border bg-card p-4">
          {loading ? <StateMessage title="Carregando receitas..." /> : null}
          {!loading && monthItems.length === 0 ? <StateMessage title="Nenhuma receita neste mês." description="Cadastre a primeira receita para calcular o saldo previsto." /> : null}
          <div className="grid gap-3">
            {monthItems.map((income) => (
              <div key={income.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong>{income.description}</strong>
                  <p className="text-sm text-muted-foreground">{formatCurrency(income.amount)} · {income.receivedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={income.isRecurring ? "good" : "neutral"}>{income.isRecurring ? "Recorrente" : "Única"}</Badge>
                  <Button variant="ghost" onClick={() => { setEditingId(income.id); setForm({ description: income.description, amount: income.amount, type: income.type, receivedAt: income.receivedAt, isRecurring: income.isRecurring }); }}><Pencil size={16} /></Button>
                  <Button variant="ghost" onClick={async () => { await deleteIncome(income.id); await reload(); }}><Trash2 size={16} /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}
