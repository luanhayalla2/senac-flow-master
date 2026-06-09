import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Mail,
  KeyRound,
} from "lucide-react";
import senacLogo from "@/assets/senac-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acessar — SENAC Service Desk" },
      { name: "description", content: "Acesse o portal corporativo do SENAC Service Desk com suas credenciais institucionais." },
    ],
  }),
  component: AuthPage,
});

// ---------- Validações ----------
const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail")
  .email("E-mail inválido")
  .max(255);

function validarCPF(cpf: string): boolean {
  const c = cpf.replace(/\D/g, "");
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

const matriculaSchema = z
  .string()
  .trim()
  .min(2, "Informe matrícula ou CPF")
  .max(40)
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    // Se parece com CPF (11 dígitos), valida CPF; senão aceita como matrícula
    if (digits.length === 11) return validarCPF(v);
    return /^[A-Za-z0-9.\-/]+$/.test(v);
  }, "CPF inválido ou matrícula com caracteres não permitidos");

function avaliarSenha(senha: string) {
  const checks = {
    tamanho: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /\d/.test(senha),
    especial: /[^A-Za-z0-9]/.test(senha),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

const STORAGE_KEEP = "senac.keep_signed_in";
const SUPABASE_STORAGE_KEY = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;

function aplicarPreferenciaSessao(keep: boolean) {
  try {
    localStorage.setItem(STORAGE_KEEP, keep ? "1" : "0");
    if (!keep) {
      // Quando o usuário não pediu para manter conectado, encerra a sessão ao fechar o navegador.
      const cleanup = () => {
        const token = localStorage.getItem(SUPABASE_STORAGE_KEY);
        if (token) sessionStorage.setItem(SUPABASE_STORAGE_KEY, token);
        localStorage.removeItem(SUPABASE_STORAGE_KEY);
      };
      window.addEventListener("pagehide", cleanup, { once: true });
    }
  } catch {
    // ignore
  }
}

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
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      <aside className="hidden lg:flex bg-gradient-hero text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <img
            src={senacLogo}
            alt="SENAC Maranhão"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-contain bg-white/15 backdrop-blur"
          />
          <div>
            <div className="font-display font-bold">SENAC Service Desk</div>
            <div className="text-xs uppercase tracking-widest text-white/80">Enterprise · MA</div>
          </div>
        </div>
        <div>
          <ShieldCheck className="h-10 w-10 text-primary-glow" aria-hidden="true" />
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight">
            Atendimento corporativo com classificação automática e SLA em tempo real.
          </h1>
          <p className="mt-4 text-white/90 max-w-md text-base">
            Abra chamados, acompanhe o atendimento e visualize indicadores do SENAC-MA em um único portal.
          </p>
        </div>
        <p className="text-xs text-white/75">Conforme boas práticas ITIL · Gestão de Incidentes</p>
      </aside>

      <main className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src={senacLogo} alt="SENAC" className="h-9 w-9 object-contain" />
            <div className="font-display font-bold text-secondary">SENAC Service Desk</div>
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground">Bem-vindo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use suas credenciais institucionais para continuar.
          </p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "entrar" | "cadastrar")} className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="mt-6">
              <FormEntrar loading={loading} setLoading={setLoading} onSuccess={() => navigate({ to: "/portal" })} />
            </TabsContent>

            <TabsContent value="cadastrar" className="mt-6">
              <FormCadastrar loading={loading} setLoading={setLoading} onSuccess={() => setTab("entrar")} />
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              ← Voltar ao site institucional
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

