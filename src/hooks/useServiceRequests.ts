import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export const SERVICE_TYPES = [
  { value: "peticao_inicial", label: "Petição Inicial" },
  { value: "recurso", label: "Recurso" },
  { value: "manifestacao", label: "Manifestação" },
  { value: "cumprimento", label: "Cumprimento de Sentença" },
  { value: "outro", label: "Outro" },
] as const;

export const SERVICE_STATUSES = [
  { value: "new", label: "Nova", color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "Em andamento", color: "bg-yellow-100 text-yellow-800" },
  { value: "waiting_client", label: "Aguardando cliente", color: "bg-orange-100 text-orange-800" },
  { value: "ready_to_file", label: "Pronta p/ protocolar", color: "bg-green-100 text-green-800" },
  { value: "filed", label: "Protocolada", color: "bg-gray-100 text-gray-800" },
  { value: "canceled", label: "Cancelada", color: "bg-red-100 text-red-800" },
  { value: "archived", label: "Arquivada", color: "bg-gray-100 text-gray-600" },
] as const;

export const PRIORITIES = [
  { value: 0, label: "Normal" },
  { value: 1, label: "Alta" },
  { value: 2, label: "Urgente" },
] as const;

export function useServiceRequests() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["service-requests", organization?.id],
    queryFn: async () => {
      if (!organization) return [];

      const { data, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          team_members:assigned_member_id (id, name),
          client:client_contact_id (id, name),
          related:related_contact_id (id, name),
          cases:case_id (id, title, cnj_number)
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });
}

export function useServiceRequest(id: string | undefined) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["service-request", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          team_members:assigned_member_id (id, name),
          client:client_contact_id (id, name),
          related:related_contact_id (id, name),
          cases:case_id (id, title, cnj_number)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!organization,
  });
}

export function getStatusInfo(status: string) {
  return SERVICE_STATUSES.find((s) => s.value === status) || SERVICE_STATUSES[0];
}

export function getServiceTypeLabel(type: string) {
  return SERVICE_TYPES.find((t) => t.value === type)?.label || type;
}

export function getPriorityLabel(priority: number) {
  return PRIORITIES.find((p) => p.value === priority)?.label || "Normal";
}
