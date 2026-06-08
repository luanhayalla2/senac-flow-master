import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/senac";

export interface ProfileData {
  id: string;
  nome_completo: string;
  email: string;
  matricula: string | null;
  setor: string | null;
  unidade_id: string | null;
}

export interface SessionState {
  session: Session | null;
  user: User | null;
  profile: ProfileData | null;
  roles: AppRole[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (sess: Session | null) => {
    if (!sess?.user) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [{ data: prof }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", sess.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", sess.user.id),
    ]);
    setProfile(prof as ProfileData | null);
    setRoles((rs ?? []).map((r) => r.role as AppRole));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void load(s);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    loading,
    refresh: async () => load(session),
  };
}

export const hasAnyRole = (roles: AppRole[], ...want: AppRole[]) =>
  roles.some((r) => want.includes(r));

export const isTecnico = (roles: AppRole[]) =>
  hasAnyRole(roles, "tecnico_n1", "tecnico_n2", "tecnico_n3");

export const isAdminLike = (roles: AppRole[]) =>
  hasAnyRole(roles, "admin", "gestor", "coordenador");
