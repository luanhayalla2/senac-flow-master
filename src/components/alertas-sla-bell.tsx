import { Link } from "@tanstack/react-router";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { useAlertasSla } from "@/hooks/use-alertas-sla";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AlertasSlaBell() {
  const { alertas, naoLidos, marcarLido, marcarTodosLidos } = useAlertasSla();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidos.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {naoLidos.length > 9 ? "9+" : naoLidos.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="font-semibold text-sm">Alertas de SLA</div>
          {naoLidos.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={marcarTodosLidos}>
              Marcar todos como lidos
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {alertas.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum alerta de SLA no momento.
            </div>
          ) : (
            <ul className="divide-y">
              {alertas.map((a) => {
                const Icon = a.tipo === "violado" ? AlertTriangle : Clock;
                const tone =
                  a.tipo === "violado" ? "text-destructive" : "text-warning-foreground";
                return (
                  <li
                    key={a.id}
                    className={`p-3 ${!a.lido_em ? "bg-muted/30" : ""}`}
                  >
                    <Link
                      to="/chamados/$id"
                      params={{ id: a.chamado_id }}
                      onClick={() => !a.lido_em && marcarLido(a.id)}
                      className="flex gap-2 items-start hover:opacity-80"
                    >
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${tone}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm leading-tight">{a.mensagem}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {new Date(a.criado_em).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
