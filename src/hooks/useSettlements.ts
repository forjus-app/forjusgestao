import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

// Types
export interface SettlementCase {
  id: string;
  organization_id: string;
  title: string;
  case_id: string | null;
  client_contact_id: string | null;
  counterparty_contact_id: string | null;
  assigned_member_id: string;
  status: "open" | "negotiating" | "awaiting_response" | "closed";
  notes: string | null;
  next_followup_at: string | null;
  followup_enabled: boolean;
  followup_every_n_days: number | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  case?: { id: string; title: string; cnj_number: string | null } | null;
  client_contact?: { id: string; name: string } | null;
  counterparty_contact?: { id: string; name: string } | null;
  assigned_member?: { id: string; name: string } | null;
}

export interface SettlementInteraction {
  id: string;
  organization_id: string;
  settlement_case_id: string;
  type: "whatsapp" | "email" | "phone_call" | "note";
  direction: "outbound" | "inbound" | null;
  message: string;
  occurred_at: string;
  next_followup_at: string | null;
  created_at: string;
}

export interface CreateSettlementInput {
  title: string;
  case_id?: string | null;
  client_contact_id?: string | null;
  counterparty_contact_id?: string | null;
  assigned_member_id: string;
  status?: string;
  notes?: string | null;
  next_followup_at?: string | null;
  followup_enabled?: boolean;
  followup_every_n_days?: number | null;
}

export interface UpdateSettlementInput extends Partial<CreateSettlementInput> {
  id: string;
}

export interface CreateInteractionInput {
  settlement_case_id: string;
  type: "whatsapp" | "email" | "phone_call" | "note";
  direction?: "outbound" | "inbound" | null;
  message: string;
  occurred_at?: string;
  next_followup_at?: string | null;
}

export type FollowupFilter = "all" | "today" | "overdue" | "next_7_days";

// Hook principal
export function useSettlements(filters?: {
  status?: string;
  assignedMemberId?: string;
  followupFilter?: FollowupFilter;
}) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["settlements", organization?.id, filters],
    queryFn: async () => {
      if (!organization) return [];

      let query = supabase
        .from("settlement_cases")
        .select(`
          *,
          case:cases(id, title, cnj_number),
          client_contact:contacts!settlement_cases_client_contact_id_fkey(id, name),
          counterparty_contact:contacts!settlement_cases_counterparty_contact_id_fkey(id, name),
          assigned_member:team_members!settlement_cases_assigned_member_id_fkey(id, name)
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      // Filtro de status
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // Filtro de responsável
      if (filters?.assignedMemberId && filters.assignedMemberId !== "all") {
        query = query.eq("assigned_member_id", filters.assignedMemberId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtro de follow-up (no cliente, pois envolve comparação de datas)
      let filtered = data as SettlementCase[];
      
      if (filters?.followupFilter && filters.followupFilter !== "all") {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const next7Days = new Date(today);
        next7Days.setDate(next7Days.getDate() + 7);

        filtered = filtered.filter((s) => {
          if (!s.next_followup_at) return false;
          const followup = new Date(s.next_followup_at);

          switch (filters.followupFilter) {
            case "today":
              return followup >= today && followup < tomorrow;
            case "overdue":
              return followup < today;
            case "next_7_days":
              return followup >= today && followup <= next7Days;
            default:
              return true;
          }
        });
      }

      return filtered;
    },
    enabled: !!organization,
  });
}

// Hook para buscar um acordo específico
export function useSettlement(id: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["settlement", id],
    queryFn: async () => {
      if (!id || !organization) return null;

      const { data, error } = await supabase
        .from("settlement_cases")
        .select(`
          *,
          case:cases(id, title, cnj_number),
          client_contact:contacts!settlement_cases_client_contact_id_fkey(id, name),
          counterparty_contact:contacts!settlement_cases_counterparty_contact_id_fkey(id, name),
          assigned_member:team_members!settlement_cases_assigned_member_id_fkey(id, name)
        `)
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;
      return data as SettlementCase;
    },
    enabled: !!id && !!organization,
  });
}

// Hook para interações de um acordo
export function useSettlementInteractions(settlementCaseId: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["settlement-interactions", settlementCaseId],
    queryFn: async () => {
      if (!settlementCaseId || !organization) return [];

      const { data, error } = await supabase
        .from("settlement_interactions")
        .select("*")
        .eq("settlement_case_id", settlementCaseId)
        .eq("organization_id", organization.id)
        .order("occurred_at", { ascending: false });

      if (error) throw error;
      return data as SettlementInteraction[];
    },
    enabled: !!settlementCaseId && !!organization,
  });
}

// Mutations
export function useCreateSettlement() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateSettlementInput) => {
      if (!organization) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("settlement_cases")
        .insert({
          ...input,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

export function useUpdateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSettlementInput) => {
      const { data, error } = await supabase
        .from("settlement_cases")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      queryClient.invalidateQueries({ queryKey: ["settlement", data.id] });
    },
  });
}

export function useDeleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("settlement_cases")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateInteractionInput) => {
      if (!organization) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("settlement_interactions")
        .insert({
          ...input,
          organization_id: organization.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["settlement-interactions", variables.settlement_case_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["settlement", variables.settlement_case_id] 
      });
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}
