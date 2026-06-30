"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recoverPassword } from "@/lib/firebase/auth";
import { AuthCard } from "@/features/auth/components/auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await recoverPassword(email);
      setMessage("Enviamos um link de recuperação para o seu e-mail.");
    } catch {
      setMessage("Não foi possível enviar o e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Recuperar senha" subtitle="Receba um link para redefinir sua senha.">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Input label="E-mail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {message ? <p className="text-sm text-ink/70">{message}</p> : null}
        <Button disabled={loading}>{loading ? "Enviando..." : "Enviar link"}</Button>
      </form>
      <Link className="mt-4 block text-sm font-semibold text-mint" href="/auth/login">Voltar ao login</Link>
    </AuthCard>
  );
}
