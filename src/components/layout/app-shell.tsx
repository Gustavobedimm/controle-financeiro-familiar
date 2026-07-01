"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Clipboard, CreditCard, FolderOpen, Home, LogOut, PiggyBank, Receipt, ReceiptText, TrendingUp, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/firebase/auth";
import { getDocument } from "@/lib/firebase/firestore";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import type { Household } from "@/types/finance";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/incomes", label: "Receitas", icon: TrendingUp },
  { href: "/quick-expenses", label: "Lançamentos", icon: ReceiptText },
  { href: "/expenses", label: "Despesas", icon: Receipt },
  { href: "/savings", label: "Caixinhas", icon: PiggyBank },
  { href: "/group", label: "Grupo", icon: Users },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/invoices", label: "Faturas", icon: WalletCards },
  { href: "/projections", label: "Projeções", icon: BarChart3 },
  { href: "/categories", label: "Categorias", icon: FolderOpen }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser, householdId } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadHousehold() {
      setHousehold(householdId ? await getDocument<Household>("households", householdId) : null);
    }

    void loadHousehold();
  }, [householdId]);

  async function handleLogout() {
    await logout();
    router.push("/auth/login");
  }

  async function copyHouseholdId() {
    if (!householdId) return;
    await navigator.clipboard.writeText(householdId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const identity = (
    <div className="rounded-md border border-border bg-muted/45 p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Household conectado</p>
      <p className="mt-1 text-sm font-bold text-foreground">{household?.name || "Grupo familiar"}</p>
      <div className="mt-2 flex items-start gap-2">
        <code className="min-w-0 flex-1 break-all rounded-sm bg-card px-2 py-1 text-[11px] text-muted-foreground">
          {householdId || "Sem household"}
        </code>
        <Button className="min-h-8 px-2 py-1" variant="ghost" onClick={copyHouseholdId} disabled={!householdId} title="Copiar householdId">
          <Clipboard size={14} />
        </Button>
      </div>
      {copied ? <p className="mt-1 text-xs font-semibold text-primary">ID copiado.</p> : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-border bg-card p-5 lg:block">
        <div className="mb-8 flex items-start justify-between gap-3">
          <div>
            <strong className="text-lg text-foreground">Finanças da Casa</strong>
            <p className="text-sm text-muted-foreground">{appUser?.name || "Conta familiar"}</p>
          </div>
          <ThemeToggle className="min-h-9 px-2" />
        </div>
        <div className="mb-5">{identity}</div>
        <nav className="grid gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" className="mt-8 w-full justify-start" onClick={handleLogout}>
          <LogOut size={18} /> Sair
        </Button>
      </aside>
      <main className="pb-20 lg:pb-0">
        <div className="flex items-start gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="min-w-0 flex-1">{identity}</div>
          <ThemeToggle className="min-h-9 px-2" />
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-10 border-t border-border bg-card lg:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`grid place-items-center py-3 ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
