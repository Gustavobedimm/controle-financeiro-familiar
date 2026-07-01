"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FloatingFormCardProps = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function FloatingFormCard({ title, open, onOpenChange, children }: FloatingFormCardProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="font-bold">{title}</h2>
          <Button type="button" variant="ghost" className="min-h-8 px-2 py-1" onClick={() => onOpenChange(false)} aria-label="Fechar formulário">
            <X size={16} />
          </Button>
        </div>
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
