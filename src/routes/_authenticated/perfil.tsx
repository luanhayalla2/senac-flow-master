import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { ROLE_LABEL } from "@/lib/senac";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const { profile, roles } = useSession();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 max-w-2xl">
        <div className="space-y-4">
          <div className="grid gap-2">
            <h3 className="font-semibold leading-none tracking-tight">Nome Completo</h3>
            <p className="text-sm text-muted-foreground">{profile?.nome_completo || "Não informado"}</p>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold leading-none tracking-tight">CPF</h3>
            <p className="text-sm text-muted-foreground">{profile?.cpf || "Não informado"}</p>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold leading-none tracking-tight">Setor</h3>
            <p className="text-sm text-muted-foreground">{profile?.setor_id || "Não informado"}</p>
          </div>
          <div className="grid gap-2">
            <h3 className="font-semibold leading-none tracking-tight">Perfis de Acesso</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {roles.length > 0 ? (
                roles.map((r) => (
                  <span key={r} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {ROLE_LABEL[r]}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  Solicitante
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
