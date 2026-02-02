import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, MapPin, User, Video } from "lucide-react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddEventDialog } from "@/components/agenda/AddEventDialog";
import { EventActions } from "@/components/agenda/EventActions";

interface CaseAgendaTabProps {
  caseId: string;
}

const eventTypeLabels: Record<string, string> = {
  audiencia: "Audiência",
  pericia: "Perícia",
  sessao: "Sessão",
  reuniao: "Reunião",
  diligencia: "Diligência",
  outro: "Outro",
};

const eventTypeColors: Record<string, string> = {
  audiencia: "bg-blue-500",
  pericia: "bg-purple-500",
  sessao: "bg-indigo-500",
  reuniao: "bg-green-500",
  diligencia: "bg-orange-500",
  outro: "bg-gray-500",
};

export function CaseAgendaTab({ caseId }: CaseAgendaTabProps) {
  const [addEventOpen, setAddEventOpen] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["case-events", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          team_members:responsible_member_id (id, name)
        `)
        .eq("case_id", caseId)
        .order("start_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });

  const getStatusBadge = (status: string, startAt: string) => {
    if (status === "done") {
      return <Badge className="bg-green-500">Realizado</Badge>;
    }
    if (status === "canceled") {
      return <Badge variant="destructive">Cancelado</Badge>;
    }
    if (isPast(new Date(startAt))) {
      return <Badge variant="outline" className="text-destructive border-destructive">Atrasado</Badge>;
    }
    return <Badge variant="outline">Agendado</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agenda do Processo</CardTitle>
          <Button size="sm" onClick={() => setAddEventOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Compromisso
          </Button>
        </CardHeader>
        <CardContent>
          {!events || events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">
                Nenhum compromisso vinculado a este processo
              </p>
              <Button onClick={() => setAddEventOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agendar Compromisso
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-4 rounded-lg border"
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center text-center min-w-[60px]">
                      <span className="text-lg font-bold">
                        {format(new Date(event.start_at), "dd/MM")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.start_at), "HH:mm")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${eventTypeColors[event.event_type]}`} />
                        <span className="text-xs text-muted-foreground uppercase">
                          {eventTypeLabels[event.event_type]}
                        </span>
                        {getStatusBadge(event.status, event.start_at)}
                      </div>
                      <p className="font-medium">{event.title}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {event.team_members?.name || "Sem responsável"}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.online_link && (
                          <a 
                            href={event.online_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Video className="h-3 w-3" />
                            Link online
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <EventActions event={event} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddEventDialog 
        open={addEventOpen} 
        onOpenChange={setAddEventOpen} 
        preselectedCaseId={caseId}
      />
    </>
  );
}
