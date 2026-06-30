"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CreditCard, FolderOpen, Home, LogOut, Receipt, TrendingUp, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/firebase/auth";
import { useAuth } from "@/features/auth/hooks/use-auth";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/incomes", label: "Receitas", icon: TrendingUp },
  { href: "/expenses", label: "Despesas", icon: Receipt },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/invoices", label: "Faturas", icon: WalletCards },
  { href: "/projections", label: "Projeções", icon: BarChart3 },
  { href: "/categories", label: "Categorias", icon: FolderOpen }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/auth/login");
  }

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-black/10 bg-white p-5 lg:block">
        <div className="mb-8">
          <strong className="text-lg text-ink">Finanças da Casa</strong>
          <p className="text-sm text-ink/60">{appUser?.name || "Conta familiar"}</p>
        </div>
        <nav className="grid gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-mint/10 text-mint" : "text-ink/70 hover:bg-black/5"
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
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-7 border-t border-black/10 bg-white lg:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`grid place-items-center py-3 ${active ? "text-mint" : "text-ink/55"}`}>
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
