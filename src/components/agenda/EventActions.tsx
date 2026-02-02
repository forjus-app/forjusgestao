import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface EventActionsProps {
  event: {
    id: string;
    status: string;
    case_id?: string | null;
    title: string;
    event_type: string;
  };
}

const eventTypeLabels: Record<string, string> = {
  audiencia: "Audiência",
  pericia: "Perícia",
  sessao: "Sessão",
  reuniao: "Reunião",
  diligencia: "Diligência",
  outro: "Outro",
};

export function EventActions({ event }: EventActionsProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const { error } = await supabase
        .from("events")
        .update({ status })
        .eq("id", event.id);

      if (error) throw error;

      // If linked to a case, create timeline event
      if (event.case_id && organization?.id) {
        const action = status === "done" ? "realizado" : "cancelado";
        await supabase.from("case_timeline_events").insert({
          organization_id: organization.id,
          case_id: event.case_id,
          event_type: status === "done" ? "completion" : "cancellation",
          title: `${eventTypeLabels[event.event_type] || "Evento"} ${action}`,
          description: event.title,
          occurred_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: (_, { status }) => {
      const message = status === "done" 
        ? "Compromisso marcado como realizado!" 
        : "Compromisso cancelado!";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      if (event.case_id) {
        queryClient.invalidateQueries({ queryKey: ["case-events", event.case_id] });
        queryClient.invalidateQueries({ queryKey: ["case-timeline", event.case_id] });
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar compromisso");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compromisso excluído!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
    },
    onError: () => {
      toast.error("Erro ao excluir compromisso");
    },
  });

  if (event.status === "done" || event.status === "canceled") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {event.case_id && (
            <DropdownMenuItem asChild>
              <Link to={`/cases/${event.case_id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Processo
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => deleteMutation.mutate()}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updateStatusMutation.mutate({ status: "done" })}
        disabled={updateStatusMutation.isPending}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Realizado
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {event.case_id && (
            <DropdownMenuItem asChild>
              <Link to={`/cases/${event.case_id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Processo
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => updateStatusMutation.mutate({ status: "canceled" })}
            className="text-destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => deleteMutation.mutate()}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
