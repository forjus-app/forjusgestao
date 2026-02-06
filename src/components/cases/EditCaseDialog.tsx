import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface EditCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: any;
}

const NONE_VALUE = "__none__";

export function EditCaseDialog({ open, onOpenChange, caseData }: EditCaseDialogProps) {
  const queryClient = useQueryClient();
  const { data: organization } = useOrganization();

  const [formData, setFormData] = useState({
    title: "",
    cnj_number: "",
    status_id: "",
    phase_id: "",
    area_id: "",
    type_id: "",
    tribunal: "",
    court: "",
    court_division: "",
    city: "",
    state: "",
    link_url: "",
    drive_link: "",
    pending_notes: "",
    claim_value: "",
  });

  // Pre-fill form when dialog opens
  useEffect(() => {
    if (open && caseData) {
      setFormData({
        title: caseData.title || "",
        cnj_number: caseData.cnj_number || "",
        status_id: caseData.status_id || "",
        phase_id: caseData.phase_id || "",
        area_id: caseData.area_id || "",
        type_id: caseData.type_id || "",
        tribunal: caseData.tribunal || "",
        court: caseData.court || "",
        court_division: caseData.court_division || "",
        city: caseData.city || "",
        state: caseData.state || "",
        link_url: caseData.link_url || "",
        drive_link: caseData.drive_link || "",
        pending_notes: caseData.pending_notes || "",
        claim_value: caseData.claim_value ? String(caseData.claim_value) : "",
      });
    }
  }, [open, caseData]);

  // Fetch taxonomies
  const { data: statuses } = useQuery({
    queryKey: ["case-statuses", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase
        .from("case_statuses")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization && open,
  });

  const { data: phases } = useQuery({
    queryKey: ["case-phases", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase
        .from("case_phases")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization && open,
  });

  const { data: areas } = useQuery({
    queryKey: ["case-areas", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase
        .from("case_areas")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization && open,
  });

  const { data: types } = useQuery({
    queryKey: ["case-types", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await supabase
        .from("case_types")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      return data || [];
    },
    enabled: !!organization && open,
  });

  const updateCase = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        title: formData.title,
        cnj_number: formData.cnj_number || null,
        status_id: formData.status_id || null,
        phase_id: formData.phase_id || null,
        area_id: formData.area_id || null,
        type_id: formData.type_id || null,
        tribunal: formData.tribunal || null,
        court: formData.court || null,
        court_division: formData.court_division || null,
        city: formData.city || null,
        state: formData.state || null,
        link_url: formData.link_url || null,
        drive_link: formData.drive_link || null,
        pending_notes: formData.pending_notes || null,
        claim_value: formData.claim_value ? parseFloat(formData.claim_value) : null,
      };

      const { error } = await supabase
        .from("cases")
        .update(payload)
        .eq("id", caseData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Processo atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar processo:", error);
      toast.error(error.message || "Erro ao atualizar processo");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    updateCase.mutate();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value === NONE_VALUE ? "" : value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Processo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Informações Básicas
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-title">Título do Processo *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cnj">Número CNJ</Label>
                <Input
                  id="edit-cnj"
                  placeholder="0000000-00.0000.0.00.0000"
                  value={formData.cnj_number}
                  onChange={(e) => handleChange("cnj_number", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-link">Link do Processo</Label>
                <Input
                  id="edit-link"
                  type="url"
                  placeholder="https://..."
                  value={formData.link_url}
                  onChange={(e) => handleChange("link_url", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-drive">Link do Drive</Label>
                <Input
                  id="edit-drive"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formData.drive_link}
                  onChange={(e) => handleChange("drive_link", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Classificação */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Classificação
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status_id || NONE_VALUE}
                  onValueChange={(v) => handleSelectChange("status_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                    {statuses?.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fase</Label>
                <Select
                  value={formData.phase_id || NONE_VALUE}
                  onValueChange={(v) => handleSelectChange("phase_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                    {phases?.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Área</Label>
                <Select
                  value={formData.area_id || NONE_VALUE}
                  onValueChange={(v) => handleSelectChange("area_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                    {areas?.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type_id || NONE_VALUE}
                  onValueChange={(v) => handleSelectChange("type_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                    {types?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Localização
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tribunal">Tribunal</Label>
                <Input
                  id="edit-tribunal"
                  placeholder="TJSP, TRF3..."
                  value={formData.tribunal}
                  onChange={(e) => handleChange("tribunal", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-court">Comarca/Foro</Label>
                <Input
                  id="edit-court"
                  placeholder="São Paulo"
                  value={formData.court}
                  onChange={(e) => handleChange("court", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-court-division">Vara</Label>
                <Input
                  id="edit-court-division"
                  placeholder="1ª Vara Cível"
                  value={formData.court_division}
                  onChange={(e) => handleChange("court_division", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-claim-value">Valor da Causa</Label>
                <Input
                  id="edit-claim-value"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.claim_value}
                  onChange={(e) => handleChange("claim_value", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-city">Cidade</Label>
                <Input
                  id="edit-city"
                  placeholder="São Paulo"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state">Estado</Label>
                <Input
                  id="edit-state"
                  placeholder="SP"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Observações
            </h3>
            <Textarea
              placeholder="Anotações gerais sobre o processo..."
              value={formData.pending_notes}
              onChange={(e) => handleChange("pending_notes", e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateCase.isPending}>
              {updateCase.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
