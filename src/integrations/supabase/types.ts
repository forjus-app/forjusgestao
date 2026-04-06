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
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          organization_id: string
          payload: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          organization_id: string
          payload?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          organization_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_areas: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_parties: {
        Row: {
          case_id: string
          contact_id: string
          created_at: string
          id: string
          is_primary_client: boolean
          notes: string | null
          organization_id: string
          role: string
          side: string | null
        }
        Insert: {
          case_id: string
          contact_id: string
          created_at?: string
          id?: string
          is_primary_client?: boolean
          notes?: string | null
          organization_id: string
          role: string
          side?: string | null
        }
        Update: {
          case_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          is_primary_client?: boolean
          notes?: string | null
          organization_id?: string
          role?: string
          side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_parties_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_parties_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_parties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_phases: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_phases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_statuses: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_statuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_tags: {
        Row: {
          case_id: string
          created_at: string
          id: string
          organization_id: string
          tag_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          organization_id: string
          tag_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_tags_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      case_timeline_events: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          title: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          title?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_timeline_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_timeline_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_types: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          archived_at: string | null
          area_id: string | null
          city: string | null
          claim_value: number | null
          closed_at: string | null
          cnj_number: string | null
          court: string | null
          court_division: string | null
          created_at: string
          drive_link: string | null
          fee_percent: number | null
          fee_value: number | null
          id: string
          internal_number: string | null
          link_url: string | null
          opened_at: string | null
          organization_id: string
          original_number: string | null
          pending_notes: string | null
          phase_id: string | null
          physical_location: string | null
          responsible_user_id: string | null
          state: string | null
          status_id: string | null
          title: string
          tribunal: string | null
          type_id: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          city?: string | null
          claim_value?: number | null
          closed_at?: string | null
          cnj_number?: string | null
          court?: string | null
          court_division?: string | null
          created_at?: string
          drive_link?: string | null
          fee_percent?: number | null
          fee_value?: number | null
          id?: string
          internal_number?: string | null
          link_url?: string | null
          opened_at?: string | null
          organization_id: string
          original_number?: string | null
          pending_notes?: string | null
          phase_id?: string | null
          physical_location?: string | null
          responsible_user_id?: string | null
          state?: string | null
          status_id?: string | null
          title: string
          tribunal?: string | null
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          city?: string | null
          claim_value?: number | null
          closed_at?: string | null
          cnj_number?: string | null
          court?: string | null
          court_division?: string | null
          created_at?: string
          drive_link?: string | null
          fee_percent?: number | null
          fee_value?: number | null
          id?: string
          internal_number?: string | null
          link_url?: string | null
          opened_at?: string | null
          organization_id?: string
          original_number?: string | null
          pending_notes?: string | null
          phase_id?: string | null
          physical_location?: string | null
          responsible_user_id?: string | null
          state?: string | null
          status_id?: string | null
          title?: string
          tribunal?: string | null
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "case_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "case_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "case_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "case_types"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          city: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          state: string | null
          type: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          state?: string | null
          type: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          state?: string | null
          type?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string
          custom_field_id: string
          entity_id: string
          id: string
          organization_id: string
          value_bool: boolean | null
          value_date: string | null
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          custom_field_id: string
          entity_id: string
          id?: string
          organization_id: string
          value_bool?: boolean | null
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          custom_field_id?: string
          entity_id?: string
          id?: string
          organization_id?: string
          value_bool?: boolean | null
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string
          entity_type: string
          field_type: string
          id: string
          is_required: boolean
          key: string
          label: string
          options: Json
          organization_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          entity_type: string
          field_type: string
          id?: string
          is_required?: boolean
          key: string
          label: string
          options?: Json
          organization_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          entity_type?: string
          field_type?: string
          id?: string
          is_required?: boolean
          key?: string
          label?: string
          options?: Json
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          case_id: string | null
          completed_at: string | null
          completed_notes: string | null
          created_at: string
          delivery_due_at: string
          drive_link: string | null
          fatal_due_at: string
          id: string
          notes: string | null
          organization_id: string
          priority: number
          responsible_member_id: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          completed_at?: string | null
          completed_notes?: string | null
          created_at?: string
          delivery_due_at: string
          drive_link?: string | null
          fatal_due_at: string
          id?: string
          notes?: string | null
          organization_id: string
          priority?: number
          responsible_member_id: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          completed_at?: string | null
          completed_notes?: string | null
          created_at?: string
          delivery_due_at?: string
          drive_link?: string | null
          fatal_due_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: number
          responsible_member_id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_responsible_member_id_fkey"
            columns: ["responsible_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      document_links: {
        Row: {
          case_id: string | null
          created_at: string
          document_id: string
          id: string
          organization_id: string
          timeline_event_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          document_id: string
          id?: string
          organization_id: string
          timeline_event_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string
          document_id?: string
          id?: string
          organization_id?: string
          timeline_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_links_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_timeline_event_id_fkey"
            columns: ["timeline_event_id"]
            isOneToOne: false
            referencedRelation: "case_timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          checksum: string | null
          created_at: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          organization_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          organization_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          checksum?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          organization_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          channel: string
          created_at: string
          event_id: string
          id: string
          organization_id: string
          remind_at: string
          sent_at: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          event_id: string
          id?: string
          organization_id: string
          remind_at: string
          sent_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          event_id?: string
          id?: string
          organization_id?: string
          remind_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          case_id: string | null
          contact_id: string | null
          created_at: string
          end_at: string | null
          event_type: string
          id: string
          location: string | null
          notes: string | null
          online_link: string | null
          organization_id: string
          responsible_member_id: string
          start_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          contact_id?: string | null
          created_at?: string
          end_at?: string | null
          event_type: string
          id?: string
          location?: string | null
          notes?: string | null
          online_link?: string | null
          organization_id: string
          responsible_member_id: string
          start_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          contact_id?: string | null
          created_at?: string
          end_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          online_link?: string | null
          organization_id?: string
          responsible_member_id?: string
          start_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_responsible_member_id_fkey"
            columns: ["responsible_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      external_case_document_links: {
        Row: {
          created_at: string
          document_id: string
          external_case_id: string
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          external_case_id: string
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          external_case_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_case_document_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_case_document_links_external_case_id_fkey"
            columns: ["external_case_id"]
            isOneToOne: false
            referencedRelation: "external_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_case_document_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_case_statuses: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "external_case_statuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_case_timeline_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          external_case_id: string
          id: string
          occurred_at: string
          organization_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          external_case_id: string
          id?: string
          occurred_at?: string
          organization_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          external_case_id?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_case_timeline_events_external_case_id_fkey"
            columns: ["external_case_id"]
            isOneToOne: false
            referencedRelation: "external_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_case_timeline_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_case_types: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "external_case_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_cases: {
        Row: {
          authority_name: string
          city: string | null
          client_contact_id: string
          created_at: string
          has_official_number: boolean
          id: string
          notes: string | null
          organization_id: string
          partner_lawyer_id: string
          portal_link: string | null
          process_number: string | null
          protocol_number: string | null
          state: string | null
          status_id: string | null
          type_id: string
          updated_at: string
        }
        Insert: {
          authority_name: string
          city?: string | null
          client_contact_id: string
          created_at?: string
          has_official_number?: boolean
          id?: string
          notes?: string | null
          organization_id: string
          partner_lawyer_id: string
          portal_link?: string | null
          process_number?: string | null
          protocol_number?: string | null
          state?: string | null
          status_id?: string | null
          type_id: string
          updated_at?: string
        }
        Update: {
          authority_name?: string
          city?: string | null
          client_contact_id?: string
          created_at?: string
          has_official_number?: boolean
          id?: string
          notes?: string | null
          organization_id?: string
          partner_lawyer_id?: string
          portal_link?: string | null
          process_number?: string | null
          protocol_number?: string | null
          state?: string | null
          status_id?: string | null
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_cases_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_cases_partner_lawyer_id_fkey"
            columns: ["partner_lawyer_id"]
            isOneToOne: false
            referencedRelation: "partner_lawyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_cases_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "external_case_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_cases_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "external_case_types"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_lawyers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          oab: string | null
          office_name: string | null
          organization_id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          oab?: string | null
          office_name?: string | null
          organization_id: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          oab?: string | null
          office_name?: string | null
          organization_id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_lawyers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_approved: boolean
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_approved?: boolean
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          assigned_member_id: string
          case_description: string
          case_id: string | null
          client_contact_id: string | null
          created_at: string
          drive_link: string | null
          evidence_list: string | null
          facts: string | null
          id: string
          notes: string | null
          organization_id: string
          priority: number
          related_contact_id: string | null
          requests: string | null
          service_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_member_id: string
          case_description: string
          case_id?: string | null
          client_contact_id?: string | null
          created_at?: string
          drive_link?: string | null
          evidence_list?: string | null
          facts?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          priority?: number
          related_contact_id?: string | null
          requests?: string | null
          service_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_member_id?: string
          case_description?: string
          case_id?: string | null
          client_contact_id?: string | null
          created_at?: string
          drive_link?: string | null
          evidence_list?: string | null
          facts?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: number
          related_contact_id?: string | null
          requests?: string | null
          service_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_member_id_fkey"
            columns: ["assigned_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_related_contact_id_fkey"
            columns: ["related_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      service_timeline_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          event_type: string
          id: string
          occurred_at: string
          organization_id: string
          service_request_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          event_type: string
          id?: string
          occurred_at?: string
          organization_id: string
          service_request_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          event_type?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_timeline_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_timeline_events_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_cases: {
        Row: {
          assigned_member_id: string
          case_id: string | null
          client_contact_id: string | null
          counterparty_contact_id: string | null
          created_at: string
          followup_enabled: boolean
          followup_every_n_days: number | null
          id: string
          next_followup_at: string | null
          notes: string | null
          organization_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_member_id: string
          case_id?: string | null
          client_contact_id?: string | null
          counterparty_contact_id?: string | null
          created_at?: string
          followup_enabled?: boolean
          followup_every_n_days?: number | null
          id?: string
          next_followup_at?: string | null
          notes?: string | null
          organization_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_member_id?: string
          case_id?: string | null
          client_contact_id?: string | null
          counterparty_contact_id?: string | null
          created_at?: string
          followup_enabled?: boolean
          followup_every_n_days?: number | null
          id?: string
          next_followup_at?: string | null
          notes?: string | null
          organization_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_cases_assigned_member_id_fkey"
            columns: ["assigned_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_cases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_cases_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_cases_counterparty_contact_id_fkey"
            columns: ["counterparty_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_interactions: {
        Row: {
          created_at: string
          direction: string | null
          id: string
          message: string
          next_followup_at: string | null
          occurred_at: string
          organization_id: string
          settlement_case_id: string
          type: string
        }
        Insert: {
          created_at?: string
          direction?: string | null
          id?: string
          message: string
          next_followup_at?: string | null
          occurred_at?: string
          organization_id: string
          settlement_case_id: string
          type: string
        }
        Update: {
          created_at?: string
          direction?: string | null
          id?: string
          message?: string
          next_followup_at?: string | null
          occurred_at?: string
          organization_id?: string
          settlement_case_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_interactions_settlement_case_id_fkey"
            columns: ["settlement_case_id"]
            isOneToOne: false
            referencedRelation: "settlement_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          role: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          role?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          role?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tribunals: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          segment: string | null
          uf: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          segment?: string | null
          uf?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          segment?: string | null
          uf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tribunals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      seed_case_taxonomy: { Args: { org_id: string }; Returns: undefined }
      seed_external_case_taxonomy: {
        Args: { org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
