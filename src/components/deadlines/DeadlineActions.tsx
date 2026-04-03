import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  CheckCheck,
  MoreHorizontal,
  RotateCcw,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { EditDeadlineDialog } from "./EditDeadlineDialog";

interface DeadlineActionsProps {
  deadline: {
    id: string;
    status: string;
    title: string;
    type: string;
    case_id?: string | null;
    responsible_member_id: string;
    delivery_due_at: string;
    fatal_due_at: string;
    priority: number;
    notes?: string | null;
    drive_link?: string | null;
  };
}

export function DeadlineActions({ deadline }: DeadlineActionsProps) {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      notes,
    }: {
      status: string;
      notes?: string;
    }) => {
      const updateData: any = { status };

      if (status === "open") {
        updateData.completed_at = null;
        updateData.completed_notes = null;
      }

      const { error } = await supabase
        .from("deadlines")
        .update(updateData)
        .eq("id", deadline.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const messages: Record<string, string> = {
        in_progress: "Prazo em execução!",
        completed: "Prazo concluído!",
        open: "Prazo reaberto",
      };
      toast.success(messages[variables.status] || "Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["case-deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["deadline-detail"] });
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleStartProgress = () => {
    updateStatusMutation.mutate({ status: "in_progress" });
  };

  const handleComplete = () => {
    updateStatusMutation.mutate({ status: "completed" });
  };

  const handleReopen = () => {
    updateStatusMutation.mutate({ status: "open" });
    setReopenDialogOpen(false);
  };

  const showStart = deadline.status === "open";
  const showComplete = deadline.status === "open" || deadline.status === "in_progress";
  const showReopen = deadline.status === "in_progress" || deadline.status === "completed";

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Quick complete button */}
        {showComplete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleComplete}
            disabled={updateStatusMutation.isPending}
            title="Concluir"
          >
            <Check className="h-4 w-4 text-success" />
          </Button>
        )}

        {/* Quick review button */}
        {showReview && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReview}
            disabled={updateStatusMutation.isPending}
            title="Conferir"
          >
            <CheckCheck className="h-4 w-4 text-primary" />
          </Button>
        )}

        {/* Dropdown for more actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            {showComplete && (
              <DropdownMenuItem onClick={handleComplete}>
                <Check className="h-4 w-4 mr-2" />
                Concluir
              </DropdownMenuItem>
            )}
            {showReview && (
              <DropdownMenuItem onClick={handleReview}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Conferir
              </DropdownMenuItem>
            )}
            {showRequestAdjustment && (
              <DropdownMenuItem onClick={() => setAdjustmentDialogOpen(true)}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Solicitar Ajuste
              </DropdownMenuItem>
            )}
            {showReopen && (
              <DropdownMenuItem onClick={() => setReopenDialogOpen(true)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reabrir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Ajuste</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Prazo: <strong>{deadline.title}</strong>
            </p>
            <div className="space-y-2">
              <Label>Motivo do ajuste *</Label>
              <Textarea
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Descreva o que precisa ser ajustado..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustmentDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRequestAdjustment}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending
                ? "Enviando..."
                : "Solicitar Ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Confirmation Dialog */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir Prazo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja reabrir o prazo <strong>{deadline.title}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              O prazo voltará para "Em aberto" e os dados de conclusão/conferência serão removidos.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReopen} disabled={updateStatusMutation.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {updateStatusMutation.isPending ? "Reabrindo..." : "Reabrir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deadline Dialog */}
      <EditDeadlineDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        deadline={deadline}
      />
    </>
  );
}
