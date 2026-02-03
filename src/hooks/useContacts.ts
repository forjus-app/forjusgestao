import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export interface Contact {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  cpf_cnpj: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useContacts() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["contacts", organization?.id],
    queryFn: async () => {
      if (!organization) return [];

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name");

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!organization,
  });
}
