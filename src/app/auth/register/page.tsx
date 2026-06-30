"use client";

import Link from "next/link";
import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUserHousehold } from "@/features/auth/services/auth-service";
import { AuthCard } from "@/features/auth/components/auth-card";

function getRegisterErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Não foi possível criar a conta. Tente novamente.";
  }

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Este e-mail já possui uma conta. Tente entrar pelo login.",
    "auth/invalid-email": "O e-mail informado não parece válido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/operation-not-allowed": "Ative o provedor E-mail/senha no Firebase Authentication.",
    "auth/network-request-failed": "Falha de rede ao falar com o Firebase.",
    "permission-denied": "O Firebase recusou a gravação. Publique as regras do Firestore do projeto.",
    "unavailable": "O Firestore está indisponível agora. Tente novamente em alguns instantes."
  };

  return messages[error.code] || `Firebase retornou ${error.code}. ${error.message}`;
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", householdName: "" });
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setWarning("");
    try {
      const result = await createUserHousehold(form);
      if (result.setupWarning) setWarning(result.setupWarning);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Criar conta" subtitle="Crie o household compartilhado para sua família.">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Input label="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <Input label="Nome da casa" value={form.householdName} onChange={(event) => setForm({ ...form, householdName: event.target.value })} />
        <Input label="E-mail" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <Input label="Senha" type="password" minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        {warning ? <p className="rounded-md bg-accent/30 p-3 text-sm text-accent-foreground">{warning}</p> : null}
        <Button disabled={loading}>{loading ? "Criando..." : "Criar conta"}</Button>
      </form>
      <Link className="mt-4 block text-sm font-semibold text-mint" href="/auth/login">Já tenho conta</Link>
    </AuthCard>
  );
}
