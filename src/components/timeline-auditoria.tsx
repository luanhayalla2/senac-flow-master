import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  PlayCircle,
  FilePlus2,
  ArrowUpRight,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
  History,
  Download,
  Printer,
} from "lucide-react";
import { STATUS_LABEL, NIVEL_SHORT, type ChamadoStatus, type Nivel } from "@/lib/senac";

interface Hist {
  id: string;
  acao: string;
  detalhes: Record<string, unknown> | null;
  criado_em: string;
  autor_id: string | null;
}

interface ProfMap {
  [k: string]: { nome_completo: string };
}

const ACAO_META: Record<string, { label: string; Icon: typeof History; tone: string }> = {
  abertura: { label: "Chamado aberto", Icon: FilePlus2, tone: "text-primary border-primary/40 bg-primary/10" },
  mudanca_status: { label: "Mudança de status", Icon: RefreshCw, tone: "text-secondary border-secondary/40 bg-secondary/10" },
  escalonamento: { label: "Escalonamento de nível", Icon: ArrowUpRight, tone: "text-warning-foreground border-warning/50 bg-warning/15" },
  motivo_escalonamento: { label: "Motivo do escalonamento", Icon: MessageSquareWarning, tone: "text-warning-foreground border-warning/50 bg-warning/15" },
  atribuicao: { label: "Atribuição de técnico", Icon: UserPlus, tone: "text-primary border-primary/40 bg-primary/10" },
  inicio_atendimento: { label: "Início do atendimento", Icon: PlayCircle, tone: "text-primary border-primary/40 bg-primary/10" },
  fechamento_automatico: { label: "Fechamento automático", Icon: CheckCircle2, tone: "text-success border-success/40 bg-success/10" },
  default: { label: "Evento", Icon: History, tone: "text-muted-foreground border-border bg-muted/30" },
};

function metaFor(acao: string) {
  return ACAO_META[acao] ?? { ...ACAO_META.default, label: acao.replace(/_/g, " ") };
}

function renderDetalhes(acao: string, d: Record<string, unknown> | null): string {
  if (!d) return "";
  const parts: string[] = [];
  if (acao === "mudanca_status" && d.de && d.para) {
    parts.push(`${STATUS_LABEL[d.de as ChamadoStatus] ?? d.de} → ${STATUS_LABEL[d.para as ChamadoStatus] ?? d.para}`);
  } else if (acao === "escalonamento" && d.de && d.para) {
    parts.push(`${NIVEL_SHORT[d.de as Nivel] ?? d.de} → ${NIVEL_SHORT[d.para as Nivel] ?? d.para}`);
  } else if (acao === "motivo_escalonamento") {
    if (d.de && d.para) parts.push(`${NIVEL_SHORT[d.de as Nivel] ?? d.de} → ${NIVEL_SHORT[d.para as Nivel] ?? d.para}`);
    if (d.motivo) parts.push(`Motivo: ${d.motivo}`);
  } else if (acao === "atribuicao") {
    parts.push(d.tecnico_id ? "Atribuído a técnico" : "Atribuição removida");
  } else if (acao === "abertura") {
    if (d.numero) parts.push(`Nº ${d.numero}`);
    if (d.nivel) parts.push(`Nível ${NIVEL_SHORT[d.nivel as Nivel] ?? d.nivel}`);
  } else {
    for (const [k, v] of Object.entries(d)) parts.push(`${k}: ${String(v)}`);
  }
  return parts.join(" · ");
}

export function TimelineAuditoria({ chamadoId, numero }: { chamadoId: string; numero: string }) {
  const { data: historico } = useQuery({
    queryKey: ["chamado-hist", chamadoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chamado_historico")
        .select("*")
        .eq("chamado_id", chamadoId)
        .order("criado_em", { ascending: true });
      return (data ?? []) as Hist[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["chamado-hist-profiles", chamadoId, historico?.length],
    queryFn: async (): Promise<ProfMap> => {
      const ids = Array.from(new Set((historico ?? []).map((h) => h.autor_id).filter(Boolean))) as string[];
      if (ids.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, nome_completo").in("id", ids);
      const map: ProfMap = {};
      for (const p of data ?? []) map[p.id] = { nome_completo: p.nome_completo };
      return map;
    },
    enabled: !!historico,
  });

  const exportCsv = () => {
    if (!historico) return;
    const rows = [["quando", "autor", "acao", "detalhes_json"]];
    for (const h of historico) {
      rows.push([
        new Date(h.criado_em).toISOString(),
        h.autor_id ? profiles?.[h.autor_id]?.nome_completo ?? h.autor_id : "Sistema",
        h.acao,
        JSON.stringify(h.detalhes ?? {}),
      ]);
    }
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-${numero}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div className="text-sm text-muted-foreground">
          {historico?.length ?? 0} eventos registrados
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir / PDF
          </Button>
        </div>
      </div>
      <ol className="relative border-l-2 border-border ml-3 space-y-5">
        {historico?.map((h) => {
          const m = metaFor(h.acao);
          const det = renderDetalhes(h.acao, h.detalhes);
          const autor = h.autor_id ? profiles?.[h.autor_id]?.nome_completo ?? "—" : "Sistema";
          return (
            <li key={h.id} className="ml-6 relative">
              <span
                className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full border-2 ${m.tone}`}
              >
                <m.Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="font-medium text-sm">{m.label}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {new Date(h.criado_em).toLocaleString("pt-BR")}
                </div>
              </div>
              {det && <div className="text-xs text-muted-foreground mt-0.5">{det}</div>}
              <div className="text-[11px] text-muted-foreground mt-0.5">por {autor}</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
