import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, MessageSquare, Calendar, AlertCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useSettlements, FollowupFilter } from "@/hooks/useSettlements";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { AddSettlementDialog } from "@/components/settlements/AddSettlementDialog";

const statusLabels: Record<string, string> = {
  open: "Aberto",
  negotiating: "Negociando",
  awaiting_response: "Aguardando Resposta",
  closed: "Encerrado",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  negotiating: "bg-yellow-100 text-yellow-800",
  awaiting_response: "bg-orange-100 text-orange-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function Settlements() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [followupFilter, setFollowupFilter] = useState<FollowupFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: settlements = [], isLoading } = useSettlements({
    status: statusFilter,
    assignedMemberId: memberFilter,
    followupFilter,
  });

  const { data: teamMembers = [] } = useTeamMembers();

  const filteredSettlements = settlements.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.client_contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.counterparty_contact?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getFollowupBadge = (nextFollowup: string | null) => {
    if (!nextFollowup) return null;
    
    const date = new Date(nextFollowup);
    
    if (isPast(date) && !isToday(date)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Atrasado
        </Badge>
      );
    }
    
    if (isToday(date)) {
      return (
        <Badge className="gap-1 bg-amber-500">
          <Calendar className="h-3 w-3" />
          Hoje
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="gap-1">
        <Calendar className="h-3 w-3" />
        {format(date, "dd/MM", { locale: ptBR })}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acordos</h1>
          <p className="text-muted-foreground">
            Gerencie negociações e acompanhe follow-ups
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Acordo
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar por título, cliente ou contraparte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="negotiating">Negociando</SelectItem>
                <SelectItem value="awaiting_response">Aguardando Resposta</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={followupFilter} onValueChange={(v) => setFollowupFilter(v as FollowupFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Follow-up" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="overdue">Atrasados</SelectItem>
                <SelectItem value="next_7_days">Próximos 7 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Contraparte</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próximo Follow-up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredSettlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-8 w-8" />
                      <p>Nenhum acordo encontrado</p>
                      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                        Criar primeiro acordo
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSettlements.map((settlement) => (
                  <TableRow
                    key={settlement.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/settlements/${settlement.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{settlement.title}</span>
                        {settlement.case && (
                          <span className="text-xs text-muted-foreground">
                            Processo: {settlement.case.cnj_number || settlement.case.title}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{settlement.client_contact?.name || "-"}</TableCell>
                    <TableCell>{settlement.counterparty_contact?.name || "-"}</TableCell>
                    <TableCell>{settlement.assigned_member?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[settlement.status]}>
                        {statusLabels[settlement.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getFollowupBadge(settlement.next_followup_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddSettlementDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
