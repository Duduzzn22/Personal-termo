"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTrainer } from "@/lib/auth/current-trainer";
import { PackagesRepository } from "@/lib/repositories/packages.repository";
import { AuditRepository } from "@/lib/repositories/audit.repository";
import { packageSchema } from "@/lib/validation/package.schema";
import { parseCurrencyToCents } from "@/lib/utils/format";

export interface PackageActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

function parsePackageForm(formData: FormData) {
  const raw = {
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
    quantidade_aulas: formData.get("quantidade_aulas"),
    duracao_minutos: formData.get("duracao_minutos"),
    valor_centavos: parseCurrencyToCents(String(formData.get("valor") || "0")),
    validade_dias: formData.get("validade_dias"),
    status: formData.get("status") || "ativo",
    observacoes: formData.get("observacoes"),
  };
  return packageSchema.safeParse(raw);
}

export async function createPackageAction(
  _prevState: PackageActionState,
  formData: FormData
): Promise<PackageActionState> {
  const parsed = parsePackageForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const packages = new PackagesRepository(db);
  const audit = new AuditRepository(db);

  const pkg = await packages.create(userId, parsed.data);
  await audit.log({
    trainer_id: userId,
    entity_type: "package",
    entity_id: pkg.id,
    event_type: "pacote_criado",
    description: `Pacote "${pkg.nome}" criado.`,
  });

  revalidatePath("/pacotes");
  return { success: true };
}

export async function updatePackageAction(
  packageId: string,
  _prevState: PackageActionState,
  formData: FormData
): Promise<PackageActionState> {
  const parsed = parsePackageForm(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifique os campos destacados.", fieldErrors };
  }

  const { userId } = await requireTrainer();
  const db = await createClient();
  const packages = new PackagesRepository(db);
  const audit = new AuditRepository(db);

  const pkg = await packages.update(userId, packageId, parsed.data);
  await audit.log({
    trainer_id: userId,
    entity_type: "package",
    entity_id: pkg.id,
    event_type: "pacote_atualizado",
    description: `Pacote "${pkg.nome}" atualizado.`,
  });

  revalidatePath("/pacotes");
  return { success: true };
}

export async function togglePackageStatusAction(packageId: string, status: "ativo" | "inativo") {
  const { userId } = await requireTrainer();
  const db = await createClient();
  const packages = new PackagesRepository(db);
  await packages.update(userId, packageId, { status });
  revalidatePath("/pacotes");
}
