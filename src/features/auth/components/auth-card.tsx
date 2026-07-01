import { ThemeToggle } from "@/features/theme/theme-toggle";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center bg-background px-4 py-10">
      <ThemeToggle className="absolute right-4 top-4 min-h-9 px-2" />
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-soft">
        <h1 className="text-2xl font-bold tracking-normal text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
