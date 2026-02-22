import { useState } from "react";
import { Link } from "react-router-dom";
import { useServiceRequests, SERVICE_STATUSES, SERVICE_TYPES, PRIORITIES, getStatusInfo, getServiceTypeLabel, getPriorityLabel } from "@/hooks/useServiceRequests";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, AlertTriangle, Flame } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddServiceRequestDialog } from "@/components/service-requests/AddServiceRequestDialog";

export default function ServiceRequests() {
  const { data: requests, isLoading } = useServiceRequests();
  const { data: members } = useTeamMembers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMember, setFilterMember] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const filtered = (requests || []).filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterMember !== "all" && r.assigned_member_id !== filterMember) return false;
    if (filterType !== "all" && r.service_type !== filterType) return false;
    return true;
  });

  const PriorityIcon = ({ priority }: { priority: number }) => {
    if (priority === 2) return <Flame className="h-4 w-4 text-destructive" />;
    if (priority === 1) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Petições Novas</h1>
          <p className="text-muted-foreground">Gerencie petições iniciais e serviços pendentes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Petição
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {SERVICE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMember} onValueChange={setFilterMember}>
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {members?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {SERVICE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma petição encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const status = getStatusInfo(r.status);
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => window.location.href = `/service-requests/${r.id}`}>
                      <TableCell className="font-medium">
                        <Link to={`/service-requests/${r.id}`} className="hover:underline">{r.title}</Link>
                      </TableCell>
                      <TableCell>{getServiceTypeLabel(r.service_type)}</TableCell>
                      <TableCell>{(r as any).team_members?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <PriorityIcon priority={r.priority} />
                          <span>{getPriorityLabel(r.priority)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddServiceRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
