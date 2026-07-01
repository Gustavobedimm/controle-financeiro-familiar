"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CategorySelect } from "@/components/forms/category-select";
import { DatePicker } from "@/components/forms/date-picker";
import { FloatingFormCard } from "@/components/forms/floating-form-card";
import { MoneyInput } from "@/components/forms/money-input";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StateMessage } from "@/components/feedback/state-message";
import {
  createCreditCard,
  createPurchaseWithInstallments,
  deleteCreditCard,
  deletePurchaseAndInstallments,
  markPastDueInstallmentsAsPaid,
  recalculatePurchaseInstallmentsFromPurchaseDate,
  updateCreditCard,
  updatePurchaseWithInstallments
} from "@/features/credit-cards/services/card-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { formatCurrency } from "@/lib/utils/currency";
import { firstInvoiceMonthFromPurchase, monthKey, todayIso } from "@/lib/utils/dates";
import type { CreditCard, CreditCardInstallment, CreditCardPurchase, ExpenseCategory } from "@/types/finance";

const blankCardForm = { name: "", limit: 0, closingDay: 25, dueDay: 10, color: "#2a9d8f" };
const blankPurchaseForm = {
  cardId: "",
  description: "",
  totalAmount: 0,
  installments: 1,
  purchaseDate: todayIso(),
  categoryId: "",
  notes: "",
  markPastDueAsPaid: true
};

