import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { NivelBadge } from "@/components/chamado-badges";
import { ArrowLeft, ArrowRight, CheckCircle2, Zap, Loader2 } from "lucide-react";
import { formatSla, type Nivel } from "@/lib/senac";

export const Route = createFileRoute("/_authenticated/chamados/novo")({
  component: NovoChamado,
});

const schema = z.object({
  unidade_id: z.string().uuid("Selecione a unidade"),
  setor: z.string().min(2).max(80),
  subcategoria_id: z.string().uuid("Escolha o problema"),
  titulo: z.string().min(5, "Mínimo 5 caracteres").max(120),
  descricao: z.string().min(10, "Descreva o problema").max(2000),
  prioridade: z.enum(["baixa","media","alta","critica"]),
});

interface Subcat { id: string; nome: string; descricao: string | null; nivel: Nivel; sla_resposta_min: number; sla_solucao_min: number; categoria_id: string }
interface Cat { id: string; nome: string; ordem: number }
interface Unidade { id: string; nome: string; cidade: string }

const SETORES_PADRAO = [
  "Restaurante Escola (RE)",
  "NUMOV - Núcleo de Unidade Móvel",
  "NUEAD - Núcleo de Educação a Distância",
  "NUTEC - Núcleo de Ensino Tecnológico",
  "NUIDI - Núcleo de Idiomas",
  "NUBEL - Núcleo de Beleza",
  "CEP - Centro de Educação Profissional",
  "SEESC - Secretaria Escolar",
  "BAOPO - Banco de Oportunidades",
  "BIDOC - Biblioteca e Documentação",
  "Acadêmico",
  "Administrativo",
  "TI",
  "Financeiro",
  "RH",
];

