import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Clock, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: organization } = useOrganization();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", organization?.id],
    queryFn: async () => {
      if (!organization) return null;

      const [casesResult, contactsResult, activeResult] = await Promise.all([
        supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id),
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization.id),
        supabase
          .from("cases")
          .select("id, case_statuses!inner(name)", { count: "exact", head: true })
          .eq("organization_id", organization.id)
          .eq("case_statuses.name", "Ativo"),
      ]);

      return {
        totalCases: casesResult.count || 0,
        totalContacts: contactsResult.count || 0,
        activeCases: activeResult.count || 0,
      };
    },
    enabled: !!organization,
  });

  const { data: recentCases } = useQuery({
    queryKey: ["recent-cases", organization?.id],
    queryFn: async () => {
      if (!organization) return [];

      const { data, error } = await supabase
        .from("cases")
        .select(`
          id,
          title,
          cnj_number,
          updated_at,
          case_statuses (name, color)
        `)
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const statCards = [
    {
      title: "Total de Processos",
      value: stats?.totalCases || 0,
      icon: Briefcase,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Processos Ativos",
      value: stats?.activeCases || 0,
      icon: Clock,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Contatos",
      value: stats?.totalContacts || 0,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Este Mês",
      value: "+0",
      icon: TrendingUp,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao {organization?.name || "seu escritório"}
          </p>
        </div>
        <Button asChild>
          <Link to="/cases/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Processo
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Processos Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cases">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!recentCases || recentCases.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum processo cadastrado</p>
              <Button asChild>
                <Link to="/cases/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Processo
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{caseItem.title}</p>
                    {caseItem.cnj_number && (
                      <p className="text-sm text-muted-foreground">
                        {caseItem.cnj_number}
                      </p>
                    )}
                  </div>
                  {caseItem.case_statuses && (
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: `${caseItem.case_statuses.color}20`,
                        color: caseItem.case_statuses.color,
                      }}
                    >
                      {caseItem.case_statuses.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
