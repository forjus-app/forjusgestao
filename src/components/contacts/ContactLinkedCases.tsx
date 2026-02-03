import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Search, ExternalLink, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContactLinkedCasesProps {
  contactId: string;
}

const roleLabels: Record<string, string> = {
  cliente: "Cliente",
  autor: "Autor",
  reu: "Réu",
  testemunha: "Testemunha",
  adv_contrario: "Advogado Contrário",
};

export function ContactLinkedCases({ contactId }: ContactLinkedCasesProps) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: linkedCases, isLoading } = useQuery({
    queryKey: ["contact-linked-cases", contactId, search, filterRole, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("case_parties")
        .select(`
          id,
          role,
          side,
          is_primary_client,
          cases:case_id (
            id,
            title,
            cnj_number,
            updated_at,
            status:status_id (id, name, color)
          )
        `)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search and role on client side (since we need case data)
      let filtered = data || [];

      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((item: any) => 
          item.cases?.title?.toLowerCase().includes(searchLower) ||
          item.cases?.cnj_number?.toLowerCase().includes(searchLower)
        );
      }

      if (filterRole !== "all") {
        filtered = filtered.filter((item: any) => item.role === filterRole);
      }

      if (filterStatus !== "all") {
        filtered = filtered.filter((item: any) => 
          item.cases?.status?.name?.toLowerCase() === filterStatus.toLowerCase()
        );
      }

      return filtered;
    },
    enabled: !!contactId,
  });

  // Get unique statuses from the data
  const { data: statuses } = useQuery({
    queryKey: ["case-statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_statuses")
        .select("id, name")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Processos Vinculados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Processos Vinculados
          {linkedCases && linkedCases.length > 0 && (
            <Badge variant="secondary">{linkedCases.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou CNJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos papéis</SelectItem>
              {Object.entries(roleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statuses?.map((status) => (
                <SelectItem key={status.id} value={status.name}>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {!linkedCases || linkedCases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum processo vinculado</p>
            {(search || filterRole !== "all" || filterStatus !== "all") && (
              <p className="text-sm mt-1">Tente ajustar os filtros</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Atualização</TableHead>
                <TableHead className="w-[80px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedCases.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.is_primary_client && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">{item.cases?.title}</p>
                        {item.cases?.cnj_number && (
                          <p className="text-sm text-muted-foreground">
                            {item.cases.cnj_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {roleLabels[item.role] || item.role}
                    </Badge>
                    {item.side && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({item.side === "ativo" ? "Polo Ativo" : "Polo Passivo"})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.cases?.status ? (
                      <Badge
                        style={{
                          backgroundColor: item.cases.status.color || undefined,
                        }}
                      >
                        {item.cases.status.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.cases?.updated_at
                      ? formatDate(item.cases.updated_at)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/cases/${item.cases?.id}`}>
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
  );
}
