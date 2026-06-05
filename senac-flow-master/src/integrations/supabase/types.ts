export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          agilidade: number
          atendimento: number
          chamado_id: string
          comentario: string | null
          comunicacao: number
          criado_em: string
          geral: number
          id: string
          qualidade: number
        }
        Insert: {
          agilidade: number
          atendimento: number
          chamado_id: string
          comentario?: string | null
          comunicacao: number
          criado_em?: string
          geral: number
          id?: string
          qualidade: number
        }
        Update: {
          agilidade?: number
          atendimento?: number
          chamado_id?: string
          comentario?: string | null
          comunicacao?: number
          criado_em?: string
          geral?: number
          id?: string
          qualidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: true
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          icone: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      chamado_historico: {
        Row: {
          acao: string
          autor_id: string | null
          chamado_id: string
          criado_em: string
          detalhes: Json | null
          id: string
        }
        Insert: {
          acao: string
          autor_id?: string | null
          chamado_id: string
          criado_em?: string
          detalhes?: Json | null
          id?: string
        }
        Update: {
          acao?: string
          autor_id?: string | null
          chamado_id?: string
          criado_em?: string
          detalhes?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamado_historico_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          aberto_em: string
          atualizado_em: string
          descricao: string
          fechado_em: string | null
          id: string
          motivo_reabertura: string | null
          nivel: Database["public"]["Enums"]["nivel_atendimento"]
          numero: string
          primeiro_atendimento_em: string | null
          prioridade: Database["public"]["Enums"]["chamado_prioridade"]
          resolvido_em: string | null
          setor: string
          sla_resposta_min: number
          sla_solucao_min: number
          solicitante_id: string
          solucao: string | null
          status: Database["public"]["Enums"]["chamado_status"]
          subcategoria_id: string
          tecnico_id: string | null
          titulo: string
          unidade_id: string
        }
        Insert: {
          aberto_em?: string
          atualizado_em?: string
          descricao: string
          fechado_em?: string | null
          id?: string
          motivo_reabertura?: string | null
          nivel: Database["public"]["Enums"]["nivel_atendimento"]
          numero: string
          primeiro_atendimento_em?: string | null
          prioridade?: Database["public"]["Enums"]["chamado_prioridade"]
          resolvido_em?: string | null
          setor: string
          sla_resposta_min: number
          sla_solucao_min: number
          solicitante_id: string
          solucao?: string | null
          status?: Database["public"]["Enums"]["chamado_status"]
          subcategoria_id: string
          tecnico_id?: string | null
          titulo: string
          unidade_id: string
        }
        Update: {
          aberto_em?: string
          atualizado_em?: string
          descricao?: string
          fechado_em?: string | null
          id?: string
          motivo_reabertura?: string | null
          nivel?: Database["public"]["Enums"]["nivel_atendimento"]
          numero?: string
          primeiro_atendimento_em?: string | null
          prioridade?: Database["public"]["Enums"]["chamado_prioridade"]
          resolvido_em?: string | null
          setor?: string
          sla_resposta_min?: number
          sla_solucao_min?: number
          solicitante_id?: string
          solucao?: string | null
          status?: Database["public"]["Enums"]["chamado_status"]
          subcategoria_id?: string
          tecnico_id?: string | null
          titulo?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chamados_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "subcategorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          matricula: string | null
          nome_completo: string
          setor: string | null
          unidade_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email: string
          id: string
          matricula?: string | null
          nome_completo: string
          setor?: string | null
          unidade_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          matricula?: string | null
          nome_completo?: string
          setor?: string | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategorias: {
        Row: {
          ativo: boolean
          categoria_id: string
          descricao: string | null
          id: string
          nivel: Database["public"]["Enums"]["nivel_atendimento"]
          nome: string
          sla_resposta_min: number
          sla_solucao_min: number
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          descricao?: string | null
          id?: string
          nivel: Database["public"]["Enums"]["nivel_atendimento"]
          nome: string
          sla_resposta_min: number
          sla_solucao_min: number
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          descricao?: string | null
          id?: string
          nivel?: Database["public"]["Enums"]["nivel_atendimento"]
          nome?: string
          sla_resposta_min?: number
          sla_solucao_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          cidade: string
          codigo: string
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          cidade: string
          codigo: string
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          cidade?: string
          codigo?: string
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tecnico: { Args: { _user_id: string }; Returns: boolean }
      niveis_visiveis: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["nivel_atendimento"][]
      }
    }
    Enums: {
      app_role:
        | "solicitante"
        | "tecnico_n1"
        | "tecnico_n2"
        | "tecnico_n3"
        | "coordenador"
        | "gestor"
        | "admin"
      chamado_prioridade: "baixa" | "media" | "alta" | "critica"
      chamado_status:
        | "aberto"
        | "em_atendimento"
        | "escalonado"
        | "resolvido"
        | "fechado"
        | "reaberto"
      nivel_atendimento: "n1" | "n2" | "n3"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "solicitante",
        "tecnico_n1",
        "tecnico_n2",
        "tecnico_n3",
        "coordenador",
        "gestor",
        "admin",
      ],
      chamado_prioridade: ["baixa", "media", "alta", "critica"],
      chamado_status: [
        "aberto",
        "em_atendimento",
        "escalonado",
        "resolvido",
        "fechado",
        "reaberto",
      ],
      nivel_atendimento: ["n1", "n2", "n3"],
    },
  },
} as const
