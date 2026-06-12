
-- Helper: can current user access this chamado?
CREATE OR REPLACE FUNCTION public.pode_ver_chamado(_chamado_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chamados c
    WHERE c.id = _chamado_id
      AND (
        c.solicitante_id = auth.uid()
        OR c.tecnico_id = auth.uid()
        OR public.is_admin(auth.uid())
        OR public.has_role(auth.uid(), 'gestor')
        OR public.has_role(auth.uid(), 'coordenador')
        OR (public.is_tecnico(auth.uid()) AND c.nivel = ANY (public.niveis_visiveis(auth.uid())))
      )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.pode_ver_chamado(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_ver_chamado(uuid) TO authenticated;

-- avaliacoes: restrict SELECT to users with access to the chamado
DROP POLICY IF EXISTS avaliacoes_select_via_chamado ON public.avaliacoes;
CREATE POLICY avaliacoes_select_acesso_chamado ON public.avaliacoes
  FOR SELECT TO authenticated
  USING (public.pode_ver_chamado(chamado_id));

-- chamado_historico: restrict SELECT to users with access to the chamado
DROP POLICY IF EXISTS historico_select_via_chamado ON public.chamado_historico;
CREATE POLICY historico_select_acesso_chamado ON public.chamado_historico
  FOR SELECT TO authenticated
  USING (public.pode_ver_chamado(chamado_id));

-- chamado_historico: require author = auth.uid() and access to the chamado
DROP POLICY IF EXISTS historico_insert_authenticated ON public.chamado_historico;
CREATE POLICY historico_insert_acesso_chamado ON public.chamado_historico
  FOR INSERT TO authenticated
  WITH CHECK (
    autor_id = auth.uid()
    AND public.pode_ver_chamado(chamado_id)
  );

-- Fix mutable search_path on trigger helper
CREATE OR REPLACE FUNCTION public.tocar_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.atualizado_em := now(); RETURN NEW; END $$;

-- Revoke EXECUTE on SECURITY DEFINER functions that should not be callable from the API.
-- Functions used inside RLS expressions (has_role, is_admin, is_tecnico, niveis_visiveis, pode_ver_chamado)
-- intentionally remain executable by authenticated.
REVOKE EXECUTE ON FUNCTION public.preencher_chamado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tocar_atualizado_em() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fechar_chamados_expirados() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.logar_mudanca_chamado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adicionar_dias_uteis(timestamptz, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setar_prazo_validacao() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verificar_sla() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.logar_mudanca_role() FROM PUBLIC, anon, authenticated;
