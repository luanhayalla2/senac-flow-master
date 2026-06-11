-- Audit log for admin actions on users
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  alvo_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acao text NOT NULL,
  de text,
  para text,
  detalhes jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND ator_id = auth.uid());

CREATE INDEX admin_audit_log_criado_em_idx ON public.admin_audit_log (criado_em DESC);
CREATE INDEX admin_audit_log_alvo_id_idx ON public.admin_audit_log (alvo_id);

-- Trigger to auto-log role changes from user_roles
CREATE OR REPLACE FUNCTION public.logar_mudanca_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_audit_log(ator_id, alvo_id, acao, para, detalhes)
    VALUES (auth.uid(), NEW.user_id, 'role_atribuida', NEW.role::text,
            jsonb_build_object('role', NEW.role));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_audit_log(ator_id, alvo_id, acao, de, detalhes)
    VALUES (auth.uid(), OLD.user_id, 'role_removida', OLD.role::text,
            jsonb_build_object('role', OLD.role));
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_logar_mudanca_role
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.logar_mudanca_role();
