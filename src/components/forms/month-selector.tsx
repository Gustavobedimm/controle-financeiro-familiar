import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMonthsToReference, readableMonth } from "@/lib/utils/dates";
import type { MonthReference } from "@/types/finance";

export function MonthSelector({
  value,
  onChange
}: {
  value: MonthReference;
  onChange: (reference: MonthReference) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" aria-label="Mês anterior" onClick={() => onChange(addMonthsToReference(value, -1))}>
        <ChevronLeft size={18} />
      </Button>
      <strong className="min-w-44 text-center text-sm capitalize text-foreground">{readableMonth(value)}</strong>
      <Button variant="ghost" aria-label="Próximo mês" onClick={() => onChange(addMonthsToReference(value, 1))}>
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}
