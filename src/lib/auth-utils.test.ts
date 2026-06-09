import { describe, it, expect } from "vitest";
import {
  emailSchema,
  matriculaSchema,
  validarCPF,
  avaliarSenha,
  traduzirErroAuth,
} from "@/lib/auth-utils";

describe("auth-utils — validações", () => {
  describe("emailSchema", () => {
    it("rejeita string vazia com mensagem clara", () => {
      const r = emailSchema.safeParse("");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].message).toMatch(/informe seu e-mail/i);
    });

    it("rejeita formato inválido com mensagem clara", () => {
      for (const v of ["abc", "abc@", "@x.com", "a@b", "a@b.c"]) {
        const r = emailSchema.safeParse(v);
        expect(r.success, `esperava inválido: ${v}`).toBe(false);
        if (!r.success) expect(r.error.issues[0].message).toBe("E-mail inválido");
      }
    });

    it("aceita e-mails válidos", () => {
      for (const v of ["a@b.co", "joao.silva@ma.senac.br", "x+y@z.dev"]) {
        expect(emailSchema.safeParse(v).success, v).toBe(true);
      }
    });
  });

  describe("validarCPF", () => {
    it("aceita CPFs válidos com e sem máscara", () => {
      expect(validarCPF("529.982.247-25")).toBe(true);
      expect(validarCPF("52998224725")).toBe(true);
    });

    it("rejeita CPFs inválidos, repetidos ou com tamanho errado", () => {
      for (const v of ["12345678900", "00000000000", "11111111111", "123", "", "abcdefghijk"]) {
        expect(validarCPF(v), v).toBe(false);
      }
    });
  });

  describe("matriculaSchema", () => {
    it("aceita matrículas alfanuméricas comuns", () => {
      expect(matriculaSchema.safeParse("MA-2025/001").success).toBe(true);
      expect(matriculaSchema.safeParse("SRV12345").success).toBe(true);
    });

    it("quando parece CPF, valida CPF e dá mensagem específica", () => {
      const r = matriculaSchema.safeParse("123.456.789-00");
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].message).toMatch(/cpf inválido/i);
    });

    it("rejeita caracteres não permitidos", () => {
      const r = matriculaSchema.safeParse("MA 2025!");
      expect(r.success).toBe(false);
    });
  });

  describe("avaliarSenha", () => {
    it("pontua 0 para vazio e cresce com complexidade", () => {
      expect(avaliarSenha("").score).toBe(0);
      expect(avaliarSenha("abc").score).toBe(1); // minúscula
      expect(avaliarSenha("Abcdefgh").score).toBeGreaterThanOrEqual(3); // tamanho+maiusc+minusc
      const forte = avaliarSenha("Senac@2026");
      expect(forte.checks.tamanho).toBe(true);
      expect(forte.score).toBeGreaterThanOrEqual(4);
    });
  });

  describe("traduzirErroAuth", () => {
    it("traduz erros conhecidos do Supabase", () => {
      expect(traduzirErroAuth("Invalid login credentials")).toMatch(/incorretos/i);
      expect(traduzirErroAuth("Email not confirmed")).toMatch(/confirme/i);
      expect(traduzirErroAuth("User already registered")).toMatch(/já está cadastrado/i);
      expect(traduzirErroAuth("Email rate limit exceeded")).toMatch(/aguarde/i);
      expect(traduzirErroAuth("Token has expired or is invalid")).toMatch(/inválido ou expirado/i);
      expect(traduzirErroAuth("otp_expired")).toMatch(/inválido ou expirado/i);
      expect(traduzirErroAuth("User not found")).toMatch(/não encontramos/i);
    });

    it("repassa mensagens desconhecidas sem mascarar", () => {
      expect(traduzirErroAuth("Algo inesperado")).toBe("Algo inesperado");
    });
  });
});
