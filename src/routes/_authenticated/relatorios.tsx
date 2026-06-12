import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, isTecnico, isAdminLike } from "@/hooks/use-session";
import { Loader2, Download, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { roles } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["relatorios"],
    queryFn: async () => {
      const { data: chamados, error } = await supabase
        .from("chamados")
        .select(`
          id,
          titulo,
          status,
          categoria,
          aberto_em,
          resolvido_em,
          tecnico:tecnico_responsavel(nome_completo)
        `)
        .eq("status", "resolvido")
        .limit(1000);

      if (error) throw error;

      // Aggregations
      const porTecnico: Record<string, number> = {};
      const porCategoria: Record<string, number> = {};
      let totalTime = 0;
      let resolucoesCount = 0;

      chamados?.forEach(c => {
        // Por Técnico
        const nomeTec = (c.tecnico as any)?.nome_completo || "Desconhecido";
        porTecnico[nomeTec] = (porTecnico[nomeTec] || 0) + 1;

        // Por Categoria
        const cat = c.categoria || "Outros";
        porCategoria[cat] = (porCategoria[cat] || 0) + 1;

        // MTTR
        if (c.aberto_em && c.resolvido_em) {
          const t1 = new Date(c.aberto_em).getTime();
          const t2 = new Date(c.resolvido_em).getTime();
          totalTime += (t2 - t1);
          resolucoesCount++;
        }
      });

      const chartTecnicos = Object.entries(porTecnico).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);
      const chartCategorias = Object.entries(porCategoria).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);
      const mttrHoras = resolucoesCount > 0 ? (totalTime / resolucoesCount / 3600000).toFixed(1) : "0";

      return {
        chamados: chamados || [],
        chartTecnicos,
        chartCategorias,
        mttrHoras,
      };
    },
    enabled: isTecnico(roles) || isAdminLike(roles),
  });

  if (!isTecnico(roles) && !isAdminLike(roles)) {
    return <div className="p-8 text-sm text-muted-foreground">Acesso restrito.</div>;
  }

  const exportCSV = () => {
    if (!data?.chamados.length) return;
    const header = "ID,Titulo,Status,Categoria,AbertoEm,ResolvidoEm,Tecnico\n";
    const rows = data.chamados.map(c => 
      `${c.id},"${c.titulo}",${c.status},${c.categoria},${c.aberto_em},${c.resolvido_em},"${(c.tecnico as any)?.nome_completo || ''}"`
    ).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_chamados_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios Gerenciais</h2>
          <p className="text-muted-foreground">Métricas avançadas de atendimento e Business Intelligence.</p>
        </div>
        <Button onClick={exportCSV} disabled={!data?.chamados.length || isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">MTTR (Tempo Médio de Solução)</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.mttrHoras} horas</div>
                <p className="text-xs text-muted-foreground">Com base nos últimos {data?.chamados.length} resolvidos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader><CardTitle>Resolvidos por Técnico</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data?.chartTecnicos}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="oklch(0.32 0.12 252)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Volume por Categoria</CardTitle></CardHeader>
              <CardContent style={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data?.chartCategorias}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="oklch(0.7 0.18 50)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
