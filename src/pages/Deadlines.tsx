import { useState } from "react";
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
import {
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";
import { format, isPast, isToday, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

type DeadlineStatus = "open" | "completed" | "reviewed" | "adjustment_requested";

const statusTabs: { value: DeadlineStatus | "all"; label: string; icon: any }[] = [
  { value: "open", label: "Abertos", icon: Clock },
  { value: "completed", label: "Pendente Conferência", icon: CheckCircle },
  { value: "reviewed", label: "Conferidos", icon: CheckCircle },
  { value: "adjustment_requested", label: "Ajuste Solicitado", icon: AlertTriangle },
];

export default function Deadlines() {
  const { data: organization } = useOrganization();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

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

  const { data: deadlines, isLoading } = useQuery({
    queryKey: [
      "deadlines",
      organization?.id,
      activeTab,
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
          cases:case_id (id, title, cnj_number)
        `
        )
        .order("fatal_due_at", { ascending: true });

      // Status filter
      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      // Responsible filter
      if (filterResponsible && filterResponsible !== "all") {
        query = query.eq("responsible_member_id", filterResponsible);
      }

      // Type filter
      if (filterType && filterType !== "all") {
        query = query.eq("type", filterType);
      }

      // Search filter
      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const getPriorityBadge = (priority: number) => {
    if (priority === 2) {
      return <Badge variant="destructive">Crítica</Badge>;
    }
    if (priority === 1) {
      return <Badge className="bg-warning text-warning-foreground">Alta</Badge>;
    }
    return null;
  };

  const getDateBadge = (fatalDate: string, status: string) => {
    if (status !== "open") return null;

    const fatal = new Date(fatalDate);
    const now = new Date();

    if (isPast(fatal) && !isToday(fatal)) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (isToday(fatal)) {
      return <Badge variant="destructive">Hoje!</Badge>;
    }
    if (isBefore(fatal, addDays(now, 3))) {
      return <Badge className="bg-warning text-warning-foreground">Próximo</Badge>;
    }
    return null;
  };

  const formatDateTime = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Count per status for badges
  const countByStatus = (status: string) => {
    if (!deadlines) return 0;
    return deadlines.filter((d) => d.status === status).length;
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
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Prazo
        </Button>
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
        </CardContent>
      </Card>

      {/* Tabs */}
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
                      <TableRow key={deadline.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{deadline.title}</span>
                            {getPriorityBadge(deadline.priority)}
                            {getDateBadge(deadline.fatal_due_at, deadline.status)}
                          </div>
                          {deadline.type === "interno" && (
                            <span className="text-xs text-muted-foreground">
                              Interno
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {deadline.team_members?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {deadline.cases ? (
                            <Link
                              to={`/cases/${deadline.cases.id}`}
                              className="text-primary hover:underline"
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
                          {deadline.status === "open" && (
                            <Badge variant="outline">Aberto</Badge>
                          )}
                          {deadline.status === "completed" && (
                            <Badge className="bg-accent text-accent-foreground">
                              Concluído
                            </Badge>
                          )}
                          {deadline.status === "reviewed" && (
                            <Badge className="bg-success text-success-foreground">
                              Conferido
                            </Badge>
                          )}
                          {deadline.status === "adjustment_requested" && (
                            <Badge variant="destructive">Ajuste</Badge>
                          )}
                        </TableCell>
                        <TableCell>
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

      {/* Add Dialog */}
      <AddDeadlineDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
