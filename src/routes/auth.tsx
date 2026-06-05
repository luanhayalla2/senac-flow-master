import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acessar — SENAC Service Desk" },
      { name: "description", content: "Acesse o portal corporativo do SENAC Service Desk." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Mínimo 6 caracteres"),
});

const cadastroSchema = z.object({
  nome_completo: z.string().min(3, "Informe seu nome completo").max(120),
  email: z.string().email("E-mail inválido"),
  matricula: z.string().min(2, "Informe matrícula ou CPF").max(40),
  setor: z.string().min(2).max(80),
  senha: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"entrar" | "cadastrar">("entrar");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/portal" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex bg-gradient-hero text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/15 grid place-items-center font-display font-bold backdrop-blur">S</div>
          <div>
            <div className="font-display font-bold">SENAC Service Desk</div>
            <div className="text-xs uppercase tracking-widest text-white/70">Enterprise · MA</div>
          </div>
        </div>
        <div>
          <ShieldCheck className="h-10 w-10 text-primary-glow" />
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight">
            Atendimento corporativo com classificação automática e SLA em tempo real.
          </h1>
          <p className="mt-4 text-white/85 max-w-md">
            Abra chamados, acompanhe o atendimento e visualize indicadores do SENAC-MA em um único portal.
          </p>
        </div>
        <p className="text-xs text-white/60">Conforme boas práticas ITIL · Gestão de Incidentes</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h2 className="font-display text-2xl font-bold">Bem-vindo</h2>
          <p className="text-sm text-muted-foreground">Use suas credenciais institucionais para continuar.</p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "entrar" | "cadastrar")} className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const parsed = loginSchema.safeParse({
                    email: fd.get("email"),
                    senha: fd.get("senha"),
                  });
                  if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
                  setLoading(true);
                  const { error } = await supabase.auth.signInWithPassword({
                    email: parsed.data.email, password: parsed.data.senha,
                  });
                  setLoading(false);
                  if (error) { toast.error(error.message); return; }
                  toast.success("Acesso autorizado");
                  navigate({ to: "/portal" });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail institucional</Label>
                  <Input id="email" name="email" type="email" placeholder="seu.nome@ma.senac.br" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" name="senha" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="cadastrar" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const parsed = cadastroSchema.safeParse({
                    nome_completo: fd.get("nome_completo"),
                    email: fd.get("email"),
                    matricula: fd.get("matricula"),
                    setor: fd.get("setor"),
                    senha: fd.get("senha"),
                  });
                  if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
                  setLoading(true);
                  const { error } = await supabase.auth.signUp({
                    email: parsed.data.email,
                    password: parsed.data.senha,
                    options: {
                      emailRedirectTo: `${window.location.origin}/portal`,
                      data: {
                        nome_completo: parsed.data.nome_completo,
                        matricula: parsed.data.matricula,
                        setor: parsed.data.setor,
                      },
                    },
                  });
                  setLoading(false);
                  if (error) { toast.error(error.message); return; }
                  toast.success("Cadastro realizado! Você já pode entrar.");
                  setTab("entrar");
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="nome_completo">Nome completo</Label>
                  <Input id="nome_completo" name="nome_completo" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula / CPF</Label>
                    <Input id="matricula" name="matricula" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setor">Setor</Label>
                    <Input id="setor" name="setor" placeholder="Ex.: TI, Acadêmico" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail institucional</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" name="senha" type="password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline-offset-4 hover:underline">← Voltar ao site</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
