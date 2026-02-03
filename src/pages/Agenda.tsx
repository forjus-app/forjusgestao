import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Calendar,
  List,
  MapPin,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  Video,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddEventDialog } from "@/components/agenda/AddEventDialog";
import { EventActions } from "@/components/agenda/EventActions";
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

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  done: "Realizado",
  canceled: "Cancelado",
};

const periodOptions = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mês" },
  { value: "all", label: "Todos" },
];

export default function Agenda() {
  const { data: organization } = useOrganization();
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("scheduled");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

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

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", organization?.id, filterType, filterStatus, filterResponsible, filterPeriod, search],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`
          *,
          team_members:responsible_member_id (id, name),
          cases:case_id (id, title, cnj_number),
          contacts:contact_id (id, name)
        `)
        .order("start_at", { ascending: true });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (filterType !== "all") {
        query = query.eq("event_type", filterType);
      }

      if (filterResponsible !== "all") {
        query = query.eq("responsible_member_id", filterResponsible);
      }

      // Period filter
      const now = new Date();
      if (filterPeriod === "today") {
        query = query.gte("start_at", startOfDay(now).toISOString())
          .lte("start_at", endOfDay(now).toISOString());
      } else if (filterPeriod === "week") {
        query = query.gte("start_at", startOfWeek(now, { locale: ptBR }).toISOString())
          .lte("start_at", endOfWeek(now, { locale: ptBR }).toISOString());
      } else if (filterPeriod === "month") {
        query = query.gte("start_at", startOfMonth(now).toISOString())
          .lte("start_at", endOfMonth(now).toISOString());
      }

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Helper to parse datetime preserving local time
  const parseLocalDateTime = (dateStr: string) => {
    // For datetime strings from datetime-local input stored without timezone
    // we need to treat them as local time, not UTC
    if (dateStr.includes("T") && !dateStr.includes("Z") && !dateStr.includes("+")) {
      // Already local format like "2025-02-03T14:00"
      return parseISO(dateStr);
    }
    // For ISO strings with Z or offset, parse normally
    return new Date(dateStr);
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseLocalDateTime(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const getStatusBadge = (status: string, startAt: string) => {
    if (status === "done") {
      return <Badge className="bg-green-500">Realizado</Badge>;
    }
    if (status === "canceled") {
      return <Badge variant="destructive">Cancelado</Badge>;
    }
    if (isPast(parseLocalDateTime(startAt))) {
      return <Badge variant="outline" className="text-destructive border-destructive">Atrasado</Badge>;
    }
    return <Badge variant="outline">Agendado</Badge>;
  };

  // Group events by date
  const groupedEvents = events?.reduce((groups: Record<string, typeof events>, event) => {
    const dateKey = format(parseLocalDateTime(event.start_at), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda Jurídica</h1>
          <p className="text-muted-foreground">
            Gerencie audiências, perícias e compromissos
          </p>
        </div>
        <Button onClick={() => setAddEventOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Compromisso
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar compromisso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
                <SelectItem value="done">Realizados</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterResponsible} onValueChange={setFilterResponsible}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("calendar")}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium mb-2">Nenhum compromisso encontrado</p>
            <p className="text-muted-foreground mb-4">
              {filterStatus === "scheduled" 
                ? "Agende sua primeira audiência ou compromisso"
                : "Nenhum evento corresponde aos filtros selecionados"}
            </p>
            <Button onClick={() => setAddEventOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Compromisso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedEvents && Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {getDateLabel(dateKey)}
              </h3>
              <div className="space-y-3">
                {(dayEvents as any[]).map((event) => (
                  <Card key={event.id} className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center text-center min-w-[60px]">
                            <span className="text-2xl font-bold">
                              {format(parseLocalDateTime(event.start_at), "HH:mm")}
                            </span>
                            {event.end_at && (
                              <span className="text-xs text-muted-foreground">
                                até {format(parseLocalDateTime(event.end_at), "HH:mm")}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${eventTypeColors[event.event_type]}`} />
                              <span className="text-xs text-muted-foreground uppercase">
                                {eventTypeLabels[event.event_type]}
                              </span>
                              {getStatusBadge(event.status, event.start_at)}
                            </div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.team_members?.name || "Sem responsável"}
                              </div>
                              {event.cases && (
                                <Link 
                                  to={`/cases/${event.cases.id}`}
                                  className="flex items-center gap-1 hover:text-primary"
                                >
                                  <Briefcase className="h-3 w-3" />
                                  {event.cases.title}
                                </Link>
                              )}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEventDialog open={addEventOpen} onOpenChange={setAddEventOpen} />
    </div>
  );
}
