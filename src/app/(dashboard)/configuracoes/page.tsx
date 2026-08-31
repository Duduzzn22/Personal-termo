import { requireTrainer } from "@/lib/auth/current-trainer";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default async function ConfiguracoesPage() {
  const { profile } = await requireTrainer();

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados profissionais</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aviso importante</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-slate-600">
            Este sistema utiliza um <strong>Termo de Ciência e Aceite</strong> com registro
            eletrônico do aceite — não se trata de uma plataforma de assinatura eletrônica
            certificada nos moldes de infraestruturas de chaves públicas. Recomendamos revisão
            profissional (jurídica) do conteúdo dos termos sempre que envolverem obrigações
            relevantes para o seu negócio.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
