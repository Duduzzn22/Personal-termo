export type PaymentStatus = "pendente" | "pago" | "cancelado";
export type PaymentMethod = "pix" | "dinheiro" | "cartao" | "transferencia" | "outro";

export interface Payment {
  id: string;
  trainer_id: string;
  student_id: string;
  student_package_id: string;
  valor_centavos: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: PaymentStatus;
  metodo: PaymentMethod | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithDetails extends Payment {
  students: { id: string; nome_completo: string } | null;
  student_packages: {
    id: string;
    packages: { id: string; nome: string } | null;
  } | null;
}
