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
    fatal_due_at: string | null;
    transit_judged_at?: string | null;
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
    mutationFn: async ({ status }: { status: string }) => {
      const updateData: any = { status };

      if (status === "open") {
        updateData.completed_at = null;
        updateData.completed_notes = null;
      }
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("deadlines")
        .update(updateData)
        .eq("id", deadline.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const messages: Record<string, string> = {
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

  const handleComplete = () => {
    updateStatusMutation.mutate({ status: "completed" });
  };

  const handleReopen = () => {
    updateStatusMutation.mutate({ status: "open" });
    setReopenDialogOpen(false);
  };

  const showComplete = deadline.status === "open";
  const showReopen = deadline.status === "completed";

  return (
    <>
      <div className="flex items-center gap-1">
        {showComplete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleComplete}
            disabled={updateStatusMutation.isPending}
            title="Concluir"
          >
            <CheckCheck className="h-4 w-4 text-success" />
          </Button>
        )}

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
                <CheckCheck className="h-4 w-4 mr-2" />
                Concluir
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
              O prazo voltará para "Aberto" e os dados de conclusão serão removidos.
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
