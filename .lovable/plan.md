
# Plano: Ciclo Completo + Auditoria Exportável + Alertas de SLA

Vou implementar três frentes integradas no SmartDesk, todas apoiadas pela auditoria já existente (`chamado_historico`).

---

## 1. Ciclo de resolução → validação → encerramento automático

**Banco (migration):**
- Adicionar coluna `prazo_validacao` (timestamptz) em `chamados`, preenchida quando o técnico marca como `resolvido` (= `resolvido_em + 5 dias úteis`).
- Função `public.adicionar_dias_uteis(ts, n)` para calcular 5 dias úteis (pula sáb/dom).
- Trigger `BEFORE UPDATE` em `chamados`: quando `status` passa para `resolvido`, define `resolvido_em = now()` e `prazo_validacao`.
- Função `public.fechar_chamados_expirados()` que percorre chamados `resolvido` com `prazo_validacao < now()` e os move para `fechado` (com `fechado_em = now()`), registrando no histórico (`acao = 'fechamento_automatico'`).
- Cron job `pg_cron` rodando a cada hora chamando essa função (SQL puro, sem endpoint).

**Front (`chamados.$id.tsx`):**
- Quando status = `resolvido` e usuário é o solicitante: exibir banner com prazo (`prazo_validacao`), botões **Validar e fechar** (status→`fechado`) e **Reabrir** (status→`reaberto` + `motivo_reabertura`).
- Mostrar contagem regressiva "Fecha automaticamente em X dias".

---

## 2. Timeline detalhada e exportável da auditoria

**Componente novo `TimelineAuditoria`** dentro de `chamados.$id.tsx`:
- Lê `chamado_historico` + join com `profiles` para nome do autor.
- Renderiza linha do tempo vertical com ícone por tipo de ação (`abertura`, `mudanca_status`, `escalonamento`, `atribuicao`, `motivo_escalonamento`, `fechamento_automatico`, `avaliacao`).
- Cada entrada mostra: timestamp, autor, ação humanizada, detalhes (de → para, motivo, técnico, etc.).
- Tabela `motivos_escalonamento` (nova) ou — para evitar nova tabela — registrar motivo direto em `chamado_historico.detalhes.motivo` na ação `motivo_escalonamento` (já é o padrão atual). Mantém modelo simples.

**Exportação:**
- Botão **Exportar CSV** (gera no client com `Blob`) — colunas: `quando, autor, acao, de, para, motivo, detalhes_json`.
- Botão **Exportar PDF** simples via `window.print()` em rota dedicada `/_authenticated/chamados/$id/auditoria` com layout limpo (sem sidebar), ou impressão da própria seção via CSS `@media print`. Vou usar a abordagem CSV + impressão (sem dependência nova).

---

## 3. Alertas automáticos de SLA

**Banco:**
- Tabela `public.alertas_sla` (`chamado_id`, `tipo` enum [`proximo_vencimento`, `violado`], `criado_em`, `lido_em`, `destinatario_id`).
- Função `public.verificar_sla()`:
  - Para chamados `aberto` / `em_atendimento` / `escalonado`:
    - Se `elapsed >= 80% sla_solucao_min` e não há alerta `proximo_vencimento` → inserir um para `tecnico_id` (ou todos do nível).
    - Se `elapsed > sla_solucao_min` e não há alerta `violado` → inserir um.
- Cron `pg_cron` a cada 5 minutos.
- GRANTs + RLS: usuário vê apenas alertas onde é `destinatario_id` ou é admin/gestor/coordenador.

**Front:**
- Hook `useAlertasSla()` que faz polling (60s) via supabase + realtime opcional.
- Sino na sidebar/topbar com badge contendo número de alertas não lidos; dropdown lista alertas com link para o chamado e botão "marcar como lido".
- Badge no card de cada chamado (`chamados.index.tsx`, `fila.tsx`) quando há alerta ativo (cor amarela `proximo` / vermelha `violado`).

---

## Detalhes técnicos

- **Sem novas dependências npm.** CSV gerado com `Blob`/`URL.createObjectURL`. Impressão com CSS.
- Tipos do Supabase serão regenerados automaticamente após a migration.
- Cron usa `pg_cron` puro (sem endpoint HTTP, já que tudo é SQL).
- Função `adicionar_dias_uteis` é determinística — segura para `BEFORE UPDATE`.

## Ordem de execução

1. Migration única: coluna `prazo_validacao`, função dias úteis, trigger validação, função/cron de fechamento automático, tabela `alertas_sla` + RLS + GRANTs, função/cron de verificação SLA.
2. Atualizar `chamados.$id.tsx` (ações solicitante + componente Timeline + export CSV/print).
3. Criar hook + componente de notificações de SLA na sidebar.
4. Badges de SLA nas listas (`chamados.index`, `fila`).
5. Teste end-to-end via SQL: simular resolução, validar prazo, simular violação SLA.

Posso seguir?