export default function CardsPage() {
  const cards = usePersonalCollection<CreditCard>("creditCards");
  const categories = usePersonalCollection<ExpenseCategory>("expenseCategories");
  const purchases = usePersonalCollection<CreditCardPurchase>("creditCardPurchases");
  const installments = usePersonalCollection<CreditCardInstallment>("creditCardInstallments");
  const [cardForm, setCardForm] = useState(blankCardForm);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState(blankPurchaseForm);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);

  function resetCardForm() {
    setCardForm(blankCardForm);
    setEditingCardId(null);
  }

  function resetPurchaseForm() {
    setPurchaseForm({ ...blankPurchaseForm, purchaseDate: todayIso() });
    setEditingPurchaseId(null);
  }

  async function saveCard(event: React.FormEvent) {
    event.preventDefault();
    if (!cards.householdId || !cards.ownerUid) return;
    const payload = { ...cardForm, limit: Number(cardForm.limit), closingDay: Number(cardForm.closingDay), dueDay: Number(cardForm.dueDay) };
    if (editingCardId) await updateCreditCard(editingCardId, payload);
    else await createCreditCard({ householdId: cards.householdId, ownerUid: cards.ownerUid, ...payload });
    resetCardForm();
    setCardFormOpen(false);
    await cards.reload();
  }

  async function savePurchase(event: React.FormEvent) {
    event.preventDefault();
    if (!cards.householdId || !cards.ownerUid) return;
    const card = cards.data.find((item) => item.id === purchaseForm.cardId) || cards.data[0];
    if (!card) return;
    const firstInvoice = firstInvoiceMonthFromPurchase(purchaseForm.purchaseDate, card.closingDay, card.dueDay);
    const purchase = {
      householdId: cards.householdId,
      ownerUid: cards.ownerUid,
      cardId: card.id,
      description: purchaseForm.description,
      totalAmount: Number(purchaseForm.totalAmount),
      installments: Number(purchaseForm.installments),
      firstInstallmentMonth: monthKey(firstInvoice),
      categoryId: purchaseForm.categoryId || categories.data[0]?.id || "",
      purchaseDate: purchaseForm.purchaseDate,
      notes: purchaseForm.notes
    };

    if (editingPurchaseId) {
      await updatePurchaseWithInstallments({
        purchaseId: editingPurchaseId,
        card,
        purchase,
        installments: installments.data,
        markPastDueAsPaid: purchaseForm.markPastDueAsPaid
      });
    } else {
      await createPurchaseWithInstallments({
        card,
        markPastDueAsPaid: purchaseForm.markPastDueAsPaid,
        purchase
      });
    }

    resetPurchaseForm();
    setPurchaseFormOpen(false);
    await Promise.all([purchases.reload(), installments.reload()]);
  }

  return (
    <ProtectedPage>
      <PageHeader title="Cartões de crédito" description="Cadastre cartões e compras parceladas com impacto nos meses futuros.">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => { resetCardForm(); setCardFormOpen(true); }}>
            <Plus size={18} /> Novo cartão
          </Button>
          <Button type="button" variant="secondary" onClick={() => { resetPurchaseForm(); setPurchaseFormOpen(true); }}>
            <Plus size={18} /> Nova compra
          </Button>
        </div>
      </PageHeader>

      <FloatingFormCard title={editingCardId ? "Editar cartão" : "Novo cartão"} open={cardFormOpen} onOpenChange={setCardFormOpen}>
          <form className="grid gap-4" onSubmit={saveCard}>
            <Input label="Nome" value={cardForm.name} onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })} required />
            <MoneyInput label="Limite" value={cardForm.limit} onChange={(event) => setCardForm({ ...cardForm, limit: Number(event.target.value) })} />
            <Input label="Dia de fechamento" type="number" min={1} max={31} value={cardForm.closingDay} onChange={(event) => setCardForm({ ...cardForm, closingDay: Number(event.target.value) })} />
            <Input label="Dia de vencimento" type="number" min={1} max={31} value={cardForm.dueDay} onChange={(event) => setCardForm({ ...cardForm, dueDay: Number(event.target.value) })} />
            <Input label="Cor" type="color" value={cardForm.color} onChange={(event) => setCardForm({ ...cardForm, color: event.target.value })} />
            <Button>{editingCardId ? <Pencil size={18} /> : <Plus size={18} />} {editingCardId ? "Salvar cartão" : "Adicionar cartão"}</Button>
          </form>
      </FloatingFormCard>

      <FloatingFormCard title={editingPurchaseId ? "Editar lançamento" : "Nova compra"} open={purchaseFormOpen} onOpenChange={setPurchaseFormOpen}>
          <form className="grid gap-4" onSubmit={savePurchase}>
            <Select label="Cartão" value={purchaseForm.cardId} onChange={(event) => setPurchaseForm({ ...purchaseForm, cardId: event.target.value })} options={cards.data.map((card) => ({ value: card.id, label: card.name }))} />
            <Input label="Descrição" value={purchaseForm.description} onChange={(event) => setPurchaseForm({ ...purchaseForm, description: event.target.value })} required />
            <MoneyInput label="Valor total" value={purchaseForm.totalAmount} onChange={(event) => setPurchaseForm({ ...purchaseForm, totalAmount: Number(event.target.value) })} />
            <Input label="Parcelas" type="number" min={1} value={purchaseForm.installments} onChange={(event) => setPurchaseForm({ ...purchaseForm, installments: Number(event.target.value) })} />
            <DatePicker label="Data da compra" value={purchaseForm.purchaseDate} onChange={(event) => setPurchaseForm({ ...purchaseForm, purchaseDate: event.target.value })} />
            <CategorySelect label="Categoria" value={purchaseForm.categoryId} onChange={(event) => setPurchaseForm({ ...purchaseForm, categoryId: event.target.value })} categories={categories.data} />
            <label className="flex items-start gap-2 text-sm font-semibold">
              <input
                className="mt-1"
                type="checkbox"
                checked={purchaseForm.markPastDueAsPaid}
                onChange={(event) => setPurchaseForm({ ...purchaseForm, markPastDueAsPaid: event.target.checked })}
              />
              <span>Marcar parcelas vencidas como pagas automaticamente</span>
            </label>
            <Button>{editingPurchaseId ? <Pencil size={18} /> : <Plus size={18} />} {editingPurchaseId ? "Salvar lançamento" : "Gerar parcelas"}</Button>
          </form>
      </FloatingFormCard>

      <div className="grid gap-6">
        <section className="grid gap-4">
          {cards.loading ? <StateMessage title="Carregando cartões..." /> : null}
          {cards.data.map((card) => {
            const used = installments.data.filter((item) => item.cardId === card.id && !item.isPaid).reduce((total, item) => total + item.amount, 0);
            return (
              <div key={card.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="mb-2 block h-2 w-20 rounded-full" style={{ background: card.color }} />
                    <strong>{card.name}</strong>
                    <p className="text-sm text-muted-foreground">Fecha dia {card.closingDay} · Vence dia {card.dueDay}</p>
                    <p className="text-sm text-muted-foreground">Limite {formatCurrency(card.limit)} · Em aberto {formatCurrency(used)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      aria-label={`Editar ${card.name}`}
                      onClick={() => {
                        setEditingCardId(card.id);
                        setCardForm({
                          name: card.name,
                          limit: card.limit,
                          closingDay: card.closingDay,
                          dueDay: card.dueDay,
                          color: card.color
                        });
                        setCardFormOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" onClick={async () => { await deleteCreditCard(card.id); await cards.reload(); }}><Trash2 size={16} /></Button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-bold">Compras parceladas</h2>
            <div className="grid gap-2">
              {purchases.data.map((purchase) => {
                const purchaseInstallments = installments.data.filter((item) => item.purchaseId === purchase.id);
                const purchaseCard = cards.data.find((card) => card.id === purchase.cardId);
                const paidCount = purchaseInstallments.filter((item) => item.isPaid).length;
                const pastDueOpenCount = purchaseInstallments.filter((item) => !item.isPaid && item.dueDate < todayIso()).length;
                return (
                <div
                  key={purchase.id}
                  className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderLeftColor: purchaseCard?.color || undefined, borderLeftWidth: purchaseCard ? 6 : undefined }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{purchase.description}</strong>
                      {purchaseCard ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: purchaseCard.color }} />
                          {purchaseCard.name}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(purchase.totalAmount)} em {purchase.installments}x · {paidCount}/{purchase.installments} pagas
                    </p>
                    <p className="text-xs text-muted-foreground">Compra em {purchase.purchaseDate}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {purchaseCard ? (
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await recalculatePurchaseInstallmentsFromPurchaseDate({
                            purchase,
                            card: purchaseCard,
                            installments: purchaseInstallments
                          });
                          await Promise.all([purchases.reload(), installments.reload()]);
                        }}
                      >
                        Recalcular pela data
                      </Button>
                    ) : null}
                    {pastDueOpenCount > 0 ? (
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await markPastDueInstallmentsAsPaid(purchaseInstallments, todayIso());
                          await installments.reload();
                        }}
                      >
                        Marcar vencidas pagas
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      aria-label={`Editar ${purchase.description}`}
                      onClick={() => {
                        setEditingPurchaseId(purchase.id);
                        setPurchaseForm({
                          cardId: purchase.cardId,
                          description: purchase.description,
                          totalAmount: purchase.totalAmount,
                          installments: purchase.installments,
                          purchaseDate: purchase.purchaseDate,
                          categoryId: purchase.categoryId,
                          notes: purchase.notes || "",
                          markPastDueAsPaid: true
                        });
                        setPurchaseFormOpen(true);
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button variant="ghost" onClick={async () => { await deletePurchaseAndInstallments(purchase.id, installments.data); await Promise.all([purchases.reload(), installments.reload()]); }}><Trash2 size={16} /></Button>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}
