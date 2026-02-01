import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  Edit,
  Users,
  Clock,
  FileText,
  MapPin,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CaseDetail() {
  const { id } = useParams();
  const { data: organization } = useOrganization();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select(`
          *,
          case_statuses (id, name, color),
          case_phases (id, name),
          case_areas (id, name),
          case_types (id, name),
          case_parties (
            id,
            role,
            side,
            is_primary_client,
            notes,
            contacts (id, name, type, email, phone)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ["case-timeline", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_timeline_events")
        .select("*")
        .eq("case_id", id)
        .order("occurred_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Processo não encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/cases">Voltar para Processos</Link>
        </Button>
      </div>
    );
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const roleLabels: Record<string, string> = {
    cliente: "Cliente",
    autor: "Autor",
    reu: "Réu",
    testemunha: "Testemunha",
    adv_contrario: "Advogado Contrário",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{caseData.title}</h1>
              {caseData.case_statuses && (
                <Badge
                  style={{
                    backgroundColor: `${caseData.case_statuses.color}15`,
                    borderColor: `${caseData.case_statuses.color}40`,
                    color: caseData.case_statuses.color,
                  }}
                >
                  {caseData.case_statuses.name}
                </Badge>
              )}
            </div>
            {caseData.cnj_number && (
              <p className="text-muted-foreground mt-1">{caseData.cnj_number}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {caseData.link_url && (
            <Button variant="outline" asChild>
              <a href={caseData.link_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Processo
              </a>
            </Button>
          )}
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Área</p>
              <p className="font-medium">{caseData.case_areas?.name || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fase</p>
              <p className="font-medium">{caseData.case_phases?.name || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <MapPin className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tribunal</p>
              <p className="font-medium">{caseData.tribunal || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <DollarSign className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor da Causa</p>
              <p className="font-medium">{formatCurrency(caseData.claim_value)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="parties">
            <Users className="h-4 w-4 mr-2" />
            Partes ({caseData.case_parties?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            Timeline ({timeline?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{caseData.case_types?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Comarca/Foro</p>
                    <p className="font-medium">{caseData.court || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vara</p>
                    <p className="font-medium">{caseData.court_division || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cidade/Estado</p>
                    <p className="font-medium">
                      {caseData.city || caseData.state
                        ? `${caseData.city || ""}${caseData.city && caseData.state ? " - " : ""}${caseData.state || ""}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {caseData.pending_notes || "Nenhuma observação registrada."}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parties" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Partes Envolvidas</CardTitle>
              <Button size="sm">
                <Users className="h-4 w-4 mr-2" />
                Adicionar Parte
              </Button>
            </CardHeader>
            <CardContent>
              {!caseData.case_parties || caseData.case_parties.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma parte vinculada a este processo
                </p>
              ) : (
                <div className="space-y-4">
                  {caseData.case_parties.map((party: any) => (
                    <div
                      key={party.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{party.contacts?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {party.contacts?.email || party.contacts?.phone || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {roleLabels[party.role] || party.role}
                        </Badge>
                        {party.is_primary_client && (
                          <Badge className="bg-accent text-accent-foreground">
                            Principal
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Timeline</CardTitle>
              <Button size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Adicionar Evento
              </Button>
            </CardHeader>
            <CardContent>
              {!timeline || timeline.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum evento registrado ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-4 p-4 rounded-lg border"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{event.title || event.event_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.occurred_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
