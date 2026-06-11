import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NivelBadge, StatusBadge } from "@/components/chamado-badges";
import { PlusCircle, FilterX } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChamadoStatus, Nivel } from "@/lib/senac";
import { STATUS_LABEL, NIVEL_LABEL } from "@/lib/senac";

export const Route = createFileRoute("/_authenticated/chamados/")({
  component: ListaChamados,
});

interface Row { id: string; numero: string; titulo: string; status: ChamadoStatus; nivel: Nivel; aberto_em: string; setor: string }

function ListaChamados() {
  const [status, setStatus] = useState<string>("all");
  const [nivel, setNivel] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["chamados", status, nivel],
    queryFn: async (): Promise<Row[]> => {
      let q = supabase.from("chamados").select("id, numero, titulo, status, nivel, aberto_em, setor").order("aberto_em", { ascending: false }).limit(100);
      if (status !== "all") q = q.eq("status", status as ChamadoStatus);
      if (nivel !== "all") q = q.eq("nivel", nivel as Nivel);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Chamados</h1>
          <p className="text-sm text-muted-foreground">Lista dos chamados que você pode visualizar.</p>
        </div>
        <Link to="/chamados/novo"><Button><PlusCircle className="h-4 w-4 mr-2" />Novo chamado</Button></Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 flex-wrap">
          <CardTitle className="font-display text-base flex-1">Filtros</CardTitle>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={nivel} onValueChange={setNivel}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Nível" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              {Object.entries(NIVEL_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          {(status !== "all" || nivel !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setStatus("all"); setNivel("all"); }}>
              <FilterX className="h-4 w-4 mr-1" /> Limpar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : !data || data.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhum chamado encontrado.</div>
          ) : (
            <div className="divide-y">
              {data.map((c) => (
                <Link to="/chamados/$id" params={{ id: c.id }} key={c.id} className="flex items-center gap-4 py-3 hover:bg-muted/30 -mx-2 px-2 rounded">
                  <NivelBadge nivel={c.nivel} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.titulo}</div>
                    <div className="text-xs text-muted-foreground">{c.numero} · {c.setor} · {new Date(c.aberto_em).toLocaleString("pt-BR")}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
