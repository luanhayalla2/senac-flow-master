
-- 1. Coluna de prazo de validação
ALTER TABLE public.chamados ADD COLUMN IF NOT EXISTS prazo_validacao timestamptz;

-- 2. Função de dias úteis (pula sábado/domingo)
CREATE OR REPLACE FUNCTION public.adicionar_dias_uteis(_ts timestamptz, _dias int)
RETURNS timestamptz LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  d timestamptz := _ts;
  restantes int := _dias;
BEGIN
  WHILE restantes > 0 LOOP
    d := d + interval '1 day';
    IF extract(isodow FROM d) < 6 THEN
      restantes := restantes - 1;
    END IF;
  END LOOP;
  RETURN d;
END $$;

-- 3. Trigger BEFORE UPDATE para definir prazo_validacao quando vira "resolvido"
CREATE OR REPLACE FUNCTION public.setar_prazo_validacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'resolvido' AND OLD.status IS DISTINCT FROM 'resolvido' THEN
    IF NEW.resolvido_em IS NULL THEN NEW.resolvido_em := now(); END IF;
    NEW.prazo_validacao := public.adicionar_dias_uteis(NEW.resolvido_em, 5);
  END IF;
  IF NEW.status = 'reaberto' AND OLD.status IS DISTINCT FROM 'reaberto' THEN
    NEW.prazo_validacao := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_setar_prazo_validacao ON public.chamados;
CREATE TRIGGER trg_setar_prazo_validacao
BEFORE UPDATE ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.setar_prazo_validacao();

-- 4. Função para fechar automaticamente chamados expirados
CREATE OR REPLACE FUNCTION public.fechar_chamados_expirados()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c RECORD;
  total int := 0;
BEGIN
  FOR c IN
    SELECT id FROM public.chamados
    WHERE status = 'resolvido'
      AND prazo_validacao IS NOT NULL
      AND prazo_validacao < now()
  LOOP
    UPDATE public.chamados
      SET status = 'fechado', fechado_em = now()
      WHERE id = c.id;
    INSERT INTO public.chamado_historico(chamado_id, autor_id, acao, detalhes)
      VALUES (c.id, NULL, 'fechamento_automatico',
              jsonb_build_object('motivo', 'Prazo de validação de 5 dias úteis expirado'));
    total := total + 1;
  END LOOP;
  RETURN total;
END $$;

-- 5. Tabela de alertas de SLA
CREATE TYPE public.alerta_sla_tipo AS ENUM ('proximo_vencimento', 'violado');

CREATE TABLE public.alertas_sla (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  destinatario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.alerta_sla_tipo NOT NULL,
  mensagem text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  lido_em timestamptz,
  UNIQUE (chamado_id, destinatario_id, tipo)
);

GRANT SELECT, UPDATE ON public.alertas_sla TO authenticated;
GRANT ALL ON public.alertas_sla TO service_role;

ALTER TABLE public.alertas_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alertas_select_destinatario_ou_admin" ON public.alertas_sla
  FOR SELECT TO authenticated
  USING (
    destinatario_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'gestor')
    OR public.has_role(auth.uid(), 'coordenador')
  );

CREATE POLICY "alertas_update_destinatario" ON public.alertas_sla
  FOR UPDATE TO authenticated
  USING (destinatario_id = auth.uid())
  WITH CHECK (destinatario_id = auth.uid());

CREATE INDEX idx_alertas_sla_dest ON public.alertas_sla(destinatario_id, lido_em);
CREATE INDEX idx_alertas_sla_chamado ON public.alertas_sla(chamado_id);

-- 6. Função que verifica SLA e gera alertas
CREATE OR REPLACE FUNCTION public.verificar_sla()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c RECORD;
  destinatarios uuid[];
  d uuid;
  elapsed_min numeric;
  pct numeric;
  total int := 0;
BEGIN
  FOR c IN
    SELECT id, numero, titulo, nivel, tecnico_id, sla_solucao_min, aberto_em
    FROM public.chamados
    WHERE status IN ('aberto','em_atendimento','escalonado','reaberto')
  LOOP
    elapsed_min := EXTRACT(EPOCH FROM (now() - c.aberto_em)) / 60;
    pct := (elapsed_min / NULLIF(c.sla_solucao_min, 0)) * 100;

    -- destinatários: técnico atribuído, ou todos com role do nível
    IF c.tecnico_id IS NOT NULL THEN
      destinatarios := ARRAY[c.tecnico_id];
    ELSE
      SELECT array_agg(ur.user_id) INTO destinatarios
      FROM public.user_roles ur
      WHERE ur.role = (
        CASE c.nivel
          WHEN 'n1' THEN 'tecnico_n1'::public.app_role
          WHEN 'n2' THEN 'tecnico_n2'::public.app_role
          WHEN 'n3' THEN 'tecnico_n3'::public.app_role
        END
      );
    END IF;

    IF destinatarios IS NULL THEN CONTINUE; END IF;

    IF elapsed_min > c.sla_solucao_min THEN
      FOREACH d IN ARRAY destinatarios LOOP
        INSERT INTO public.alertas_sla(chamado_id, destinatario_id, tipo, mensagem)
        VALUES (c.id, d, 'violado',
                'SLA violado no chamado ' || c.numero || ' — ' || c.titulo)
        ON CONFLICT (chamado_id, destinatario_id, tipo) DO NOTHING;
        IF FOUND THEN total := total + 1; END IF;
      END LOOP;
    ELSIF pct >= 80 THEN
      FOREACH d IN ARRAY destinatarios LOOP
        INSERT INTO public.alertas_sla(chamado_id, destinatario_id, tipo, mensagem)
        VALUES (c.id, d, 'proximo_vencimento',
                'SLA próximo do vencimento (' || round(pct) || '%) — chamado ' || c.numero)
        ON CONFLICT (chamado_id, destinatario_id, tipo) DO NOTHING;
        IF FOUND THEN total := total + 1; END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN total;
END $$;

-- 7. Cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'fechar-chamados-expirados',
  '0 * * * *',
  $$ SELECT public.fechar_chamados_expirados(); $$
);

SELECT cron.schedule(
  'verificar-sla-chamados',
  '*/5 * * * *',
  $$ SELECT public.verificar_sla(); $$
);
