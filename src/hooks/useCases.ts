import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export interface Case {
  id: string;
  organization_id: string;
  title: string;
  cnj_number: string | null;
  internal_number: string | null;
  original_number: string | null;
  tribunal: string | null;
  court: string | null;
  court_division: string | null;
  state: string | null;
  city: string | null;
  status_id: string | null;
  phase_id: string | null;
  area_id: string | null;
  type_id: string | null;
  claim_value: number | null;
  fee_value: number | null;
  fee_percent: number | null;
  opened_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
  pending_notes: string | null;
  physical_location: string | null;
  link_url: string | null;
  drive_link: string | null;
  responsible_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useCases(onlyActive = true) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["cases", organization?.id, onlyActive],
    queryFn: async () => {
      if (!organization) return [];

      let query = supabase
        .from("cases")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (onlyActive) {
        query = query.is("archived_at", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Case[];
    },
    enabled: !!organization,
  });
}
