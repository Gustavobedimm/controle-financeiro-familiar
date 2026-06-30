export function StateMessage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-md border border-dashed border-black/15 bg-white p-6 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink/60">{description}</p> : null}
    </div>
  );
}
