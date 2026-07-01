"use client";

import { PiggyBank, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import {
  createSavingsBox,
  createSavingsContribution,
  deleteSavingsBox,
  deleteSavingsContribution
} from "@/features/savings/services/savings-service";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useHouseholdCollection } from "@/hooks/use-household-collection";
import { formatCurrency, roundMoney } from "@/lib/utils/currency";
import { todayIso } from "@/lib/utils/dates";
import type { SavingsBox, SavingsBoxYieldType, SavingsContribution, SavingsContributionType } from "@/types/finance";

const boxBlank = {
  name: "Caixinha da casa",
  goalAmount: 0,
  targetDate: "",
  institution: "Nubank",
  yieldType: "cdi" as SavingsBoxYieldType,
  yieldPercent: 20,
  annualRate: 0,
  notes: "Reserva para futura compra da casa."
};

const contributionBlank = {
  savingsBoxId: "",
  amount: 0,
  type: "deposit" as SavingsContributionType,
  contributedAt: todayIso(),
  notes: ""
};

function contributionSignedAmount(contribution: SavingsContribution) {
  return contribution.type === "withdrawal" ? -contribution.amount : contribution.amount;
}

function estimateMonthlyYield(total: number, box?: SavingsBox) {
  if (!box || total <= 0) return 0;
  if (box.yieldType === "fixed") return roundMoney(total * ((box.annualRate || 0) / 100 / 12));
  if (box.yieldType === "cdi") return roundMoney(total * (((box.annualRate || 0) * ((box.yieldPercent || 0) / 100)) / 100 / 12));
  return 0;
}

