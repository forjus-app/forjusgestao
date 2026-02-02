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
} from "lucide-react";

interface DeadlineActionsProps {
  deadline: {
    id: string;
    status: string;
    review_status: string;
    title: string;
  };
}

export function DeadlineActions({ deadline }: DeadlineActionsProps) {
  const queryClient = useQueryClient();
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [adjustmentNotes, setAdjustmentNotes] = useState("");

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      notes,
    }: {
      status: string;
      notes?: string;
    }) => {
      const updateData: any = { status };

      if (status === "adjustment_requested" && notes) {
        updateData.reviewed_notes = notes;
      }

      if (status === "open") {
        updateData.completed_at = null;
        updateData.completed_notes = null;
        updateData.review_status = "not_required";
        updateData.reviewed_at = null;
        updateData.reviewed_notes = null;
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
        reviewed: "Prazo conferido!",
        adjustment_requested: "Ajuste solicitado",
        open: "Prazo reaberto",
      };
      toast.success(messages[variables.status] || "Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["case-deadlines"] });
      setAdjustmentDialogOpen(false);
      setAdjustmentNotes("");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleComplete = () => {
    updateStatusMutation.mutate({ status: "completed" });
  };

  const handleReview = () => {
    updateStatusMutation.mutate({ status: "reviewed" });
  };

  const handleReopen = () => {
    updateStatusMutation.mutate({ status: "open" });
  };

  const handleRequestAdjustment = () => {
    if (!adjustmentNotes.trim()) {
      toast.error("Informe o motivo do ajuste");
      return;
    }
    updateStatusMutation.mutate({
      status: "adjustment_requested",
      notes: adjustmentNotes,
    });
  };

  // Determine available actions based on status
  const showComplete = deadline.status === "open";
  const showReview = deadline.status === "completed";
  const showRequestAdjustment = deadline.status === "completed";
  const showReopen =
    deadline.status === "adjustment_requested" ||
    deadline.status === "reviewed";

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
              <DropdownMenuItem onClick={handleReopen}>
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
    </>
  );
}
