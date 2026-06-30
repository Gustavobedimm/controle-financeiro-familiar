"use client";

import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MonthSelector } from "@/components/forms/month-selector";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StateMessage } from "@/components/feedback/state-message";
import { updateInstallment } from "@/features/credit-cards/services/card-service";
import { markInvoiceAsPaid } from "@/features/invoices/services/invoice-service";
import { usePersonalCollection } from "@/hooks/use-personal-collection";
import { formatCurrency } from "@/lib/utils/currency";
import { currentMonthReference, todayIso } from "@/lib/utils/dates";
import type { CreditCard, CreditCardInstallment, CreditCardPurchase } from "@/types/finance";

export default function InvoicesPage() {
  const [reference, setReference] = useState(currentMonthReference());
  const cards = usePersonalCollection<CreditCard>("creditCards");
  const installments = usePersonalCollection<CreditCardInstallment>("creditCardInstallments");
  const purchases = usePersonalCollection<CreditCardPurchase>("creditCardPurchases");
  const [cardId, setCardId] = useState("");

  const selectedCardId = cardId || cards.data[0]?.id || "";
  const invoiceItems = useMemo(
    () => installments.data.filter((item) => item.cardId === selectedCardId && item.invoiceMonth === reference.month && item.invoiceYear === reference.year),
    [installments.data, reference, selectedCardId]
  );
  const total = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const futurePurchases = purchases.data.filter((purchase) => installments.data.some((item) => item.purchaseId === purchase.id && !item.isPaid));

  return (
    <ProtectedPage>
      <PageHeader title="Faturas" description="Veja a fatura por cartão, mês e ano.">
        <div className="grid gap-3 sm:grid-cols-[220px_auto]">
          <Select label="Cartão" value={selectedCardId} onChange={(event) => setCardId(event.target.value)} options={cards.data.map((card) => ({ value: card.id, label: card.name }))} />
          <MonthSelector value={reference} onChange={setReference} />
        </div>
      </PageHeader>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-black/10 bg-white p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-ink/60">Total da fatura</p>
              <strong className="text-3xl">{formatCurrency(total)}</strong>
            </div>
            <Button disabled={!invoiceItems.length} onClick={async () => { await markInvoiceAsPaid(invoiceItems); await installments.reload(); }}>
              <CheckCircle2 size={18} /> Marcar fatura paga
            </Button>
          </div>
          {installments.loading ? <StateMessage title="Carregando fatura..." /> : null}
          {!installments.loading && invoiceItems.length === 0 ? <StateMessage title="Nenhuma parcela nesta fatura." /> : null}
          <div className="grid gap-3">
            {invoiceItems.map((item) => {
              const card = cards.data.find((entry) => entry.id === item.cardId);
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-md border border-black/10 p-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderLeftColor: card?.color || undefined, borderLeftWidth: card ? 6 : undefined }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{item.description}</strong>
                      {card ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-xs font-semibold text-ink/70">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: card.color }} />
                          {card.name}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-ink/60">{item.installmentNumber}/{item.totalInstallments} · vence {item.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>{formatCurrency(item.amount)}</strong>
                    <Badge tone={item.isPaid ? "good" : "warn"}>{item.isPaid ? "Pago" : "Aberto"}</Badge>
                    {!item.isPaid ? (
                      <Button variant="ghost" onClick={async () => { await updateInstallment(item.id, { isPaid: true, paidAt: todayIso() }); await installments.reload(); }}>
                        <CheckCircle2 size={16} />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <aside className="rounded-lg border border-black/10 bg-white p-4">
          <h2 className="mb-3 font-bold">Parcelamentos ativos</h2>
          <div className="grid gap-2">
            {futurePurchases.map((purchase) => {
              const card = cards.data.find((entry) => entry.id === purchase.cardId);
              const last = installments.data
                .filter((item) => item.purchaseId === purchase.id)
                .sort((a, b) => a.invoiceYear - b.invoiceYear || a.invoiceMonth - b.invoiceMonth)
                .at(-1);
              return (
                <div
                  key={purchase.id}
                  className="rounded-md border border-black/10 p-3"
                  style={{ borderLeftColor: card?.color || undefined, borderLeftWidth: card ? 6 : undefined }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{purchase.description}</strong>
                    {card ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-1 text-xs font-semibold text-ink/70">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: card.color }} />
                        {card.name}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-ink/60">Termina em {last ? `${String(last.invoiceMonth).padStart(2, "0")}/${last.invoiceYear}` : "-"}</p>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </ProtectedPage>
  );
}
