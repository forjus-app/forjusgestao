import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export interface TeamMember {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTeamMembers(onlyActive = true) {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["team-members", organization?.id, onlyActive],
    queryFn: async () => {
      if (!organization) return [];

      let query = supabase
        .from("team_members")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name");

      if (onlyActive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!organization,
  });
}
