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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chores: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          household_id: string
          icon: string | null
          id: string
          reward_value: number
          status: Database["public"]["Enums"]["chore_status"]
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          household_id: string
          icon?: string | null
          id?: string
          reward_value?: number
          status?: Database["public"]["Enums"]["chore_status"]
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          reward_value?: number
          status?: Database["public"]["Enums"]["chore_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chores_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      earnings: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          chore_id: string | null
          created_at: string
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["earning_status"]
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          chore_id?: string | null
          created_at?: string
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["earning_status"]
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          chore_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["earning_status"]
        }
        Relationships: [
          {
            foreignKeyName: "earnings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          current_price: number
          id: string
          profile_id: string
          purchase_price: number
          purchased_at: string
          shares: number
          stock_name: string
          stock_symbol: string
          theme: string | null
        }
        Insert: {
          current_price: number
          id?: string
          profile_id: string
          purchase_price: number
          purchased_at?: string
          shares: number
          stock_name: string
          stock_symbol: string
          theme?: string | null
        }
        Update: {
          current_price?: number
          id?: string
          profile_id?: string
          purchase_price?: number
          purchased_at?: string
          shares?: number
          stock_name?: string
          stock_symbol?: string
          theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          profile_id: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          profile_id: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          profile_id?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_wallets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          household_id: string
          id: string
          name: string
          total_earnings: number
          type: Database["public"]["Enums"]["profile_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          household_id: string
          id?: string
          name: string
          total_earnings?: number
          type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          total_earnings?: number
          type?: Database["public"]["Enums"]["profile_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempted_at: string
          id: string
          is_correct: boolean
          points_earned: number
          profile_id: string
          question_id: string
          selected_answer: number
        }
        Insert: {
          attempted_at?: string
          id?: string
          is_correct: boolean
          points_earned?: number
          profile_id: string
          question_id: string
          selected_answer: number
        }
        Update: {
          attempted_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          profile_id?: string
          question_id?: string
          selected_answer?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          category: string
          correct_answer: number
          created_at: string
          difficulty: string
          id: string
          options: Json
          points: number
          question: string
        }
        Insert: {
          category?: string
          correct_answer: number
          created_at?: string
          difficulty?: string
          id?: string
          options: Json
          points?: number
          question: string
        }
        Update: {
          category?: string
          correct_answer?: number
          created_at?: string
          difficulty?: string
          id?: string
          options?: Json
          points?: number
          question?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          cost: number
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          profile_id: string
          reward_id: string
          status: string
        }
        Insert: {
          cost: number
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          profile_id: string
          reward_id: string
          status?: string
        }
        Update: {
          cost?: number
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          profile_id?: string
          reward_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          cost: number
          created_at: string
          created_by: string | null
          description: string | null
          household_id: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          household_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          household_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_amount: number
          icon: string | null
          id: string
          is_completed: boolean
          name: string
          profile_id: string
          target_amount: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          icon?: string | null
          id?: string
          is_completed?: boolean
          name: string
          profile_id: string
          target_amount: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          icon?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          profile_id?: string
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          recipient_profile_id: string | null
          stripe_payment_intent_id: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          recipient_profile_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          recipient_profile_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "parent_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_household_with_parent_profile: {
        Args: { household_name?: string; parent_name: string }
        Returns: {
          household_id: string
          profile_id: string
        }[]
      }
      get_current_household_id: { Args: never; Returns: string }
      get_current_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string
          household_id: string
          id: string
          name: string
          total_earnings: number
          type: Database["public"]["Enums"]["profile_type"]
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_current_profile_id: { Args: never; Returns: string }
      is_member_of_household: {
        Args: { _household_id: string }
        Returns: boolean
      }
      is_parent: { Args: never; Returns: boolean }
      is_parent_of_household: {
        Args: { _household_id: string }
        Returns: boolean
      }
      redeem_reward: {
        Args: { p_profile_id: string; p_reward_id: string }
        Returns: string
      }
      transfer_to_kid: {
        Args: {
          p_amount: number
          p_description?: string
          p_kid_profile_id: string
        }
        Returns: string
      }
    }
    Enums: {
      chore_status:
        | "available"
        | "claimed"
        | "pending_verification"
        | "completed"
      earning_status: "pending" | "approved" | "rejected"
      profile_type: "parent" | "kid"
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
      chore_status: [
        "available",
        "claimed",
        "pending_verification",
        "completed",
      ],
      earning_status: ["pending", "approved", "rejected"],
      profile_type: ["parent", "kid"],
    },
  },
} as const
