import { z } from "zod";

// ---------- E-mail ----------
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail")
  .email("E-mail inválido")
  .max(255);

// ---------- CPF ----------
export function validarCPF(cpf: string): boolean {
  const c = (cpf ?? "").replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i);
  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i);
  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10]);
}

// ---------- Matrícula / CPF ----------
export const matriculaSchema = z
  .string()
  .trim()
  .min(2, "Informe matrícula ou CPF")
  .max(40)
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length === 11) return validarCPF(v);
    return /^[A-Za-z0-9.\-/]+$/.test(v);
  }, "CPF inválido ou matrícula com caracteres não permitidos");

// ---------- Senha ----------
export interface ChecagemSenha {
  tamanho: boolean;
  maiuscula: boolean;
  minuscula: boolean;
  numero: boolean;
  especial: boolean;
}

export function avaliarSenha(senha: string): { checks: ChecagemSenha; score: number } {
  const checks: ChecagemSenha = {
    tamanho: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /\d/.test(senha),
    especial: /[^A-Za-z0-9]/.test(senha),
  };
  return { checks, score: Object.values(checks).filter(Boolean).length };
}

// ---------- Tradução de erros do Supabase Auth ----------
export function traduzirErroAuth(msg: string): string {
  const m = (msg ?? "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("user already registered")) return "Este e-mail já está cadastrado.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns instantes.";
  if (m.includes("expired") || m.includes("invalid token") || m.includes("otp_expired"))
    return "Link de recuperação inválido ou expirado. Solicite um novo.";
  if (m.includes("password")) return "Senha não atende aos requisitos de segurança.";
  if (m.includes("not found") || m.includes("user not found"))
    return "Não encontramos um cadastro com este e-mail. Verifique e tente novamente.";
  return msg;
}
