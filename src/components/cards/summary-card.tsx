import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

export function SummaryCard({
  title,
  value,
  icon: Icon,
  tone = "neutral"
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  tone?: "good" | "bad" | "neutral";
}) {
  const tones = {
    good: "text-primary bg-primary/10",
    bad: "text-destructive bg-destructive/10",
    neutral: "text-foreground bg-muted"
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className={`rounded-md p-2 ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <strong className="mt-3 block text-2xl font-bold tracking-normal text-foreground">{formatCurrency(value)}</strong>
    </section>
  );
}
