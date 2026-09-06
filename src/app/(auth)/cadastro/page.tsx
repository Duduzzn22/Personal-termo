"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithGoogleAction, signUpAction, type AuthActionState } from "@/lib/actions/auth.actions";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: AuthActionState = {};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="currentColor" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
      <path fill="currentColor" d="M12 22c2.7 0 4.97-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z" />
      <path fill="currentColor" d="M6.39 13.91A6.03 6.03 0 0 1 6.07 12c0-.66.11-1.3.32-1.91v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.51l3.35-2.6Z" />
      <path fill="currentColor" d="M12 5.96c1.47 0 2.78.5 3.82 1.49l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.35 2.6C7.18 7.72 9.39 5.96 12 5.96Z" />
    </svg>
  );
}

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <Card>
      <CardContent className="space-y-4">
        <form action={signInWithGoogleAction}>
          <Button type="submit" variant="outline" fullWidth>
            <GoogleMark />
            Criar conta com Google
          </Button>
        </form>

        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">ou</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form action={formAction} className="space-y-4">
          <Input
            label="Nome profissional"
            name="nome_profissional"
            required
            placeholder="Ex: Carlos Souza"
          />
          <Input label="E-mail" name="email" type="email" required autoComplete="email" />
          <Input
            label="Senha"
            name="password"
            type="password"
            required
            minLength={10}
            hint="Mínimo de 10 caracteres, com maiúscula, minúscula, número e símbolo."
            autoComplete="new-password"
          />
          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}
          <Button type="submit" fullWidth loading={pending}>
            Criar conta
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-slate-900 hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
