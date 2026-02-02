import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel, Stethoscope, Calendar, ArrowRight, MapPin, User } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function UpcomingEventsCards() {
  const { data: organization } = useOrganization();

  const { data: upcomingHearings, isLoading: loadingHearings } = useQuery({
    queryKey: ["upcoming-hearings", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id, title, start_at, location,
          team_members:responsible_member_id (name),
          cases:case_id (id, title)
        `)
        .eq("event_type", "audiencia")
        .eq("status", "scheduled")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: upcomingExpertises, isLoading: loadingExpertises } = useQuery({
    queryKey: ["upcoming-expertises", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id, title, start_at, location,
          team_members:responsible_member_id (name),
          cases:case_id (id, title)
        `)
        .eq("event_type", "pericia")
        .eq("status", "scheduled")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: upcomingAll, isLoading: loadingAll } = useQuery({
    queryKey: ["upcoming-all", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id, title, start_at, location, event_type,
          team_members:responsible_member_id (name),
          cases:case_id (id, title)
        `)
        .eq("status", "scheduled")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Hoje, ${format(date, "HH:mm")}`;
    if (isTomorrow(date)) return `Amanhã, ${format(date, "HH:mm")}`;
    return format(date, "dd/MM, HH:mm", { locale: ptBR });
  };

  const eventTypeLabels: Record<string, string> = {
    audiencia: "Audiência",
    pericia: "Perícia",
    sessao: "Sessão",
    reuniao: "Reunião",
    diligencia: "Diligência",
    outro: "Outro",
  };

  const renderEventList = (
    events: any[] | undefined, 
    isLoading: boolean, 
    emptyMessage: string,
    icon: React.ReactNode
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (!events || events.length === 0) {
      return (
        <div className="text-center py-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            {icon}
          </div>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {events.map((event) => (
          <div 
            key={event.id} 
            className="flex items-start justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{event.title}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatEventDate(event.start_at)}
                </span>
                {event.team_members?.name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {event.team_members.name}
                  </span>
                )}
              </div>
              {event.cases && (
                <Link 
                  to={`/cases/${event.cases.id}`}
                  className="text-xs text-primary hover:underline truncate block"
                >
                  {event.cases.title}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Próximas Audiências */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
              <Gavel className="h-4 w-4" />
            </div>
            Próximas Audiências
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/agenda?type=audiencia">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {renderEventList(
            upcomingHearings,
            loadingHearings,
            "Nenhuma audiência agendada",
            <Gavel className="h-5 w-5 text-muted-foreground" />
          )}
        </CardContent>
      </Card>

      {/* Próximas Perícias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-100 text-purple-600">
              <Stethoscope className="h-4 w-4" />
            </div>
            Próximas Perícias
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/agenda?type=pericia">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {renderEventList(
            upcomingExpertises,
            loadingExpertises,
            "Nenhuma perícia agendada",
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
          )}
        </CardContent>
      </Card>

      {/* Próximos Compromissos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-100 text-green-600">
              <Calendar className="h-4 w-4" />
            </div>
            Próximos Compromissos
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/agenda">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {renderEventList(
            upcomingAll,
            loadingAll,
            "Nenhum compromisso agendado",
            <Calendar className="h-5 w-5 text-muted-foreground" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
