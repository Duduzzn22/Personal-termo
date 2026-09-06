"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth.actions";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: AuthActionState = {};

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <Card>
      <CardContent className="space-y-4">
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
            hint="Mínimo de 10 caracteres. Prefira uma senha única e longa."
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
