import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, isTecnico, isAdminLike } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { Inbox, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { slaProgress, type ChamadoStatus, type Nivel } from "@/lib/senac";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

interface Row { id: string; status: ChamadoStatus; nivel: Nivel; aberto_em: string; sla_solucao_min: number; resolvido_em: string | null; unidade_id: string }

const COLORS = ["hsl(var(--primary))","oklch(0.65 0.16 152)","oklch(0.7 0.16 230)","oklch(0.58 0.22 27)"];

function Dashboard() {
  const { roles } = useSession();
  if (!isTecnico(roles) && !isAdminLike(roles)) {
    return <div className="max-w-xl mx-auto text-sm text-muted-foreground">Acesso restrito.</div>;
  }

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<{ rows: Row[]; unidades: Map<string,string> }> => {
      const [{ data: rows }, { data: unidades }] = await Promise.all([
        supabase.from("chamados").select("id, status, nivel, aberto_em, sla_solucao_min, resolvido_em, unidade_id").limit(1000),
        supabase.from("unidades").select("id, nome"),
      ]);
      return {
        rows: (rows ?? []) as Row[],
        unidades: new Map((unidades ?? []).map((u) => [u.id, u.nome])),
      };
    },
  });

  const rows = data?.rows ?? [];
  const ativos = rows.filter((r) => !["fechado"].includes(r.status));
  const vencidos = ativos.filter((r) => slaProgress(r.aberto_em, r.sla_solucao_min, r.resolvido_em).vencido).length;
  const resolvidos = rows.filter((r) => r.status === "resolvido" || r.status === "fechado").length;

  const porNivel = (["n1","n2","n3"] as Nivel[]).map((n) => ({
    nivel: n.toUpperCase(),
    ativos: ativos.filter((r) => r.nivel === n).length,
  }));

  const porStatus = (["aberto","em_atendimento","escalonado","resolvido","fechado","reaberto"] as ChamadoStatus[]).map((s) => ({
    name: s.replace("_"," "), value: rows.filter((r) => r.status === s).length,
  })).filter((d) => d.value > 0);

  const porUnidade = Array.from(data?.unidades.entries() ?? []).map(([id, nome]) => ({
    unidade: nome.replace("SENAC ",""),
    chamados: rows.filter((r) => r.unidade_id === id).length,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Indicadores em tempo real do Service Desk.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPI icon={Inbox} label="Total" value={rows.length} tone="secondary" />
        <KPI icon={Activity} label="Ativos" value={ativos.length} tone="primary" />
        <KPI icon={AlertTriangle} label="SLA vencido" value={vencidos} tone="destructive" />
        <KPI icon={CheckCircle2} label="Resolvidos" value={resolvidos} tone="success" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Chamados ativos por nível</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={porNivel}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="nivel" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="ativos" fill="oklch(0.7 0.18 50)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Distribuição por status</CardTitle></CardHeader>
          <CardContent style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={porStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {porStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-base">Volume por unidade</CardTitle></CardHeader>
        <CardContent style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={porUnidade}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="unidade" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="chamados" fill="oklch(0.32 0.12 252)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: "primary"|"secondary"|"success"|"destructive" }) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  return (
    <Card>
      <CardContent className="pt-6 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg grid place-items-center ${cls}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-display font-bold">{value}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
