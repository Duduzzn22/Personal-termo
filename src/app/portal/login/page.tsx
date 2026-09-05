import { Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ disabled?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Área do Aluno</h1>
          <p className="mt-1 text-sm text-slate-500">Entre com o e-mail cadastrado pelo seu personal.</p>
        </div>

        <Card>
          <CardContent className="space-y-4">
            {params.disabled && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Seu acesso ao portal está desativado. Fale com seu personal trainer.
              </p>
            )}
            {params.error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                O link de acesso é inválido ou expirou. Solicite um novo abaixo.
              </p>
            )}
            <PortalLoginForm />
            <p className="text-center text-xs leading-5 text-slate-400">
              Não usamos senha: você recebe um link temporário de acesso no seu e-mail.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
