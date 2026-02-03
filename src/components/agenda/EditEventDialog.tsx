import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { format } from "date-fns";

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    event_type: string;
    case_id?: string | null;
    responsible_member_id: string;
    start_at: string;
    end_at?: string | null;
    location?: string | null;
    online_link?: string | null;
    notes?: string | null;
    status: string;
  } | null;
}

const eventTypeOptions = [
  { value: "audiencia", label: "Audiência" },
  { value: "pericia", label: "Perícia" },
  { value: "sessao", label: "Sessão" },
  { value: "reuniao", label: "Reunião" },
  { value: "diligencia", label: "Diligência" },
  { value: "outro", label: "Outro" },
];

const formatDateTimeLocal = (dateStr: string) => {
  const date = new Date(dateStr);
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

export function EditEventDialog({
  open,
  onOpenChange,
  event,
}: EditEventDialogProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    eventType: "audiencia",
    caseId: "",
    responsibleMemberId: "",
    startAt: "",
    endAt: "",
    location: "",
    onlineLink: "",
    notes: "",
  });
  const [linkToCase, setLinkToCase] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        eventType: event.event_type || "audiencia",
        caseId: event.case_id || "",
        responsibleMemberId: event.responsible_member_id || "",
        startAt: event.start_at ? formatDateTimeLocal(event.start_at) : "",
        endAt: event.end_at ? formatDateTimeLocal(event.end_at) : "",
        location: event.location || "",
        onlineLink: event.online_link || "",
        notes: event.notes || "",
      });
      setLinkToCase(!!event.case_id);
    }
  }, [event]);

  const { data: teamMembers } = useQuery({
    queryKey: ["team-members-active", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, role")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open && !!organization?.id,
  });

  const { data: cases } = useQuery({
    queryKey: ["cases-search", organization?.id, caseSearch],
    queryFn: async () => {
      let query = supabase
        .from("cases")
        .select("id, title, cnj_number")
        .order("updated_at", { ascending: false })
        .limit(20);

      if (caseSearch) {
        query = query.or(
          `title.ilike.%${caseSearch}%,cnj_number.ilike.%${caseSearch}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open && !!organization?.id && linkToCase,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !event) throw new Error("Dados incompletos");

      if (!formData.title) throw new Error("Título é obrigatório");
      if (!formData.responsibleMemberId) throw new Error("Responsável é obrigatório");
      if (!formData.startAt) throw new Error("Data/hora é obrigatória");

      const { error } = await supabase
        .from("events")
        .update({
          event_type: formData.eventType,
          case_id: linkToCase && formData.caseId ? formData.caseId : null,
          title: formData.title,
          responsible_member_id: formData.responsibleMemberId,
          start_at: formData.startAt,
          end_at: formData.endAt || null,
          location: formData.location || null,
          online_link: formData.onlineLink || null,
          notes: formData.notes || null,
        })
        .eq("id", event.id);

      if (error) throw error;

      // Create timeline event if linked to a case
      if (linkToCase && formData.caseId) {
        await supabase.from("case_timeline_events").insert({
          organization_id: organization.id,
          case_id: formData.caseId,
          event_type: "event_update",
          title: `Compromisso atualizado: ${formData.title}`,
          description: `Reagendado para ${new Date(formData.startAt).toLocaleString("pt-BR")}`,
          occurred_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      toast.success("Compromisso atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-events"] });
      if (formData.caseId) {
        queryClient.invalidateQueries({ queryKey: ["case-events", formData.caseId] });
        queryClient.invalidateQueries({ queryKey: ["case-timeline", formData.caseId] });
      }
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar compromisso");
    },
  });

  const selectedCase = cases?.find((c) => c.id === formData.caseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle>Editar Compromisso</DialogTitle>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Event Type */}
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={formData.eventType}
                onValueChange={(v) => setFormData({ ...formData, eventType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Audiência de Instrução, Perícia Médica..."
              />
            </div>

            {/* Link to Case Toggle */}
            <div className="flex items-center justify-between">
              <Label>Vincular a processo</Label>
              <Switch
                checked={linkToCase}
                onCheckedChange={setLinkToCase}
              />
            </div>

            {/* Case selection */}
            {linkToCase && (
              <div className="space-y-2">
                <Label>Processo</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar processo..."
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="h-32 rounded-md border">
                  <div className="p-2 space-y-1">
                    {cases?.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, caseId: c.id })}
                        className={`w-full text-left p-2 rounded text-sm transition-colors ${
                          formData.caseId === c.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <p className="font-medium truncate">{c.title}</p>
                        {c.cnj_number && (
                          <p className={`text-xs truncate ${
                            formData.caseId === c.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}>
                            {c.cnj_number}
                          </p>
                        )}
                      </button>
                    ))}
                    {cases?.length === 0 && (
                      <p className="text-center py-2 text-muted-foreground text-sm">
                        Nenhum processo encontrado
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {selectedCase && (
                  <p className="text-sm text-muted-foreground">
                    Selecionado: {selectedCase.title}
                  </p>
                )}
              </div>
            )}

            {/* Responsible */}
            <div className="space-y-2">
              <Label>Responsável *</Label>
              <Select
                value={formData.responsibleMemberId}
                onValueChange={(v) => setFormData({ ...formData, responsibleMemberId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data/Hora Início *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data/Hora Fim</Label>
                <Input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Fórum Central, Sala 302..."
              />
            </div>

            {/* Online Link */}
            <div className="space-y-2">
              <Label>Link Online (videoconferência)</Label>
              <Input
                type="url"
                value={formData.onlineLink}
                onChange={(e) => setFormData({ ...formData, onlineLink: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalhes adicionais..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
