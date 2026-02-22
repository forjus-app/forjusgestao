import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useContacts } from "@/hooks/useContacts";
import { SERVICE_TYPES, PRIORITIES } from "@/hooks/useServiceRequests";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddServiceRequestDialog({ open, onOpenChange }: Props) {
  const { data: organization } = useOrganization();
  const { data: members } = useTeamMembers();
  const { data: contacts } = useContacts();
  const queryClient = useQueryClient();
  const [extrasOpen, setExtrasOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    service_type: "peticao_inicial",
    assigned_member_id: "",
    client_contact_id: "",
    related_contact_id: "",
    case_description: "",
    facts: "",
    requests: "",
    evidence_list: "",
    priority: "0",
    drive_link: "",
    notes: "",
  });

  const reset = () => {
    setForm({
      title: "", service_type: "peticao_inicial", assigned_member_id: "",
      client_contact_id: "", related_contact_id: "", case_description: "",
      facts: "", requests: "", evidence_list: "", priority: "0", drive_link: "", notes: "",
    });
    setExtrasOpen(false);
  };

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      if (!organization) throw new Error("Organização não encontrada");
      const { error } = await supabase.from("service_requests").insert({
        organization_id: organization.id,
        title: form.title,
        service_type: form.service_type,
        assigned_member_id: form.assigned_member_id,
        client_contact_id: form.client_contact_id || null,
        related_contact_id: form.related_contact_id || null,
        case_description: form.case_description,
        facts: form.facts || null,
        requests: form.requests || null,
        evidence_list: form.evidence_list || null,
        priority: parseInt(form.priority),
        status,
        drive_link: form.drive_link || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Petição criada com sucesso!");
      reset();
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao criar petição"),
  });

  const handleSubmit = (status = "new") => {
    if (!form.title.trim()) return toast.error("Título é obrigatório");
    if (!form.assigned_member_id) return toast.error("Responsável é obrigatório");
    if (!form.case_description.trim()) return toast.error("Descrição do caso é obrigatória");
    mutation.mutate(status);
  };

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nova Petição / Serviço</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Ex: Inicial — Plano de saúde — João" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Type */}
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.service_type} onValueChange={(v) => set("service_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Responsible */}
              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Select value={form.assigned_member_id} onValueChange={(v) => set("assigned_member_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {members?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Client */}
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={form.client_contact_id} onValueChange={(v) => set("client_contact_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {contacts?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Counterpart */}
              <div className="space-y-2">
                <Label>Parte contrária</Label>
                <Select value={form.related_contact_id} onValueChange={(v) => set("related_contact_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {contacts?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Priority */}
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drive link */}
              <div className="space-y-2">
                <Label>Link do Drive</Label>
                <Input placeholder="https://drive.google.com/..." value={form.drive_link} onChange={(e) => set("drive_link", e.target.value)} />
              </div>
            </div>

            {/* Case description */}
            <div className="space-y-2">
              <Label>Descrição completa do caso *</Label>
              <Textarea placeholder="Descreva os detalhes do caso, incluindo contexto, partes envolvidas, pretensão..." value={form.case_description} onChange={(e) => set("case_description", e.target.value)} rows={6} />
            </div>

            {/* Collapsible extras */}
            <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  Campos extras (fatos, pedidos, provas)
                  <ChevronDown className={`h-4 w-4 transition-transform ${extrasOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Fatos</Label>
                  <Textarea placeholder="Fatos relevantes..." value={form.facts} onChange={(e) => set("facts", e.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Pedidos</Label>
                  <Textarea placeholder="Pedidos a serem formulados..." value={form.requests} onChange={(e) => set("requests", e.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Provas / Documentos</Label>
                  <Textarea placeholder="Lista de provas e documentos necessários..." value={form.evidence_list} onChange={(e) => set("evidence_list", e.target.value)} rows={4} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações internas</Label>
              <Textarea placeholder="Observações..." value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="secondary" onClick={() => handleSubmit("ready_to_file")} disabled={mutation.isPending}>
            Salvar como "Pronta"
          </Button>
          <Button onClick={() => handleSubmit("new")} disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
