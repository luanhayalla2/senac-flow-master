import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, XCircle } from "lucide-react";
import senacLogo from "@/assets/senac-logo.png";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — SENAC Service Desk" },
      { name: "description", content: "Crie uma nova senha de acesso ao portal SENAC Service Desk." },
    ],
  }),
  component: ResetPasswordPage,
});

function avaliar(senha: string) {
  const checks = {
    tamanho: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /\d/.test(senha),
    especial: /[^A-Za-z0-9]/.test(senha),
  };
  return { checks, score: Object.values(checks).filter(Boolean).length };
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [sessaoRecovery, setSessaoRecovery] = useState<"checando" | "ok" | "invalida">("checando");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase processa o hash automaticamente e dispara PASSWORD_RECOVERY
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && window.location.hash.includes("type=recovery"))) {
        setSessaoRecovery("ok");
      } else if (session) {
        setSessaoRecovery("ok");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessaoRecovery("ok");
      else setTimeout(() => setSessaoRecovery((s) => (s === "checando" ? "invalida" : s)), 1500);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const { checks, score } = useMemo(() => avaliar(senha), [senha]);
  const forte = score >= 4 && checks.tamanho;
  const confere = senha.length > 0 && senha === confirmar;
  const pode = forte && confere && sessaoRecovery === "ok";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pode) {
      toast.error("Revise a senha antes de continuar");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada. Faça login com sua nova senha.");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-hero p-6">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <img src={senacLogo} alt="SENAC" className="h-10 w-10 object-contain" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">SENAC Service Desk</div>
          </div>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
            Definir nova senha
          </CardTitle>
          <CardDescription>
            Sua nova senha será usada para acessar o portal corporativo SENAC-MA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessaoRecovery === "checando" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando link de recuperação…
            </div>
          )}

          {sessaoRecovery === "invalida" && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm space-y-3">
              <p className="font-medium text-destructive flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Link inválido ou expirado
              </p>
              <p className="text-muted-foreground">
                Por segurança, o link de recuperação tem validade curta. Solicite um novo na tela de acesso.
              </p>
              <Link to="/auth" className="text-primary font-semibold hover:underline">
                ← Voltar para o login
              </Link>
            </div>
          )}

          {sessaoRecovery === "ok" && (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="nova">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="nova"
                    type={mostrar ? "text" : "password"}
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrar((v) => !v)}
                    aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={mostrar}
                    className="absolute inset-y-0 right-0 grid place-items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <ul className="text-xs text-muted-foreground grid grid-cols-2 gap-y-1 gap-x-3 pt-1">
                  <Req ok={checks.tamanho} t="Mínimo 8 caracteres" />
                  <Req ok={checks.maiuscula} t="Letra maiúscula" />
                  <Req ok={checks.minuscula} t="Letra minúscula" />
                  <Req ok={checks.numero} t="Número" />
                  <Req ok={checks.especial} t="Caractere especial" />
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar nova senha</Label>
                <Input
                  id="confirmar"
                  type={mostrar ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  className={confirmar.length > 0 && !confere ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {confirmar.length > 0 && !confere && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" aria-hidden="true" /> As senhas não coincidem
                  </p>
                )}
              </div>

              <div className="rounded-md bg-accent/60 p-3 text-xs text-accent-foreground flex gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                <span>Não compartilhe sua senha. O SENAC nunca solicitará credenciais por telefone ou e-mail.</span>
              </div>

              <Button type="submit" className="w-full h-11 text-base" disabled={!pode || loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar nova senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Req({ ok, t }: { ok: boolean; t: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-success" : ""}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 inline-block" />}
      <span>{t}</span>
    </li>
  );
}
