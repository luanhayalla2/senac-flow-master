import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/senha")({
  component: SenhaPage,
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

function SenhaPage() {
  const { profile } = useSession();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(false);

  const { checks, score } = useMemo(() => avaliar(nova), [nova]);
  const forte = score >= 4 && checks.tamanho;
  const igual = nova.length > 0 && nova === confirmar;
  const podeEnviar = atual.length >= 6 && forte && igual;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.email) return;
    if (!podeEnviar) {
      toast.error("Revise os requisitos antes de continuar");
      return;
    }
    setLoading(true);
    // Reautentica com a senha atual
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: atual,
    });
    if (signErr) {
      setLoading(false);
      toast.error("Senha atual incorreta");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: nova });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível alterar: " + error.message);
      return;
    }
    toast.success("Senha alterada com sucesso");
    setAtual(""); setNova(""); setConfirmar("");
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <KeyRound className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold">Alterar Senha</h1>
          <p className="text-sm text-muted-foreground">Use uma senha forte e exclusiva.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Trocar senha</CardTitle>
          <CardDescription>É preciso informar a senha atual para confirmar a alteração.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <CampoSenha id="atual" label="Senha atual" value={atual} onChange={setAtual} mostrar={mostrar} setMostrar={setMostrar} autoComplete="current-password" />
            <CampoSenha id="nova" label="Nova senha" value={nova} onChange={setNova} mostrar={mostrar} setMostrar={setMostrar} autoComplete="new-password" />
            <CampoSenha id="confirmar" label="Confirmar nova senha" value={confirmar} onChange={setConfirmar} mostrar={mostrar} setMostrar={setMostrar} autoComplete="new-password" />
            <ul className="text-xs grid grid-cols-2 gap-y-1 gap-x-3 pt-1">
              <Req ok={checks.tamanho} t="Mínimo 8 caracteres" />
              <Req ok={checks.maiuscula} t="Letra maiúscula" />
              <Req ok={checks.minuscula} t="Letra minúscula" />
              <Req ok={checks.numero} t="Número" />
              <Req ok={checks.especial} t="Caractere especial" />
              <Req ok={igual} t="Confirmação confere" />
            </ul>
            <Button type="submit" disabled={loading || !podeEnviar} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CampoSenha({ id, label, value, onChange, mostrar, setMostrar, autoComplete }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  mostrar: boolean; setMostrar: (v: boolean) => void; autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={mostrar ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setMostrar(!mostrar)}
          aria-label={mostrar ? "Ocultar" : "Mostrar"}
          className="absolute inset-y-0 right-0 grid place-items-center px-3 text-muted-foreground hover:text-foreground"
        >
          {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Req({ ok, t }: { ok: boolean; t: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-success" : "text-muted-foreground"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {t}
    </li>
  );
}
