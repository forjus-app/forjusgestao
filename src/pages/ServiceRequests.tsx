import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization, useProfile } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Plus, Search, Users, UserCheck } from "lucide-react";
import { format, differenceInCalendarDays, isAfter, subDays, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  PETICAO_STATUSES,
  getPeticaoStatus,
  normalizeStatus,
  usePeticoes,
  useUpdatePeticao,
  useDeletePeticao,
  ACTION_TYPES,
  type Peticao,
} from "@/hooks/usePeticoes";
import { PeticaoCard } from "@/components/peticoes/PeticaoCard";
import { AddPeticaoDialog } from "@/components/peticoes/AddPeticaoDialog";
import { PeticaoDetailDrawer } from "@/components/peticoes/PeticaoDetailDrawer";
import { ProtocolarDialog } from "@/components/peticoes/ProtocolarDialog";
import { ManageResponsaveisDialog } from "@/components/peticoes/ManageResponsaveisDialog";

function useKanbanMembers() {
  const { data: organization } = useOrganization();
  return useQuery({
    queryKey: ["peticao-members", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, is_active, show_in_kanban")
        .eq("organization_id", organization.id)
        .order("name");
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!organization,
  });
}

export default function ServiceRequests() {
  const { data: peticoes } = usePeticoes();
  const { data: allMembers } = useKanbanMembers();
  const { data: profile } = useProfile();
  const update = useUpdatePeticao();
  const remove = useDeletePeticao();

  const [addOpen, setAddOpen] = useState(false);
  const [addMemberId, setAddMemberId] = useState<string | undefined>();
  const [detail, setDetail] = useState<Peticao | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [fileTarget, setFileTarget] = useState<Peticao | null>(null);
  const [fileOpen, setFileOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [sortBy, setSortBy] = useState("oldest");

  // drag state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const counters = useRef<Record<string, number>>({});
  const [transfer, setTransfer] = useState<{ peticao: Peticao; toId: string } | null>(null);

  const members = (allMembers || []).filter((m) => m.is_active);
  const columnMembers = members.filter((m) => m.show_in_kanban !== false);
  const myMemberId = useMemo(() => {
    if (!profile?.full_name) return null;
    return members.find((m) => m.name.toLowerCase() === profile.full_name!.toLowerCase())?.id ?? null;
  }, [members, profile]);

  const open = (peticoes || []).filter((p) => normalizeStatus(p.status) !== "filed");
  const filed = (peticoes || []).filter((p) => normalizeStatus(p.status) === "filed");

  const applyFilters = (list: Peticao[]) =>
    list.filter((p) => {
      if (search) {
        const s = search.toLowerCase();
        const memberName = p.team_members?.name?.toLowerCase() || "";
        if (
          !(p.client_name || p.title || "").toLowerCase().includes(s) &&
          !(p.action_type || "").toLowerCase().includes(s) &&
          !memberName.includes(s)
        )
          return false;
      }
      if (filterStatus !== "all" && normalizeStatus(p.status) !== filterStatus) return false;
      if (filterMember !== "all" && p.assigned_member_id !== filterMember) return false;
      if (filterType !== "all" && (p.action_type || "") !== filterType) return false;
      if (onlyMine && myMemberId && p.assigned_member_id !== myMemberId) return false;
      if (filterPeriod !== "all") {
        const created = new Date(p.created_at);
        const days = filterPeriod === "7" ? 7 : filterPeriod === "30" ? 30 : 90;
        if (!isAfter(created, subDays(new Date(), days))) return false;
      }
      return true;
    });

  const filteredOpen = applyFilters(open);
  const filteredFiled = applyFilters(filed);

  const sortList = (list: Peticao[]) => {
    const copy = [...list];
    if (sortBy === "oldest") copy.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sortBy === "newest") copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sortBy === "client")
      copy.sort((a, b) => (a.client_name || a.title || "").localeCompare(b.client_name || b.title || ""));
    if (sortBy === "status")
      copy.sort((a, b) =>
        PETICAO_STATUSES.findIndex((s) => s.value === normalizeStatus(a.status)) -
        PETICAO_STATUSES.findIndex((s) => s.value === normalizeStatus(b.status))
      );
    return copy;
  };

  // Indicators
  const stats = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const filedThisMonth = filed.filter((p) => p.filed_at && isAfter(new Date(p.filed_at), monthStart));
    const durations = filed
      .filter((p) => p.filed_at)
      .map((p) => differenceInCalendarDays(new Date(p.filed_at!), new Date(p.created_at)));
    const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
    return {
      openCount: open.length,
      drafting: open.filter((p) => normalizeStatus(p.status) === "drafting").length,
      review: open.filter((p) => normalizeStatus(p.status) === "review").length,
      ready: open.filter((p) => normalizeStatus(p.status) === "ready").length,
      filedMonth: filedThisMonth.length,
      avg,
    };
  }, [open, filed]);

  const actionTypeOptions = useMemo(() => {
    const set = new Set<string>(ACTION_TYPES);
    (peticoes || []).forEach((p) => p.action_type && set.add(p.action_type));
    return Array.from(set).sort();
  }, [peticoes]);

  const handleDrop = useCallback(
    (toMemberId: string) => {
      const p = (peticoes || []).find((x) => x.id === dragId);
      if (p && dragFrom && dragFrom !== toMemberId) setTransfer({ peticao: p, toId: toMemberId });
      setDragId(null);
      setDragFrom(null);
      setDragOver(null);
      counters.current = {};
    },
    [dragId, dragFrom, peticoes]
  );

  const confirmTransfer = () => {
    if (!transfer) return;
    const from = members.find((m) => m.id === transfer.peticao.assigned_member_id)?.name || "—";
    const to = members.find((m) => m.id === transfer.toId)?.name || "—";
    update.mutate({
      id: transfer.peticao.id,
      values: { assigned_member_id: transfer.toId },
      logs: [{ eventType: "transfer", description: `Ação transferida de ${from} para ${to}.` }],
    });
    setTransfer(null);
  };

  const changeStatus = (p: Peticao, status: string) => {
    update.mutate({
      id: p.id,
      values: { status },
      logs: [{ eventType: "status", description: `Status alterado para ${getPeticaoStatus(status).label}.` }],
    });
  };

  const openFileDialog = (p: Peticao) => {
    setFileTarget(p);
    setFileOpen(true);
  };

  const indicators = [
    { label: "Iniciais abertas", value: stats.openCount },
    { label: "Em elaboração", value: stats.drafting },
    { label: "Em revisão", value: stats.review },
    { label: "Prontas p/ protocolo", value: stats.ready },
    { label: "Protocoladas no mês", value: stats.filedMonth },
    { label: "Tempo médio p/ protocolo", value: stats.avg === null ? "—" : `${stats.avg}d` },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Petição Inicial</h1>
          <p className="text-sm text-muted-foreground">Distribuição e acompanhamento das ações iniciais</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
            <Users className="h-4 w-4 mr-1" /> Responsáveis
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setAddMemberId(undefined);
              setAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Nova Ação
          </Button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {indicators.map((i) => (
          <div key={i.label} className="rounded-md border bg-card px-3 py-2">
            <p className="text-[11px] text-muted-foreground leading-tight">{i.label}</p>
            <p className="text-lg font-semibold leading-tight">{i.value}</p>
          </div>
        ))}
      </div>

      {/* Busca e filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ação..."
            className="pl-9"
          />
        </div>
        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos responsáveis</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {PETICAO_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {actionTypeOptions.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer período</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="oldest">Mais antigas primeiro</SelectItem>
            <SelectItem value="newest">Mais recentes primeiro</SelectItem>
            <SelectItem value="client">Cliente (A-Z)</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={onlyMine ? "default" : "outline"}
          size="sm"
          onClick={() => setOnlyMine((v) => !v)}
          disabled={!myMemberId}
          title={myMemberId ? "" : "Seu nome não corresponde a um responsável cadastrado"}
        >
          <UserCheck className="h-4 w-4 mr-1" /> Somente minhas ações
        </Button>
      </div>

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <TabsList className="self-start mb-3">
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="filed">Protocoladas / Concluídas ({filed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="flex-1 mt-0">
          {columnMembers.length === 0 ? (
            <div className="border rounded-lg py-16 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Nenhum responsável exibido no Kanban.</p>
              <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
                <Users className="h-4 w-4 mr-1" /> Cadastrar responsáveis
              </Button>
            </div>
          ) : (
            <ScrollArea className="-mx-2">
              <div className="flex gap-3 px-2 pb-4">
                {columnMembers.map((m) => {
                  const list = sortList(filteredOpen.filter((p) => p.assigned_member_id === m.id));
                  const isOver = dragOver === m.id;
                  const canDrop = !!dragId && dragFrom !== m.id;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex-shrink-0 w-[270px] flex flex-col rounded-lg border transition-colors",
                        isOver ? "bg-primary/5 border-primary/40" : canDrop ? "border-dashed" : "bg-muted/30"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDragEnter={() => {
                        counters.current[m.id] = (counters.current[m.id] || 0) + 1;
                        setDragOver(m.id);
                      }}
                      onDragLeave={() => {
                        counters.current[m.id] = (counters.current[m.id] || 0) - 1;
                        if (counters.current[m.id] <= 0) {
                          counters.current[m.id] = 0;
                          setDragOver((prev) => (prev === m.id ? null : prev));
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(m.id);
                      }}
                    >
                      <div className="flex items-center justify-between px-3 py-2.5 border-b">
                        <h3 className="text-xs font-semibold uppercase tracking-wide">{m.name}</h3>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="h-5 text-[10px] min-w-[20px] justify-center">
                            {list.length}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setAddMemberId(m.id);
                              setAddOpen(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-380px)] min-h-[120px]">
                        {list.length === 0 && (
                          <p className="text-center text-xs text-muted-foreground/50 py-8">
                            {isOver ? "Soltar aqui" : "Nenhuma ação"}
                          </p>
                        )}
                        {list.map((p) => (
                          <PeticaoCard
                            key={p.id}
                            peticao={p}
                            members={members}
                            isDragging={dragId === p.id}
                            onOpen={() => {
                              setDetail(p);
                              setDetailOpen(true);
                            }}
                            onStatusChange={(s) => changeStatus(p, s)}
                            onTransfer={(toId) => setTransfer({ peticao: p, toId })}
                            onDelete={() => remove.mutate(p.id)}
                            onFile={() => openFileDialog(p)}
                            onDragStart={(e) => {
                              setDragId(p.id);
                              setDragFrom(p.assigned_member_id);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", p.id);
                            }}
                            onDragEnd={() => {
                              setDragId(null);
                              setDragFrom(null);
                              setDragOver(null);
                              counters.current = {};
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="filed" className="mt-0">
          <div className="border rounded-lg">
            {filteredFiled.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">Nenhuma ação protocolada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Criada</TableHead>
                    <TableHead>Protocolada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortList(filteredFiled).map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setDetail(p);
                        setDetailOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{p.client_name || p.title}</TableCell>
                      <TableCell>{p.action_type || "—"}</TableCell>
                      <TableCell>{p.team_members?.name || "—"}</TableCell>
                      <TableCell className="text-xs">{p.process_number || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {p.filed_at ? format(new Date(p.filed_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AddPeticaoDialog open={addOpen} onOpenChange={setAddOpen} members={members} defaultMemberId={addMemberId} />
      <PeticaoDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        peticao={detail}
        members={members}
        onFile={() => detail && openFileDialog(detail)}
      />
      <ProtocolarDialog open={fileOpen} onOpenChange={setFileOpen} peticao={fileTarget} />
      <ManageResponsaveisDialog open={manageOpen} onOpenChange={setManageOpen} members={allMembers || []} />

      <AlertDialog open={!!transfer} onOpenChange={(o) => !o && setTransfer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transferir ação</AlertDialogTitle>
            <AlertDialogDescription>
              {transfer &&
                `Deseja transferir esta ação de ${
                  members.find((m) => m.id === transfer.peticao.assigned_member_id)?.name || "—"
                } para ${members.find((m) => m.id === transfer.toId)?.name || "—"}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTransfer}>Transferir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
