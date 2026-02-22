import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TribunalSelect } from "@/components/cases/TribunalSelect";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: any;
}

export function ConvertToCaseDialog({ open, onOpenChange, serviceRequest }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  const [form, setForm] = useState({
    title: "",
    cnj_number: "",
    tribunal: "",
    link_url: "",
    drive_link: "",
  });

  // Reset form when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && serviceRequest) {
      setForm({
        title: serviceRequest.title || "",
        cnj_number: "",
        tribunal: "",
        link_url: "",
        drive_link: serviceRequest.drive_link || "",
      });
    }
    onOpenChange(isOpen);
  };

  const { data: statuses } = useQuery({
    queryKey: ["case-statuses", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase.from("case_statuses").select("*").eq("organization_id", organization.id).order("sort_order");
      return data || [];
    },
    enabled: !!organization && open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("Organização não encontrada");

      const defaultStatus = statuses?.find((s) => s.is_default) || statuses?.[0];

      // 1. Create case
      const { data: newCase, error: caseError } = await supabase
        .from("cases")
        .insert({
          organization_id: organization.id,
          title: form.title,
          cnj_number: form.cnj_number || null,
          tribunal: form.tribunal || null,
          link_url: form.link_url || null,
          drive_link: form.drive_link || null,
          status_id: defaultStatus?.id || null,
          pending_notes: serviceRequest.case_description || null,
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // 2. Link client as primary party
      if (serviceRequest.client_contact_id) {
        await supabase.from("case_parties").insert({
          organization_id: organization.id,
          case_id: newCase.id,
          contact_id: serviceRequest.client_contact_id,
          role: "cliente",
          is_primary_client: true,
        });
      }

      // 3. Link counterpart
      if (serviceRequest.related_contact_id) {
        await supabase.from("case_parties").insert({
          organization_id: organization.id,
          case_id: newCase.id,
          contact_id: serviceRequest.related_contact_id,
          role: "parte_contraria",
          is_primary_client: false,
        });
      }

      // 4. Update service request
      await supabase.from("service_requests").update({
        case_id: newCase.id,
        status: "filed",
      }).eq("id", serviceRequest.id);

      // 5. Create timeline event
      await supabase.from("case_timeline_events").insert({
        organization_id: organization.id,
        case_id: newCase.id,
        event_type: "note",
        title: "Processo criado a partir de Petição Nova",
        description: `Petição "${serviceRequest.title}" convertida em processo.`,
      });

      return newCase;
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["service-request"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Processo criado com sucesso!");
      onOpenChange(false);
      navigate(`/cases/${newCase.id}`);
    },
    onError: () => toast.error("Erro ao converter em processo"),
  });

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Converter em Processo</DialogTitle>
          <DialogDescription>Confirme os dados para criar o processo judicial</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título do Processo *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Número CNJ</Label>
            <Input placeholder="0000000-00.0000.0.00.0000" value={form.cnj_number} onChange={(e) => set("cnj_number", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tribunal</Label>
            <TribunalSelect value={form.tribunal} onChange={(v) => set("tribunal", v)} />
          </div>
          <div className="space-y-2">
            <Label>Link do Processo</Label>
            <Input placeholder="https://..." value={form.link_url} onChange={(e) => set("link_url", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Link do Drive</Label>
            <Input value={form.drive_link} onChange={(e) => set("drive_link", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.title.trim()}>
            {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : "Criar Processo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
