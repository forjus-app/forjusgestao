import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { DeadlineTagBadges } from "@/components/deadlines/DeadlineTagBadges";
import { useDeadlineTags, useDeadlineTagLinks } from "@/hooks/useDeadlineTags";
import { ExportDropdown } from "@/components/ExportDropdown";
import { exportToExcel } from "@/lib/exportUtils";
import { exportDeadlinesPDF } from "@/lib/deadlinesPdfExport";
import {
  Plus,
  Gavel,
  Search,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  format,
  isPast,
  isToday,
  addDays,
  startOfDay,
  endOfDay,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";
import { toast } from "sonner";

type DateFunnel = "all" | "overdue" | "today" | "tomorrow" | "week" | "month";

const dateFunnels: { value: DateFunnel; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "overdue", label: "Atrasados" },
  { value: "today", label: "Hoje" },
  { value: "tomorrow", label: "Amanhã" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

export default function CumprimentosSentenca() {
  const { data: organization } = useOrganization();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<"open" | "completed" | "all">("open");
  const [activeFunnel, setActiveFunnel] = useState<DateFunnel>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

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

  const { data: rawItems, isLoading } = useQuery({
    queryKey: ["cumprimentos", organization?.id, activeStatus, filterResponsible, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("deadlines")
        .select(
          `
          *,
          team_members:responsible_member_id (id, name),
          cases:case_id (id, title, cnj_number)
        `
        )
        .eq("deadline_category", "cumprimento_sentenca")
        .order("fatal_due_at", { ascending: true, nullsFirst: false });

      if (activeStatus !== "all") query = query.eq("status", activeStatus);
      if (filterResponsible !== "all")
        query = query.eq("responsible_member_id", filterResponsible);

      const { data, error } = await query;
      if (error) throw error;

      let rows = data || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        rows = rows.filter(
          (d: any) =>
            d.title?.toLowerCase().includes(term) ||
            d.cases?.title?.toLowerCase().includes(term) ||
            d.cases?.cnj_number?.toLowerCase().includes(term)
        );
      }
      return rows;
    },
    enabled: !!organization?.id,
  });

  const items = useMemo(() => {
    let rows = rawItems || [];

    if (filterTag !== "all") {
      rows = rows.filter((d: any) =>
        (tagLinks?.[d.id] || []).some((t) => t.id === filterTag)
      );
    }

    if (activeFunnel !== "all") {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const tomorrowStart = startOfDay(addDays(now, 1));
      const tomorrowEnd = endOfDay(addDays(now, 1));
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const monthEnd = endOfMonth(now);

      rows = rows.filter((d: any) => {
        if (!d.fatal_due_at) return false;
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
    }

    return rows;
  }, [rawItems, filterTag, tagLinks, activeFunnel]);

  const formatDateTime = (date: string | null) =>
    date ? format(parseLocalDateTime(date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";
  const formatDate = (date: string | null) =>
    date ? format(parseLocalDateTime(date), "dd/MM/yyyy", { locale: ptBR }) : "—";

  const getDateBadge = (fatalDate: string | null, status: string) => {
    if (status === "completed" || !fatalDate) return null;
    const fatal = parseLocalDateTime(fatalDate);
    if (isPast(fatal) && !isToday(fatal)) return <Badge variant="destructive">Vencido</Badge>;
    if (isToday(fatal)) return <Badge variant="destructive">Hoje!</Badge>;
    return null;
  };

  const getFiltersLabel = () => {
    const parts: string[] = [];
    if (activeFunnel !== "all")
      parts.push(`Período: ${dateFunnels.find((f) => f.value === activeFunnel)?.label}`);
    if (activeStatus !== "all")
      parts.push(`Status: ${activeStatus === "open" ? "Em aberto" : "Concluídos"}`);
    if (filterResponsible !== "all") {
      const name = teamMembers?.find((m) => m.id === filterResponsible)?.name;
      if (name) parts.push(`Responsável: ${name}`);
    }
    if (filterTag !== "all") {
      const tagName = allTags?.find((t) => t.id === filterTag)?.name;
      if (tagName) parts.push(`Etiqueta: ${tagName}`);
    }
    if (searchTerm) parts.push(`Busca: "${searchTerm}"`);
    return parts.length > 0 ? parts.join(" | ") : "Todos";
  };

  const handleExportPDF = () => {
    if (items.length === 0) {
      toast.error("Nenhum cumprimento para exportar");
      return;
    }
    exportDeadlinesPDF({ deadlines: items, filtersLabel: getFiltersLabel() });
    toast.success("PDF exportado com sucesso!");
  };

  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error("Nenhum cumprimento para exportar");
      return;
    }
    exportToExcel({
      title: "Cumprimentos de Sentença",
      columns: [
        { header: "Prazo Fatal", accessor: (row: any) => formatDateTime(row.fatal_due_at) },
        { header: "Trânsito em Julgado", accessor: (row: any) => formatDate(row.transit_judged_at) },
        { header: "Título", accessor: "title" },
        { header: "Responsável", accessor: (row: any) => row.team_members?.name || "—" },
        { header: "Processo", accessor: (row: any) => row.cases?.title || "—" },
        { header: "CNJ", accessor: (row: any) => row.cases?.cnj_number || "—" },
        { header: "Status", accessor: (row: any) => (row.status === "open" ? "Aberto" : "Concluído") },
        { header: "Observações", accessor: (row: any) => row.notes || "—" },
      ],
      data: items,
      filename: `cumprimentos_sentenca_${format(new Date(), "yyyy-MM-dd")}`,
    });
    toast.success("Excel exportado com sucesso!");
  };

  const copyCnj = (cnj?: string | null) => {
    if (!cnj) {
      toast.error("Processo sem número CNJ");
      return;
    }
    navigator.clipboard.writeText(cnj);
    toast.success("Nº do processo copiado!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cumprimentos de Sentença</h1>
          <p className="text-muted-foreground">
            Lista exclusiva dos prazos de cumprimento de sentença
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            disabled={items.length === 0}
          />
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cumprimento
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, processo ou CNJ..."
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
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[180px]">
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
            <Select
              value={activeStatus}
              onValueChange={(v) => setActiveStatus(v as any)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Em aberto</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {dateFunnels.map((funnel) => (
              <Button
                key={funnel.value}
                variant={activeFunnel === funnel.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFunnel(funnel.value)}
              >
                {funnel.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Cumprimentos de Sentença
            <Badge variant="secondary" className="ml-2">
              {items.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cumprimento de sentença encontrado</p>
              <Button variant="outline" className="mt-4" onClick={() => setAddDialogOpen(true)}>
                Cadastrar cumprimento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Processo / CNJ</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Trânsito</TableHead>
                  <TableHead>Prazo Fatal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedDeadlineId(item.id);
                      setDetailDrawerOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {getDateBadge(item.fatal_due_at, item.status)}
                      </div>
                      <DeadlineTagBadges tags={tagLinks?.[item.id]} max={3} className="mt-1" />
                    </TableCell>
                    <TableCell>
                      {item.cases ? (
                        <div>
                          <Link
                            to={`/cases/${item.cases.id}`}
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.cases.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {item.cases.cnj_number || "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{item.team_members?.name || "—"}</TableCell>
                    <TableCell className="text-sm">{formatDate(item.transit_judged_at)}</TableCell>
                    <TableCell className="text-sm">{formatDateTime(item.fatal_due_at)}</TableCell>
                    <TableCell>
                      {item.status === "open" ? (
                        <Badge variant="outline">Aberto</Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground">Concluído</Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Copiar nº do processo"
                          onClick={() => copyCnj(item.cases?.cnj_number)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {item.drive_link && (
                          <Button variant="ghost" size="icon" title="Abrir Drive" asChild>
                            <a href={item.drive_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <DeadlineActions deadline={item} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddDeadlineDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        defaultCategory="cumprimento_sentenca"
      />
      <DeadlineDetailDrawer
        deadlineId={selectedDeadlineId}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
      />
    </div>
  );
}
