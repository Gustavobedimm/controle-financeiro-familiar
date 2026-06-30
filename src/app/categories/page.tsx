"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateMessage } from "@/components/feedback/state-message";
import { Badge } from "@/components/ui/badge";
import { createCategory, deleteCategory, updateCategory } from "@/features/categories/services/category-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import type { CreditCardInstallment, Expense, ExpenseCategory, ExpenseCategoryType } from "@/types/finance";

const blank = { name: "", type: "variable" as ExpenseCategoryType, color: "#2a9d8f", icon: "circle" };

export default function CategoriesPage() {
  const categories = usePersonalCollection<ExpenseCategory>("expenseCategories");
  const expenses = usePersonalCollection<Expense>("expenses");
  const installments = usePersonalCollection<CreditCardInstallment>("creditCardInstallments");
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);

  function categoryIsUsed(id: string) {
    return expenses.data.some((expense) => expense.categoryId === id) || installments.data.some((item) => item.categoryId === id);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!categories.householdId || !categories.ownerUid) return;
    if (editingId) await updateCategory(editingId, form);
    else await createCategory({ householdId: categories.householdId, ownerUid: categories.ownerUid, ...form });
    setForm(blank);
    setEditingId(null);
    await categories.reload();
  }

  return (
    <ProtectedPage>
      <PageHeader title="Categorias" description="Organize os gastos por tipo, cor e ícone." />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form className="grid gap-4 rounded-lg border border-border bg-card p-4" onSubmit={handleSubmit}>
          <Input label="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value as ExpenseCategoryType })}
            options={[
              { value: "fixed", label: "Fixa" },
              { value: "variable", label: "Variável" },
              { value: "card", label: "Cartão" },
              { value: "other", label: "Outra" }
            ]}
          />
          <Input label="Ícone" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          <Input label="Cor" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
          <Button><Plus size={18} /> {editingId ? "Salvar categoria" : "Adicionar categoria"}</Button>
        </form>
        <section className="rounded-lg border border-border bg-card p-4">
          {categories.loading ? <StateMessage title="Carregando categorias..." /> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {categories.data.map((category) => {
              const used = categoryIsUsed(category.id);
              return (
                <div key={category.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                  <div>
                    <span className="mb-2 block h-2 w-20 rounded-full" style={{ background: category.color }} />
                    <strong>{category.name}</strong>
                    <p className="text-sm text-muted-foreground">{category.icon}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{category.type}</Badge>
                    <Button variant="ghost" onClick={() => { setEditingId(category.id); setForm({ name: category.name, type: category.type, color: category.color, icon: category.icon }); }}><Pencil size={16} /></Button>
                    <Button variant="ghost" disabled={used} onClick={async () => { await deleteCategory(category.id); await categories.reload(); }}><Trash2 size={16} /></Button>
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
