import { Select } from "@/components/ui/select";
import type { ExpenseCategory } from "@/types/finance";

export function CategorySelect({
  categories,
  ...props
}: Omit<React.ComponentProps<typeof Select>, "options"> & { categories: ExpenseCategory[] }) {
  return <Select {...props} options={categories.map((category) => ({ value: category.id, label: category.name }))} />;
}