export default function SavingsPage() {
  const { appUser } = useAuth();
  const boxes = useHouseholdCollection<SavingsBox>("savingsBoxes");
  const contributions = useHouseholdCollection<SavingsContribution>("savingsContributions");
  const [boxForm, setBoxForm] = useState(boxBlank);
  const [contributionForm, setContributionForm] = useState(contributionBlank);
  const [boxFormOpen, setBoxFormOpen] = useState(false);
  const [contributionFormOpen, setContributionFormOpen] = useState(false);

  const selectedBoxId = contributionForm.savingsBoxId || boxes.data[0]?.id || "";
  const selectedBox = boxes.data.find((box) => box.id === selectedBoxId);
  const selectedContributions = contributions.data
    .filter((item) => item.savingsBoxId === selectedBoxId)
    .sort((a, b) => b.contributedAt.localeCompare(a.contributedAt));

  const totals = useMemo(() => {
    const total = selectedContributions.reduce((sum, item) => sum + contributionSignedAmount(item), 0);
    const byPerson = selectedContributions.reduce<Record<string, { name: string; total: number }>>((acc, item) => {
      if (!acc[item.createdByUid]) acc[item.createdByUid] = { name: item.createdByName, total: 0 };
      acc[item.createdByUid].total += contributionSignedAmount(item);
      return acc;
    }, {});

    return { total: roundMoney(total), byPerson: Object.values(byPerson).map((item) => ({ ...item, total: roundMoney(item.total) })) };
  }, [selectedContributions]);

  async function handleCreateBox(event: React.FormEvent) {
    event.preventDefault();
    if (!boxes.householdId || !appUser) return;
    await createSavingsBox({
      householdId: boxes.householdId,
      name: boxForm.name,
      goalAmount: Number(boxForm.goalAmount) || undefined,
      targetDate: boxForm.targetDate || undefined,
      institution: boxForm.institution || undefined,
      yieldType: boxForm.yieldType,
      yieldPercent: boxForm.yieldType === "cdi" ? Number(boxForm.yieldPercent) : undefined,
      annualRate: Number(boxForm.annualRate) || undefined,
      notes: boxForm.notes || undefined,
      createdByUid: appUser.uid
    });
    setBoxForm(boxBlank);
    setBoxFormOpen(false);
    await boxes.reload();
  }

  async function handleCreateContribution(event: React.FormEvent) {
    event.preventDefault();
    if (!contributions.householdId || !appUser || !selectedBoxId) return;
    await createSavingsContribution({
      householdId: contributions.householdId,
      savingsBoxId: selectedBoxId,
      createdByUid: appUser.uid,
      createdByName: appUser.name,
      amount: Number(contributionForm.amount),
      type: contributionForm.type,
      contributedAt: contributionForm.contributedAt,
      notes: contributionForm.notes || undefined
    });
    setContributionForm({ ...contributionBlank, savingsBoxId: selectedBoxId });
    setContributionFormOpen(false);
    await contributions.reload();
  }

  return (
    <ProtectedPage>
      <PageHeader title="Caixinhas" description="Acompanhe metas compartilhadas e aportes individuais para objetivos da família.">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => { setBoxForm(boxBlank); setBoxFormOpen(true); }}>
            <PiggyBank size={18} /> Nova caixinha
          </Button>
          <Button type="button" variant="secondary" onClick={() => { setContributionForm({ ...contributionBlank, savingsBoxId: selectedBoxId }); setContributionFormOpen(true); }} disabled={!selectedBoxId}>
            <Plus size={18} /> Novo lançamento
          </Button>
        </div>
      </PageHeader>

      <FloatingFormCard title="Nova caixinha" open={boxFormOpen} onOpenChange={setBoxFormOpen}>
          <form className="grid gap-4" onSubmit={handleCreateBox}>
            <Input label="Nome" value={boxForm.name} onChange={(event) => setBoxForm({ ...boxForm, name: event.target.value })} required />
            <MoneyInput label="Meta" value={boxForm.goalAmount} onChange={(event) => setBoxForm({ ...boxForm, goalAmount: Number(event.target.value) })} />
            <DatePicker label="Data alvo" value={boxForm.targetDate} onChange={(event) => setBoxForm({ ...boxForm, targetDate: event.target.value })} />
            <Input label="Instituição" value={boxForm.institution} onChange={(event) => setBoxForm({ ...boxForm, institution: event.target.value })} />
            <Select
              label="Tipo de rendimento"
              value={boxForm.yieldType}
              onChange={(event) => setBoxForm({ ...boxForm, yieldType: event.target.value as SavingsBoxYieldType })}
              options={[
                { value: "none", label: "Sem rendimento informado" },
                { value: "cdi", label: "Percentual do CDI" },
                { value: "fixed", label: "Taxa anual fixa" }
              ]}
            />
            {boxForm.yieldType === "cdi" ? (
              <>
                <Input label="% do CDI" type="number" min={0} step="0.01" value={boxForm.yieldPercent} onChange={(event) => setBoxForm({ ...boxForm, yieldPercent: Number(event.target.value) })} />
                <Input label="CDI anual estimado (%)" type="number" min={0} step="0.01" value={boxForm.annualRate} onChange={(event) => setBoxForm({ ...boxForm, annualRate: Number(event.target.value) })} />
              </>
            ) : null}
            {boxForm.yieldType === "fixed" ? (
              <Input label="Taxa anual (%)" type="number" min={0} step="0.01" value={boxForm.annualRate} onChange={(event) => setBoxForm({ ...boxForm, annualRate: Number(event.target.value) })} />
            ) : null}
            <Input label="Observações" value={boxForm.notes} onChange={(event) => setBoxForm({ ...boxForm, notes: event.target.value })} />
            <Button><Plus size={18} /> Criar caixinha</Button>
          </form>
      </FloatingFormCard>

      <FloatingFormCard title="Novo lançamento" open={contributionFormOpen} onOpenChange={setContributionFormOpen}>
          <form className="grid gap-4" onSubmit={handleCreateContribution}>
            <Select
              label="Caixinha"
              value={selectedBoxId}
              onChange={(event) => setContributionForm({ ...contributionForm, savingsBoxId: event.target.value })}
              options={boxes.data.map((box) => ({ value: box.id, label: box.name }))}
            />
            <Select
              label="Tipo"
              value={contributionForm.type}
              onChange={(event) => setContributionForm({ ...contributionForm, type: event.target.value as SavingsContributionType })}
              options={[
                { value: "deposit", label: "Aporte" },
                { value: "withdrawal", label: "Retirada" },
                { value: "yield", label: "Rendimento" }
              ]}
            />
            <MoneyInput label="Valor" value={contributionForm.amount} onChange={(event) => setContributionForm({ ...contributionForm, amount: Number(event.target.value) })} required />
            <DatePicker label="Data" value={contributionForm.contributedAt} onChange={(event) => setContributionForm({ ...contributionForm, contributedAt: event.target.value })} />
            <Input label="Observação" value={contributionForm.notes} onChange={(event) => setContributionForm({ ...contributionForm, notes: event.target.value })} />
            <Button disabled={!selectedBoxId}><Plus size={18} /> Lançar na minha conta</Button>
          </form>
      </FloatingFormCard>

      <div className="grid gap-6">
        <section className="grid gap-4">
          {boxes.loading || contributions.loading ? <StateMessage title="Carregando caixinhas..." /> : null}
          {!boxes.loading && boxes.data.length === 0 ? (
            <StateMessage title="Nenhuma caixinha criada." description="Crie a caixinha da casa para vocês dois registrarem os aportes." />
          ) : null}

          {selectedBox ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedBox.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedBox.institution || "Instituição não informada"}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedBox.yieldType === "cdi" ? <Badge>{selectedBox.yieldPercent || 0}% do CDI</Badge> : null}
                    {selectedBox.targetDate ? <Badge>Meta em {selectedBox.targetDate}</Badge> : null}
                  </div>
                </div>
                <Button variant="ghost" onClick={async () => { await deleteSavingsBox(selectedBox.id); await boxes.reload(); }}>
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Total guardado</p>
                  <strong className="text-2xl">{formatCurrency(totals.total)}</strong>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Meta</p>
                  <strong className="text-2xl">{formatCurrency(selectedBox.goalAmount || 0)}</strong>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Rendimento mensal estimado</p>
                  <strong className="text-2xl">{formatCurrency(estimateMonthlyYield(totals.total, selectedBox))}</strong>
                </div>
              </div>

              {selectedBox.goalAmount ? (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>{Math.min(100, Math.round((totals.total / selectedBox.goalAmount) * 100))}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (totals.total / selectedBox.goalAmount) * 100)}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {totals.byPerson.length ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-3 font-bold">Total por pessoa</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {totals.byPerson.map((person) => (
                  <div key={person.name} className="rounded-md border border-border p-3">
                    <p className="text-sm text-muted-foreground">{person.name}</p>
                    <strong className="text-xl">{formatCurrency(person.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 font-bold">Lançamentos</h2>
            {!selectedContributions.length ? <StateMessage title="Nenhum lançamento nesta caixinha." /> : null}
            <div className="grid gap-3">
              {selectedContributions.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong>{formatCurrency(item.amount)}</strong>
                    <p className="text-sm text-muted-foreground">{item.createdByName} · {item.contributedAt}</p>
                    {item.notes ? <p className="text-sm text-muted-foreground">{item.notes}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={item.type === "withdrawal" ? "bad" : "good"}>
                      {item.type === "deposit" ? "Aporte" : item.type === "yield" ? "Rendimento" : "Retirada"}
                    </Badge>
                    <Button variant="ghost" onClick={async () => { await deleteSavingsContribution(item.id); await contributions.reload(); }}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </ProtectedPage>
  );
}
