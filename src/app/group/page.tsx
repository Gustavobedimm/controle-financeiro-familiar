"use client";

import { Banknote, Clipboard, CreditCard, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SummaryCard } from "@/components/cards/summary-card";
import { MonthSelector } from "@/components/forms/month-selector";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/feedback/state-message";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useHouseholdCollection } from "@/hooks/use-household-collection";
import { getDocument } from "@/lib/firebase/firestore";
import { calculateMonthlySummary } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { currentMonthReference } from "@/lib/utils/dates";
import type { AppUser, CreditCard as CreditCardType, CreditCardInstallment, Expense, Household, Income, SavingsContribution } from "@/types/finance";

type HouseholdUser = AppUser & { id: string };

export default function GroupPage() {
  const { appUser, householdId } = useAuth();
  const [reference, setReference] = useState(currentMonthReference());
  const [selectedUid, setSelectedUid] = useState("");
  const [household, setHousehold] = useState<Household | null>(null);
  const [copied, setCopied] = useState(false);
  const users = useHouseholdCollection<HouseholdUser>("users");
  const incomes = useHouseholdCollection<Income>("incomes");
  const expenses = useHouseholdCollection<Expense>("expenses");
  const cards = useHouseholdCollection<CreditCardType>("creditCards");
  const installments = useHouseholdCollection<CreditCardInstallment>("creditCardInstallments");
  const savingsContributions = useHouseholdCollection<SavingsContribution>("savingsContributions");

  useEffect(() => {
    if (!selectedUid && appUser?.uid) setSelectedUid(appUser.uid);
  }, [appUser, selectedUid]);

  useEffect(() => {
    async function loadHousehold() {
      setHousehold(householdId ? await getDocument<Household>("households", householdId) : null);
    }

    void loadHousehold();
  }, [householdId]);

  async function copyHouseholdId() {
    if (!householdId) return;
    await navigator.clipboard.writeText(householdId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const selectedUser = users.data.find((user) => user.uid === selectedUid) || appUser;
  const userIncomes = incomes.data.filter((item) => item.ownerUid === selectedUid);
  const userExpenses = expenses.data.filter((item) => item.ownerUid === selectedUid);
  const userCards = cards.data.filter((item) => item.ownerUid === selectedUid);
  const userInstallments = installments.data.filter((item) => item.ownerUid === selectedUid);
  const userSavings = savingsContributions.data.filter((item) => item.createdByUid === selectedUid);

  const summary = useMemo(
    () =>
      calculateMonthlySummary({
        reference,
        incomes: userIncomes,
        expenses: userExpenses,
        installments: userInstallments
      }),
    [reference, userExpenses, userIncomes, userInstallments]
  );

  const cardOpenAmounts = userCards.map((card) => ({
    card,
    openAmount: userInstallments.filter((item) => item.cardId === card.id && !item.isPaid).reduce((sum, item) => sum + item.amount, 0)
  }));

  const savingsTotal = userSavings.reduce((sum, item) => sum + (item.type === "withdrawal" ? -item.amount : item.amount), 0);
  const loading = users.loading || incomes.loading || expenses.loading || cards.loading || installments.loading || savingsContributions.loading;

  return (
    <ProtectedPage>
      <PageHeader title="Grupo familiar" description="Acompanhe uma visão geral dos usuários conectados ao mesmo household.">
        <MonthSelector value={reference} onChange={setReference} />
      </PageHeader>

      {loading ? <StateMessage title="Carregando dados do grupo..." /> : null}

      {!loading ? (
        <div className="grid gap-6">
          <section className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Household conectado</p>
                <h2 className="mt-1 text-lg font-bold">{household?.name || "Grupo familiar"}</h2>
                <div className="mt-2 flex max-w-xl items-start gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-sm bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                    {householdId || "Sem household"}
                  </code>
                  <Button className="min-h-8 px-2 py-1" variant="ghost" onClick={copyHouseholdId} disabled={!householdId} title="Copiar householdId">
                    <Clipboard size={14} />
                  </Button>
                </div>
                {copied ? <p className="mt-1 text-xs font-semibold text-primary">ID copiado.</p> : null}
              </div>
              <div className="text-sm text-muted-foreground">{users.data.length} pessoas</div>
            </div>

            <h3 className="mb-2 font-bold">Usuários no household</h3>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {users.data.map((user) => {
                const active = user.uid === selectedUid;
                return (
                  <button
                    key={user.uid}
                    className={`flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                      active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                    }`}
                    onClick={() => setSelectedUid(user.uid)}
                  >
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">{user.name}</strong>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                    <Badge tone={user.uid === appUser?.uid ? "good" : "neutral"}>{user.uid === appUser?.uid ? "Você" : user.role}</Badge>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Visão geral de</p>
              <h2 className="text-2xl font-bold">{selectedUser?.name || "Usuário"}</h2>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SummaryCard title="Receitas" value={summary.totalIncome} icon={Banknote} tone="good" />
              <SummaryCard title="Fixas" value={summary.totalFixedExpenses} icon={Receipt} />
              <SummaryCard title="Variáveis" value={summary.totalVariableExpenses} icon={Wallet} />
              <SummaryCard title="Cartão no mês" value={summary.totalCreditCardExpenses} icon={CreditCard} />
              <SummaryCard title="Saldo previsto" value={summary.expectedBalance} icon={TrendingUp} tone={summary.expectedBalance < 0 ? "bad" : "good"} />
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Saldo real</p>
                <strong className="mt-1 block text-2xl">{formatCurrency(summary.realBalance)}</strong>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Aportes em caixinhas</p>
                <strong className="mt-1 block text-2xl">{formatCurrency(savingsTotal)}</strong>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Cartões cadastrados</p>
                <strong className="mt-1 block text-2xl">{userCards.length}</strong>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-3 font-bold">Cartões dessa pessoa</h2>
              {!cardOpenAmounts.length ? <StateMessage title="Nenhum cartão cadastrado." /> : null}
              <div className="grid gap-3 md:grid-cols-2">
                {cardOpenAmounts.map(({ card, openAmount }) => (
                  <div key={card.id} className="rounded-md border border-border p-3">
                    <span className="mb-2 block h-2 w-20 rounded-full" style={{ background: card.color }} />
                    <strong>{card.name}</strong>
                    <p className="text-sm text-muted-foreground">Limite {formatCurrency(card.limit)}</p>
                    <p className="text-sm text-muted-foreground">Em aberto {formatCurrency(openAmount)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-3 font-bold">Últimos lançamentos em caixinhas</h2>
              {!userSavings.length ? <StateMessage title="Nenhum aporte registrado por essa pessoa." /> : null}
              <div className="grid gap-3">
                {userSavings
                  .sort((a, b) => b.contributedAt.localeCompare(a.contributedAt))
                  .slice(0, 8)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                      <div>
                        <strong>{formatCurrency(item.amount)}</strong>
                        <p className="text-sm text-muted-foreground">{item.contributedAt}</p>
                      </div>
                      <Badge tone={item.type === "withdrawal" ? "bad" : "good"}>
                        {item.type === "deposit" ? "Aporte" : item.type === "yield" ? "Rendimento" : "Retirada"}
                      </Badge>
                    </div>
                  ))}
              </div>
            </section>
          </section>
        </div>
      ) : null}
    </ProtectedPage>
  );
}
