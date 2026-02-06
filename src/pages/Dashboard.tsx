import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TodayStatsCards } from "@/components/today/TodayStatsCards";
import { TodayDeadlinesSection } from "@/components/today/TodayDeadlinesSection";
import { TodayAgendaSection } from "@/components/today/TodayAgendaSection";
import { TodaySettlementsSection } from "@/components/today/TodaySettlementsSection";
import {
  useTodayDeadlines,
  useTodayEvents,
  useTodayFollowups,
  useTodayStats,
} from "@/hooks/useTodayData";
import { User } from "lucide-react";

export default function Dashboard() {
  const { data: organization } = useOrganization();
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members-active", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: deadlinesData, isLoading: loadingDeadlines } =
    useTodayDeadlines(responsibleFilter);
  const { data: events = [], isLoading: loadingEvents } =
    useTodayEvents(responsibleFilter);
  const { data: followupsData, isLoading: loadingFollowups } =
    useTodayFollowups(responsibleFilter);
  const { data: stats, isLoading: loadingStats } =
    useTodayStats(responsibleFilter);

  const followupCount =
    (followupsData?.overdue?.length || 0) + (followupsData?.today?.length || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel de Hoje</h1>
          <p className="text-muted-foreground">
            Visão consolidada das suas atividades —{" "}
            {organization?.name || "seu escritório"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select
            value={responsibleFilter}
            onValueChange={setResponsibleFilter}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {teamMembers?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <TodayStatsCards
        stats={stats}
        followupCount={followupCount}
        isLoading={loadingStats || loadingFollowups}
      />

      {/* Prazos Section */}
      <TodayDeadlinesSection
        overdue={deadlinesData?.overdue || []}
        today={deadlinesData?.today || []}
        isLoading={loadingDeadlines}
      />

      {/* Agenda + Acordos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayAgendaSection events={events} isLoading={loadingEvents} />
        <TodaySettlementsSection
          overdue={followupsData?.overdue || []}
          today={followupsData?.today || []}
          isLoading={loadingFollowups}
        />
      </div>
    </div>
  );
}