// ---------- Entrar ----------
function FormEntrar({
  loading,
  setLoading,
  onSuccess,
}: {
  loading: boolean;
  setLoading: (b: boolean) => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);
  const [touched, setTouched] = useState<{ email?: boolean; senha?: boolean }>({});

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEEP);
      if (v !== null) setManterConectado(v === "1");
    } catch {
      // ignore
    }
  }, []);

  const errEmail = useMemo(() => {
    if (!touched.email) return undefined;
    const r = emailSchema.safeParse(email);
    return r.success ? undefined : r.error.issues[0].message;
  }, [email, touched.email]);

  const errSenha = useMemo(() => {
    if (!touched.senha) return undefined;
    if (senha.length === 0) return "Informe sua senha";
    if (senha.length < 6) return "Mínimo 6 caracteres";
    return undefined;
  }, [senha, touched.senha]);

  const podeEnviar = email.length > 0 && senha.length >= 6 && !errEmail;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, senha: true });
    const r = emailSchema.safeParse(email);
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return;
    }
    if (senha.length < 6) {
      toast.error("Senha deve ter ao menos 6 caracteres");
      return;
    }
    setLoading(true);
    aplicarPreferenciaSessao(manterConectado);
    const { error } = await supabase.auth.signInWithPassword({ email: r.data, password: senha });
    setLoading(false);
    if (error) {
      toast.error(traduzirErroAuth(error.message));
      return;
    }
    toast.success("Acesso autorizado");
    onSuccess();
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail institucional</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          aria-invalid={!!errEmail}
          aria-describedby={errEmail ? "email-erro" : undefined}
          placeholder="seu.nome@ma.senac.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          className={errEmail ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errEmail && (
          <p id="email-erro" className="text-sm text-destructive flex items-center gap-1.5">
            <XCircle className="h-4 w-4" aria-hidden="true" /> {errEmail}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="senha">Senha</Label>
          <EsqueceuSenhaDialog emailInicial={email} />
        </div>
        <div className="relative">
          <Input
            id="senha"
            name="senha"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={!!errSenha}
            aria-describedby={errSenha ? "senha-erro" : undefined}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, senha: true }))}
            className={`pr-10 ${errSenha ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={mostrarSenha}
            className="absolute inset-y-0 right-0 grid place-items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errSenha && (
          <p id="senha-erro" className="text-sm text-destructive flex items-center gap-1.5">
            <XCircle className="h-4 w-4" aria-hidden="true" /> {errSenha}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="manter"
          checked={manterConectado}
          onCheckedChange={(v) => setManterConectado(v === true)}
        />
        <Label htmlFor="manter" className="text-sm font-normal cursor-pointer">
          Manter-me conectado neste dispositivo
        </Label>
      </div>

      <Button type="submit" className="w-full h-11 text-base" disabled={loading || !podeEnviar}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />}
        Entrar
      </Button>

      <p className="text-xs text-muted-foreground">
        Ao continuar, você concorda com as políticas internas de uso do SENAC-MA.
      </p>
    </form>
  );
}

// ---------- Cadastrar ----------
function FormCadastrar({
  loading,
  setLoading,
  onSuccess,
}: {
  loading: boolean;
  setLoading: (b: boolean) => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    nome_completo: "",
    matricula: "",
    setor: "",
    email: "",
    senha: "",
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const errors = useMemo(() => {
    const e: Record<string, string | undefined> = {};
    if (form.nome_completo.trim().length < 3) e.nome_completo = "Informe seu nome completo";
    const em = emailSchema.safeParse(form.email);
    if (!em.success) e.email = em.error.issues[0].message;
    const mt = matriculaSchema.safeParse(form.matricula);
    if (!mt.success) e.matricula = mt.error.issues[0].message;
    if (form.setor.trim().length < 2) e.setor = "Informe seu setor";
    return e;
  }, [form]);

  const { score, checks } = avaliarSenha(form.senha);
  const senhaForte = score >= 4 && checks.tamanho;
  const podeEnviar =
    Object.keys(errors).length === 0 && senhaForte;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nome_completo: true, matricula: true, setor: true, email: true, senha: true });
    if (!podeEnviar) {
      toast.error("Revise os campos destacados antes de continuar");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        data: {
          nome_completo: form.nome_completo.trim(),
          matricula: form.matricula.trim(),
          setor: form.setor.trim(),
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(traduzirErroAuth(error.message));
      return;
    }
    toast.success("Cadastro realizado! Você já pode entrar.");
    onSuccess();
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <CampoTexto
        id="nome_completo"
        label="Nome completo"
        autoComplete="name"
        value={form.nome_completo}
        onChange={setField("nome_completo")}
        onBlur={blur("nome_completo")}
        error={touched.nome_completo ? errors.nome_completo : undefined}
      />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto
          id="matricula"
          label="Matrícula / CPF"
          value={form.matricula}
          onChange={setField("matricula")}
          onBlur={blur("matricula")}
          error={touched.matricula ? errors.matricula : undefined}
        />
        <CampoTexto
          id="setor"
          label="Setor"
          placeholder="Ex.: TI, Acadêmico"
          value={form.setor}
          onChange={setField("setor")}
          onBlur={blur("setor")}
          error={touched.setor ? errors.setor : undefined}
        />
      </div>
      <CampoTexto
        id="email"
        label="E-mail institucional"
        type="email"
        autoComplete="email"
        value={form.email}
        onChange={setField("email")}
        onBlur={blur("email")}
        error={touched.email ? errors.email : undefined}
      />
      <div className="space-y-2">
        <Label htmlFor="senha-novo">Senha</Label>
        <div className="relative">
          <Input
            id="senha-novo"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="new-password"
            value={form.senha}
            onChange={setField("senha")}
            onBlur={blur("senha")}
            aria-invalid={touched.senha && !senhaForte}
            aria-describedby="senha-requisitos"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={mostrarSenha}
            className="absolute inset-y-0 right-0 grid place-items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <BarraForcaSenha score={score} />
        <ul id="senha-requisitos" className="text-xs text-muted-foreground grid grid-cols-2 gap-y-1 gap-x-3 pt-1">
          <ItemRequisito ok={checks.tamanho} texto="Mínimo 8 caracteres" />
          <ItemRequisito ok={checks.maiuscula} texto="Letra maiúscula" />
          <ItemRequisito ok={checks.minuscula} texto="Letra minúscula" />
          <ItemRequisito ok={checks.numero} texto="Número" />
          <ItemRequisito ok={checks.especial} texto="Caractere especial" />
        </ul>
      </div>

      <Button type="submit" className="w-full h-11 text-base" disabled={loading || !podeEnviar}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />}
        Criar conta
      </Button>
    </form>
  );
}

// ---------- Esqueceu a senha ----------
function EsqueceuSenhaDialog({ emailInicial }: { emailInicial: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(emailInicial);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(emailInicial);
      setEnviado(false);
    }
  }, [open, emailInicial]);

  const errEmail = useMemo(() => {
    if (!email) return undefined;
    const r = emailSchema.safeParse(email);
    return r.success ? undefined : r.error.issues[0].message;
  }, [email]);

  async function enviar() {
    const r = emailSchema.safeParse(email);
    if (!r.success) {
      toast.error(r.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(r.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(traduzirErroAuth(error.message));
      return;
    }
    setEnviado(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
        >
          Esqueceu a senha?
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
            Recuperar acesso SENAC
          </DialogTitle>
          <DialogDescription>
            {enviado
              ? "Enviamos as instruções para o e-mail informado. Verifique também a caixa de spam."
              : "Informe seu e-mail institucional. Você receberá um link seguro para criar uma nova senha."}
          </DialogDescription>
        </DialogHeader>

        {!enviado ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email-reset">E-mail institucional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email-reset"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="seu.nome@ma.senac.br"
                  className={`pl-9 ${errEmail ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errEmail}
                  aria-describedby={errEmail ? "email-reset-erro" : "email-reset-dica"}
                />
              </div>
              {errEmail ? (
                <p id="email-reset-erro" className="text-sm text-destructive">{errEmail}</p>
              ) : (
                <p id="email-reset-dica" className="text-xs text-muted-foreground">
                  Use o mesmo e-mail cadastrado no SENAC Service Desk.
                </p>
              )}
            </div>
            <div className="rounded-md bg-accent/60 p-3 text-xs text-accent-foreground">
              <strong className="font-semibold">Precisa de ajuda?</strong> Se você não tem acesso ao
              e-mail institucional, procure o setor de TI do SENAC-MA para validar sua identidade.
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-success/30 bg-success/10 p-4 text-sm text-foreground flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium">E-mail enviado para {email}.</p>
              <p className="text-muted-foreground mt-1">
                O link expira em alguns minutos por segurança. Caso não receba, confira o spam ou tente novamente.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {enviado ? "Fechar" : "Cancelar"}
          </Button>
          {!enviado && (
            <Button onClick={enviar} disabled={loading || !!errEmail || !email}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />}
              Enviar link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Helpers ----------
function CampoTexto({
  id,
  label,
  error,
  ...props
}: {
  id: string;
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-erro` : undefined}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        {...props}
      />
      {error && (
        <p id={`${id}-erro`} className="text-sm text-destructive flex items-center gap-1.5">
          <XCircle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

function BarraForcaSenha({ score }: { score: number }) {
  const cores = ["bg-muted", "bg-destructive", "bg-warning", "bg-warning", "bg-success", "bg-success"];
  const rotulos = ["—", "Muito fraca", "Fraca", "Razoável", "Forte", "Excelente"];
  return (
    <div aria-live="polite" className="space-y-1">
      <div className="grid grid-cols-5 gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-colors ${i <= score ? cores[score] : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Força da senha: <span className="font-medium text-foreground">{rotulos[score]}</span></p>
    </div>
  );
}

function ItemRequisito({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-success" : ""}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 inline-block" aria-hidden="true" />}
      <span>{texto}</span>
    </li>
  );
}

function traduzirErroAuth(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("user already registered")) return "Este e-mail já está cadastrado.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns instantes.";
  if (m.includes("password")) return "Senha não atende aos requisitos de segurança.";
  return msg;
}
