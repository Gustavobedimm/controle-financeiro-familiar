"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CategorySelect } from "@/components/forms/category-select";
import { DatePicker } from "@/components/forms/date-picker";
import { MoneyInput } from "@/components/forms/money-input";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateMessage } from "@/components/feedback/state-message";
import { createCreditCard, createPurchaseWithInstallments, deleteCreditCard, deletePurchaseAndInstallments } from "@/features/credit-cards/services/card-service";
import { useHouseholdCollection } from "@/hooks/use-household-collection";
import { formatCurrency } from "@/lib/utils/currency";
import { currentMonthReference, monthKey, todayIso } from "@/lib/utils/dates";
import type { CreditCard, CreditCardInstallment, CreditCardPurchase, ExpenseCategory } from "@/types/finance";

export default function CardsPage() {
  const cards = useHouseholdCollection<CreditCard>("creditCards");
  const categories = useHouseholdCollection<ExpenseCategory>("expenseCategories");
  const purchases = useHouseholdCollection<CreditCardPurchase>("creditCardPurchases");
  const installments = useHouseholdCollection<CreditCardInstallment>("creditCardInstallments");
  const [cardForm, setCardForm] = useState({ name: "", limit: 0, closingDay: 25, dueDay: 10, color: "#2a9d8f" });
  const [purchaseForm, setPurchaseForm] = useState({ cardId: "", description: "", totalAmount: 0, installments: 1, purchaseDate: todayIso(), categoryId: "", notes: "" });

  async function addCard(event: React.FormEvent) {
    event.preventDefault();
    if (!cards.householdId) return;
    await createCreditCard({ householdId: cards.householdId, ...cardForm, limit: Number(cardForm.limit), closingDay: Number(cardForm.closingDay), dueDay: Number(cardForm.dueDay) });
    setCardForm({ name: "", limit: 0, closingDay: 25, dueDay: 10, color: "#2a9d8f" });
    await cards.reload();
  }

  async function addPurchase(event: React.FormEvent) {
    event.preventDefault();
    if (!cards.householdId) return;
    const card = cards.data.find((item) => item.id === purchaseForm.cardId) || cards.data[0];
    if (!card) return;
    await createPurchaseWithInstallments({
      card,
      purchase: {
        householdId: cards.householdId,
        cardId: card.id,
        description: purchaseForm.description,
        totalAmount: Number(purchaseForm.totalAmount),
        installments: Number(purchaseForm.installments),
        firstInstallmentMonth: monthKey(currentMonthReference()),
        categoryId: purchaseForm.categoryId || categories.data[0]?.id || "",
        purchaseDate: purchaseForm.purchaseDate,
        notes: purchaseForm.notes
      }
    });
    setPurchaseForm({ cardId: "", description: "", totalAmount: 0, installments: 1, purchaseDate: todayIso(), categoryId: "", notes: "" });
    await Promise.all([purchases.reload(), installments.reload()]);
  }

  return (
    <ProtectedPage>
      <PageHeader title="Cartões de crédito" description="Cadastre cartões e compras parceladas com impacto nos meses futuros." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="grid gap-6">
          <form className="grid gap-4 rounded-lg border border-black/10 bg-white p-4" onSubmit={addCard}>
            <h2 className="font-bold">Novo cartão</h2>
            <Input label="Nome" value={cardForm.name} onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })} required />
            <MoneyInput label="Limite" value={cardForm.limit} onChange={(event) => setCardForm({ ...cardForm, limit: Number(event.target.value) })} />
            <Input label="Dia de fechamento" type="number" min={1} max={31} value={cardForm.closingDay} onChange={(event) => setCardForm({ ...cardForm, closingDay: Number(event.target.value) })} />
            <Input label="Dia de vencimento" type="number" min={1} max={31} value={cardForm.dueDay} onChange={(event) => setCardForm({ ...cardForm, dueDay: Number(event.target.value) })} />
            <Input label="Cor" type="color" value={cardForm.color} onChange={(event) => setCardForm({ ...cardForm, color: event.target.value })} />
            <Button><Plus size={18} /> Adicionar cartão</Button>
          </form>
          <form className="grid gap-4 rounded-lg border border-black/10 bg-white p-4" onSubmit={addPurchase}>
            <h2 className="font-bold">Nova compra</h2>
            <Select label="Cartão" value={purchaseForm.cardId} onChange={(event) => setPurchaseForm({ ...purchaseForm, cardId: event.target.value })} options={cards.data.map((card) => ({ value: card.id, label: card.name }))} />
            <Input label="Descrição" value={purchaseForm.description} onChange={(event) => setPurchaseForm({ ...purchaseForm, description: event.target.value })} required />
            <MoneyInput label="Valor total" value={purchaseForm.totalAmount} onChange={(event) => setPurchaseForm({ ...purchaseForm, totalAmount: Number(event.target.value) })} />
            <Input label="Parcelas" type="number" min={1} value={purchaseForm.installments} onChange={(event) => setPurchaseForm({ ...purchaseForm, installments: Number(event.target.value) })} />
            <DatePicker label="Data da compra" value={purchaseForm.purchaseDate} onChange={(event) => setPurchaseForm({ ...purchaseForm, purchaseDate: event.target.value })} />
            <CategorySelect label="Categoria" value={purchaseForm.categoryId} onChange={(event) => setPurchaseForm({ ...purchaseForm, categoryId: event.target.value })} categories={categories.data} />
            <Button><Plus size={18} /> Gerar parcelas</Button>
          </form>
        </div>
        <section className="grid gap-4">
          {cards.loading ? <StateMessage title="Carregando cartões..." /> : null}
          {cards.data.map((card) => {
            const used = installments.data.filter((item) => item.cardId === card.id && !item.isPaid).reduce((total, item) => total + item.amount, 0);
            return (
              <div key={card.id} className="rounded-lg border border-black/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="mb-2 block h-2 w-20 rounded-full" style={{ background: card.color }} />
                    <strong>{card.name}</strong>
                    <p className="text-sm text-ink/60">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
                    <p className="text-sm text-ink/60">Limite {formatCurrency(card.limit)} · Em aberto {formatCurrency(used)}</p>
                  </div>
                  <Button variant="ghost" onClick={async () => { await deleteCreditCard(card.id); await cards.reload(); }}><Trash2 size={16} /></Button>
                </div>
              </div>
            );
          })}
          <div className="rounded-lg border border-black/10 bg-white p-4">
            <h2 className="mb-3 font-bold">Compras parceladas</h2>
            <div className="grid gap-2">
              {purchases.data.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between gap-3 rounded-md border border-black/10 p-3">
                  <div>
                    <strong>{purchase.description}</strong>
                    <p className="text-sm text-ink/60">{formatCurrency(purchase.totalAmount)} em {purchase.installments}x</p>
                  </div>
                  <Button variant="ghost" onClick={async () => { await deletePurchaseAndInstallments(purchase.id, installments.data); await Promise.all([purchases.reload(), installments.reload()]); }}><Trash2 size={16} /></Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}
