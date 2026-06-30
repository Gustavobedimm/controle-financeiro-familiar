import { Input } from "@/components/ui/input";

export function MoneyInput(props: Omit<React.ComponentProps<typeof Input>, "type" | "step">) {
  return <Input type="number" step="0.01" min="0" inputMode="decimal" {...props} />;
}
