
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('solicitante','tecnico_n1','tecnico_n2','tecnico_n3','coordenador','gestor','admin');
CREATE TYPE public.nivel_atendimento AS ENUM ('n1','n2','n3');
CREATE TYPE public.chamado_status AS ENUM ('aberto','em_atendimento','escalonado','resolvido','fechado','reaberto');
CREATE TYPE public.chamado_prioridade AS ENUM ('baixa','media','alta','critica');

-- UNIDADES
CREATE TABLE public.unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text NOT NULL UNIQUE,
  cidade text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.unidades TO authenticated, anon;
GRANT ALL ON public.unidades TO service_role;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unidades_read_all" ON public.unidades FOR SELECT USING (true);

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  matricula text,
  email text NOT NULL,
  unidade_id uuid REFERENCES public.unidades(id),
  setor text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- niveis visiveis para um usuario
CREATE OR REPLACE FUNCTION public.niveis_visiveis(_user_id uuid)
RETURNS public.nivel_atendimento[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role IN ('admin','gestor','coordenador','tecnico_n3'))
      THEN ARRAY['n1','n2','n3']::public.nivel_atendimento[]
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role = 'tecnico_n2')
      THEN ARRAY['n1','n2']::public.nivel_atendimento[]
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role = 'tecnico_n1')
      THEN ARRAY['n1']::public.nivel_atendimento[]
    ELSE ARRAY[]::public.nivel_atendimento[]
  END
$$;

CREATE OR REPLACE FUNCTION public.is_tecnico(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role IN ('tecnico_n1','tecnico_n2','tecnico_n3'))
$$;

-- profile policies
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()) OR public.is_tecnico(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- user_roles policies
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- CATEGORIAS
CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  icone text,
  ordem int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categorias TO authenticated, anon;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_read_all" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "categorias_admin" ON public.categorias FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- SUBCATEGORIAS (carregam o nivel e o SLA — fonte da classificação automática)
CREATE TABLE public.subcategorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  nivel public.nivel_atendimento NOT NULL,
  sla_resposta_min int NOT NULL,
  sla_solucao_min int NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  UNIQUE (categoria_id, nome)
);
GRANT SELECT ON public.subcategorias TO authenticated, anon;
GRANT ALL ON public.subcategorias TO service_role;
ALTER TABLE public.subcategorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategorias_read_all" ON public.subcategorias FOR SELECT USING (true);
CREATE POLICY "subcategorias_admin" ON public.subcategorias FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- CHAMADOS
CREATE SEQUENCE public.chamado_seq START 1;

CREATE TABLE public.chamados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  titulo text NOT NULL,
  descricao text NOT NULL,
  solicitante_id uuid NOT NULL REFERENCES auth.users(id),
  unidade_id uuid NOT NULL REFERENCES public.unidades(id),
  setor text NOT NULL,
  subcategoria_id uuid NOT NULL REFERENCES public.subcategorias(id),
  nivel public.nivel_atendimento NOT NULL,
  prioridade public.chamado_prioridade NOT NULL DEFAULT 'media',
  status public.chamado_status NOT NULL DEFAULT 'aberto',
  tecnico_id uuid REFERENCES auth.users(id),
  sla_resposta_min int NOT NULL,
  sla_solucao_min int NOT NULL,
  aberto_em timestamptz NOT NULL DEFAULT now(),
  primeiro_atendimento_em timestamptz,
  resolvido_em timestamptz,
  fechado_em timestamptz,
  solucao text,
  motivo_reabertura text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chamados TO authenticated;
GRANT ALL ON public.chamados TO service_role;
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

-- Gera o número CH-YYYY-NNNNNN, copia nivel e SLA da subcategoria
CREATE OR REPLACE FUNCTION public.preencher_chamado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sub RECORD;
  seq_val bigint;
BEGIN
  SELECT nivel, sla_resposta_min, sla_solucao_min INTO sub
  FROM public.subcategorias WHERE id = NEW.subcategoria_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subcategoria inválida'; END IF;
  NEW.nivel := sub.nivel;
  NEW.sla_resposta_min := sub.sla_resposta_min;
  NEW.sla_solucao_min := sub.sla_solucao_min;
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    seq_val := nextval('public.chamado_seq');
    NEW.numero := 'CH-' || to_char(now(), 'YYYY') || '-' || lpad(seq_val::text, 6, '0');
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_preencher_chamado BEFORE INSERT ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.preencher_chamado();

