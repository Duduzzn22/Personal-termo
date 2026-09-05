import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentRisk, StudentRiskReason } from "@/types/student-risk";
import { todayISO } from "@/lib/utils/agenda";

function utcDay(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

function dayDiff(from: string, to: string) {
  return Math.floor((utcDay(to) - utcDay(from)) / 86400000);
}

export async function buildStudentRadar(db: SupabaseClient, trainerId: string): Promise<StudentRisk[]> {
  const today = todayISO();
  const ninetyDaysAgo = new Date(utcDay(today) - 90 * 86400000).toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(utcDay(today) - 30 * 86400000).toISOString().slice(0, 10);

  const [studentsRes, packagesRes, paymentsRes, sessionsRes, assessmentsRes] = await Promise.all([
    db.from("students").select("id,nome_completo,whatsapp,telefone,status").eq("trainer_id", trainerId).eq("status", "ativo"),
    db.from("student_packages").select("*, package:packages(quantidade_aulas,nome)").eq("trainer_id", trainerId).order("created_at", { ascending: false }),
    db.from("payments").select("student_id,status,valor_centavos,data_vencimento").eq("trainer_id", trainerId).eq("status", "pendente"),
    db.from("training_sessions").select("student_id,data,status").eq("trainer_id", trainerId).gte("data", ninetyDaysAgo),
    db.from("physical_assessments").select("student_id,data_avaliacao").eq("trainer_id", trainerId).order("data_avaliacao", { ascending: false }),
  ]);

  const students = studentsRes.data ?? [];
  const packages = packagesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const assessments = assessmentsRes.data ?? [];

  return students.map((student) => {
    const reasons: StudentRiskReason[] = [];
    const studentPackages = packages.filter((p) => p.student_id === student.id);
    const activePackage = studentPackages.find((p) => p.status === "ativo") ?? studentPackages[0];
    const packageDef = activePackage?.package as { quantidade_aulas?: number; nome?: string } | null | undefined;
    const remaining = activePackage && packageDef?.quantidade_aulas != null
      ? Math.max(Number(packageDef.quantidade_aulas) - Number(activePackage.aulas_realizadas ?? 0), 0)
      : null;

    if (remaining !== null && remaining <= 2) reasons.push({ code: "saldo_baixo", label: `Apenas ${remaining} aula(s) restante(s)`, points: 25 });

    let expiresIn: number | null = null;
    if (activePackage?.data_validade_final) {
      expiresIn = dayDiff(today, activePackage.data_validade_final);
      if (expiresIn >= 0 && expiresIn <= 7) reasons.push({ code: "pacote_vencendo", label: `Pacote vence em ${expiresIn} dia(s)`, points: 15 });
      if (expiresIn < 0) reasons.push({ code: "pacote_vencido", label: "Pacote vencido", points: 30 });
    }

    const overdue = payments.filter((p) => p.student_id === student.id && p.data_vencimento < today);
    const overdueAmount = overdue.reduce((sum, p) => sum + Number(p.valor_centavos ?? 0), 0);
    if (overdue.length > 0) reasons.push({ code: "inadimplente", label: `${overdue.length} cobrança(s) vencida(s)`, points: 35 });

    const completed = sessions.filter((s) => s.student_id === student.id && s.status === "concluido").sort((a,b) => b.data.localeCompare(a.data));
    const daysWithoutTraining = completed[0] ? Math.max(dayDiff(completed[0].data, today), 0) : null;
    if (daysWithoutTraining === null) reasons.push({ code: "sem_aulas", label: "Nenhuma aula concluída nos últimos 90 dias", points: 35 });
    else if (daysWithoutTraining >= 30) reasons.push({ code: "inativo_30", label: `${daysWithoutTraining} dias sem aula concluída`, points: 40 });
    else if (daysWithoutTraining >= 14) reasons.push({ code: "inativo_14", label: `${daysWithoutTraining} dias sem aula concluída`, points: 25 });

    const cancellations30d = sessions.filter((s) => s.student_id === student.id && s.status === "cancelado" && s.data >= thirtyDaysAgo).length;
    if (cancellations30d >= 3) reasons.push({ code: "cancelamentos", label: `${cancellations30d} cancelamentos em 30 dias`, points: 20 });
    else if (cancellations30d === 2) reasons.push({ code: "cancelamentos", label: "2 cancelamentos em 30 dias", points: 10 });

    const latestAssessment = assessments.find((a) => a.student_id === student.id);
    if (!latestAssessment) reasons.push({ code: "sem_avaliacao", label: "Sem avaliação física registrada", points: 8 });
    else if (dayDiff(latestAssessment.data_avaliacao, today) >= 90) reasons.push({ code: "avaliacao_antiga", label: "Avaliação física há mais de 90 dias", points: 8 });

    const score = Math.min(reasons.reduce((sum, reason) => sum + reason.points, 0), 100);
    const level = score >= 60 ? "alto" : score >= 30 ? "medio" : "baixo";
    const recommendation = overdue.length
      ? "Priorize contato sobre a pendência financeira e confirme a continuidade do aluno."
      : daysWithoutTraining !== null && daysWithoutTraining >= 14
        ? "Entre em contato para entender a ausência e facilitar o retorno às aulas."
        : remaining !== null && remaining <= 2
          ? "Antecipe a conversa de renovação antes do fim do pacote."
          : cancellations30d >= 2
            ? "Converse sobre disponibilidade e ajuste de horários para reduzir cancelamentos."
            : "Acompanhamento normal; mantenha contato e evolução registrados.";

    return {
      studentId: student.id,
      studentName: student.nome_completo,
      whatsapp: student.whatsapp || student.telefone || null,
      score,
      level,
      reasons: reasons.sort((a,b) => b.points - a.points),
      recommendation,
      remainingClasses: remaining,
      daysWithoutTraining,
      overdueAmountCents: overdueAmount,
      packageExpiresInDays: expiresIn,
      cancellations30d,
    } satisfies StudentRisk;
  }).sort((a,b) => b.score - a.score || a.studentName.localeCompare(b.studentName));
}
