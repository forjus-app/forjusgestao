import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useCrmColumns() {
  const { data: organization } = useOrganization();

  const query = useQuery({
    queryKey: ["crm-columns", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("crm_columns")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  return query;
}

export function useCrmCategories() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["crm-categories", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("crm_categories")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });
}

export function useCrmLeads() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["crm-leads", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*, crm_categories(name), crm_lead_tags(tag_id, tags(id, name, color))")
        .eq("organization_id", organization.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });
}

export function useCrmLeadHistory(leadId: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["crm-lead-history", leadId],
    queryFn: async () => {
      if (!organization || !leadId) return [];
      const { data, error } = await supabase
        .from("crm_lead_history")
        .select("*, from_col:from_column_id(name), to_col:to_column_id(name)")
        .eq("lead_id", leadId)
        .eq("organization_id", organization.id)
        .order("moved_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organization && !!leadId,
  });
}

export function useInitCrmColumns() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("No org");
      const { error } = await supabase.rpc("seed_crm_taxonomy", { org_id: organization.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-columns"] });
      queryClient.invalidateQueries({ queryKey: ["crm-categories"] });
    },
  });
}

export function useCreateCrmLead() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: {
      name: string;
      phone?: string;
      city?: string;
      email?: string;
      category_id?: string;
      summary?: string;
      drive_link?: string;
      column_id: string;
    }) => {
      if (!organization) throw new Error("No org");
      const { data, error } = await supabase
        .from("crm_leads")
        .insert({ ...lead, organization_id: organization.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar lead"),
  });
}

export function useUpdateCrmLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("crm_leads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });
}

export function useMoveCrmLead() {
  const { data: organization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, fromColumnId, toColumnId }: { leadId: string; fromColumnId: string; toColumnId: string }) => {
      if (!organization) throw new Error("No org");
      
      const { error: updateError } = await supabase
        .from("crm_leads")
        .update({ column_id: toColumnId })
        .eq("id", leadId);
      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("crm_lead_history")
        .insert({
          organization_id: organization.id,
          lead_id: leadId,
          from_column_id: fromColumnId,
          to_column_id: toColumnId,
          moved_by: user?.id || null,
        });
      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-lead-history"] });
    },
  });
}

export function useDeleteCrmLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      toast.success("Lead excluído!");
    },
    onError: () => toast.error("Erro ao excluir lead"),
  });
}

export function useCreateCrmColumn() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (col: { name: string; color?: string; sort_order: number }) => {
      if (!organization) throw new Error("No org");
      const { error } = await supabase
        .from("crm_columns")
        .insert({ ...col, organization_id: organization.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-columns"] });
      toast.success("Coluna criada!");
    },
  });
}

export function useUpdateCrmColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; sort_order?: number }) => {
      const { error } = await supabase.from("crm_columns").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-columns"] });
    },
  });
}

export function useDeleteCrmColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-columns"] });
      toast.success("Coluna excluída!");
    },
    onError: () => toast.error("Erro ao excluir coluna. Verifique se não há leads vinculados."),
  });
}

export function useManageCrmLeadTags() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, tagIds }: { leadId: string; tagIds: string[] }) => {
      if (!organization) throw new Error("No org");
      
      // Delete existing
      await supabase.from("crm_lead_tags").delete().eq("lead_id", leadId);
      
      // Insert new
      if (tagIds.length > 0) {
        const { error } = await supabase
          .from("crm_lead_tags")
          .insert(tagIds.map((tag_id) => ({ lead_id: leadId, tag_id, organization_id: organization.id })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    },
  });
}

export function useCreateCrmCategory() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cat: { name: string; sort_order: number }) => {
      if (!organization) throw new Error("No org");
      const { error } = await supabase
        .from("crm_categories")
        .insert({ ...cat, organization_id: organization.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-categories"] });
      toast.success("Categoria criada!");
    },
  });
}

export function useDeleteCrmCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-categories"] });
      toast.success("Categoria excluída!");
    },
  });
}