function NovoChamado() {
  const navigate = useNavigate();
  const { user, profile } = useSession();
  const [step, setStep] = useState(1);
  const [unidadeId, setUnidadeId] = useState(profile?.unidade_id ?? "");
  const setorInicial = profile?.setor
    ? (SETORES_PADRAO.includes(profile.setor) ? profile.setor : "__outro__")
    : "";
  const [setorSelect, setSetorSelect] = useState<string>(setorInicial);
  const [setorOutro, setSetorOutro] = useState<string>(setorInicial === "__outro__" ? (profile?.setor ?? "") : "");
  const setor = setorSelect === "__outro__" ? setorOutro.trim() : setorSelect;
  const [categoriaId, setCategoriaId] = useState("");
  const [subId, setSubId] = useState("");
  const [outroNivel, setOutroNivel] = useState<Nivel | "">("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<"baixa"|"media"|"alta"|"critica">("media");
  const [submitting, setSubmitting] = useState(false);

  const { data: unidades } = useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data } = await supabase.from("unidades").select("id, nome, cidade").order("nome");
      return (data ?? []) as Unidade[];
    },
  });
  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data } = await supabase.from("categorias").select("id, nome, ordem").order("ordem");
      return (data ?? []) as Cat[];
    },
  });
  const { data: subcats } = useQuery({
    queryKey: ["subcats", categoriaId],
    enabled: !!categoriaId,
    queryFn: async () => {
      const { data } = await supabase.from("subcategorias")
        .select("id, nome, descricao, nivel, sla_resposta_min, sla_solucao_min, categoria_id")
        .eq("categoria_id", categoriaId).eq("ativo", true).order("nome");
      return (data ?? []) as Subcat[];
    },
  });
  const subSel = useMemo(() => subcats?.find((s) => s.id === subId), [subcats, subId]);

  const submit = async () => {
    const parsed = schema.safeParse({ unidade_id: unidadeId, setor, subcategoria_id: subId, titulo, descricao, prioridade });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("chamados").insert({
      ...parsed.data,
      solicitante_id: user!.id,
      // os campos abaixo são preenchidos pelo trigger; precisamos enviar placeholders válidos
      numero: "",
      nivel: "n1",
      sla_resposta_min: 0,
      sla_solucao_min: 0,
    }).select("id, numero").single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Chamado ${data.numero} aberto com sucesso!`);
    navigate({ to: "/chamados/$id", params: { id: data.id } });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">Novo chamado</p>
        <h1 className="font-display text-3xl font-bold">Abertura de chamado</h1>
        <p className="text-sm text-muted-foreground">Em 4 passos. O sistema classifica o nível automaticamente.</p>
      </div>

      <Stepper step={step} />

      <Card>
        <CardContent className="pt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">1. Identificação</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidade SENAC</Label>
                  <Select value={unidadeId} onValueChange={setUnidadeId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {unidades?.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome} — {u.cidade}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Select value={setorSelect} onValueChange={setSetorSelect}>
                    <SelectTrigger><SelectValue placeholder="Selecione o setor..." /></SelectTrigger>
                    <SelectContent>
                      {SETORES_PADRAO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      <SelectItem value="__outro__">Outro (especificar)</SelectItem>
                    </SelectContent>
                  </Select>
                  {setorSelect === "__outro__" && (
                    <Input
                      value={setorOutro}
                      onChange={(e) => setSetorOutro(e.target.value)}
                      placeholder="Informe o nome do setor"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">2. Categoria do problema</h2>
              <p className="text-xs text-muted-foreground">
                Não encontra a categoria? Selecione <b>Outros</b> e descreva o problema nas próximas etapas.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categorias?.map((c) => (
                  <button key={c.id}
                    onClick={() => { setCategoriaId(c.id); setSubId(""); }}
                    className={`text-left rounded-lg border p-4 hover:border-primary transition ${categoriaId === c.id ? "border-primary bg-accent/40" : ""}`}>
                    <div className="font-semibold">{c.nome}</div>
                    {c.nome === "Outros" && <div className="text-[11px] text-muted-foreground mt-1">Para chamados que não se encaixam nas demais categorias</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">3. Problema específico</h2>
              <div className="space-y-2">
                {subcats?.map((s) => (
                  <button key={s.id}
                    onClick={() => setSubId(s.id)}
                    className={`w-full text-left rounded-lg border p-4 hover:border-primary transition flex items-start gap-3 ${subId === s.id ? "border-primary bg-accent/40" : ""}`}>
                    <NivelBadge nivel={s.nivel} />
                    <div className="flex-1">
                      <div className="font-medium">{s.nome}</div>
                      {s.descricao && <div className="text-xs text-muted-foreground mt-0.5">{s.descricao}</div>}
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right uppercase tracking-wide">
                      Resp. {formatSla(s.sla_resposta_min)}<br />Sol. {formatSla(s.sla_solucao_min)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold">4. Detalhes e confirmação</h2>
              {subSel && (
                <div className="rounded-lg border bg-accent/30 p-4 flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold">Classificação automática: <NivelBadge nivel={subSel.nivel} /></div>
                    <div className="text-muted-foreground mt-0.5">
                      Resposta em até <b>{formatSla(subSel.sla_resposta_min)}</b> · Solução em até <b>{formatSla(subSel.sla_solucao_min)}</b>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Impressora do setor não imprime" />
              </div>
              <div className="space-y-2">
                <Label>Descrição detalhada</Label>
                <Textarea rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva quando começou, o que tentou, mensagens de erro..." />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <RadioGroup value={prioridade} onValueChange={(v) => setPrioridade(v as typeof prioridade)} className="grid grid-cols-4 gap-2">
                  {(["baixa","media","alta","critica"] as const).map((p) => (
                    <Label key={p} htmlFor={`p-${p}`} className={`rounded-lg border p-3 text-center cursor-pointer capitalize ${prioridade === p ? "border-primary bg-accent/40" : ""}`}>
                      <RadioGroupItem id={`p-${p}`} value={p} className="sr-only" />
                      {p}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!unidadeId || !setor)) ||
                  (step === 2 && !categoriaId) ||
                  (step === 3 && !subId)
                }
              >
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Abrir chamado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const items = ["Identificação","Categoria","Problema","Confirmação"];
  return (
    <div className="flex items-center gap-2">
      {items.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold border ${done ? "bg-success text-success-foreground border-success" : active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"}`}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : n}
            </div>
            <div className={`text-xs ${active ? "font-semibold" : "text-muted-foreground"}`}>{label}</div>
            {n < items.length && <div className="flex-1 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
