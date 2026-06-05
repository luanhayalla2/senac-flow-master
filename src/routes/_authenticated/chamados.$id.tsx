import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession, isTecnico, isAdminLike } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NivelBadge, StatusBadge } from "@/components/chamado-badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Star, Play, ArrowUpRight, CheckCircle2, RotateCcw, X, Loader2 } from "lucide-react";
import { formatSla, slaProgress, type ChamadoStatus, type ChamadoPrioridade, type Nivel, PRIORIDADE_LABEL } from "@/lib/senac";

export const Route = createFileRoute("/_authenticated/chamados/$id")({
  component: ChamadoDetalhe,
});

interface Chamado {
  id: string; numero: string; titulo: string; descricao: string;
  status: ChamadoStatus; nivel: Nivel; prioridade: ChamadoPrioridade;
  solicitante_id: string; tecnico_id: string | null;
  unidade_id: string; setor: string; subcategoria_id: string;
  sla_resposta_min: number; sla_solucao_min: number;
  aberto_em: string; primeiro_atendimento_em: string | null;
  resolvido_em: string | null; fechado_em: string | null;
  solucao: string | null;
}
interface Hist { id: string; acao: string; detalhes: Record<string, unknown> | null; criado_em: string; autor_id: string | null }

function ChamadoDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, roles } = useSession();
  const tecnico = isTecnico(roles);
  const admin = isAdminLike(roles);

  const { data: chamado } = useQuery({
    queryKey: ["chamado", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("chamados").select("*").eq("id", id).single();
      if (error) throw error;
      return data as unknown as Chamado;
    },
  });

  const { data: historico } = useQuery({
    queryKey: ["chamado-hist", id],
    queryFn: async () => {
      const { data } = await supabase.from("chamado_historico").select("*").eq("chamado_id", id).order("criado_em", { ascending: true });
      return (data ?? []) as Hist[];
    },
  });

  const { data: avaliacao } = useQuery({
    queryKey: ["chamado-aval", id],
    queryFn: async () => {
      const { data } = await supabase.from("avaliacoes").select("*").eq("chamado_id", id).maybeSingle();
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["chamado", id] });
    qc.invalidateQueries({ queryKey: ["chamado-hist", id] });
    qc.invalidateQueries({ queryKey: ["chamado-aval", id] });
  };

  if (!chamado) return <div className="text-sm text-muted-foreground">Carregando...</div>;

  const sou_solicitante = user?.id === chamado.solicitante_id;
  const sla = slaProgress(chamado.aberto_em, chamado.sla_solucao_min, chamado.resolvido_em);

  return (
    <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs text-muted-foreground">{chamado.numero}</div>
                <CardTitle className="font-display text-xl mt-1">{chamado.titulo}</CardTitle>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <NivelBadge nivel={chamado.nivel} />
                  <StatusBadge status={chamado.status} />
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 py-0.5 border rounded">{PRIORIDADE_LABEL[chamado.prioridade]}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Descrição</div>
              <p className="text-sm whitespace-pre-wrap">{chamado.descricao}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Setor" value={chamado.setor} />
              <Info label="Aberto em" value={new Date(chamado.aberto_em).toLocaleString("pt-BR")} />
              {chamado.primeiro_atendimento_em && <Info label="Início atend." value={new Date(chamado.primeiro_atendimento_em).toLocaleString("pt-BR")} />}
              {chamado.resolvido_em && <Info label="Resolvido em" value={new Date(chamado.resolvido_em).toLocaleString("pt-BR")} />}
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground uppercase tracking-wide">SLA de solução · {formatSla(chamado.sla_solucao_min)}</span>
                <span className={sla.vencido ? "text-destructive font-semibold" : "text-muted-foreground"}>
                  {sla.vencido ? "Vencido" : `Restam ${formatSla(Math.max(0, sla.restanteMin))}`}
                </span>
              </div>
              <Progress value={sla.pct} className={sla.vencido ? "[&>div]:bg-destructive" : sla.pct > 80 ? "[&>div]:bg-warning" : ""} />
            </div>
            {chamado.solucao && (
              <div className="rounded-lg border bg-success/5 p-4">
                <div className="text-xs uppercase tracking-wide text-success font-semibold mb-1">Solução aplicada</div>
                <p className="text-sm whitespace-pre-wrap">{chamado.solucao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Histórico</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative border-l ml-2 space-y-4">
              {historico?.map((h) => (
                <li key={h.id} className="ml-4">
                  <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary mt-1.5" />
                  <div className="text-sm font-medium capitalize">{h.acao.replace("_"," ")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(h.criado_em).toLocaleString("pt-BR")}</div>
                  {h.detalhes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {Object.entries(h.detalhes).map(([k, v]) => <span key={k} className="mr-3"><b>{k}:</b> {String(v)}</span>)}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {(tecnico || admin) && (
          <AcoesTecnico chamado={chamado} userId={user!.id} onChange={refresh} />
        )}
        {sou_solicitante && chamado.status === "resolvido" && (
          <ValidacaoSolicitante chamado={chamado} onChange={refresh} />
        )}
        {sou_solicitante && chamado.status === "fechado" && !avaliacao && (
          <AvaliacaoForm chamadoId={chamado.id} onChange={refresh} />
        )}
        {avaliacao && <AvaliacaoView aval={avaliacao as unknown as { atendimento: number; agilidade: number; comunicacao: number; qualidade: number; geral: number; comentario: string | null }} />}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function AcoesTecnico({ chamado, userId, onChange }: { chamado: Chamado; userId: string; onChange: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [solucao, setSolucao] = useState("");
  const [novoNivel, setNovoNivel] = useState<Nivel>("n2");

  const update = async (patch: Partial<Chamado>, msg: string) => {
    setLoading(msg);
    const { error } = await supabase.from("chamados").update(patch).eq("id", chamado.id);
    setLoading(null);
    if (error) { toast.error(error.message); return; }
    toast.success(msg);
    onChange();
  };

  const iniciar = () => update({
    status: "em_atendimento",
    tecnico_id: userId,
    primeiro_atendimento_em: chamado.primeiro_atendimento_em ?? new Date().toISOString(),
  }, "Atendimento iniciado");

  const escalonar = async () => {
    if (!motivo.trim()) { toast.error("Informe o motivo do escalonamento"); return; }
    setLoading("Escalonando...");
    const { error: e1 } = await supabase.from("chamados").update({
      nivel: novoNivel, status: "escalonado", tecnico_id: null,
    }).eq("id", chamado.id);
    if (!e1) {
      await supabase.from("chamado_historico").insert({
        chamado_id: chamado.id, autor_id: userId, acao: "motivo_escalonamento",
        detalhes: { motivo, de: chamado.nivel, para: novoNivel },
      });
    }
    setLoading(null);
    if (e1) { toast.error(e1.message); return; }
    toast.success("Chamado escalonado");
    setMotivo("");
    onChange();
  };

  const resolver = async () => {
    if (!solucao.trim()) { toast.error("Descreva a solução aplicada"); return; }
    await update({ status: "resolvido", solucao, resolvido_em: new Date().toISOString() }, "Chamado marcado como resolvido");
    setSolucao("");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Ações de atendimento</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {chamado.status === "aberto" || chamado.status === "escalonado" || chamado.status === "reaberto" ? (
          <Button className="w-full" onClick={iniciar} disabled={!!loading}>
            <Play className="h-4 w-4 mr-2" /> Iniciar atendimento
          </Button>
        ) : null}

        {chamado.status === "em_atendimento" && (
          <>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Escalonar para</div>
              <Select value={novoNivel} onValueChange={(v) => setNovoNivel(v as Nivel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["n1","n2","n3"] as Nivel[]).filter((n) => n !== chamado.nivel).map((n) => (
                    <SelectItem key={n} value={n}>{n.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea placeholder="Motivo do escalonamento (obrigatório)" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} />
              <Button variant="outline" className="w-full" onClick={escalonar} disabled={!!loading}>
                <ArrowUpRight className="h-4 w-4 mr-2" /> Escalonar
              </Button>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Resolver chamado</div>
              <Textarea placeholder="Solução aplicada (obrigatório)" value={solucao} onChange={(e) => setSolucao(e.target.value)} rows={3} />
              <Button className="w-full" onClick={resolver} disabled={!!loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Marcar como resolvido
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ValidacaoSolicitante({ chamado, onChange }: { chamado: Chamado; onChange: () => void }) {
  const [motivo, setMotivo] = useState("");
  const aceitar = async () => {
    const { error } = await supabase.from("chamados").update({ status: "fechado", fechado_em: new Date().toISOString() }).eq("id", chamado.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Solução aceita. Chamado encerrado.");
    onChange();
  };
  const reabrir = async () => {
    if (!motivo.trim()) { toast.error("Informe o motivo da reabertura"); return; }
    const { error } = await supabase.from("chamados").update({ status: "reaberto", motivo_reabertura: motivo, resolvido_em: null, tecnico_id: null }).eq("id", chamado.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Chamado reaberto");
    onChange();
  };
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Validar solução</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full" onClick={aceitar}><CheckCircle2 className="h-4 w-4 mr-2" />Aceitar solução</Button>
        <div className="text-xs text-center text-muted-foreground">ou</div>
        <Textarea rows={2} placeholder="Motivo da reabertura" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <Button variant="outline" className="w-full" onClick={reabrir}><RotateCcw className="h-4 w-4 mr-2" />Solicitar reabertura</Button>
      </CardContent>
    </Card>
  );
}

function AvaliacaoForm({ chamadoId, onChange }: { chamadoId: string; onChange: () => void }) {
  const [vals, setVals] = useState({ atendimento: 5, agilidade: 5, comunicacao: 5, qualidade: 5, geral: 5 });
  const [comentario, setComentario] = useState("");
  const submit = async () => {
    const { error } = await supabase.from("avaliacoes").insert({ chamado_id: chamadoId, ...vals, comentario });
    if (error) { toast.error(error.message); return; }
    toast.success("Avaliação registrada. Obrigado!");
    onChange();
  };
  const dims: { key: keyof typeof vals; label: string }[] = [
    { key: "atendimento", label: "Atendimento" },
    { key: "agilidade", label: "Agilidade" },
    { key: "comunicacao", label: "Comunicação" },
    { key: "qualidade", label: "Qualidade da solução" },
    { key: "geral", label: "Satisfação geral" },
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Pesquisa de satisfação</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {dims.map((d) => (
          <div key={d.key}>
            <div className="text-xs text-muted-foreground mb-1">{d.label}</div>
            <Stars value={vals[d.key]} onChange={(v) => setVals({ ...vals, [d.key]: v })} />
          </div>
        ))}
        <Textarea rows={2} placeholder="Comentário (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
        <Button className="w-full" onClick={submit}>Enviar avaliação</Button>
      </CardContent>
    </Card>
  );
}

function AvaliacaoView({ aval }: { aval: { atendimento: number; agilidade: number; comunicacao: number; qualidade: number; geral: number; comentario: string | null } }) {
  const dims: { key: keyof typeof aval; label: string }[] = [
    { key: "atendimento", label: "Atendimento" },
    { key: "agilidade", label: "Agilidade" },
    { key: "comunicacao", label: "Comunicação" },
    { key: "qualidade", label: "Qualidade" },
    { key: "geral", label: "Satisfação geral" },
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Avaliação registrada</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {dims.map((d) => (
          <div key={String(d.key)} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{d.label}</span>
            <Stars value={aval[d.key] as number} readOnly />
          </div>
        ))}
        {aval.comentario && <p className="text-sm pt-2 border-t italic text-muted-foreground">"{aval.comentario}"</p>}
      </CardContent>
    </Card>
  );
}

function Stars({ value, onChange, readOnly }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n} type="button" disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={n <= value ? "text-primary" : "text-muted"}
        >
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
    </div>
  );
}
