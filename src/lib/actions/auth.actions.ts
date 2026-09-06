"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthActionState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 10;

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const nome = String(formData.get("nome_profissional") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!nome || !email || password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Preencha nome, e-mail e uma senha com ao menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome_profissional: nome } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { error: "Este e-mail já possui cadastro." };
    }
    return { error: "Não foi possível concluir o cadastro. Tente novamente." };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
