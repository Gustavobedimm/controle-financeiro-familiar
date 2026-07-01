export function StateMessage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-card p-6 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
