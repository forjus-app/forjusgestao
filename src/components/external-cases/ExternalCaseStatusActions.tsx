import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, X, Archive } from "lucide-react";
import { toast } from "sonner";

interface ExternalCaseStatusActionsProps {
  externalCase: any;
  statuses: any[];
}

export function ExternalCaseStatusActions({ 
  externalCase, 
  statuses 
}: ExternalCaseStatusActionsProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (statusId: string) => {
      if (!organization) throw new Error("Organização não encontrada");

      const newStatus = statuses.find(s => s.id === statusId);

      // Update the case status
      const { error } = await supabase
        .from("external_cases")
        .update({ status_id: statusId })
        .eq("id", externalCase.id);

      if (error) throw error;

      // Add timeline event
      await supabase.from("external_case_timeline_events").insert({
        organization_id: organization.id,
        external_case_id: externalCase.id,
        event_type: "status_change",
        title: "Status alterado",
        description: `Status alterado de "${externalCase.external_case_statuses?.name || 'não definido'}" para "${newStatus?.name}"`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-case", externalCase.id] });
      queryClient.invalidateQueries({ queryKey: ["external-case-timeline", externalCase.id] });
      queryClient.invalidateQueries({ queryKey: ["external-cases"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const currentStatusName = externalCase.external_case_statuses?.name?.toLowerCase();
  
  // Quick action buttons based on current status
  const quickActions = [];
  
  if (currentStatusName !== "concluído") {
    const concludedStatus = statuses.find(s => s.name.toLowerCase() === "concluído");
    if (concludedStatus) {
      quickActions.push({
        label: "Marcar como Concluído",
        icon: Check,
        statusId: concludedStatus.id,
        variant: "default" as const,
      });
    }
  }

  if (currentStatusName !== "arquivado") {
    const archivedStatus = statuses.find(s => s.name.toLowerCase() === "arquivado");
    if (archivedStatus) {
      quickActions.push({
        label: "Arquivar",
        icon: Archive,
        statusId: archivedStatus.id,
        variant: "outline" as const,
      });
    }
  }

  return (
    <div className="flex items-center gap-2">
      {quickActions.map((action) => (
        <Button
          key={action.statusId}
          variant={action.variant}
          size="sm"
          onClick={() => updateStatusMutation.mutate(action.statusId)}
          disabled={updateStatusMutation.isPending}
        >
          <action.icon className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Alterar Status
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {statuses.map((status) => (
            <DropdownMenuItem
              key={status.id}
              onClick={() => updateStatusMutation.mutate(status.id)}
              disabled={status.id === externalCase.status_id}
            >
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: status.color }}
              />
              {status.name}
              {status.id === externalCase.status_id && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
