"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Ativar modo claro" : "Ativar modo escuro";
  const Icon = isDark ? Sun : Moon;

  return (
    <Button className={className} variant="ghost" onClick={toggleTheme} aria-label={label} title={label}>
      <Icon size={18} />
    </Button>
  );
}
