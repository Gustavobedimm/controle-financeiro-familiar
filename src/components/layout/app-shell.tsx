"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CreditCard, FolderOpen, Grid3X3, Home, LogOut, PiggyBank, Receipt, ReceiptText, TrendingUp, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/firebase/auth";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ThemeToggle } from "@/features/theme/theme-toggle";

const sections = [
  {
    label: "Visão geral",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/overview", label: "Visão rápida", icon: Grid3X3 },
      { href: "/projections", label: "Projeções", icon: BarChart3 }
    ]
  },
  {
    label: "Movimentações",
    items: [
      { href: "/incomes", label: "Receitas", icon: TrendingUp },
      { href: "/expenses", label: "Todas as despesas", icon: Receipt },
      { href: "/quick-expenses", label: "Lançar Pix ou dinheiro", icon: ReceiptText }
    ]
  },
  {
    label: "Cartões de crédito",
    items: [
      { href: "/cards", label: "Cartões e compras", icon: CreditCard },
      { href: "/invoices", label: "Faturas", icon: WalletCards }
    ]
  },
  {
    label: "Organização",
    items: [
      { href: "/savings", label: "Caixinhas", icon: PiggyBank },
      { href: "/group", label: "Grupo", icon: Users },
      { href: "/categories", label: "Categorias", icon: FolderOpen }
    ]
  }
];

const items = sections.flatMap((section) => section.items);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/auth/login");
  }

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
        <nav className="grid gap-5">
          {sections.map((section) => (
            <section key={section.label}>
              <p className="mb-1 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{section.label}</p>
              <div className="grid gap-1">
                {section.items.map((item) => {
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
              </div>
            </section>
          ))}
        </nav>
        <Button variant="ghost" className="mt-8 w-full justify-start" onClick={handleLogout}>
          <LogOut size={18} /> Sair
        </Button>
      </aside>
      <main className="pb-20 lg:pb-0">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <div>
            <strong className="text-base text-foreground">Finanças da Casa</strong>
            <p className="text-sm text-muted-foreground">{appUser?.name || "Conta familiar"}</p>
          </div>
          <ThemeToggle className="min-h-9 px-2" />
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-border bg-card lg:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`grid min-w-[76px] place-items-center gap-0.5 px-2 py-2 ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon size={18} />
              <span className="max-w-[72px] truncate text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
