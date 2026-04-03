import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  completed: boolean;
}

export function useOnboarding() {
  const { data: organization } = useOrganization();

  return useQuery({
    queryKey: ["onboarding", organization?.id],
    queryFn: async () => {
      if (!organization) return null;

      const [teamRes, contactsRes, casesRes, deadlinesRes] = await Promise.all([
        supabase.from("team_members").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
        supabase.from("cases").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
        supabase.from("deadlines").select("id", { count: "exact", head: true }).eq("organization_id", organization.id),
      ]);

      const hasTeam = (teamRes.count ?? 0) > 0;
      const hasContacts = (contactsRes.count ?? 0) > 0;
      const hasCases = (casesRes.count ?? 0) > 0;
      const hasDeadlines = (deadlinesRes.count ?? 0) > 0;

      const steps: OnboardingStep[] = [
        {
          key: "team",
          label: "Cadastrar membro da equipe",
          description: "Adicione os advogados e colaboradores do escritório",
          href: "/team",
          completed: hasTeam,
        },
        {
          key: "contact",
          label: "Cadastrar primeiro contato",
          description: "Adicione um cliente ou parte interessada",
          href: "/contacts",
          completed: hasContacts,
        },
        {
          key: "case",
          label: "Cadastrar primeiro processo",
          description: "Registre um processo judicial para acompanhamento",
          href: "/cases/new",
          completed: hasCases,
        },
        {
          key: "deadline",
          label: "Criar primeiro prazo",
          description: "Cadastre um prazo para não perder nenhuma data",
          href: "/deadlines",
          completed: hasDeadlines,
        },
      ];

      const completedCount = steps.filter((s) => s.completed).length;
      const allCompleted = completedCount === steps.length;

      return { steps, completedCount, totalSteps: steps.length, allCompleted };
    },
    enabled: !!organization,
  });
}
