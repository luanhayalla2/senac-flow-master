import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, isAdminLike } from "@/hooks/use-session";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/auditoria")({
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const { roles } = useSession();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["auditoria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select(`
          id,
          acao,
          de,
          para,
          criado_em,
          detalhes,
          ator:ator_id(nome_completo),
          alvo:alvo_id(nome_completo)
        `)
        .order("criado_em", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: isAdminLike(roles),
  });

  if (!isAdminLike(roles)) {
    return <div className="p-8 text-sm text-muted-foreground">Acesso restrito a administradores.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Auditoria</h2>
          <p className="text-muted-foreground">Histórico de ações e alterações de segurança do sistema.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log de Eventos</CardTitle>
          <CardDescription>
            Últimos 100 eventos administrativos registrados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ator</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Detalhes (De → Para)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{(log.ator as any)?.nome_completo || "Sistema"}</TableCell>
                      <TableCell className="font-medium">{log.acao}</TableCell>
                      <TableCell>{(log.alvo as any)?.nome_completo || "-"}</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {log.de && <span className="line-through mr-2">{log.de}</span>}
                          {log.para && <span className="font-semibold">{log.para}</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum evento registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
