import { cn } from "@/lib/utils";
import { NIVEL_SHORT, STATUS_LABEL, nivelTone, statusTone } from "@/lib/senac";
import type { Nivel, ChamadoStatus } from "@/lib/senac";

export function NivelBadge({ nivel }: { nivel: Nivel }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wide", nivelTone(nivel))}>
      {NIVEL_SHORT[nivel]}
    </span>
  );
}

export function StatusBadge({ status }: { status: ChamadoStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border", statusTone(status))}>
      {STATUS_LABEL[status]}
    </span>
  );
}
