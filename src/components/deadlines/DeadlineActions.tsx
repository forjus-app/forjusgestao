import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  UserCog,
} from "lucide-react";
import { EditDeadlineDialog } from "./EditDeadlineDialog";

interface DeadlineActionsProps {
  deadline: {
    id: string;
    status: string;
    title: string;
    type: string;
    deadline_category?: string | null;
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
  const [transferOpen, setTransferOpen] = useState(false);
  const [newResponsible, setNewResponsible] = useState("");

  const { data: members = [] } = useQuery({
    queryKey: ["transfer-team-members"],
    enabled: transferOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("deadlines")
        .update({ responsible_member_id: newResponsible })
        .eq("id", deadline.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prazo transferido");
      setTransferOpen(false);
      ["deadlines", "cumprimentos", "today-deadlines", "today-cumprimentos", "case-deadlines", "deadline-detail"].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: [k] })
      );
    },
    onError: (error: any) => toast.error("Erro: " + error.message),
  });

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
      queryClient.invalidateQueries({ queryKey: ["cumprimentos"] });
      queryClient.invalidateQueries({ queryKey: ["today-deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["today-cumprimentos"] });
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
            aria-label="Concluir prazo"
          >
            <CheckCheck className="h-4 w-4 text-success" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Mais ações do prazo">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setNewResponsible(deadline.responsible_member_id);
                setTransferOpen(true);
              }}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Transferir prazo
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

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Transferir Prazo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Escolha o novo responsável por <strong>{deadline.title}</strong>. O responsável do processo não será alterado.
            </p>
            <Select value={newResponsible} onValueChange={setNewResponsible}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => transferMutation.mutate()}
              disabled={!newResponsible || newResponsible === deadline.responsible_member_id || transferMutation.isPending}
            >
              {transferMutation.isPending ? "Transferindo..." : "Transferir"}
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
