export function PageHeader({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-normal text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink/60">{description}</p>
      </div>
      {children}
    </header>
  );
}
