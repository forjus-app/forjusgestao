import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Edit,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  useSettlement,
  useSettlementInteractions,
  useUpdateSettlement,
} from "@/hooks/useSettlements";
import { EditSettlementDialog } from "@/components/settlements/EditSettlementDialog";
import { AddInteractionDialog } from "@/components/settlements/AddInteractionDialog";

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

const interactionTypeIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-green-600" />,
  email: <Mail className="h-4 w-4 text-blue-600" />,
  phone_call: <Phone className="h-4 w-4 text-purple-600" />,
  note: <FileText className="h-4 w-4 text-gray-600" />,
};

const interactionTypeLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  phone_call: "Ligação",
  note: "Nota",
};

const directionLabels: Record<string, string> = {
  outbound: "Enviado",
  inbound: "Recebido",
};

export default function SettlementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);

  const { data: settlement, isLoading } = useSettlement(id);
  const { data: interactions = [] } = useSettlementInteractions(id);
  const updateSettlement = useUpdateSettlement();

  const handleToggleFollowup = async (enabled: boolean) => {
    if (!settlement) return;
    
    try {
      await updateSettlement.mutateAsync({
        id: settlement.id,
        followup_enabled: enabled,
      });
      toast.success(enabled ? "Automação ativada" : "Automação desativada");
    } catch {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleUpdateFollowupDays = async (days: number) => {
    if (!settlement || !days) return;
    
    try {
      await updateSettlement.mutateAsync({
        id: settlement.id,
        followup_every_n_days: days,
      });
      toast.success("Configuração atualizada");
    } catch {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleQuickStatus = async (status: string) => {
    if (!settlement) return;
    
    try {
      await updateSettlement.mutateAsync({
        id: settlement.id,
        status,
        ...(status === "closed" ? { next_followup_at: null } : {}),
      });
      toast.success(`Status alterado para: ${statusLabels[status]}`);
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const getFollowupBadge = () => {
    if (!settlement?.next_followup_at) return null;
    
    const date = new Date(settlement.next_followup_at);
    
    if (isPast(date) && !isToday(date)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Atrasado - {format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </Badge>
      );
    }
    
    if (isToday(date)) {
      return (
        <Badge className="gap-1 bg-amber-500">
          <Clock className="h-3 w-3" />
          Hoje - {format(date, "HH:mm", { locale: ptBR })}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="gap-1">
        <Calendar className="h-3 w-3" />
        {format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settlement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Acordo não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/settlements")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settlements")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{settlement.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[settlement.status]}>
                {statusLabels[settlement.status]}
              </Badge>
              {settlement.case && (
                <Badge variant="outline" className="cursor-pointer" onClick={() => navigate(`/cases/${settlement.case?.id}`)}>
                  Processo: {settlement.case.cnj_number || settlement.case.title}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{settlement.client_contact?.name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contraparte</Label>
                  <p className="font-medium">{settlement.counterparty_contact?.name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Responsável</Label>
                  <p className="font-medium">{settlement.assigned_member?.name || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Próximo Follow-up</Label>
                  <div className="mt-1">{getFollowupBadge() || <span className="text-muted-foreground">Não agendado</span>}</div>
                </div>
              </div>
              
              {settlement.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="mt-1 whitespace-pre-wrap">{settlement.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Histórico de interações */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Contatos</CardTitle>
                <CardDescription>Registre mensagens, e-mails e ligações</CardDescription>
              </div>
              <Button onClick={() => setInteractionDialogOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Registrar Contato
              </Button>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum contato registrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0 mt-1">
                        {interactionTypeIcons[interaction.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {interactionTypeLabels[interaction.type]}
                          </span>
                          {interaction.direction && (
                            <Badge variant="outline" className="text-xs">
                              {directionLabels[interaction.direction]}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(interaction.occurred_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{interaction.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {settlement.status !== "awaiting_response" && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleQuickStatus("awaiting_response")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Marcar como Aguardando
                </Button>
              )}
              {settlement.status !== "negotiating" && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleQuickStatus("negotiating")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Marcar como Negociando
                </Button>
              )}
              {settlement.status !== "closed" && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-green-600 hover:text-green-700"
                  onClick={() => handleQuickStatus("closed")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Encerrar Acordo
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Automação */}
          <Card>
            <CardHeader>
              <CardTitle>Automação de Follow-up</CardTitle>
              <CardDescription>
                Agendar automaticamente após cada contato enviado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ativar automação</Label>
                <Switch
                  checked={settlement.followup_enabled}
                  onCheckedChange={handleToggleFollowup}
                  disabled={updateSettlement.isPending}
                />
              </div>
              
              {settlement.followup_enabled && (
                <div className="space-y-2">
                  <Label>A cada (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={settlement.followup_every_n_days || ""}
                    placeholder="Ex: 3"
                    onBlur={(e) => {
                      const value = parseInt(e.target.value);
                      if (value && value !== settlement.followup_every_n_days) {
                        handleUpdateFollowupDays(value);
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <EditSettlementDialog
        settlement={settlement}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      
      <AddInteractionDialog
        settlementId={settlement.id}
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
      />
    </div>
  );
}
