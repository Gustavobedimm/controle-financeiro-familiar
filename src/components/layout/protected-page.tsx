"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { StateMessage } from "@/components/feedback/state-message";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) router.push("/auth/login");
  }, [firebaseUser, loading, router]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-foreground">Carregando...</div>;
  if (!firebaseUser) return <StateMessage title="Redirecionando para login..." />;

  return <AppShell>{children}</AppShell>;
}
