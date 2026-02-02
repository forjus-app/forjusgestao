import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  MessageSquare, 
  RefreshCw, 
  FileText, 
  ArrowRightLeft,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ExternalCaseTimelineTabProps {
  externalCaseId: string;
}

const eventTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  note: { icon: MessageSquare, label: "Nota", color: "text-blue-500" },
  update: { icon: RefreshCw, label: "Atualização", color: "text-green-500" },
  document: { icon: FileText, label: "Documento", color: "text-purple-500" },
  status_change: { icon: ArrowRightLeft, label: "Alteração de Status", color: "text-orange-500" },
};

export function ExternalCaseTimelineTab({ externalCaseId }: ExternalCaseTimelineTabProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    event_type: "note",
    title: "",
    description: "",
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ["external-case-timeline", externalCaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_case_timeline_events")
        .select("*")
        .eq("external_case_id", externalCaseId)
        .order("occurred_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!externalCaseId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("Organização não encontrada");

      const { error } = await supabase
        .from("external_case_timeline_events")
        .insert({
          organization_id: organization.id,
          external_case_id: externalCaseId,
          event_type: newEvent.event_type,
          title: newEvent.title || null,
          description: newEvent.description || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-case-timeline", externalCaseId] });
      toast.success("Evento adicionado à timeline");
      setNewEvent({ event_type: "note", title: "", description: "" });
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao adicionar evento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("external_case_timeline_events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-case-timeline", externalCaseId] });
      toast.success("Evento removido");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao remover evento");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Timeline</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Evento na Timeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Evento</label>
                <Select 
                  value={newEvent.event_type}
                  onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Nota</SelectItem>
                    <SelectItem value="update">Atualização</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Título do evento"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Descreva o evento..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Adicionar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!events || events.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum evento na timeline</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {events.map((event) => {
                const config = eventTypeConfig[event.event_type] || eventTypeConfig.note;
                const Icon = config.icon;

                return (
                  <div key={event.id} className="relative pl-10 group">
                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.occurred_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {config.label}
                            </span>
                          </div>
                          {event.title && (
                            <p className="font-medium">{event.title}</p>
                          )}
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteId(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
