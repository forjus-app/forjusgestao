import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export function ExternalCasesCard() {
  const { data: organization } = useOrganization();

  const { data: activeStatuses } = useQuery({
    queryKey: ["external-case-statuses-active", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("external_case_statuses")
        .select("id")
        .eq("organization_id", organization.id)
        .in("name", ["Aberto", "Em andamento", "Aguardando"]);
      if (error) throw error;
      return data.map(s => s.id);
    },
    enabled: !!organization,
  });

  const { data: externalCases, isLoading } = useQuery({
    queryKey: ["external-cases-active", organization?.id, activeStatuses],
    queryFn: async () => {
      if (!organization || !activeStatuses?.length) return [];

      const { data, error } = await supabase
        .from("external_cases")
        .select(`
          id,
          authority_name,
          updated_at,
          external_case_statuses (id, name, color),
          external_case_types (id, name),
          partner_lawyers (id, name),
          contacts:client_contact_id (id, name)
        `)
        .eq("organization_id", organization.id)
        .in("status_id", activeStatuses)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!organization && !!activeStatuses?.length,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Casos Externos em Andamento
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/external-cases">
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {!externalCases || externalCases.length === 0 ? (
          <div className="text-center py-6">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum caso externo em andamento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {externalCases.map((extCase) => (
              <Link
                key={extCase.id}
                to={`/external-cases/${extCase.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{extCase.contacts?.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{extCase.authority_name}</span>
                    <span>•</span>
                    <span>{extCase.partner_lawyers?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {extCase.external_case_statuses && (
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${extCase.external_case_statuses.color}15`,
                        borderColor: `${extCase.external_case_statuses.color}40`,
                        color: extCase.external_case_statuses.color,
                      }}
                    >
                      {extCase.external_case_statuses.name}
                    </Badge>
                  )}
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
