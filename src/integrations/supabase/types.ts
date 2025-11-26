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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      document_audit_log: {
        Row: {
          action: string
          document_id: string
          id: string
          metadata: Json | null
          performed_by: string
          timestamp: string
        }
        Insert: {
          action: string
          document_id: string
          id?: string
          metadata?: Json | null
          performed_by: string
          timestamp?: string
        }
        Update: {
          action?: string
          document_id?: string
          id?: string
          metadata?: Json | null
          performed_by?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_audit_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      documents: {
        Row: {
          client_file_url: string | null
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          pld_acknowledged: boolean | null
          pld_acknowledged_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          tkb_file_url: string | null
          updated_at: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          client_file_url?: string | null
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          pld_acknowledged?: boolean | null
          pld_acknowledged_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tkb_file_url?: string | null
          updated_at?: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          client_file_url?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          pld_acknowledged?: boolean | null
          pld_acknowledged_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tkb_file_url?: string | null
          updated_at?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      leads: {
        Row: {
          admin_notes: string | null
          contacted_at: string | null
          converted_at: string | null
          created_at: string
          email_corporativo: string
          id: string
          ip_address: string | null
          necessidade: string
          necessidade_outro: string | null
          nome_completo: string
          qualified_at: string | null
          status: string | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          volume_mensal: string
        }
        Insert: {
          admin_notes?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          email_corporativo: string
          id?: string
          ip_address?: string | null
          necessidade: string
          necessidade_outro?: string | null
          nome_completo: string
          qualified_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          volume_mensal: string
        }
        Update: {
          admin_notes?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          email_corporativo?: string
          id?: string
          ip_address?: string | null
          necessidade?: string
          necessidade_outro?: string | null
          nome_completo?: string
          qualified_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          volume_mensal?: string
        }
        Relationships: []
      }
      offline_client_documents: {
        Row: {
          client_id: string
          document_name: string
          document_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          client_id: string
          document_name: string
          document_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          client_id?: string
          document_name?: string
          document_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "offline_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_clients: {
        Row: {
          created_at: string
          created_by: string
          document_number: string
          document_type: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          document_number: string
          document_type?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_number?: string
          document_type?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      offline_transactions: {
        Row: {
          brl_amount: number
          client_id: string
          created_at: string
          created_by: string
          id: string
          notes: string | null
          operation_type: string
          transaction_date: string
          updated_at: string
          usdt_amount: number
          usdt_rate: number
        }
        Insert: {
          brl_amount: number
          client_id: string
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          operation_type?: string
          transaction_date: string
          updated_at?: string
          usdt_amount: number
          usdt_rate: number
        }
        Update: {
          brl_amount?: number
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          operation_type?: string
          transaction_date?: string
          updated_at?: string
          usdt_amount?: number
          usdt_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "offline_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "offline_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          actor_type: string
          created_at: string
          event_type: string
          id: string
          message: string
          metadata: Json | null
          order_id: string
        }
        Insert: {
          actor_type: string
          created_at?: string
          event_type: string
          id?: string
          message: string
          metadata?: Json | null
          order_id: string
        }
        Update: {
          actor_type?: string
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          id: string
          locked_at: string | null
          locked_price: number
          network: string
          partner_type: string | null
          payment_confirmed_at: string | null
          receipt_url: string | null
          status: string
          total: number
          transaction_hash: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_price: number
          network: string
          partner_type?: string | null
          payment_confirmed_at?: string | null
          receipt_url?: string | null
          status?: string
          total: number
          transaction_hash?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_price?: number
          network?: string
          partner_type?: string | null
          payment_confirmed_at?: string | null
          receipt_url?: string | null
          status?: string
          total?: number
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      otc_quote_clients: {
        Row: {
          client_name: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          slug: string
          spread_percent: number
          updated_at: string | null
        }
        Insert: {
          client_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          slug: string
          spread_percent: number
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          slug?: string
          spread_percent?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_b2b_config: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          markup_percent: number
          markup_type: string | null
          notes: string | null
          price_source: string | null
          trading_volume_monthly: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          markup_percent: number
          markup_type?: string | null
          notes?: string | null
          price_source?: string | null
          trading_volume_monthly?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          markup_percent?: number
          markup_type?: string | null
          notes?: string | null
          price_source?: string | null
          trading_volume_monthly?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_requests: {
        Row: {
          created_at: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          name: string
          notes: string | null
          phone: string
          request_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          trading_volume_monthly: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name: string
          notes?: string | null
          phone: string
          request_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          trading_volume_monthly?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          name?: string
          notes?: string | null
          phone?: string
          request_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          trading_volume_monthly?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          document_number: string
          document_type: string
          email: string | null
          full_name: string
          id: string
          instagram: string | null
          linkedin: string | null
          phone: string | null
          terms_accepted_at: string | null
          twitter: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          document_number: string
          document_type: string
          email?: string | null
          full_name: string
          id: string
          instagram?: string | null
          linkedin?: string | null
          phone?: string | null
          terms_accepted_at?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          document_number?: string
          document_type?: string
          email?: string | null
          full_name?: string
          id?: string
          instagram?: string | null
          linkedin?: string | null
          phone?: string | null
          terms_accepted_at?: string | null
          twitter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          subject: string
          updated_at: string | null
          user_id: string
          whatsapp: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
          whatsapp: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_stats: {
        Row: {
          avg_ticket: number | null
          completed_orders: number | null
          document_number: string | null
          document_type: string | null
          full_name: string | null
          last_order_date: string | null
          paid_orders: number | null
          pending_orders: number | null
          registered_at: string | null
          total_volume: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_stats: {
        Args: never
        Returns: {
          avg_ticket: number | null
          completed_orders: number | null
          document_number: string | null
          document_type: string | null
          full_name: string | null
          last_order_date: string | null
          paid_orders: number | null
          pending_orders: number | null
          registered_at: string | null
          total_volume: number | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "user_stats"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_document_available: { Args: { doc: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "b2b_partner"
      document_status: "pending" | "under_review" | "approved" | "rejected"
      document_type:
        | "contrato-quadro"
        | "dossie-kyc"
        | "politica-pld"
        | "kyc-faturamento"
        | "kyc-cnpj"
        | "kyc-identificacao"
        | "kyc-comprovante-residencia"
        | "kyc-outros"
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
      app_role: ["admin", "user", "b2b_partner"],
      document_status: ["pending", "under_review", "approved", "rejected"],
      document_type: [
        "contrato-quadro",
        "dossie-kyc",
        "politica-pld",
        "kyc-faturamento",
        "kyc-cnpj",
        "kyc-identificacao",
        "kyc-comprovante-residencia",
        "kyc-outros",
      ],
    },
  },
} as const
