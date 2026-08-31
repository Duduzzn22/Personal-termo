"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthActionState } from "@/lib/actions/auth.actions";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <Card>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          <Input label="E-mail" name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com" />
          <Input
            label="Senha"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}
          <Button type="submit" fullWidth loading={pending}>
            Entrar
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-slate-900 hover:underline">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
