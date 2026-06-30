export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-black/10 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold tracking-normal text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink/60">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
