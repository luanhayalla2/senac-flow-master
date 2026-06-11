import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, isTecnico, isAdminLike, hasAnyRole } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NivelBadge, StatusBadge } from "@/components/chamado-badges";
import { Progress } from "@/components/ui/progress";
import { formatSla, slaProgress, type ChamadoStatus, type Nivel } from "@/lib/senac";

export const Route = createFileRoute("/_authenticated/fila")({
  component: FilaPage,
});

interface Row {
  id: string; numero: string; titulo: string; status: ChamadoStatus; nivel: Nivel;
  aberto_em: string; sla_solucao_min: number; resolvido_em: string | null;
  prioridade: string; setor: string;
}

function FilaPage() {
  const { roles } = useSession();
  const tecnico = isTecnico(roles);
  const admin = isAdminLike(roles);

  const { data } = useQuery({
    queryKey: ["fila"],
    queryFn: async (): Promise<Row[]> => {
      const { data } = await supabase
        .from("chamados")
        .select("id, numero, titulo, status, nivel, aberto_em, sla_solucao_min, resolvido_em, prioridade, setor")
        .in("status", ["aberto","em_atendimento","escalonado","reaberto"])
        .order("aberto_em", { ascending: true })
        .limit(200);
      return (data ?? []) as Row[];
    },
    enabled: tecnico || admin,
    refetchInterval: 30_000,
  });

  if (!tecnico && !admin) {
    return <div className="max-w-xl mx-auto text-sm text-muted-foreground">Acesso restrito a técnicos e gestores.</div>;
  }

  // Admin/gestor/coord vê todos os níveis. Técnicos veem APENAS seu próprio nível.
  const niveisVisiveis: Nivel[] = admin
    ? (["n1","n2","n3"] as Nivel[])
    : hasAnyRole(roles, "tecnico_n3") ? ["n3"]
    : hasAnyRole(roles, "tecnico_n2") ? ["n2"]
    : hasAnyRole(roles, "tecnico_n1") ? ["n1"]
    : [];

  const byNivel = (n: Nivel) => data?.filter((c) => c.nivel === n) ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold">Fila de atendimento</h1>
        <p className="text-sm text-muted-foreground">
          {admin ? "Visão completa de todos os níveis." : `Chamados visíveis ao seu nível (${niveisVisiveis.map(n=>n.toUpperCase()).join(", ") || "—"}).`}
        </p>
      </div>
      <div className={`grid gap-4 ${niveisVisiveis.length === 1 ? "lg:grid-cols-1" : niveisVisiveis.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {niveisVisiveis.map((n) => (
          <Card key={n}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-display flex items-center gap-2"><NivelBadge nivel={n} /> Fila {n.toUpperCase()}</CardTitle>
              <span className="text-xs text-muted-foreground">{byNivel(n).length} chamado(s)</span>
            </CardHeader>
            <CardContent>
              {byNivel(n).length === 0 ? (
                <div className="text-xs text-muted-foreground py-6 text-center">Sem chamados na fila.</div>
              ) : (
                <div className="space-y-2">
                  {byNivel(n).map((c) => {
                    const sla = slaProgress(c.aberto_em, c.sla_solucao_min, c.resolvido_em);
                    return (
                      <Link to="/chamados/$id" params={{ id: c.id }} key={c.id} className="block rounded-lg border p-3 hover:border-primary transition">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground">{c.numero}</div>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="mt-1 font-medium text-sm">{c.titulo}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{c.setor} · {new Date(c.aberto_em).toLocaleString("pt-BR")}</div>
                        <div className="mt-2">
                          <Progress value={sla.pct} className={sla.vencido ? "[&>div]:bg-destructive" : sla.pct > 80 ? "[&>div]:bg-warning" : ""} />
                          <div className="text-[10px] mt-1 text-muted-foreground flex justify-between">
                            <span>SLA {formatSla(c.sla_solucao_min)}</span>
                            <span className={sla.vencido ? "text-destructive font-semibold" : ""}>
                              {sla.vencido ? "Vencido" : `Restam ${formatSla(Math.max(0, sla.restanteMin))}`}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
