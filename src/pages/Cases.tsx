import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Filter, Briefcase, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Cases() {
  const { data: organization } = useOrganization();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: statuses } = useQuery({
    queryKey: ["case-statuses", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("case_statuses")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const { data: cases, isLoading } = useQuery({
    queryKey: ["cases", organization?.id, search, statusFilter],
    queryFn: async () => {
      if (!organization) return [];

      let query = supabase
        .from("cases")
        .select(`
          *,
          case_statuses (id, name, color),
          case_phases (id, name),
          case_areas (id, name),
          case_parties (
            id,
            is_primary_client,
            contacts (id, name)
          )
        `)
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status_id", statusFilter);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,cnj_number.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const getPrimaryClient = (caseItem: any) => {
    const primaryParty = caseItem.case_parties?.find((p: any) => p.is_primary_client);
    return primaryParty?.contacts?.name || "-";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus processos</p>
        </div>
        <Button asChild>
          <Link to="/cases/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Processo
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou número CNJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statuses?.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !cases || cases.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-lg font-medium mb-1">Nenhum processo encontrado</p>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando seu primeiro processo"}
              </p>
              {!search && statusFilter === "all" && (
                <Button asChild>
                  <Link to="/cases/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Processo
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="table-row-hover">
                    <TableCell>
                      <div>
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {caseItem.title}
                        </Link>
                        {caseItem.cnj_number && (
                          <p className="text-sm text-muted-foreground">
                            {caseItem.cnj_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPrimaryClient(caseItem)}</TableCell>
                    <TableCell>
                      {caseItem.case_statuses && (
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${caseItem.case_statuses.color}15`,
                            borderColor: `${caseItem.case_statuses.color}40`,
                            color: caseItem.case_statuses.color,
                          }}
                        >
                          {caseItem.case_statuses.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {caseItem.case_areas?.name || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(caseItem.updated_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/cases/${caseItem.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
