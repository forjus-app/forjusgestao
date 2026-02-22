import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useServiceRequest, getStatusInfo, getServiceTypeLabel, getPriorityLabel, SERVICE_STATUSES } from "@/hooks/useServiceRequests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Copy, Flame, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditServiceRequestDialog } from "@/components/service-requests/EditServiceRequestDialog";
import { ConvertToCaseDialog } from "@/components/service-requests/ConvertToCaseDialog";

export default function ServiceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();
  const { data: sr, isLoading } = useServiceRequest(id);
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase.from("service_requests").update({ status: newStatus }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-request", id] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!sr) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Petição não encontrada</p></div>;

  const status = getStatusInfo(sr.status);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/service-requests"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{sr.title}</h1>
              {sr.priority === 2 && <Flame className="h-5 w-5 text-destructive" />}
              {sr.priority === 1 && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={status.color}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground">{getServiceTypeLabel(sr.service_type)}</span>
              <span className="text-sm text-muted-foreground">• Prioridade: {getPriorityLabel(sr.priority)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>Editar</Button>
          {sr.status !== "filed" && sr.status !== "canceled" && (
            <Button onClick={() => setConvertOpen(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Converter em Processo
            </Button>
          )}
        </div>
      </div>

      {/* Status change */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Alterar status:</span>
            <Select value={sr.status} onValueChange={(v) => statusMutation.mutate(v)}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left col - details */}
        <div className="md:col-span-2 space-y-6">
          {/* Case description */}
          <Card>
            <CardHeader><CardTitle>Descrição do Caso</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{sr.case_description}</p>
            </CardContent>
          </Card>

          {/* Facts */}
          {sr.facts && (
            <Card>
              <CardHeader><CardTitle>Fatos</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{sr.facts}</p></CardContent>
            </Card>
          )}

          {/* Requests */}
          {sr.requests && (
            <Card>
              <CardHeader><CardTitle>Pedidos</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{sr.requests}</p></CardContent>
            </Card>
          )}

          {/* Evidence */}
          {sr.evidence_list && (
            <Card>
              <CardHeader><CardTitle>Provas / Documentos</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{sr.evidence_list}</p></CardContent>
            </Card>
          )}

          {/* Notes */}
          {sr.notes && (
            <Card>
              <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{sr.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Right col - metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Responsável</span>
                <p className="font-medium">{(sr as any).team_members?.name || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cliente</span>
                <p className="font-medium">{(sr as any).client?.name || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Parte contrária</span>
                <p className="font-medium">{(sr as any).related?.name || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Criado em</span>
                <p className="font-medium">{format(new Date(sr.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Atualizado em</span>
                <p className="font-medium">{format(new Date(sr.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
              </div>
            </CardContent>
          </Card>

          {/* Drive link */}
          {sr.drive_link && (
            <Card>
              <CardHeader><CardTitle>Drive</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={sr.drive_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />Abrir
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(sr.drive_link!); toast.success("Link copiado!"); }}>
                  <Copy className="h-4 w-4 mr-1" />Copiar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Linked case */}
          {(sr as any).cases && (
            <Card>
              <CardHeader><CardTitle>Processo vinculado</CardTitle></CardHeader>
              <CardContent>
                <p className="font-medium text-sm">{(sr as any).cases.title}</p>
                {(sr as any).cases.cnj_number && (
                  <p className="text-xs text-muted-foreground mt-1">{(sr as any).cases.cnj_number}</p>
                )}
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link to={`/cases/${(sr as any).cases.id}`}>Abrir processo</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditServiceRequestDialog open={editOpen} onOpenChange={setEditOpen} serviceRequest={sr} />
      <ConvertToCaseDialog open={convertOpen} onOpenChange={setConvertOpen} serviceRequest={sr} />
    </div>
  );
}
