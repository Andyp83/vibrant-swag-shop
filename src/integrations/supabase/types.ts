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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      catalog_categories: {
        Row: {
          colour: string
          created_at: string
          description: string
          id: string
          image_url: string
          name: string
          slug: string
          sort_order: number
          tagline: string
          updated_at: string
        }
        Insert: {
          colour?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name: string
          slug: string
          sort_order?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          colour?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_products: {
        Row: {
          blurb: string
          category_id: string
          colours: string
          created_at: string
          id: string
          image_url: string | null
          methods: string[]
          moq: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          blurb?: string
          category_id: string
          colours?: string
          created_at?: string
          id?: string
          image_url?: string | null
          methods?: string[]
          moq?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          blurb?: string
          category_id?: string
          colours?: string
          created_at?: string
          id?: string
          image_url?: string | null
          methods?: string[]
          moq?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          created_at: string
          error: string | null
          id: string
          related_id: string | null
          related_type: string | null
          status: string
          subject: string
          template: string
          to_email: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          status?: string
          subject: string
          template: string
          to_email: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          related_id?: string | null
          related_type?: string | null
          status?: string
          subject?: string
          template?: string
          to_email?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          customer_id: string
          description: string
          due_date: string | null
          id: string
          job_id: string | null
          kind: string
          last_reminder_at: string | null
          number: string
          paid_at: string | null
          quote_id: string | null
          share_token: string
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_id: string
          description?: string
          due_date?: string | null
          id?: string
          job_id?: string | null
          kind?: string
          last_reminder_at?: string | null
          number?: string
          paid_at?: string | null
          quote_id?: string | null
          share_token?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_id?: string
          description?: string
          due_date?: string | null
          id?: string
          job_id?: string | null
          kind?: string
          last_reminder_at?: string | null
          number?: string
          paid_at?: string | null
          quote_id?: string | null
          share_token?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_events: {
        Row: {
          created_at: string
          id: string
          job_id: string
          kind: string
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          kind?: string
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          kind?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          notes: string
          number: string
          quote_id: string | null
          share_token: string
          stage: Database["public"]["Enums"]["job_stage"]
          supplier_reference: string
          title: string
          tracking_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          notes?: string
          number?: string
          quote_id?: string | null
          share_token?: string
          stage?: Database["public"]["Enums"]["job_stage"]
          supplier_reference?: string
          title: string
          tracking_number?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          notes?: string
          number?: string
          quote_id?: string | null
          share_token?: string
          stage?: Database["public"]["Enums"]["job_stage"]
          supplier_reference?: string
          title?: string
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          environment: string
          id: string
          invoice_id: string
          provider: string
          provider_reference: string | null
          status: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          invoice_id: string
          provider?: string
          provider_reference?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          id?: string
          invoice_id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      proofs: {
        Row: {
          created_at: string
          file_path: string
          id: string
          job_id: string
          notes: string
          responded_at: string | null
          response_note: string
          sent_at: string | null
          share_token: string
          status: Database["public"]["Enums"]["proof_status"]
          version: number
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          job_id: string
          notes?: string
          responded_at?: string | null
          response_note?: string
          sent_at?: string | null
          share_token?: string
          status?: Database["public"]["Enums"]["proof_status"]
          version?: number
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          job_id?: string
          notes?: string
          responded_at?: string | null
          response_note?: string
          sent_at?: string | null
          share_token?: string
          status?: Database["public"]["Enums"]["proof_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proofs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          amount_cents: number
          created_at: string
          decoration: string
          description: string
          id: string
          product: string
          quantity: number
          quote_id: string
          sort_order: number
          unit_price_cents: number
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          decoration?: string
          description: string
          id?: string
          product?: string
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_price_cents?: number
        }
        Update: {
          amount_cents?: number
          created_at?: string
          decoration?: string
          description?: string
          id?: string
          product?: string
          quantity?: number
          quote_id?: string
          sort_order?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          admin_notes: string
          budget: string | null
          company: string | null
          created_at: string
          customer_id: string | null
          decoration: string | null
          email: string
          file_paths: string[]
          id: string
          name: string
          notes: string | null
          phone: string | null
          product_interest: string | null
          quantity: number | null
          required_by: string | null
          status: Database["public"]["Enums"]["quote_request_status"]
        }
        Insert: {
          admin_notes?: string
          budget?: string | null
          company?: string | null
          created_at?: string
          customer_id?: string | null
          decoration?: string | null
          email: string
          file_paths?: string[]
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          product_interest?: string | null
          quantity?: number | null
          required_by?: string | null
          status?: Database["public"]["Enums"]["quote_request_status"]
        }
        Update: {
          admin_notes?: string
          budget?: string | null
          company?: string | null
          created_at?: string
          customer_id?: string | null
          decoration?: string | null
          email?: string
          file_paths?: string[]
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          product_interest?: string | null
          quantity?: number | null
          required_by?: string | null
          status?: Database["public"]["Enums"]["quote_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          currency: string
          customer_id: string
          declined_at: string | null
          discount_cents: number
          freight_cents: number
          id: string
          notes: string
          number: string
          request_id: string | null
          sent_at: string | null
          setup_cents: number
          share_token: string
          status: Database["public"]["Enums"]["quote_status"]
          subtotal_cents: number
          tax_cents: number
          tax_rate: number
          terms: string
          total_cents: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          declined_at?: string | null
          discount_cents?: number
          freight_cents?: number
          id?: string
          notes?: string
          number?: string
          request_id?: string | null
          sent_at?: string | null
          setup_cents?: number
          share_token?: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          tax_cents?: number
          tax_rate?: number
          terms?: string
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          declined_at?: string | null
          discount_cents?: number
          freight_cents?: number
          id?: string
          notes?: string
          number?: string
          request_id?: string | null
          sent_at?: string | null
          setup_cents?: number
          share_token?: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          tax_cents?: number
          tax_rate?: number
          terms?: string
          total_cents?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
    }
    Enums: {
      app_role: "admin"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "void"
      job_stage:
        | "artwork"
        | "proof"
        | "approved"
        | "production"
        | "shipped"
        | "delivered"
      proof_status: "sent" | "approved" | "changes_requested"
      quote_request_status: "new" | "in_progress" | "quoted" | "won" | "lost"
      quote_status: "draft" | "sent" | "accepted" | "declined" | "expired"
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
      app_role: ["admin"],
      invoice_status: ["draft", "sent", "paid", "overdue", "void"],
      job_stage: [
        "artwork",
        "proof",
        "approved",
        "production",
        "shipped",
        "delivered",
      ],
      proof_status: ["sent", "approved", "changes_requested"],
      quote_request_status: ["new", "in_progress", "quoted", "won", "lost"],
      quote_status: ["draft", "sent", "accepted", "declined", "expired"],
    },
  },
} as const
