import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABEL } from "@/lib/senac";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const { profile, user, roles, refresh } = useSession();
  const { data: unidades } = useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [setor, setSetor] = useState("");
  const [unidadeId, setUnidadeId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setNome(profile.nome_completo ?? "");
    setMatricula(profile.matricula ?? "");
    setSetor(profile.setor ?? "");
    setUnidadeId(profile.unidade_id ?? "");
  }, [profile]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (nome.trim().length < 3) {
      toast.error("Informe seu nome completo");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nome_completo: nome.trim(),
        matricula: matricula.trim() || null,
        setor: setor.trim() || null,
        unidade_id: unidadeId || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Não foi possível salvar: " + error.message);
      return;
    }
    toast.success("Perfil atualizado");
    await refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <UserCircle2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-bold">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">
            {roles.map((r) => ROLE_LABEL[r]).join(", ") || "Solicitante"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Dados pessoais</CardTitle>
          <CardDescription>Mantenha suas informações atualizadas para agilizar o atendimento.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail institucional</Label>
              <Input id="email" value={profile?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula / CPF</Label>
                <Input id="matricula" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setor">Setor</Label>
                <Input id="setor" value={setor} onChange={(e) => setSetor(e.target.value)} placeholder="Ex.: TI" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade SENAC</Label>
              <Select value={unidadeId || undefined} onValueChange={setUnidadeId}>
                <SelectTrigger id="unidade">
                  <SelectValue placeholder="Selecione sua unidade" />
                </SelectTrigger>
                <SelectContent>
                  {(unidades ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
