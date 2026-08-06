export function PageHeader({ title, description, children, compact = false }: { title: string; description: string; children?: React.ReactNode; compact?: boolean }) {
  return (
    <header className={`${compact ? "mb-3 gap-2" : "mb-6 gap-4"} flex flex-col sm:flex-row sm:items-end sm:justify-between`}>
      <div>
        <h1 className={`${compact ? "text-2xl" : "text-3xl"} font-bold tracking-normal text-foreground`}>{title}</h1>
        <p className={`${compact ? "mt-0.5 text-xs" : "mt-1 text-sm"} text-muted-foreground`}>{description}</p>
      </div>
      {children}
    </header>
  );
}
