import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, isTecnico, isAdminLike } from "@/hooks/use-session";
import { slaProgress, type ChamadoStatus, type Nivel } from "@/lib/senac";
import { Loader2, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/sla")({
  component: SlaPage,
});

function SlaPage() {
  const { roles, profile } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["sla-dashboard"],
    queryFn: async () => {
      const [{ data: chamados }, { data: alertas }] = await Promise.all([
        supabase
          .from("chamados")
          .select("id, titulo, status, nivel, aberto_em, sla_solucao_min, resolvido_em, protocolo")
          .neq("status", "fechado")
          .neq("status", "resolvido")
          .limit(100),
        supabase
          .from("alertas_sla")
          .select("id, chamado_id, tipo, mensagem, lido_em, criado_em")
          .eq(isAdminLike(roles) ? "" : "destinatario_id", profile?.id || "") // Admin vê todos, Técnico vê os seus. Se Admin, ignora filtro. (simplificado)
          .order("criado_em", { ascending: false })
          .limit(20)
      ]);
      
      return {
        chamados: chamados || [],
        alertas: alertas || []
      };
    },
    enabled: isTecnico(roles) || isAdminLike(roles),
  });

  if (!isTecnico(roles) && !isAdminLike(roles)) {
    return <div className="p-8 text-sm text-muted-foreground">Acesso restrito.</div>;
  }

  const ativos = data?.chamados.map(c => ({
    ...c,
    sla: slaProgress(c.aberto_em, c.sla_solucao_min, c.resolvido_em)
  })).sort((a, b) => a.sla.restanteMin - b.sla.restanteMin) || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Painel de SLA</h2>
          <p className="text-muted-foreground">Acompanhamento de Service Level Agreement (Tempo de Solução).</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Fila de Prioridade por SLA
              </CardTitle>
              <CardDescription>Chamados ativos ordenados por vencimento.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Restante</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ativos.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.protocolo}</TableCell>
                        <TableCell><Badge variant="outline">{c.nivel?.toUpperCase()}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden min-w-[100px]">
                              <div 
                                className={`h-full ${c.sla.vencido ? 'bg-destructive' : c.sla.pct > 75 ? 'bg-warning' : 'bg-success'}`}
                                style={{ width: `${c.sla.pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{c.sla.pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {c.sla.vencido ? (
                            <span className="text-destructive font-bold text-xs flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Vencido em {Math.abs(c.sla.restanteMin)}m
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">{c.sla.restanteMin}m restantes</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link to={`/chamados/${c.id}`} className="text-primary hover:underline flex items-center text-xs">
                            Ver <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ativos.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum chamado pendente.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
              ) : (
                <div className="space-y-4">
                  {data?.alertas.map(a => (
                    <div key={a.id} className={`p-3 rounded-lg border text-sm ${a.tipo === 'violado' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-warning/10 border-warning/20 text-warning-foreground'}`}>
                      <p className="font-semibold">{a.tipo === 'violado' ? 'SLA Violado' : 'Atenção ao SLA'}</p>
                      <p className="opacity-80 text-xs mt-1">{a.mensagem}</p>
                    </div>
                  ))}
                  {data?.alertas.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center">Nenhum alerta recente.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
