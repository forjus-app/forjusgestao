import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddDeadlineDialog } from "@/components/deadlines/AddDeadlineDialog";
import { DeadlineActions } from "@/components/deadlines/DeadlineActions";
import { DeadlineDetailDrawer } from "@/components/deadlines/DeadlineDetailDrawer";
import {
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  LayoutList,
  Columns3,
} from "lucide-react";
import { DeadlineKanbanView } from "@/components/deadlines/DeadlineKanbanView";
import { format, isPast, isToday, addDays, isBefore, startOfDay, endOfDay, endOfWeek, endOfMonth, isTomorrow, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";
import { toast } from "sonner";
import { ExportDropdown } from "@/components/ExportDropdown";
import { exportToExcel } from "@/lib/exportUtils";
import { exportDeadlinesPDF } from "@/lib/deadlinesPdfExport";

type DeadlineStatus = "open" | "completed" | "reviewed" | "adjustment_requested";
type DateFunnel = "all" | "overdue" | "today" | "tomorrow" | "week" | "month";

const statusTabs: { value: DeadlineStatus | "all"; label: string; icon: any }[] = [
  { value: "open", label: "Abertos", icon: Clock },
  { value: "completed", label: "Pendente Conferência", icon: CheckCircle },
  { value: "reviewed", label: "Conferidos", icon: CheckCircle },
  { value: "adjustment_requested", label: "Ajuste Solicitado", icon: AlertTriangle },
];

const dateFunnels: { value: DateFunnel; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "overdue", label: "Atrasados" },
  { value: "today", label: "Hoje" },
  { value: "tomorrow", label: "Amanhã" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export default function Deadlines() {
  const { data: organization } = useOrganization();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("open");
  const [activeFunnel, setActiveFunnel] = useState<DateFunnel>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

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

  const { data: rawDeadlines, isLoading } = useQuery({
    queryKey: [
      "deadlines",
      organization?.id,
      viewMode === "kanban" ? "all" : activeTab,
      filterResponsible,
      filterType,
      searchTerm,
    ],
    queryFn: async () => {
      let query = supabase
        .from("deadlines")
        .select(
          `
          *,
          team_members:responsible_member_id (id, name),
          cases:case_id (id, title, cnj_number, case_parties (is_primary_client, contacts (name)))
        `
        )
        .order("fatal_due_at", { ascending: true });

      if (viewMode !== "kanban" && activeTab !== "all") {
        query = query.eq("status", activeTab);
      }
      if (filterResponsible && filterResponsible !== "all") {
        query = query.eq("responsible_member_id", filterResponsible);
      }
      if (filterType && filterType !== "all") {
        query = query.eq("type", filterType);
      }
      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Apply date funnel filter client-side
  const deadlines = useMemo(() => {
    if (!rawDeadlines || activeFunnel === "all") return rawDeadlines;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));
    const tomorrowEnd = endOfDay(addDays(now, 1));
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(now);

    return rawDeadlines.filter((d) => {
      const fatal = parseLocalDateTime(d.fatal_due_at);
      switch (activeFunnel) {
        case "overdue":
          return d.status === "open" && isPast(fatal) && !isToday(fatal);
        case "today":
          return isWithinInterval(fatal, { start: todayStart, end: todayEnd });
        case "tomorrow":
          return isWithinInterval(fatal, { start: tomorrowStart, end: tomorrowEnd });
        case "week":
          return isWithinInterval(fatal, { start: todayStart, end: endOfDay(weekEnd) });
        case "month":
          return isWithinInterval(fatal, { start: todayStart, end: endOfDay(monthEnd) });
        default:
          return true;
      }
    });
  }, [rawDeadlines, activeFunnel]);

  // Funnel counts
  const funnelCounts = useMemo(() => {
    if (!rawDeadlines) return {} as Record<DateFunnel, number>;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));
    const tomorrowEnd = endOfDay(addDays(now, 1));
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(now);

    const counts: Record<DateFunnel, number> = {
      all: rawDeadlines.length,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      week: 0,
      month: 0,
    };

    rawDeadlines.forEach((d) => {
      const fatal = parseLocalDateTime(d.fatal_due_at);
      if (d.status === "open" && isPast(fatal) && !isToday(fatal)) counts.overdue++;
      if (isWithinInterval(fatal, { start: todayStart, end: todayEnd })) counts.today++;
      if (isWithinInterval(fatal, { start: tomorrowStart, end: tomorrowEnd })) counts.tomorrow++;
      if (isWithinInterval(fatal, { start: todayStart, end: endOfDay(weekEnd) })) counts.week++;
      if (isWithinInterval(fatal, { start: todayStart, end: endOfDay(monthEnd) })) counts.month++;
    });

    return counts;
  }, [rawDeadlines]);

  const getPriorityBadge = (priority: number) => {
    if (priority === 2) return <Badge variant="destructive">Crítica</Badge>;
    if (priority === 1) return <Badge className="bg-warning text-warning-foreground">Alta</Badge>;
    return null;
  };

  const getDateBadge = (fatalDate: string, status: string) => {
    if (status !== "open") return null;
    const fatal = parseLocalDateTime(fatalDate);
    const now = new Date();
    if (isPast(fatal) && !isToday(fatal)) return <Badge variant="destructive">Vencido</Badge>;
    if (isToday(fatal)) return <Badge variant="destructive">Hoje!</Badge>;
    if (isBefore(fatal, addDays(now, 3))) return <Badge className="bg-warning text-warning-foreground">Próximo</Badge>;
    return null;
  };

  const formatDateTime = (date: string) => {
    return format(parseLocalDateTime(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getAppliedFiltersLabel = () => {
    const parts: string[] = [];
    const funnelLabel = dateFunnels.find(f => f.value === activeFunnel)?.label;
    if (funnelLabel && activeFunnel !== "all") parts.push(`Período: ${funnelLabel}`);
    const statusLabel = statusTabs.find(t => t.value === activeTab)?.label;
    if (statusLabel && activeTab !== "all") parts.push(`Status: ${statusLabel}`);
    if (filterResponsible !== "all") {
      const name = teamMembers?.find(m => m.id === filterResponsible)?.name;
      if (name) parts.push(`Responsável: ${name}`);
    }
    if (filterType !== "all") parts.push(`Tipo: ${filterType === "processual" ? "Processual" : "Interno"}`);
    if (searchTerm) parts.push(`Busca: "${searchTerm}"`);
    return parts.length > 0 ? parts.join(" | ") : "Todos";
  };

  const getClientName = (deadline: any): string => {
    if (!deadline.cases?.case_parties) return "—";
    const primary = deadline.cases.case_parties.find((p: any) => p.is_primary_client);
    return primary?.contacts?.name || "—";
  };

  const handleExportPDF = () => {
    if (!deadlines || deadlines.length === 0) {
      toast.error("Nenhum prazo para exportar");
      return;
    }
    exportDeadlinesPDF({
      deadlines,
      filtersLabel: getAppliedFiltersLabel(),
    });
    toast.success("PDF exportado com sucesso!");
  };

  const handleExportExcel = () => {
    if (!deadlines || deadlines.length === 0) {
      toast.error("Nenhum prazo para exportar");
      return;
    }
    exportToExcel({
      title: "Prazos",
      columns: [
        { header: "Prazo Fatal", accessor: (row: any) => format(parseLocalDateTime(row.fatal_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) },
        { header: "Entrega", accessor: (row: any) => format(parseLocalDateTime(row.delivery_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) },
        { header: "Título", accessor: "title" },
        { header: "Responsável", accessor: (row: any) => row.team_members?.name || "—" },
        { header: "Processo", accessor: (row: any) => row.cases?.title || "—" },
        { header: "CNJ", accessor: (row: any) => row.cases?.cnj_number || "—" },
        { header: "Cliente", accessor: (row: any) => getClientName(row) },
        { header: "Tipo", accessor: (row: any) => row.type === "processual" ? "Processual" : "Interno" },
        { header: "Prioridade", accessor: (row: any) => row.priority === 2 ? "Crítica" : row.priority === 1 ? "Alta" : "Normal" },
        { header: "Observações", accessor: (row: any) => row.notes || "—" },
        { header: "Link Drive", accessor: (row: any) => row.drive_link || "—" },
      ],
      data: deadlines,
      filename: `prazos_${format(new Date(), "yyyy-MM-dd")}`,
    });
    toast.success("Excel exportado com sucesso!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prazos</h1>
          <p className="text-muted-foreground">
            Gerencie prazos processuais e atividades internas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("table")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("kanban")}
            >
              <Columns3 className="h-4 w-4" />
            </Button>
          </div>
          <ExportDropdown
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={!deadlines || deadlines.length === 0}
          />
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Prazo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterResponsible} onValueChange={setFilterResponsible}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos responsáveis</SelectItem>
                {teamMembers?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                <SelectItem value="processual">Processual</SelectItem>
                <SelectItem value="interno">Interno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Funnel Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {dateFunnels.map((funnel) => (
              <Button
                key={funnel.value}
                variant={activeFunnel === funnel.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFunnel(funnel.value)}
                className="gap-1.5"
              >
                {funnel.label}
                {funnelCounts[funnel.value] !== undefined && (
                  <Badge
                    variant={activeFunnel === funnel.value ? "secondary" : "outline"}
                    className="ml-1 text-[10px] px-1.5 py-0 h-5 min-w-[20px] justify-center"
                  >
                    {funnelCounts[funnel.value]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban or Table View */}
      {viewMode === "kanban" ? (
        isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : !deadlines || deadlines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum prazo encontrado</p>
          </div>
        ) : (
          <DeadlineKanbanView
            deadlines={deadlines}
            onDeadlineClick={(id) => {
              setSelectedDeadlineId(id);
              setDetailDrawerOpen(true);
            }}
          />
        )
      ) : (
        /* Table View with Status Tabs */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {statusTabs.find((t) => t.value === activeTab)?.label || "Prazos"}
                  {deadlines && (
                    <Badge variant="secondary" className="ml-2">
                      {deadlines.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </div>
                ) : !deadlines || deadlines.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum prazo encontrado</p>
                    {activeTab === "open" && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        Criar primeiro prazo
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Processo</TableHead>
                        <TableHead>Entrega</TableHead>
                        <TableHead>Fatal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deadlines.map((deadline) => (
                        <TableRow
                          key={deadline.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedDeadlineId(deadline.id);
                            setDetailDrawerOpen(true);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{deadline.title}</span>
                              {getPriorityBadge(deadline.priority)}
                              {getDateBadge(deadline.fatal_due_at, deadline.status)}
                            </div>
                            {deadline.type === "interno" && (
                              <span className="text-xs text-muted-foreground">Interno</span>
                            )}
                          </TableCell>
                          <TableCell>{deadline.team_members?.name || "-"}</TableCell>
                          <TableCell>
                            {deadline.cases ? (
                              <Link
                                to={`/cases/${deadline.cases.id}`}
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {deadline.cases.title}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(deadline.delivery_due_at)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatDateTime(deadline.fatal_due_at)}
                          </TableCell>
                          <TableCell>
                            {deadline.status === "open" && <Badge variant="outline">Aberto</Badge>}
                            {deadline.status === "completed" && (
                              <Badge className="bg-accent text-accent-foreground">Concluído</Badge>
                            )}
                            {deadline.status === "reviewed" && (
                              <Badge className="bg-success text-success-foreground">Conferido</Badge>
                            )}
                            {deadline.status === "adjustment_requested" && (
                              <Badge variant="destructive">Ajuste</Badge>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DeadlineActions deadline={deadline} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <AddDeadlineDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <DeadlineDetailDrawer
        deadlineId={selectedDeadlineId}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
      />
    </div>
  );
}
