"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithEmail } from "@/lib/firebase/auth";
import { AuthCard } from "@/features/auth/components/auth-card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginWithEmail(email, password);
      router.push("/dashboard");
    } catch {
      setError("Não foi possível entrar. Confira e-mail e senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Entrar" subtitle="Acesse o controle financeiro da sua casa.">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link className="font-semibold text-primary" href="/auth/register">Criar conta</Link>
        <Link className="font-semibold text-muted-foreground" href="/auth/forgot-password">Esqueci a senha</Link>
      </div>
    </AuthCard>
  );
}
