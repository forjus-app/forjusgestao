import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { EditDeadlineDialog } from "./EditDeadlineDialog";
import {
  Calendar,
  Clock,
  User,
  FileText,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Pencil,
  X,
  Save,
  Link as LinkIcon,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";

interface DeadlineDetailDrawerProps {
  deadlineId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeadlineDetailDrawer({
  deadlineId,
  open,
  onOpenChange,
}: DeadlineDetailDrawerProps) {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);

  const { data: deadline, isLoading } = useQuery({
    queryKey: ["deadline-detail", deadlineId],
    queryFn: async () => {
      if (!deadlineId) return null;
      const { data, error } = await supabase
        .from("deadlines")
        .select(
          `
          *,
          team_members:responsible_member_id (id, name),
          cases:case_id (id, title, cnj_number)
        `
        )
        .eq("id", deadlineId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!deadlineId && open,
  });

  const updateDeadline = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!deadlineId) return;
      const { error } = await supabase
        .from("deadlines")
        .update(updates)
        .eq("id", deadlineId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deadline-detail", deadlineId] });
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["case-deadlines"] });
    },
  });

  const handleComplete = async () => {
    await updateDeadline.mutateAsync({ status: "completed" });
    toast.success("Prazo marcado como concluído");
  };

  const handleReopen = async () => {
    await updateDeadline.mutateAsync({
      status: "open",
      completed_at: null,
      completed_notes: null,
    });
    setReopenDialogOpen(false);
    toast.success("Prazo reaberto com sucesso");
  };

  const handleStartProgress = async () => {
    await updateDeadline.mutateAsync({ status: "in_progress" });
    toast.success("Prazo em execução");
  };

  const handleSaveNotes = async () => {
    await updateDeadline.mutateAsync({ notes: notesValue });
    setEditingNotes(false);
    toast.success("Observações atualizadas");
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const formatDateTime = (date: string) => {
    return format(parseLocalDateTime(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDate = (date: string) => {
    return format(parseLocalDateTime(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline">Aberto</Badge>;
      case "in_progress":
        return <Badge className="bg-primary text-primary-foreground">Em Execução</Badge>;
      case "completed":
        return <Badge className="bg-success text-success-foreground">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 2) return <Badge variant="destructive">Crítica</Badge>;
    if (priority === 1) return <Badge className="bg-warning text-warning-foreground">Alta</Badge>;
    return null;
  };

  const getDateWarning = () => {
    if (!deadline || deadline.status !== "open") return null;
    const fatal = parseLocalDateTime(deadline.fatal_due_at);
    if (isPast(fatal) && !isToday(fatal)) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (isToday(fatal)) {
      return <Badge variant="destructive">Vence Hoje!</Badge>;
    }
    return null;
  };

  if (!deadlineId) return null;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header Sticky */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <DrawerHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <DrawerTitle className="text-xl truncate">
                    {deadline?.title || "Carregando..."}
                  </DrawerTitle>
                  {deadline && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {getStatusBadge(deadline.status)}
                      <Badge variant="secondary">
                        {deadline.type === "processual" ? "Processual" : "Interno"}
                      </Badge>
                      {getPriorityBadge(deadline.priority)}
                      {getDateWarning()}
                    </div>
                  )}
                </div>
              </div>
            </DrawerHeader>
          </div>

          {/* Body with scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando detalhes...
              </div>
            ) : deadline ? (
              <div className="space-y-6">
                {/* Dados Principais */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dados Principais
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Responsável</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {deadline.team_members?.name || "Não atribuído"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Prazo de Entrega</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatDateTime(deadline.delivery_due_at)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Prazo Fatal</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-destructive" />
                        <span className="font-medium text-destructive">
                          {formatDateTime(deadline.fatal_due_at)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Criado em</p>
                      <span className="text-sm">
                        {formatDate(deadline.created_at)}
                      </span>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Vinculação */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Vinculação
                  </h3>
                  {deadline.type === "processual" && deadline.cases ? (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Processo</p>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{deadline.cases.title}</p>
                          {deadline.cases.cnj_number && (
                            <p className="text-sm text-muted-foreground">
                              {deadline.cases.cnj_number}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {deadline.cases.cnj_number ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(deadline.cases!.cnj_number!);
                                toast.success("Número do processo copiado!");
                              }}
                              title="Copiar nº do processo"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/cases/${deadline.cases.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Abrir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Prazo interno - não vinculado a processo
                    </p>
                  )}
                </section>

                {/* Link do Drive */}
                {deadline.drive_link && (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        Link do Drive
                      </h3>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                        <span className="flex-1 text-sm truncate">
                          {deadline.drive_link}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(deadline.drive_link!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={deadline.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </section>
                  </>
                )}

                <Separator />

                {/* Observações */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Observações
                    </h3>
                    {!editingNotes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNotesValue(deadline.notes || "");
                          setEditingNotes(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Adicione observações..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveNotes}>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingNotes(false)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border rounded-lg bg-muted/30 min-h-[80px]">
                      {deadline.notes ? (
                        <p className="text-sm whitespace-pre-wrap">{deadline.notes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Sem observações
                        </p>
                      )}
                    </div>
                  )}
                </section>

                {/* Conclusão e Conferência */}
                {(deadline.status === "completed" ||
                  deadline.status === "reviewed" ||
                  deadline.status === "adjustment_requested") && (
                  <>
                    <Separator />
                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        Conclusão e Conferência
                      </h3>
                      <div className="space-y-3">
                        {deadline.completed_at && (
                          <div className="p-3 border rounded-lg bg-muted/30">
                            <p className="text-sm text-muted-foreground mb-1">
                              Concluído em
                            </p>
                            <p className="font-medium">
                              {formatDateTime(deadline.completed_at)}
                            </p>
                            {deadline.completed_notes && (
                              <p className="text-sm mt-2 whitespace-pre-wrap">
                                {deadline.completed_notes}
                              </p>
                            )}
                          </div>
                        )}
                        {deadline.reviewed_at && (
                          <div className="p-3 border rounded-lg bg-success/10">
                            <p className="text-sm text-muted-foreground mb-1">
                              {deadline.status === "reviewed"
                                ? "Conferido em"
                                : "Ajuste solicitado em"}
                            </p>
                            <p className="font-medium">
                              {formatDateTime(deadline.reviewed_at)}
                            </p>
                            {deadline.reviewed_notes && (
                              <p className="text-sm mt-2 whitespace-pre-wrap">
                                {deadline.reviewed_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer Sticky */}
          {deadline && (
            <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
              <div className="flex flex-wrap gap-2 justify-end">
                {deadline.status === "open" && (
                  <Button onClick={handleComplete}>
                    <Check className="h-4 w-4 mr-2" />
                    Concluir
                  </Button>
                )}

                {deadline.status === "completed" && (
                  <>
                    <Button variant="outline" onClick={() => setReopenDialogOpen(true)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reabrir
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRequestAdjustment}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Solicitar Ajuste
                    </Button>
                    <Button onClick={handleReview}>
                      <Check className="h-4 w-4 mr-2" />
                      Conferir
                    </Button>
                  </>
                )}

                {(deadline.status === "reviewed" ||
                  deadline.status === "adjustment_requested") && (
                  <Button variant="outline" onClick={() => setReopenDialogOpen(true)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reabrir
                  </Button>
                )}

                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Reopen Confirmation Dialog */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir Prazo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja reabrir o prazo <strong>{deadline?.title}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              O prazo voltará para "Em aberto" e os dados de conclusão/conferência serão removidos.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReopen} disabled={updateDeadline.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {updateDeadline.isPending ? "Reabrindo..." : "Reabrir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deadline && (
        <EditDeadlineDialog
          deadline={deadline}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </>
  );
}
