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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      hrm_announcements: {
        Row: {
          author_id: string | null
          body: string
          category: Database["public"]["Enums"]["hrm_announcement_category"]
          created_at: string
          expires_at: string | null
          id: string
          is_pinned: boolean
          is_published: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category?: Database["public"]["Enums"]["hrm_announcement_category"]
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: Database["public"]["Enums"]["hrm_announcement_category"]
          created_at?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          is_published?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_asset_assignments: {
        Row: {
          asset_id: string
          assigned_at: string
          condition_on_assign: string | null
          condition_on_return: string | null
          employee_id: string
          id: string
          notes: string | null
          performed_by: string | null
          returned_at: string | null
        }
        Insert: {
          asset_id: string
          assigned_at?: string
          condition_on_assign?: string | null
          condition_on_return?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          returned_at?: string | null
        }
        Update: {
          asset_id?: string
          assigned_at?: string
          condition_on_assign?: string | null
          condition_on_return?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          returned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrm_asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "hrm_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_asset_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_asset_assignments_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_assets: {
        Row: {
          asset_no: string
          category: string
          created_at: string
          current_assigned_at: string | null
          current_assignee_id: string | null
          id: string
          name: string
          notes: string | null
          purchase_price: number | null
          purchased_at: string | null
          serial_no: string | null
          status: Database["public"]["Enums"]["hrm_asset_status"]
          updated_at: string
        }
        Insert: {
          asset_no: string
          category: string
          created_at?: string
          current_assigned_at?: string | null
          current_assignee_id?: string | null
          id?: string
          name: string
          notes?: string | null
          purchase_price?: number | null
          purchased_at?: string | null
          serial_no?: string | null
          status?: Database["public"]["Enums"]["hrm_asset_status"]
          updated_at?: string
        }
        Update: {
          asset_no?: string
          category?: string
          created_at?: string
          current_assigned_at?: string | null
          current_assignee_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          purchase_price?: number | null
          purchased_at?: string | null
          serial_no?: string | null
          status?: Database["public"]["Enums"]["hrm_asset_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_assets_current_assignee_id_fkey"
            columns: ["current_assignee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrm_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_business_trip_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          notes: string | null
          performed_by: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_business_trip_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_business_trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "hrm_business_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_business_trips: {
        Row: {
          accommodation: string | null
          accompanying_employee_ids: string[] | null
          approved_at: string | null
          approver_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          completion_report: string | null
          created_at: string
          destination_city: string | null
          destination_country: string
          employee_id: string
          end_date: string
          id: string
          notes: string | null
          purpose: string
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["hrm_business_trip_status"]
          transportation: Database["public"]["Enums"]["hrm_business_trip_transport"]
          trip_type: Database["public"]["Enums"]["hrm_business_trip_type"]
          updated_at: string
        }
        Insert: {
          accommodation?: string | null
          accompanying_employee_ids?: string[] | null
          approved_at?: string | null
          approver_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completion_report?: string | null
          created_at?: string
          destination_city?: string | null
          destination_country: string
          employee_id: string
          end_date: string
          id?: string
          notes?: string | null
          purpose: string
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["hrm_business_trip_status"]
          transportation?: Database["public"]["Enums"]["hrm_business_trip_transport"]
          trip_type: Database["public"]["Enums"]["hrm_business_trip_type"]
          updated_at?: string
        }
        Update: {
          accommodation?: string | null
          accompanying_employee_ids?: string[] | null
          approved_at?: string | null
          approver_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          completion_report?: string | null
          created_at?: string
          destination_city?: string | null
          destination_country?: string
          employee_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          purpose?: string
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["hrm_business_trip_status"]
          transportation?: Database["public"]["Enums"]["hrm_business_trip_transport"]
          trip_type?: Database["public"]["Enums"]["hrm_business_trip_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_business_trips_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_business_trips_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_business_trips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_departments: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hrm_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_email_logs: {
        Row: {
          attempt_count: number
          created_at: string
          error_message: string | null
          id: string
          provider_id: string | null
          recipient_email: string
          related_resource_id: string | null
          related_resource_type: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template_type: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          error_message?: string | null
          id?: string
          provider_id?: string | null
          recipient_email: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          sent_at?: string | null
          status: string
          subject?: string | null
          template_type: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          error_message?: string | null
          id?: string
          provider_id?: string | null
          recipient_email?: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_type?: string
        }
        Relationships: []
      }
      hrm_employee_career: {
        Row: {
          company_name: string
          created_at: string
          description: string | null
          employee_id: string
          end_date: string | null
          id: string
          position: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          description?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          position?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          description?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          position?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_employee_career_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_employee_certifications: {
        Row: {
          certificate_number: string | null
          created_at: string
          employee_id: string
          expires_date: string | null
          id: string
          issued_date: string | null
          issuer: string | null
          name: string
          updated_at: string
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string
          employee_id: string
          expires_date?: string | null
          id?: string
          issued_date?: string | null
          issuer?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          certificate_number?: string | null
          created_at?: string
          employee_id?: string
          expires_date?: string | null
          id?: string
          issued_date?: string | null
          issuer?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_employee_certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_employee_compensation: {
        Row: {
          bank_account_masked: string | null
          bank_name: string | null
          base_salary: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          effective_from: string
          effective_to: string | null
          employee_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          bank_account_masked?: string | null
          bank_name?: string | null
          base_salary?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          effective_from: string
          effective_to?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          bank_account_masked?: string | null
          bank_name?: string | null
          base_salary?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_employee_compensation_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_employee_compensation_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_employee_documents: {
        Row: {
          created_at: string
          document_type: string
          employee_id: string
          file_name: string
          file_size: number | null
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          employee_id: string
          file_name: string
          file_size?: number | null
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          employee_id?: string
          file_name?: string
          file_size?: number | null
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrm_employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_employee_education: {
        Row: {
          created_at: string
          degree: string | null
          employee_id: string
          end_date: string | null
          id: string
          is_graduated: boolean | null
          major: string | null
          school_name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          is_graduated?: boolean | null
          major?: string | null
          school_name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          is_graduated?: boolean | null
          major?: string | null
          school_name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_employee_education_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_employee_family: {
        Row: {
          birth_year: number | null
          created_at: string
          employee_id: string
          id: string
          is_dependent: boolean | null
          name: string
          relation: string
          updated_at: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          employee_id: string
          id?: string
          is_dependent?: boolean | null
          name: string
          relation: string
          updated_at?: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          employee_id?: string
          id?: string
          is_dependent?: boolean | null
          name?: string
          relation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_employee_family_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_employees: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          department_id: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_no: string | null
          employment_status: Database["public"]["Enums"]["hrm_employment_status"]
          employment_type: Database["public"]["Enums"]["hrm_employment_type"]
          gender: Database["public"]["Enums"]["hrm_gender"] | null
          hire_date: string
          id: string
          job_title: string | null
          manager_id: string | null
          name_en: string | null
          name_ko: string
          phone: string | null
          position: string | null
          profile_image_url: string | null
          resignation_date: string | null
          role: Database["public"]["Enums"]["hrm_user_role"]
          sms_opt_in: boolean
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_no?: string | null
          employment_status?: Database["public"]["Enums"]["hrm_employment_status"]
          employment_type?: Database["public"]["Enums"]["hrm_employment_type"]
          gender?: Database["public"]["Enums"]["hrm_gender"] | null
          hire_date: string
          id: string
          job_title?: string | null
          manager_id?: string | null
          name_en?: string | null
          name_ko: string
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          resignation_date?: string | null
          role?: Database["public"]["Enums"]["hrm_user_role"]
          sms_opt_in?: boolean
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_no?: string | null
          employment_status?: Database["public"]["Enums"]["hrm_employment_status"]
          employment_type?: Database["public"]["Enums"]["hrm_employment_type"]
          gender?: Database["public"]["Enums"]["hrm_gender"] | null
          hire_date?: string
          id?: string
          job_title?: string | null
          manager_id?: string | null
          name_en?: string | null
          name_ko?: string
          phone?: string | null
          position?: string | null
          profile_image_url?: string | null
          resignation_date?: string | null
          role?: Database["public"]["Enums"]["hrm_user_role"]
          sms_opt_in?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hrm_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_family_event_policies: {
        Row: {
          code: string
          created_at: string
          description: string | null
          event_kind: Database["public"]["Enums"]["hrm_family_event_kind"]
          granted_days: number
          id: string
          is_active: boolean
          name: string
          relation: Database["public"]["Enums"]["hrm_family_relation"]
          required_attachment_note: string | null
          sort_order: number
          updated_at: string
          usage_limit: Database["public"]["Enums"]["hrm_family_event_usage_limit"]
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          event_kind: Database["public"]["Enums"]["hrm_family_event_kind"]
          granted_days: number
          id?: string
          is_active?: boolean
          name: string
          relation: Database["public"]["Enums"]["hrm_family_relation"]
          required_attachment_note?: string | null
          sort_order?: number
          updated_at?: string
          usage_limit?: Database["public"]["Enums"]["hrm_family_event_usage_limit"]
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          event_kind?: Database["public"]["Enums"]["hrm_family_event_kind"]
          granted_days?: number
          id?: string
          is_active?: boolean
          name?: string
          relation?: Database["public"]["Enums"]["hrm_family_relation"]
          required_attachment_note?: string | null
          sort_order?: number
          updated_at?: string
          usage_limit?: Database["public"]["Enums"]["hrm_family_event_usage_limit"]
        }
        Relationships: []
      }
      hrm_leave_balances: {
        Row: {
          adjusted_days: number
          created_at: string
          employee_id: string
          expires_at: string | null
          granted_days: number
          id: string
          pending_days: number
          updated_at: string
          used_days: number
          year: number
        }
        Insert: {
          adjusted_days?: number
          created_at?: string
          employee_id: string
          expires_at?: string | null
          granted_days?: number
          id?: string
          pending_days?: number
          updated_at?: string
          used_days?: number
          year: number
        }
        Update: {
          adjusted_days?: number
          created_at?: string
          employee_id?: string
          expires_at?: string | null
          granted_days?: number
          id?: string
          pending_days?: number
          updated_at?: string
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "hrm_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_leave_policies: {
        Row: {
          basis: Database["public"]["Enums"]["hrm_leave_policy_basis"]
          created_at: string
          fiscal_year_start_day: number
          fiscal_year_start_month: number
          id: string
          is_active: boolean
          max_carryover_days: number | null
          promotion_first_warn_months: number | null
          promotion_second_warn_months: number | null
          updated_at: string
        }
        Insert: {
          basis?: Database["public"]["Enums"]["hrm_leave_policy_basis"]
          created_at?: string
          fiscal_year_start_day?: number
          fiscal_year_start_month?: number
          id?: string
          is_active?: boolean
          max_carryover_days?: number | null
          promotion_first_warn_months?: number | null
          promotion_second_warn_months?: number | null
          updated_at?: string
        }
        Update: {
          basis?: Database["public"]["Enums"]["hrm_leave_policy_basis"]
          created_at?: string
          fiscal_year_start_day?: number
          fiscal_year_start_month?: number
          id?: string
          is_active?: boolean
          max_carryover_days?: number | null
          promotion_first_warn_months?: number | null
          promotion_second_warn_months?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hrm_leave_requests: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          end_period: Database["public"]["Enums"]["hrm_leave_period"]
          family_event_policy_id: string | null
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          start_period: Database["public"]["Enums"]["hrm_leave_period"]
          status: Database["public"]["Enums"]["hrm_leave_request_status"]
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          end_period?: Database["public"]["Enums"]["hrm_leave_period"]
          family_event_policy_id?: string | null
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          start_period?: Database["public"]["Enums"]["hrm_leave_period"]
          status?: Database["public"]["Enums"]["hrm_leave_request_status"]
          total_days: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          end_period?: Database["public"]["Enums"]["hrm_leave_period"]
          family_event_policy_id?: string | null
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          start_period?: Database["public"]["Enums"]["hrm_leave_period"]
          status?: Database["public"]["Enums"]["hrm_leave_request_status"]
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_leave_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_requests_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_requests_family_event_policy_id_fkey"
            columns: ["family_event_policy_id"]
            isOneToOne: false
            referencedRelation: "hrm_family_event_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "hrm_leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_leave_transactions: {
        Row: {
          created_at: string
          days: number
          employee_id: string
          id: string
          performed_by: string | null
          reason: string | null
          related_request_id: string | null
          transaction_type: Database["public"]["Enums"]["hrm_leave_transaction_type"]
        }
        Insert: {
          created_at?: string
          days: number
          employee_id: string
          id?: string
          performed_by?: string | null
          reason?: string | null
          related_request_id?: string | null
          transaction_type: Database["public"]["Enums"]["hrm_leave_transaction_type"]
        }
        Update: {
          created_at?: string
          days?: number
          employee_id?: string
          id?: string
          performed_by?: string | null
          reason?: string | null
          related_request_id?: string | null
          transaction_type?: Database["public"]["Enums"]["hrm_leave_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "hrm_leave_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_leave_transactions_related_request_id_fkey"
            columns: ["related_request_id"]
            isOneToOne: false
            referencedRelation: "hrm_leave_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_leave_types: {
        Row: {
          code: string
          color_hint: string | null
          created_at: string
          deducts_from_annual: boolean
          id: string
          is_active: boolean
          is_paid: boolean
          max_days_per_request: number | null
          name: string
          requires_attachment: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          code: string
          color_hint?: string | null
          created_at?: string
          deducts_from_annual?: boolean
          id?: string
          is_active?: boolean
          is_paid?: boolean
          max_days_per_request?: number | null
          name: string
          requires_attachment?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          color_hint?: string | null
          created_at?: string
          deducts_from_annual?: boolean
          id?: string
          is_active?: boolean
          is_paid?: boolean
          max_days_per_request?: number | null
          name?: string
          requires_attachment?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hrm_notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["hrm_notification_channel"]
          created_at: string
          delivery_error: string | null
          delivery_status: Database["public"]["Enums"]["hrm_notification_delivery_status"]
          id: string
          kind: Database["public"]["Enums"]["hrm_notification_kind"]
          link_path: string | null
          provider_id: string | null
          read_at: string | null
          recipient_employee_id: string
          related_resource_id: string | null
          related_resource_type: string | null
          sender_employee_id: string | null
          title: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["hrm_notification_channel"]
          created_at?: string
          delivery_error?: string | null
          delivery_status?: Database["public"]["Enums"]["hrm_notification_delivery_status"]
          id?: string
          kind: Database["public"]["Enums"]["hrm_notification_kind"]
          link_path?: string | null
          provider_id?: string | null
          read_at?: string | null
          recipient_employee_id: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          sender_employee_id?: string | null
          title: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["hrm_notification_channel"]
          created_at?: string
          delivery_error?: string | null
          delivery_status?: Database["public"]["Enums"]["hrm_notification_delivery_status"]
          id?: string
          kind?: Database["public"]["Enums"]["hrm_notification_kind"]
          link_path?: string | null
          provider_id?: string | null
          read_at?: string | null
          recipient_employee_id?: string
          related_resource_id?: string | null
          related_resource_type?: string | null
          sender_employee_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_notifications_recipient_employee_id_fkey"
            columns: ["recipient_employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_notifications_sender_employee_id_fkey"
            columns: ["sender_employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_position_history: {
        Row: {
          change_type: Database["public"]["Enums"]["hrm_position_change_type"]
          created_at: string
          effective_date: string
          employee_id: string
          from_department_id: string | null
          from_position: string | null
          from_role: Database["public"]["Enums"]["hrm_user_role"] | null
          id: string
          notes: string | null
          performed_by: string | null
          to_department_id: string | null
          to_position: string | null
          to_role: Database["public"]["Enums"]["hrm_user_role"] | null
        }
        Insert: {
          change_type: Database["public"]["Enums"]["hrm_position_change_type"]
          created_at?: string
          effective_date: string
          employee_id: string
          from_department_id?: string | null
          from_position?: string | null
          from_role?: Database["public"]["Enums"]["hrm_user_role"] | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          to_department_id?: string | null
          to_position?: string | null
          to_role?: Database["public"]["Enums"]["hrm_user_role"] | null
        }
        Update: {
          change_type?: Database["public"]["Enums"]["hrm_position_change_type"]
          created_at?: string
          effective_date?: string
          employee_id?: string
          from_department_id?: string | null
          from_position?: string | null
          from_role?: Database["public"]["Enums"]["hrm_user_role"] | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          to_department_id?: string | null
          to_position?: string | null
          to_role?: Database["public"]["Enums"]["hrm_user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "hrm_position_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_position_history_from_department_id_fkey"
            columns: ["from_department_id"]
            isOneToOne: false
            referencedRelation: "hrm_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_position_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_position_history_to_department_id_fkey"
            columns: ["to_department_id"]
            isOneToOne: false
            referencedRelation: "hrm_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_remote_work_requests: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contact_method: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          reason: string
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["hrm_remote_work_status"]
          total_days: number
          updated_at: string
          work_location: string | null
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contact_method?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          reason: string
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["hrm_remote_work_status"]
          total_days: number
          updated_at?: string
          work_location?: string | null
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contact_method?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["hrm_remote_work_status"]
          total_days?: number
          updated_at?: string
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrm_remote_work_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_remote_work_requests_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrm_remote_work_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrm_training_records: {
        Row: {
          category: string | null
          certificate_url: string | null
          cost: number | null
          created_at: string
          employee_id: string
          end_date: string | null
          hours: number | null
          id: string
          notes: string | null
          provider: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          certificate_url?: string | null
          cost?: number | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          provider?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          certificate_url?: string | null
          cost?: number | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          provider?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrm_training_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      hrm_leave_balances_view: {
        Row: {
          adjusted_days: number | null
          created_at: string | null
          employee_id: string | null
          expires_at: string | null
          granted_days: number | null
          id: string | null
          pending_days: number | null
          remaining_days: number | null
          updated_at: string | null
          used_days: number | null
          year: number | null
        }
        Insert: {
          adjusted_days?: number | null
          created_at?: string | null
          employee_id?: string | null
          expires_at?: string | null
          granted_days?: number | null
          id?: string | null
          pending_days?: number | null
          remaining_days?: never
          updated_at?: string | null
          used_days?: number | null
          year?: number | null
        }
        Update: {
          adjusted_days?: number | null
          created_at?: string | null
          employee_id?: string | null
          expires_at?: string | null
          granted_days?: number | null
          id?: string | null
          pending_days?: number | null
          remaining_days?: never
          updated_at?: string | null
          used_days?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hrm_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrm_employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_business_trip: { Args: { req_id: string }; Returns: Json }
      approve_leave_request: { Args: { req_id: string }; Returns: Json }
      approve_remote_work: { Args: { req_id: string }; Returns: Json }
      can_cancel_request: { Args: { req_id: string }; Returns: boolean }
      cancel_business_trip: {
        Args: { p_reason: string; req_id: string }
        Returns: Json
      }
      cancel_leave_request: {
        Args: { p_reason: string; req_id: string }
        Returns: Json
      }
      cancel_remote_work: { Args: { req_id: string }; Returns: Json }
      complete_business_trip: {
        Args: { p_report: string; req_id: string }
        Returns: Json
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_manager_of: { Args: { target: string }; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      promote_trips_in_progress: { Args: never; Returns: number }
      reject_business_trip: {
        Args: { p_reason: string; req_id: string }
        Returns: Json
      }
      reject_leave_request: {
        Args: { p_reason: string; req_id: string }
        Returns: Json
      }
      reject_remote_work: {
        Args: { p_reason: string; req_id: string }
        Returns: Json
      }
      submit_business_trip: {
        Args: {
          p_accommodation: string
          p_accompanying: string[]
          p_destination_city: string
          p_destination_country: string
          p_end_date: string
          p_notes: string
          p_purpose: string
          p_start_date: string
          p_transportation: Database["public"]["Enums"]["hrm_business_trip_transport"]
          p_trip_type: Database["public"]["Enums"]["hrm_business_trip_type"]
        }
        Returns: string
      }
      submit_family_event_leave: {
        Args: {
          p_end_date: string
          p_policy_id: string
          p_reason: string
          p_start_date: string
          p_total_days: number
        }
        Returns: string
      }
      submit_leave_request: {
        Args: {
          p_end_date: string
          p_end_period: Database["public"]["Enums"]["hrm_leave_period"]
          p_leave_type_id: string
          p_reason: string
          p_start_date: string
          p_start_period: Database["public"]["Enums"]["hrm_leave_period"]
          p_total_days: number
        }
        Returns: string
      }
      submit_remote_work: {
        Args: {
          p_contact_method: string
          p_end_date: string
          p_reason: string
          p_start_date: string
          p_total_days: number
          p_work_location: string
        }
        Returns: string
      }
    }
    Enums: {
      hrm_announcement_category:
        | "general"
        | "policy"
        | "event"
        | "system"
        | "hr"
        | "urgent"
      hrm_asset_status: "available" | "assigned" | "in_repair" | "retired"
      hrm_business_trip_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "in_progress"
        | "completed"
      hrm_business_trip_transport:
        | "flight"
        | "train"
        | "bus"
        | "car_company"
        | "car_personal"
        | "ship"
        | "other"
      hrm_business_trip_type: "domestic" | "overseas"
      hrm_employment_status: "active" | "on_leave" | "resigned"
      hrm_employment_type: "regular" | "contract" | "intern" | "part_time"
      hrm_family_event_kind:
        | "wedding"
        | "funeral"
        | "birth"
        | "maternity"
        | "sixtieth"
        | "other"
      hrm_family_event_usage_limit:
        | "once_lifetime"
        | "once_per_year"
        | "once_per_target"
        | "unlimited"
      hrm_family_relation:
        | "self"
        | "spouse"
        | "child"
        | "parent"
        | "parent_in_law"
        | "sibling"
        | "grandparent"
        | "grandchild"
      hrm_gender: "male" | "female" | "other"
      hrm_leave_period: "full_day" | "am_half" | "pm_half" | "hourly"
      hrm_leave_policy_basis: "hire_date" | "fiscal_year"
      hrm_leave_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "system_cancelled"
      hrm_leave_transaction_type:
        | "grant"
        | "deduct"
        | "refund"
        | "adjust"
        | "expire"
      hrm_notification_channel: "inapp" | "sms" | "email"
      hrm_notification_delivery_status:
        | "pending"
        | "sent"
        | "stubbed"
        | "failed"
      hrm_notification_kind:
        | "leave_request_submitted"
        | "leave_approved"
        | "leave_rejected"
        | "leave_cancelled_by_employee"
        | "employee_invitation"
      hrm_position_change_type:
        | "hire"
        | "promotion"
        | "demotion"
        | "transfer"
        | "role_change"
        | "resignation"
        | "other"
      hrm_remote_work_status: "pending" | "approved" | "rejected" | "cancelled"
      hrm_user_role: "employee" | "manager" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      hrm_announcement_category: [
        "general",
        "policy",
        "event",
        "system",
        "hr",
        "urgent",
      ],
      hrm_asset_status: ["available", "assigned", "in_repair", "retired"],
      hrm_business_trip_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "in_progress",
        "completed",
      ],
      hrm_business_trip_transport: [
        "flight",
        "train",
        "bus",
        "car_company",
        "car_personal",
        "ship",
        "other",
      ],
      hrm_business_trip_type: ["domestic", "overseas"],
      hrm_employment_status: ["active", "on_leave", "resigned"],
      hrm_employment_type: ["regular", "contract", "intern", "part_time"],
      hrm_family_event_kind: [
        "wedding",
        "funeral",
        "birth",
        "maternity",
        "sixtieth",
        "other",
      ],
      hrm_family_event_usage_limit: [
        "once_lifetime",
        "once_per_year",
        "once_per_target",
        "unlimited",
      ],
      hrm_family_relation: [
        "self",
        "spouse",
        "child",
        "parent",
        "parent_in_law",
        "sibling",
        "grandparent",
        "grandchild",
      ],
      hrm_gender: ["male", "female", "other"],
      hrm_leave_period: ["full_day", "am_half", "pm_half", "hourly"],
      hrm_leave_policy_basis: ["hire_date", "fiscal_year"],
      hrm_leave_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "system_cancelled",
      ],
      hrm_leave_transaction_type: [
        "grant",
        "deduct",
        "refund",
        "adjust",
        "expire",
      ],
      hrm_notification_channel: ["inapp", "sms", "email"],
      hrm_notification_delivery_status: [
        "pending",
        "sent",
        "stubbed",
        "failed",
      ],
      hrm_notification_kind: [
        "leave_request_submitted",
        "leave_approved",
        "leave_rejected",
        "leave_cancelled_by_employee",
        "employee_invitation",
      ],
      hrm_position_change_type: [
        "hire",
        "promotion",
        "demotion",
        "transfer",
        "role_change",
        "resignation",
        "other",
      ],
      hrm_remote_work_status: ["pending", "approved", "rejected", "cancelled"],
      hrm_user_role: ["employee", "manager", "admin"],
    },
  },
} as const
