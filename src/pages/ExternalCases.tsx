import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Filter, Briefcase, ExternalLink, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddExternalCaseDialog } from "@/components/external-cases/AddExternalCaseDialog";

export default function ExternalCases() {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Seed taxonomy if not exists
  useEffect(() => {
    const seedTaxonomy = async () => {
      if (!organization) return;
      
      // Check if statuses exist
      const { data: existingStatuses } = await supabase
        .from("external_case_statuses")
        .select("id")
        .eq("organization_id", organization.id)
        .limit(1);
      
      if (!existingStatuses || existingStatuses.length === 0) {
        await supabase.rpc("seed_external_case_taxonomy", { org_id: organization.id });
        queryClient.invalidateQueries({ queryKey: ["external-case-statuses"] });
        queryClient.invalidateQueries({ queryKey: ["external-case-types"] });
      }
    };
    
    seedTaxonomy();
  }, [organization, queryClient]);

  const { data: statuses } = useQuery({
    queryKey: ["external-case-statuses", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("external_case_statuses")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const { data: types } = useQuery({
    queryKey: ["external-case-types", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("external_case_types")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const { data: partners } = useQuery({
    queryKey: ["partner-lawyers", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("partner_lawyers")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const { data: externalCases, isLoading } = useQuery({
    queryKey: ["external-cases", organization?.id, search, statusFilter, partnerFilter, typeFilter],
    queryFn: async () => {
      if (!organization) return [];

      let query = supabase
        .from("external_cases")
        .select(`
          *,
          external_case_statuses (id, name, color),
          external_case_types (id, name),
          partner_lawyers (id, name, office_name),
          contacts:client_contact_id (id, name)
        `)
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status_id", statusFilter);
      }

      if (partnerFilter && partnerFilter !== "all") {
        query = query.eq("partner_lawyer_id", partnerFilter);
      }

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("type_id", typeFilter);
      }

      if (search) {
        query = query.or(`authority_name.ilike.%${search}%,process_number.ilike.%${search}%,protocol_number.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Casos Externos</h1>
          <p className="text-muted-foreground">
            Gerencie casos administrativos e terceirizados
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Caso Externo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por órgão, número ou protocolo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {statuses?.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={partnerFilter} onValueChange={setPartnerFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Parceiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos parceiros</SelectItem>
                {partners?.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                {types?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
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
          ) : !externalCases || externalCases.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-lg font-medium mb-1">Nenhum caso externo encontrado</p>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all" || partnerFilter !== "all" || typeFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando seu primeiro caso externo"}
              </p>
              {!search && statusFilter === "all" && partnerFilter === "all" && typeFilter === "all" && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Caso Externo
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Órgão/Local</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {externalCases.map((extCase) => (
                  <TableRow key={extCase.id} className="table-row-hover">
                    <TableCell>
                      <div>
                        <Link
                          to={`/external-cases/${extCase.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {extCase.contacts?.name || "-"}
                        </Link>
                        {(extCase.process_number || extCase.protocol_number) && (
                          <p className="text-sm text-muted-foreground">
                            {extCase.process_number || extCase.protocol_number}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span>{extCase.authority_name}</span>
                        {(extCase.city || extCase.state) && (
                          <p className="text-sm text-muted-foreground">
                            {[extCase.city, extCase.state].filter(Boolean).join(" - ")}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {extCase.external_case_types?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span>{extCase.partner_lawyers?.name || "-"}</span>
                        {extCase.partner_lawyers?.office_name && (
                          <p className="text-sm text-muted-foreground">
                            {extCase.partner_lawyers.office_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {extCase.external_case_statuses && (
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${extCase.external_case_statuses.color}15`,
                            borderColor: `${extCase.external_case_statuses.color}40`,
                            color: extCase.external_case_statuses.color,
                          }}
                        >
                          {extCase.external_case_statuses.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(extCase.updated_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/external-cases/${extCase.id}`}>
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

      <AddExternalCaseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
