import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useContacts } from "@/hooks/useContacts";
import { SERVICE_TYPES, PRIORITIES } from "@/hooks/useServiceRequests";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: any;
}

export function EditServiceRequestDialog({ open, onOpenChange, serviceRequest }: Props) {
  const { data: members } = useTeamMembers();
  const { data: contacts } = useContacts();
  const queryClient = useQueryClient();
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (serviceRequest && open) {
      setForm({
        title: serviceRequest.title || "",
        service_type: serviceRequest.service_type || "peticao_inicial",
        assigned_member_id: serviceRequest.assigned_member_id || "",
        client_contact_id: serviceRequest.client_contact_id || "",
        related_contact_id: serviceRequest.related_contact_id || "",
        case_description: serviceRequest.case_description || "",
        facts: serviceRequest.facts || "",
        requests: serviceRequest.requests || "",
        evidence_list: serviceRequest.evidence_list || "",
        priority: String(serviceRequest.priority ?? 0),
        drive_link: serviceRequest.drive_link || "",
        notes: serviceRequest.notes || "",
      });
      setExtrasOpen(!!(serviceRequest.facts || serviceRequest.requests || serviceRequest.evidence_list));
    }
  }, [serviceRequest, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_requests").update({
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
        drive_link: form.drive_link || null,
        notes: form.notes || null,
      }).eq("id", serviceRequest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-request", serviceRequest.id] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast.success("Petição atualizada!");
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const handleSubmit = () => {
    if (!form.title?.trim()) return toast.error("Título é obrigatório");
    if (!form.assigned_member_id) return toast.error("Responsável é obrigatório");
    if (!form.case_description?.trim()) return toast.error("Descrição do caso é obrigatória");
    mutation.mutate();
  };

  const set = (field: string, value: string) => setForm((p: any) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader><DialogTitle>Editar Petição</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.service_type} onValueChange={(v) => set("service_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Select value={form.assigned_member_id} onValueChange={(v) => set("assigned_member_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {members?.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={form.client_contact_id || "none"} onValueChange={(v) => set("client_contact_id", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {contacts?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Parte contrária</Label>
                <Select value={form.related_contact_id || "none"} onValueChange={(v) => set("related_contact_id", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {contacts?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (<SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link do Drive</Label>
                <Input value={form.drive_link || ""} onChange={(e) => set("drive_link", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição completa do caso *</Label>
              <Textarea value={form.case_description || ""} onChange={(e) => set("case_description", e.target.value)} rows={6} />
            </div>
            <Collapsible open={extrasOpen} onOpenChange={setExtrasOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  Campos extras <ChevronDown className={`h-4 w-4 transition-transform ${extrasOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Fatos</Label><Textarea value={form.facts || ""} onChange={(e) => set("facts", e.target.value)} rows={4} /></div>
                <div className="space-y-2"><Label>Pedidos</Label><Textarea value={form.requests || ""} onChange={(e) => set("requests", e.target.value)} rows={4} /></div>
                <div className="space-y-2"><Label>Provas / Documentos</Label><Textarea value={form.evidence_list || ""} onChange={(e) => set("evidence_list", e.target.value)} rows={4} /></div>
              </CollapsibleContent>
            </Collapsible>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} /></div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
