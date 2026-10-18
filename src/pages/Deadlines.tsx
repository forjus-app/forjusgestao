import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Search,
  LayoutList,
  Columns3,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { DeadlineKanbanView } from "@/components/deadlines/DeadlineKanbanView";
import { format, isPast, isToday, addDays, isBefore, startOfDay, endOfDay, endOfWeek, endOfMonth, startOfMonth, subMonths, isTomorrow, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";
import { toast } from "sonner";
import { ExportDropdown } from "@/components/ExportDropdown";
import { exportToExcel } from "@/lib/exportUtils";
import { exportDeadlinesPDF, exportCompletedDeadlinesPDF } from "@/lib/deadlinesPdfExport";
import { DeadlineTagBadges } from "@/components/deadlines/DeadlineTagBadges";
import { useDeadlineTags, useDeadlineTagLinks } from "@/hooks/useDeadlineTags";
import { useIsMobile } from "@/hooks/use-mobile";

type DeadlineStatus = "open" | "completed";
type DateFunnel = "all" | "overdue" | "today" | "tomorrow" | "week" | "month";

const statusTabs: { value: DeadlineStatus | "all"; label: string; icon: any }[] = [
  { value: "open", label: "Abertos", icon: Clock },
  { value: "completed", label: "Concluídos", icon: CheckCircle },
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
  const isMobile = useIsMobile();
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("open");
  const [activeFunnel, setActiveFunnel] = useState<DateFunnel>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(now, i);
      return { value: format(d, "yyyy-MM"), label: format(d, "MMMM 'de' yyyy", { locale: ptBR }) };
    });
  }, []);
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResponsible, setBulkResponsible] = useState<string>("");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const bulkUpdateResponsible = useMutation({
    mutationFn: async ({ ids, responsibleId }: { ids: string[]; responsibleId: string }) => {
      const { error } = await supabase
        .from("deadlines")
        .update({ responsible_member_id: responsibleId })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Responsável atualizado nos prazos selecionados");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      setSelectedIds([]);
      setBulkResponsible("");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("deadlines").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prazos excluídos");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = (rows: any[]) => {
    const ids = rows.map((r) => r.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])));
  };

  const { data: allTags } = useDeadlineTags();
  const { data: tagLinks } = useDeadlineTagLinks();

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
      viewMode,
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
        .eq("deadline_category", "normal");

      if (viewMode !== "kanban" && activeTab === "completed") {
        query = query.order("completed_at", { ascending: false, nullsFirst: false });
      } else {
        query = query.order("fatal_due_at", { ascending: true });
      }

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

  // Apply tag filter + date funnel filter client-side
  const taggedDeadlines = useMemo(() => {
    if (!rawDeadlines) return rawDeadlines;
    let list = rawDeadlines;
    if (filterTag !== "all") {
      list = list.filter((d: any) => (tagLinks?.[d.id] || []).some((t) => t.id === filterTag));
    }
    if (filterMonth !== "all" && activeTab === "completed") {
      const [y, m] = filterMonth.split("-").map(Number);
      const base = new Date(y, m - 1, 1);
      const start = startOfMonth(base);
      const end = endOfMonth(base);
      list = list.filter((d: any) => {
        if (!d.completed_at) return false;
        const done = parseLocalDateTime(d.completed_at);
        return isWithinInterval(done, { start, end });
      });
    }
    return list;
  }, [rawDeadlines, filterTag, tagLinks, filterMonth, activeTab]);

  const deadlines = useMemo(() => {
    if (!taggedDeadlines || activeFunnel === "all") return taggedDeadlines;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));
    const tomorrowEnd = endOfDay(addDays(now, 1));
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(now);
    const useCompletedDate = activeTab === "completed";

    return taggedDeadlines.filter((d: any) => {
      const baseDate = useCompletedDate ? d.completed_at : d.fatal_due_at;
      if (!baseDate) return false;
      const fatal = parseLocalDateTime(baseDate);
      switch (activeFunnel) {
        case "overdue":
          return !useCompletedDate && d.status === "open" && isPast(fatal) && !isToday(fatal);
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
  }, [taggedDeadlines, activeFunnel, activeTab]);

  // Funnel counts
  const funnelCounts = useMemo(() => {
    if (!taggedDeadlines) return {} as Record<DateFunnel, number>;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrowStart = startOfDay(addDays(now, 1));
    const tomorrowEnd = endOfDay(addDays(now, 1));
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(now);

    const counts: Record<DateFunnel, number> = {
      all: taggedDeadlines.length,
      overdue: 0,
      today: 0,
      tomorrow: 0,
      week: 0,
      month: 0,
    };

    const useCompletedDate = activeTab === "completed";

    taggedDeadlines.forEach((d: any) => {
      const baseDate = useCompletedDate ? d.completed_at : d.fatal_due_at;
      if (!baseDate) return;
      const fatal = parseLocalDateTime(baseDate);
      if (!useCompletedDate && d.status === "open" && isPast(fatal) && !isToday(fatal)) counts.overdue++;
      if (isWithinInterval(fatal, { start: todayStart, end: todayEnd })) counts.today++;
      if (isWithinInterval(fatal, { start: tomorrowStart, end: tomorrowEnd })) counts.tomorrow++;
      if (isWithinInterval(fatal, { start: todayStart, end: endOfDay(weekEnd) })) counts.week++;
      if (isWithinInterval(fatal, { start: todayStart, end: endOfDay(monthEnd) })) counts.month++;
    });

    return counts;
  }, [taggedDeadlines, activeTab]);

  const getPriorityBadge = (priority: number) => {
    if (priority === 2) return <Badge variant="destructive">Crítica</Badge>;
    if (priority === 1) return <Badge className="bg-warning text-warning-foreground">Alta</Badge>;
    return null;
  };

  const getDateBadge = (fatalDate: string | null, status: string) => {
    if (status === "completed" || !fatalDate) return null;
    const fatal = parseLocalDateTime(fatalDate);
    const now = new Date();
    if (isPast(fatal) && !isToday(fatal)) return <Badge variant="destructive">Vencido</Badge>;
    if (isToday(fatal)) return <Badge variant="destructive">Hoje!</Badge>;
    if (isBefore(fatal, addDays(now, 3))) return <Badge className="bg-warning text-warning-foreground">Próximo</Badge>;
    return null;
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "—";
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
    if (filterTag !== "all") {
      const tagName = allTags?.find((t) => t.id === filterTag)?.name;
      if (tagName) parts.push(`Etiqueta: ${tagName}`);
    }
    if (filterMonth !== "all" && activeTab === "completed") {
      const label = monthOptions.find((o) => o.value === filterMonth)?.label;
      if (label) parts.push(`Mês de conclusão: ${label}`);
    }
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
    if (activeTab === "completed" && viewMode === "table") {
      exportCompletedDeadlinesPDF({
        deadlines,
        filtersLabel: getAppliedFiltersLabel(),
      });
    } else {
      exportDeadlinesPDF({
        deadlines,
        filtersLabel: getAppliedFiltersLabel(),
      });
    }
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
        { header: "Prazo Fatal", accessor: (row: any) => row.fatal_due_at ? format(parseLocalDateTime(row.fatal_due_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—" },
        { header: "Trânsito em Julgado", accessor: (row: any) => row.transit_judged_at ? format(parseLocalDateTime(row.transit_judged_at), "dd/MM/yyyy", { locale: ptBR }) : "—" },
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
    <div className="min-w-0 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Prazos</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gerencie prazos processuais e atividades internas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex shrink-0 items-center border rounded-md">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("table")}
              aria-label="Visualização em lista"
              title="Visualização em lista"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("kanban")}
              aria-label="Visualização Kanban"
              title="Visualização Kanban"
            >
              <Columns3 className="h-4 w-4" />
            </Button>
          </div>
          <ExportDropdown
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={!deadlines || deadlines.length === 0}
          />
          <Button className="flex-1 sm:flex-none" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Prazo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="border-y py-4">
        <div>
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-4">
            <div className="min-w-0 sm:min-w-[200px] sm:flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-base sm:text-sm"
                  aria-label="Buscar prazos por título"
                />
              </div>
            </div>
            <Select value={filterResponsible} onValueChange={setFilterResponsible}>
              <SelectTrigger className="w-full min-w-0 sm:w-[200px]" aria-label="Filtrar por responsável">
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
              <SelectTrigger className="w-full min-w-0 sm:w-[150px]" aria-label="Filtrar por tipo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                <SelectItem value="processual">Processual</SelectItem>
                <SelectItem value="interno">Interno</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-full min-w-0 sm:w-[180px]" aria-label="Filtrar por etiqueta">
                <SelectValue placeholder="Etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas etiquetas</SelectItem>
                {allTags?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === "completed" && viewMode === "table" && (
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-full min-w-0 sm:w-[200px]" aria-label="Mês de conclusão">
                  <SelectValue placeholder="Mês de conclusão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {monthOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="capitalize">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date Funnel Chips */}
          {activeTab === "completed" && viewMode === "table" && (
            <p className="text-xs text-muted-foreground mt-4">
              Período filtrado pela data de conclusão
            </p>
          )}
          <div className={`grid grid-cols-3 gap-2 sm:flex sm:flex-wrap ${activeTab === "completed" && viewMode === "table" ? "mt-2" : "mt-4"}`}>
            {dateFunnels.map((funnel) => (
              <Button
                key={funnel.value}
                variant={activeFunnel === funnel.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFunnel(funnel.value)}
                className="min-w-0 gap-1 px-2 sm:gap-1.5 sm:px-3"
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
        </div>
      </div>

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
          <TabsList className="grid w-full grid-cols-2">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 sm:mt-6">
            <Card className="min-w-0 border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm">
              <CardHeader className="px-0 py-3 sm:p-6">
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
              <CardContent className="px-0 sm:px-6">
                {selectedIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-md border bg-muted/40">
                    <span className="text-sm font-medium">
                      {selectedIds.length} selecionado(s)
                    </span>
                    <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
                      <Select value={bulkResponsible} onValueChange={setBulkResponsible}>
                        <SelectTrigger className="h-9 w-full min-w-0 flex-1 sm:w-[220px] sm:flex-none">
                          <SelectValue placeholder="Alterar responsável para..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={!bulkResponsible || bulkUpdateResponsible.isPending}
                        onClick={() =>
                          bulkUpdateResponsible.mutate({
                            ids: selectedIds,
                            responsibleId: bulkResponsible,
                          })
                        }
                      >
                        <UserCog className="h-4 w-4 mr-2" />
                        Aplicar
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setBulkDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  </div>
                )}
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
                ) : isMobile ? (
                  <div className="space-y-3">
                    <label className="flex min-h-10 items-center gap-3 text-sm">
                      <Checkbox
                        checked={deadlines.every((d) => selectedIds.includes(d.id))}
                        onCheckedChange={() => toggleAll(deadlines)}
                        aria-label="Sélectionner tous les prazos"
                      />
                      Selecionar todos
                    </label>
                    {deadlines.map((deadline) => (
                      <Card key={deadline.id} className="min-w-0 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex h-10 shrink-0 items-center justify-center px-1">
                            <Checkbox
                              checked={selectedIds.includes(deadline.id)}
                              onCheckedChange={() => toggleOne(deadline.id)}
                              aria-label={`Selecionar ${deadline.title}`}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            className="h-auto min-h-10 min-w-0 flex-1 justify-start whitespace-normal px-0 py-2 text-left font-semibold hover:bg-transparent"
                            onClick={() => {
                              setSelectedDeadlineId(deadline.id);
                              setDetailDrawerOpen(true);
                            }}
                          >
                            <span className="break-words">{deadline.title}</span>
                          </Button>
                          <div className="shrink-0"><DeadlineActions deadline={deadline} /></div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {getPriorityBadge(deadline.priority)}
                          {getDateBadge(deadline.fatal_due_at, deadline.status)}
                          {deadline.status === "completed" && <Badge className="bg-success text-success-foreground">Concluído</Badge>}
                          {deadline.type === "interno" && <Badge variant="outline">Interno</Badge>}
                        </div>
                        <dl className="mt-3 space-y-2 text-sm">
                          <div><dt className="text-xs text-muted-foreground">Responsável</dt><dd className="break-words">{deadline.team_members?.name || "—"}</dd></div>
                          {deadline.cases && (
                            <div><dt className="text-xs text-muted-foreground">Processo</dt><dd><Link to={`/cases/${deadline.cases.id}`} className="break-words text-primary hover:underline">{deadline.cases.title}</Link></dd></div>
                          )}
                          <div><dt className="text-xs text-muted-foreground">Prazo fatal</dt><dd className="font-medium">{formatDateTime(deadline.fatal_due_at)}</dd></div>
                          {activeTab === "completed" && <div><dt className="text-xs text-muted-foreground">Concluído em</dt><dd>{formatDateTime(deadline.completed_at)}</dd></div>}
                        </dl>
                        <DeadlineTagBadges tags={tagLinks?.[deadline.id]} className="mt-2 flex-wrap" />
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={
                              deadlines.length > 0 &&
                              deadlines.every((d: any) => selectedIds.includes(d.id))
                            }
                            onCheckedChange={() => toggleAll(deadlines)}
                          />
                        </TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Processo</TableHead>
                        <TableHead>Fatal</TableHead>
                        {activeTab === "completed" && <TableHead>Concluído em</TableHead>}
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
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(deadline.id)}
                              onCheckedChange={() => toggleOne(deadline.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{deadline.title}</span>
                              {getPriorityBadge(deadline.priority)}
                              {getDateBadge(deadline.fatal_due_at, deadline.status)}
                            </div>
                            {deadline.type === "interno" && (
                              <span className="text-xs text-muted-foreground">Interno</span>
                            )}
                            <DeadlineTagBadges tags={tagLinks?.[deadline.id]} className="mt-1" />
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
                            {deadline.fatal_due_at
                              ? formatDateTime(deadline.fatal_due_at)
                              : deadline.transit_judged_at
                              ? `Trânsito: ${format(parseLocalDateTime(deadline.transit_judged_at), "dd/MM/yyyy", { locale: ptBR })}`
                              : "—"}
                          </TableCell>
                          {activeTab === "completed" && (
                            <TableCell className="text-sm">
                              {formatDateTime(deadline.completed_at)}
                            </TableCell>
                          )}
                          <TableCell>
                            {deadline.status === "open" && <Badge variant="outline">Aberto</Badge>}
                            {deadline.status === "completed" && (
                              <Badge className="bg-success text-success-foreground">Concluído</Badge>
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
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prazos selecionados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá {selectedIds.length} prazo(s) permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDelete.mutate(selectedIds)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
