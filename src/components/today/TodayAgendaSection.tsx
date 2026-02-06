import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EditEventDialog } from "@/components/agenda/EditEventDialog";
import {
  CalendarDays,
  CheckCircle,
  Pencil,
  User,
  MapPin,
  Video,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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

interface TodayAgendaSectionProps {
  events: any[];
  isLoading: boolean;
}

export function TodayAgendaSection({ events, isLoading }: TodayAgendaSectionProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const [editEvent, setEditEvent] = useState<any | null>(null);

  const markDoneMutation = useMutation({
    mutationFn: async (event: any) => {
      const { error } = await supabase
        .from("events")
        .update({ status: "done" })
        .eq("id", event.id);
      if (error) throw error;

      if (event.case_id && organization?.id) {
        await supabase.from("case_timeline_events").insert({
          organization_id: organization.id,
          case_id: event.case_id,
          event_type: "completion",
          title: `${eventTypeLabels[event.event_type] || "Evento"} realizado`,
          description: event.title,
          occurred_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      toast.success("Compromisso marcado como realizado!");
      queryClient.invalidateQueries({ queryKey: ["today-events"] });
      queryClient.invalidateQueries({ queryKey: ["today-stats"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => toast.error("Erro ao atualizar compromisso"),
  });

  const formatEventDate = (dateStr: string) => {
    const date = parseLocalDateTime(dateStr);
    if (isToday(date)) return `Hoje, ${format(date, "HH:mm")}`;
    if (isTomorrow(date)) return `Amanhã, ${format(date, "HH:mm")}`;
    return format(date, "EEE dd/MM, HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            Agenda — Próximos 7 dias
            {events.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {events.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/agenda">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-6">
              <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum compromisso nos próximos 7 dias
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="flex flex-col items-center justify-center min-w-[50px]">
                      <span className="text-lg font-bold">
                        {format(parseLocalDateTime(event.start_at), "HH:mm")}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {format(parseLocalDateTime(event.start_at), "EEE", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${eventTypeColors[event.event_type] || "bg-gray-500"}`} />
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {eventTypeLabels[event.event_type] || event.event_type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatEventDate(event.start_at)}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                        {event.team_members?.name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.team_members.name}
                          </span>
                        )}
                        {event.cases && (
                          <Link
                            to={`/cases/${event.cases.id}`}
                            className="flex items-center gap-1 text-primary hover:underline truncate max-w-[140px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Briefcase className="h-3 w-3" />
                            {event.cases.title}
                          </Link>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                        {event.online_link && (
                          <a
                            href={event.online_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Video className="h-3 w-3" />
                            Link
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Marcar realizado"
                      onClick={() => markDoneMutation.mutate(event)}
                      disabled={markDoneMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar"
                      onClick={() => setEditEvent(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editEvent && (
        <EditEventDialog
          open={!!editEvent}
          onOpenChange={(open) => !open && setEditEvent(null)}
          event={editEvent}
        />
      )}
    </>
  );
}