CREATE OR REPLACE FUNCTION public.tocar_atualizado_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em := now(); RETURN NEW; END $$;

CREATE TRIGGER trg_chamados_updated BEFORE UPDATE ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.tocar_atualizado_em();

-- POLICIES chamados: solicitante vê os próprios; técnico vê do seu nível; admin/gestor/coordenador veem tudo
CREATE POLICY "chamados_select_own" ON public.chamados FOR SELECT TO authenticated
  USING (solicitante_id = auth.uid());
CREATE POLICY "chamados_select_tecnico_nivel" ON public.chamados FOR SELECT TO authenticated
  USING (nivel = ANY (public.niveis_visiveis(auth.uid())));
CREATE POLICY "chamados_select_admin_gestor" ON public.chamados FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid())
         OR public.has_role(auth.uid(),'gestor')
         OR public.has_role(auth.uid(),'coordenador'));
CREATE POLICY "chamados_insert_solicitante" ON public.chamados FOR INSERT TO authenticated
  WITH CHECK (solicitante_id = auth.uid());
CREATE POLICY "chamados_update_tecnico_admin" ON public.chamados FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR tecnico_id = auth.uid()
    OR (public.is_tecnico(auth.uid()) AND nivel = ANY (public.niveis_visiveis(auth.uid())))
    OR (solicitante_id = auth.uid() AND status IN ('resolvido'))
  );

-- HISTORICO
CREATE TABLE public.chamado_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id),
  acao text NOT NULL,
  detalhes jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chamado_historico TO authenticated;
GRANT ALL ON public.chamado_historico TO service_role;
ALTER TABLE public.chamado_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "historico_select_via_chamado" ON public.chamado_historico FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id));
CREATE POLICY "historico_insert_authenticated" ON public.chamado_historico FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() OR autor_id IS NULL);

-- log automático de status
CREATE OR REPLACE FUNCTION public.logar_mudanca_chamado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.chamado_historico(chamado_id, autor_id, acao, detalhes)
    VALUES (NEW.id, NEW.solicitante_id, 'abertura',
      jsonb_build_object('status', NEW.status, 'nivel', NEW.nivel, 'numero', NEW.numero));
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.chamado_historico(chamado_id, autor_id, acao, detalhes)
      VALUES (NEW.id, auth.uid(), 'mudanca_status',
        jsonb_build_object('de', OLD.status, 'para', NEW.status));
    END IF;
    IF NEW.tecnico_id IS DISTINCT FROM OLD.tecnico_id THEN
      INSERT INTO public.chamado_historico(chamado_id, autor_id, acao, detalhes)
      VALUES (NEW.id, auth.uid(), 'atribuicao',
        jsonb_build_object('tecnico_id', NEW.tecnico_id));
    END IF;
    IF NEW.nivel IS DISTINCT FROM OLD.nivel THEN
      INSERT INTO public.chamado_historico(chamado_id, autor_id, acao, detalhes)
      VALUES (NEW.id, auth.uid(), 'escalonamento',
        jsonb_build_object('de', OLD.nivel, 'para', NEW.nivel));
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_log_chamado_ins AFTER INSERT ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.logar_mudanca_chamado();
CREATE TRIGGER trg_log_chamado_upd AFTER UPDATE ON public.chamados
FOR EACH ROW EXECUTE FUNCTION public.logar_mudanca_chamado();

-- AVALIACOES
CREATE TABLE public.avaliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id uuid NOT NULL UNIQUE REFERENCES public.chamados(id) ON DELETE CASCADE,
  atendimento int NOT NULL CHECK (atendimento BETWEEN 1 AND 5),
  agilidade int NOT NULL CHECK (agilidade BETWEEN 1 AND 5),
  comunicacao int NOT NULL CHECK (comunicacao BETWEEN 1 AND 5),
  qualidade int NOT NULL CHECK (qualidade BETWEEN 1 AND 5),
  geral int NOT NULL CHECK (geral BETWEEN 1 AND 5),
  comentario text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avaliacoes_select_via_chamado" ON public.avaliacoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id));
CREATE POLICY "avaliacoes_insert_solicitante" ON public.avaliacoes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id AND c.solicitante_id = auth.uid()));

-- TRIGGER: cria profile e dá role inicial (primeiro usuário = admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email, matricula, setor)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'matricula',
    NEW.raw_user_meta_data->>'setor'
  );
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'solicitante');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
