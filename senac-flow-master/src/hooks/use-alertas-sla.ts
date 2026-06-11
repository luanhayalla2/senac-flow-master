import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export interface AlertaSla {
  id: string;
  chamado_id: string;
  destinatario_id: string;
  tipo: "proximo_vencimento" | "violado";
  mensagem: string;
  criado_em: string;
  lido_em: string | null;
}

export function useAlertasSla() {
  const { user } = useSession();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["alertas-sla", user?.id],
    queryFn: async (): Promise<AlertaSla[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("alertas_sla")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AlertaSla[];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("alertas_sla_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alertas_sla" },
        () => qc.invalidateQueries({ queryKey: ["alertas-sla", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const marcarLido = async (id: string) => {
    await supabase.from("alertas_sla").update({ lido_em: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["alertas-sla", user?.id] });
  };

  const marcarTodosLidos = async () => {
    if (!user) return;
    await supabase
      .from("alertas_sla")
      .update({ lido_em: new Date().toISOString() })
      .is("lido_em", null)
      .eq("destinatario_id", user.id);
    qc.invalidateQueries({ queryKey: ["alertas-sla", user.id] });
  };

  const alertas = query.data ?? [];
  const naoLidos = alertas.filter((a) => !a.lido_em);
  return { alertas, naoLidos, marcarLido, marcarTodosLidos, isLoading: query.isLoading };
}
