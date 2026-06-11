import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession, isAdminLike } from "@/hooks/use-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL, type AppRole } from "@/lib/senac";
import { Shield, Headphones, Wrench, Cpu, UserCog, Users, User, History, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

interface UserRow { id: string; nome_completo: string; email: string; setor: string | null }

function AdminPage() {
  const { roles } = useSession();
  if (!isAdminLike(roles)) {
    return <div className="max-w-xl mx-auto text-sm text-muted-foreground">Acesso restrito a administradores.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Administração</h1>
        <p className="text-sm text-muted-foreground">Gestão de usuários, papéis e catálogos do sistema.</p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários e papéis</TabsTrigger>
          <TabsTrigger value="categorias">Catálogo de problemas</TabsTrigger>
          <TabsTrigger value="regras">Regras de negócio</TabsTrigger>
          <TabsTrigger value="auditoria"><History className="h-3.5 w-3.5 mr-1.5" />Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <UsuariosCard />
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <CategoriasCard />
        </TabsContent>

        <TabsContent value="regras" className="mt-4">
          <RegrasCard />
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <AuditoriaCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsuariosCard() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profs }, { data: rs }] = await Promise.all([
        supabase.from("profiles").select("id, nome_completo, email, setor").order("nome_completo"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const map = new Map<string, AppRole[]>();
      (rs ?? []).forEach((r) => {
        const arr = map.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        map.set(r.user_id, arr);
      });
      return ((profs ?? []) as UserRow[]).map((p) => ({ ...p, roles: map.get(p.id) ?? [] }));
    },
  });

  const setRole = async (userId: string, newRole: AppRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) { toast.error(error.message); return; }
    toast.success("Papel atualizado");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const grupos: { key: AppRole; label: string; desc: string; icon: typeof Shield; tone: string }[] = [
    { key: "admin",       label: "Administradores",          desc: "Acesso total ao sistema",                icon: Shield,   tone: "bg-destructive/10 text-destructive border-destructive/30" },
    { key: "gestor",      label: "Gestores",                 desc: "Visão institucional e relatórios",       icon: UserCog,  tone: "bg-primary/10 text-primary border-primary/30" },
    { key: "coordenador", label: "Coordenadores",            desc: "Gestão da unidade",                      icon: Users,    tone: "bg-secondary/15 text-secondary border-secondary/30" },
    { key: "tecnico_n3",  label: "Técnicos N3 — Especialista", desc: "Atende chamados N1, N2 e N3",          icon: Cpu,      tone: "bg-n3/15 text-n3 border-n3/30" },
    { key: "tecnico_n2",  label: "Técnicos N2 — Analista",   desc: "Atende chamados N1 e N2",                icon: Wrench,   tone: "bg-n2/15 text-n2 border-n2/30" },
    { key: "tecnico_n1",  label: "Técnicos N1 — Operacional", desc: "Atende chamados N1",                    icon: Headphones, tone: "bg-n1/15 text-n1 border-n1/30" },
    { key: "solicitante", label: "Solicitantes",             desc: "Usuários que abrem chamados",            icon: User,     tone: "bg-muted text-muted-foreground border-border" },
  ];

  return (
    <div className="space-y-4">
      {grupos.map((g) => {
        const Icon = g.icon;
        const lista = (data ?? []).filter((u) => (u.roles[0] ?? "solicitante") === g.key);
        return (
          <Card key={g.key}>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-3">
                <span className={`h-9 w-9 rounded-lg border grid place-items-center ${g.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div>{g.label}</div>
                  <div className="text-xs font-normal text-muted-foreground">{g.desc}</div>
                </div>
                <Badge variant="outline" className="ml-auto">{lista.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lista.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum usuário neste grupo.</p>
              ) : (
                <div className="divide-y">
                  {lista.map((u) => (
                    <div key={u.id} className="py-3 flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{u.nome_completo}</div>
                        <div className="text-xs text-muted-foreground">{u.email} · {u.setor ?? "—"}</div>
                      </div>
                      {(g.key === "tecnico_n1" || g.key === "tecnico_n2" || g.key === "tecnico_n3") && (
                        <Badge variant="outline" className={g.tone}>
                          {g.key === "tecnico_n1" ? "N1" : g.key === "tecnico_n2" ? "N2" : "N3"}
                        </Badge>
                      )}
                      <Select value={u.roles[0] ?? "solicitante"} onValueChange={(v) => setRole(u.id, v as AppRole)}>
                        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABEL) as AppRole[]).map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CategoriasCard() {
  const { data } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => {
      const { data } = await supabase.from("subcategorias")
        .select("id, nome, nivel, sla_resposta_min, sla_solucao_min, categoria:categorias(nome)")
        .order("nivel");
      return data ?? [];
    },
  });
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Catálogo de problemas (read-only)</CardTitle></CardHeader>
      <CardContent>
        <div className="divide-y text-sm">
          {data?.map((s) => (
            <div key={s.id} className="py-2 flex items-center gap-3 flex-wrap">
              <div className="flex-1">
                <div className="font-medium">{s.nome}</div>
                <div className="text-xs text-muted-foreground">{(s.categoria as unknown as { nome: string })?.nome}</div>
              </div>
              <span className="text-xs uppercase font-bold">{s.nivel}</span>
              <span className="text-xs text-muted-foreground">SLA: {s.sla_resposta_min}min / {s.sla_solucao_min}min</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RegrasCard() {
  const regras = [
    "Todo chamado deve possuir categoria e subcategoria.",
    "O nível (N1/N2/N3) é definido automaticamente a partir da subcategoria.",
    "Nenhum chamado pode permanecer sem fila — o encaminhamento é automático.",
    "Todo escalonamento exige motivo e fica registrado no histórico.",
    "Todo atendimento gera trilha de auditoria.",
    "Técnicos só visualizam chamados do seu nível (N2 vê N1; N3 vê todos).",
    "Coordenadores e gestores visualizam chamados da unidade/instituição.",
    "Administradores possuem acesso total.",
    "SLA monitorado em tempo real, com indicação visual de vencimento.",
    "Avaliação de satisfação obrigatória após o encerramento.",
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Regras de negócio aplicadas</CardTitle></CardHeader>
      <CardContent>
        <ol className="list-decimal pl-5 space-y-1.5 text-sm">
          {regras.map((r) => <li key={r}>{r}</li>)}
        </ol>
      </CardContent>
    </Card>
  );
}
