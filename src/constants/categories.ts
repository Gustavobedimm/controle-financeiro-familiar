import type { ExpenseCategoryType } from "@/types/finance";

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: ExpenseCategoryType;
  color: string;
  icon: string;
}> = [
  { name: "Moradia", type: "fixed", color: "#2a9d8f", icon: "home" },
  { name: "Mercado", type: "variable", color: "#e9c46a", icon: "shopping-cart" },
  { name: "Alimentação", type: "variable", color: "#e76f51", icon: "utensils" },
  { name: "Transporte", type: "variable", color: "#457b9d", icon: "car" },
  { name: "Saúde", type: "variable", color: "#d62828", icon: "heart-pulse" },
  { name: "Educação", type: "fixed", color: "#6d597a", icon: "graduation-cap" },
  { name: "Lazer", type: "variable", color: "#f4a261", icon: "party-popper" },
  { name: "Assinaturas", type: "fixed", color: "#264653", icon: "repeat" },
  { name: "Cartão de crédito", type: "card", color: "#118ab2", icon: "credit-card" },
  { name: "Outros", type: "other", color: "#6c757d", icon: "circle-help" }
];
