import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Building2, 
  User, 
  MapPin, 
  Link as LinkIcon, 
  FileText,
  Calendar,
  ExternalLink,
  MoreVertical,
  Trash2,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useState } from "react";
import { ExternalCaseTimelineTab } from "@/components/external-cases/ExternalCaseTimelineTab";
import { ExternalCaseStatusActions } from "@/components/external-cases/ExternalCaseStatusActions";

export default function ExternalCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: externalCase, isLoading } = useQuery({
    queryKey: ["external-case", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("external_cases")
        .select(`
          *,
          external_case_statuses (id, name, color),
          external_case_types (id, name),
          partner_lawyers (id, name, oab, email, whatsapp, office_name),
          contacts:client_contact_id (id, name, email, phone, whatsapp)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id || !organization) throw new Error("Dados inválidos");
      
      // First delete timeline events
      await supabase
        .from("external_case_timeline_events")
        .delete()
        .eq("external_case_id", id);
      
      // Then delete document links
      await supabase
        .from("external_case_document_links")
        .delete()
        .eq("external_case_id", id);
      
      // Finally delete the case
      const { error } = await supabase
        .from("external_cases")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Caso externo excluído com sucesso");
      navigate("/external-cases");
    },
    onError: () => {
      toast.error("Erro ao excluir caso externo");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!externalCase) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-lg font-medium mb-4">Caso externo não encontrado</p>
        <Button asChild>
          <Link to="/external-cases">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/external-cases">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{externalCase.contacts?.name}</h1>
              {externalCase.external_case_statuses && (
                <Badge
                  style={{
                    backgroundColor: `${externalCase.external_case_statuses.color}15`,
                    borderColor: `${externalCase.external_case_statuses.color}40`,
                    color: externalCase.external_case_statuses.color,
                  }}
                >
                  {externalCase.external_case_statuses.name}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {externalCase.external_case_types?.name} • {externalCase.authority_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExternalCaseStatusActions 
            externalCase={externalCase} 
            statuses={statuses || []}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{externalCase.contacts?.name}</p>
                {externalCase.contacts?.email && (
                  <p className="text-sm text-muted-foreground">{externalCase.contacts.email}</p>
                )}
                {externalCase.contacts?.phone && (
                  <p className="text-sm text-muted-foreground">{externalCase.contacts.phone}</p>
                )}
              </CardContent>
            </Card>

            {/* Parceiro */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Advogado Parceiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{externalCase.partner_lawyers?.name}</p>
                {externalCase.partner_lawyers?.oab && (
                  <p className="text-sm text-muted-foreground">OAB: {externalCase.partner_lawyers.oab}</p>
                )}
                {externalCase.partner_lawyers?.office_name && (
                  <p className="text-sm text-muted-foreground">{externalCase.partner_lawyers.office_name}</p>
                )}
                {externalCase.partner_lawyers?.email && (
                  <p className="text-sm text-muted-foreground">{externalCase.partner_lawyers.email}</p>
                )}
              </CardContent>
            </Card>

            {/* Órgão/Local */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Órgão / Local
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{externalCase.authority_name}</p>
                {(externalCase.city || externalCase.state) && (
                  <p className="text-sm text-muted-foreground">
                    {[externalCase.city, externalCase.state].filter(Boolean).join(" - ")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Números */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {externalCase.process_number ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Número do processo</p>
                    <p className="font-medium">{externalCase.process_number}</p>
                  </div>
                ) : externalCase.protocol_number ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Protocolo</p>
                    <p className="font-medium">{externalCase.protocol_number}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sem número cadastrado</p>
                )}
                {externalCase.portal_link && (
                  <a
                    href={externalCase.portal_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Acessar portal
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notas */}
          {externalCase.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{externalCase.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadados */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Criado em {format(new Date(externalCase.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Atualizado em {format(new Date(externalCase.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <ExternalCaseTimelineTab externalCaseId={externalCase.id} />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Módulo de documentos em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir caso externo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados do caso, incluindo timeline e documentos vinculados, serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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
