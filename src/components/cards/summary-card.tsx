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
    good: "text-mint bg-mint/10",
    bad: "text-coral bg-coral/10",
    neutral: "text-ink bg-ink/10"
  };

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink/60">{title}</p>
        <span className={`rounded-md p-2 ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <strong className="mt-3 block text-2xl font-bold tracking-normal text-ink">{formatCurrency(value)}</strong>
    </section>
  );
}
