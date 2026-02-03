import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAddCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaseCreated: (caseId: string, caseTitle: string) => void;
}

type Step = 1 | 2 | 3;

export function QuickAddCaseDialog({
  open,
  onOpenChange,
  onCaseCreated,
}: QuickAddCaseDialogProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    title: "",
    status_id: "",
    cnj_number: "",
    link_url: "",
    drive_link: "",
  });

  // Fetch statuses
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
    enabled: open && !!organization,
  });

  const defaultStatus = statuses?.find((s) => s.is_default) || statuses?.[0];

  const createCase = useMutation({
    mutationFn: async () => {
      if (!organization) throw new Error("Organização não encontrada");
      if (!formData.title.trim()) throw new Error("Título é obrigatório");

      const { data, error } = await supabase
        .from("cases")
        .insert({
          organization_id: organization.id,
          title: formData.title,
          status_id: formData.status_id || defaultStatus?.id || null,
          cnj_number: formData.cnj_number || null,
          link_url: formData.link_url || null,
          drive_link: formData.drive_link || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["cases-search"] });
      toast.success("Processo criado e vinculado ao prazo!");
      onCaseCreated(data.id, data.title);
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar processo");
    },
  });

  const handleClose = () => {
    setFormData({
      title: "",
      status_id: "",
      cnj_number: "",
      link_url: "",
      drive_link: "",
    });
    setCurrentStep(1);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = () => {
    createCase.mutate();
  };

  const steps = [
    { number: 1, label: "Dados Básicos" },
    { number: 2, label: "Identificação" },
    { number: 3, label: "Links" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle>Cadastrar Processo Rápido</DialogTitle>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep === step.number
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.number
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.number ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 mx-1",
                      currentStep > step.number ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {steps.find((s) => s.number === currentStep)?.label}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Dados Básicos */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título do Processo *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Ação de Indenização - João vs. Empresa X"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status_id || defaultStatus?.id || ""}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses?.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Identificação */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Número CNJ</Label>
                <Input
                  value={formData.cnj_number}
                  onChange={(e) =>
                    setFormData({ ...formData, cnj_number: e.target.value })
                  }
                  placeholder="0000000-00.0000.0.00.0000"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Pode ser adicionado depois.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Links */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Link do Processo</Label>
                <Input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) =>
                    setFormData({ ...formData, link_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Link do Drive</Label>
                <Input
                  type="url"
                  value={formData.drive_link}
                  onChange={(e) =>
                    setFormData({ ...formData, drive_link: e.target.value })
                  }
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Estes dados podem ser editados posteriormente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 flex gap-2 justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createCase.isPending}
              >
                {createCase.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Processo"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
