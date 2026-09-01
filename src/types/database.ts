// =============================================================================
// Tipos que espelham o schema do banco (ver supabase/migrations/0001_init_schema.sql)
// Escritos manualmente para manter o projeto independente da CLI do Supabase.
// Se preferir, substitua por tipos gerados via `supabase gen types typescript`.
// =============================================================================

export type StudentStatus = "ativo" | "inativo" | "arquivado";
export type PackageStatus = "ativo" | "inativo";
export type StudentPackageStatus = "ativo" | "concluido" | "cancelado" | "expirado";
export type TermVersionStatus = "rascunho" | "publicado" | "arquivado";
export type InvitationStatus =
  | "pendente"
  | "aceito"
  | "expirado"
  | "cancelado"
  | "nova_versao_pendente";
export type AcceptanceStatus = "ativo" | "cancelado";
export type AuditEventType =
  | "termo_criado"
  | "termo_atualizado"
  | "clausula_criada"
  | "clausula_atualizada"
  | "clausula_removida"
  | "clausula_reordenada"
  | "versao_publicada"
  | "convite_gerado"
  | "convite_enviado"
  | "convite_cancelado"
  | "link_acessado"
  | "termo_aceito"
  | "pdf_gerado"
  | "nova_versao_solicitada"
  | "aluno_criado"
  | "aluno_atualizado"
  | "aluno_arquivado"
  | "pacote_criado"
  | "pacote_atualizado"
  | "termo_excluido"
  | "horario_treino_criado"
  | "horario_treino_atualizado"
  | "horario_treino_removido"
  | "sessao_treino_registrada"
  | "sessao_treino_removida";
export type TrainingSessionStatus = "agendado" | "concluido" | "cancelado";

export interface TrainerProfile {
  id: string;
  nome_profissional: string;
  nome_empresa: string | null;
  cref: string | null;
  email_contato: string | null;
  telefone: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  foto_url: string | null;
  cor_principal: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  trainer_id: string;
  nome_completo: string;
  cpf: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  observacoes: string | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  trainer_id: string;
  nome: string;
  descricao: string | null;
  quantidade_aulas: number;
  duracao_minutos: number;
  valor_centavos: number;
  validade_dias: number;
  status: PackageStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentPackage {
  id: string;
  trainer_id: string;
  student_id: string;
  package_id: string;
  data_inicio: string | null;
  data_validade_final: string | null;
  aulas_realizadas: number;
  status: StudentPackageStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TermTemplate {
  id: string;
  trainer_id: string;
  titulo: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TermClause {
  id: string;
  trainer_id: string;
  template_id: string;
  titulo: string;
  conteudo: string;
  posicao: number;
  obrigatoria: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TermVersion {
  id: string;
  trainer_id: string;
  template_id: string;
  versao: string;
  titulo_snapshot: string;
  status: TermVersionStatus;
  published_at: string | null;
  created_at: string;
}

export interface TermVersionClause {
  id: string;
  term_version_id: string;
  titulo: string;
  conteudo: string;
  posicao: number;
  obrigatoria: boolean;
  created_at: string;
}

/** Cláusula já com as variáveis {{...}} resolvidas, congelada dentro de um snapshot. */
export interface SnapshotClause {
  titulo: string;
  conteudo: string;
  posicao: number;
  obrigatoria: boolean;
}

/** Conteúdo completo apresentado ao aluno — persistido em convites e aceites. */
export interface DocumentSnapshot {
  termo_titulo: string;
  termo_versao: string;
  personal: {
    nome_profissional: string;
    nome_empresa: string | null;
    cref: string | null;
    whatsapp: string | null;
    email_contato: string | null;
  };
  aluno: {
    nome_completo: string;
    cpf: string | null;
    email: string | null;
    telefone: string | null;
  };
  pacote: {
    nome: string;
    quantidade_aulas: number;
    duracao_minutos: number;
    valor_centavos: number;
    validade_dias: number;
  };
  data_inicio: string | null;
  clausulas: SnapshotClause[];
  gerado_em: string;
}

export interface TermInvitation {
  id: string;
  trainer_id: string;
  student_id: string;
  package_id: string;
  student_package_id: string | null;
  term_version_id: string;
  token: string;
  data_inicio: string | null;
  informacoes_adicionais: string | null;
  document_snapshot: DocumentSnapshot;
  status: InvitationStatus;
  expires_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Acceptance {
  id: string;
  invitation_id: string;
  trainer_id: string;
  student_id: string;
  term_id: string;
  term_version_id: string;
  package_id: string;
  protocolo: string;
  document_snapshot: DocumentSnapshot;
  document_hash: string;
  checkbox_confirmado: boolean;
  accepted_at: string;
  timezone: string;
  ip_address: string | null;
  user_agent: string | null;
  status: AcceptanceStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  trainer_id: string;
  entity_type: string;
  entity_id: string | null;
  event_type: AuditEventType;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Padrão semanal fixo de treino de um aluno (ex.: "toda segunda às 19h"). */
export interface TrainingSchedule {
  id: string;
  trainer_id: string;
  student_id: string;
  dia_semana: number; // 0=domingo ... 6=sábado
  horario: string; // "HH:mm:ss"
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

/** Sessão avulsa (schedule_id nulo) ou exceção de uma ocorrência recorrente numa data específica. */
export interface TrainingSession {
  id: string;
  trainer_id: string;
  student_id: string;
  schedule_id: string | null;
  data: string; // "YYYY-MM-DD"
  horario: string; // "HH:mm:ss"
  status: TrainingSessionStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  trainer_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}
