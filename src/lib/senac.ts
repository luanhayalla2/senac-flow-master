import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Nivel = Database["public"]["Enums"]["nivel_atendimento"];
export type ChamadoStatus = Database["public"]["Enums"]["chamado_status"];
export type ChamadoPrioridade = Database["public"]["Enums"]["chamado_prioridade"];

export const NIVEL_LABEL: Record<Nivel, string> = {
  n1: "N1 — Operacional",
  n2: "N2 — Especializado",
  n3: "N3 — Avançado",
};

export const NIVEL_SHORT: Record<Nivel, string> = { n1: "N1", n2: "N2", n3: "N3" };

export const STATUS_LABEL: Record<ChamadoStatus, string> = {
  aberto: "Aberto",
  em_atendimento: "Em Atendimento",
  escalonado: "Escalonado",
  resolvido: "Resolvido",
  fechado: "Fechado",
  reaberto: "Reaberto",
};

export const PRIORIDADE_LABEL: Record<ChamadoPrioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  solicitante: "Solicitante",
  tecnico_n1: "Técnico N1",
  tecnico_n2: "Analista N2",
  tecnico_n3: "Especialista N3",
  coordenador: "Coordenador",
  gestor: "Gestor",
  admin: "Administrador",
};

export function formatSla(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m ? `${h}h${m}min` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}d ${rh}h` : `${d}d`;
}

export function slaProgress(abertoEm: string, slaMin: number, resolvidoEm: string | null) {
  const start = new Date(abertoEm).getTime();
  const end = resolvidoEm ? new Date(resolvidoEm).getTime() : Date.now();
  const elapsedMin = Math.floor((end - start) / 60000);
  const pct = Math.min(100, Math.round((elapsedMin / slaMin) * 100));
  return {
    elapsedMin,
    pct,
    vencido: elapsedMin > slaMin,
    restanteMin: slaMin - elapsedMin,
  };
}

export const nivelTone = (n: Nivel) =>
  n === "n1" ? "bg-n1/15 text-n1 border-n1/30" : n === "n2" ? "bg-n2/15 text-n2 border-n2/30" : "bg-n3/15 text-n3 border-n3/30";

export const statusTone = (s: ChamadoStatus) => {
  switch (s) {
    case "aberto":
      return "bg-secondary/15 text-secondary border-secondary/30";
    case "em_atendimento":
      return "bg-primary/15 text-primary border-primary/30";
    case "escalonado":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "resolvido":
      return "bg-success/15 text-success border-success/30";
    case "fechado":
      return "bg-muted text-muted-foreground border-border";
    case "reaberto":
      return "bg-destructive/15 text-destructive border-destructive/30";
  }
};
