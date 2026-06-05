import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NivelBadge, StatusBadge } from "@/components/chamado-badges";
import { PlusCircle, Inbox, CheckCircle2, Timer } from "lucide-react";
import type { ChamadoStatus, Nivel } from "@/lib/senac";

export const Route = createFileRoute("/_authenticated/portal")({
  component: PortalPage,
});

interface ChamadoListItem {
  id: string;
  numero: string;
  titulo: string;
  status: ChamadoStatus;
  nivel: Nivel;
  aberto_em: string;
}

function PortalPage() {
  const { profile, user } = useSession();
  const { data: chamados } = useQuery({
    queryKey: ["meus-chamados", user?.id],
    queryFn: async (): Promise<ChamadoListItem[]> => {
      const { data, error } = await supabase
        .from("chamados")
        .select("id, numero, titulo, status, nivel, aberto_em")
        .eq("solicitante_id", user!.id)
        .order("aberto_em", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as ChamadoListItem[];
    },
    enabled: !!user?.id,
  });

  const ativos = chamados?.filter((c) => !["fechado"].includes(c.status)).length ?? 0;
  const resolvidos = chamados?.filter((c) => c.status === "resolvido").length ?? 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <section className="rounded-2xl bg-gradient-hero text-white p-8 shadow-elegant">
        <p className="text-xs uppercase tracking-widest text-white/70">Portal de Serviços</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Olá, {profile?.nome_completo?.split(" ")[0] ?? "usuário"}</h1>
        <p className="mt-1 text-white/85">O que você precisa hoje?</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/chamados/novo">
            <Button size="lg" className="shadow-elegant"><PlusCircle className="h-4 w-4 mr-2" />Abrir novo chamado</Button>
          </Link>
          <Link to="/chamados">
            <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Inbox className="h-4 w-4 mr-2" /> Meus chamados
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Inbox} label="Chamados ativos" value={ativos} tone="primary" />
        <StatCard icon={CheckCircle2} label="Resolvidos (recentes)" value={resolvidos} tone="success" />
        <StatCard icon={Timer} label="Total recentes" value={chamados?.length ?? 0} tone="secondary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Chamados recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {!chamados || chamados.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Você ainda não abriu nenhum chamado.{" "}
              <Link to="/chamados/novo" className="text-primary font-semibold hover:underline">Abrir o primeiro →</Link>
            </div>
          ) : (
            <div className="divide-y">
              {chamados.map((c) => (
                <Link to="/chamados/$id" params={{ id: c.id }} key={c.id} className="flex items-center gap-4 py-3 hover:bg-muted/30 -mx-2 px-2 rounded">
                  <NivelBadge nivel={c.nivel} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.titulo}</div>
                    <div className="text-xs text-muted-foreground">{c.numero} · {new Date(c.aberto_em).toLocaleString("pt-BR")}</div>
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

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: "primary" | "success" | "secondary" }) {
  const toneCls = tone === "primary" ? "bg-primary/10 text-primary" : tone === "success" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary";
  return (
    <Card>
      <CardContent className="pt-6 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg grid place-items-center ${toneCls}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-display font-bold">{value}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
