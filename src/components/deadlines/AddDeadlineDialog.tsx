import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, isWeekend, format } from "date-fns";
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
import { toast } from "sonner";
import { Plus, Search, FolderOpen, Copy, Check, ExternalLink, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuickAddCaseDialog } from "./QuickAddCaseDialog";
import { toLocalISOString } from "@/lib/dateUtils";

interface AddDeadlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCaseId?: string;
}

const priorityOptions = [
  { value: "0", label: "Normal" },
  { value: "1", label: "Alta" },
  { value: "2", label: "Crítica" },
];

const datePresets = [
  { label: "5 dias", days: 5 },
  { label: "10 dias", days: 10 },
  { label: "15 dias", days: 15 },
  { label: "20 dias", days: 20 },
  { label: "30 dias", days: 30 },
];

function addBusinessDays(startDate: Date, numDays: number): Date {
  let current = startDate;
  let added = 0;
  while (added < numDays) {
    current = addDays(current, 1);
    if (!isWeekend(current)) {
      added++;
    }
  }
  return current;
}

function computeTargetDate(numDays: number, useBusinessDays: boolean): string {
  const now = new Date();
  const target = useBusinessDays ? addBusinessDays(now, numDays) : addDays(now, numDays);
  target.setHours(18, 0, 0, 0);
  return format(target, "yyyy-MM-dd'T'HH:mm");
}

export function AddDeadlineDialog({
  open,
  onOpenChange,
  preselectedCaseId,
}: AddDeadlineDialogProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    type: preselectedCaseId ? "processual" : "interno",
    caseId: preselectedCaseId || "",
    responsibleMemberId: "",
    deliveryDueAt: "",
    fatalDueAt: "",
    priority: "0",
    notes: "",
    driveLink: "",
  });
  const [caseSearch, setCaseSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [quickAddCaseOpen, setQuickAddCaseOpen] = useState(false);
  const [newlyCreatedCase, setNewlyCreatedCase] = useState<{ id: string; title: string } | null>(null);
  const [dayMode, setDayMode] = useState<"business" | "calendar">("business");

  const applyDatePreset = useCallback((days: number) => {
    const useBusinessDays = dayMode === "business";
    const deliveryDate = computeTargetDate(days - 2 > 0 ? days - 2 : days, useBusinessDays);
    const fatalDate = computeTargetDate(days, useBusinessDays);
    setFormData(prev => ({ ...prev, deliveryDueAt: deliveryDate, fatalDueAt: fatalDate }));
  }, [dayMode]);

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
        .select("id, title, cnj_number, drive_link")
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
    enabled: open && !!organization?.id && formData.type === "processual",
  });

  // Get selected case with drive_link
  const selectedCase = cases?.find((c) => c.id === formData.caseId);

  // Query for preselected case drive_link
  const { data: preselectedCase } = useQuery({
    queryKey: ["case-drive-link", preselectedCaseId],
    queryFn: async () => {
      if (!preselectedCaseId) return null;
      const { data, error } = await supabase
        .from("cases")
        .select("id, title, drive_link")
        .eq("id", preselectedCaseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!preselectedCaseId && open,
  });

  const caseDriveLink = preselectedCaseId ? preselectedCase?.drive_link : selectedCase?.drive_link;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      // Validate
      if (!formData.title) throw new Error("Título é obrigatório");
      if (!formData.responsibleMemberId)
        throw new Error("Responsável é obrigatório");
      if (!formData.deliveryDueAt)
        throw new Error("Data de entrega é obrigatória");
      if (!formData.fatalDueAt) throw new Error("Data fatal é obrigatória");
      if (
        formData.type === "processual" &&
        !formData.caseId &&
        !preselectedCaseId
      ) {
        throw new Error("Processo é obrigatório para prazos processuais");
      }

      const deliveryDate = new Date(formData.deliveryDueAt);
      const fatalDate = new Date(formData.fatalDueAt);
      if (fatalDate < deliveryDate) {
        throw new Error("Data fatal deve ser maior ou igual à data de entrega");
      }

      const { error } = await supabase.from("deadlines").insert({
        organization_id: organization.id,
        type: formData.type,
        case_id:
          formData.type === "processual"
            ? formData.caseId || preselectedCaseId
            : null,
        title: formData.title,
        responsible_member_id: formData.responsibleMemberId,
        delivery_due_at: toLocalISOString(formData.deliveryDueAt),
        fatal_due_at: toLocalISOString(formData.fatalDueAt),
        priority: parseInt(formData.priority),
        notes: formData.notes || null,
        drive_link: formData.driveLink || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prazo criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
      if (preselectedCaseId) {
        queryClient.invalidateQueries({
          queryKey: ["case-deadlines", preselectedCaseId],
        });
      }
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar prazo");
    },
  });

  const handleClose = () => {
    setFormData({
      title: "",
      type: preselectedCaseId ? "processual" : "interno",
      caseId: preselectedCaseId || "",
      responsibleMemberId: "",
      deliveryDueAt: "",
      fatalDueAt: "",
      priority: "0",
      notes: "",
      driveLink: "",
    });
    setCaseSearch("");
    setCopied(false);
    setNewlyCreatedCase(null);
    onOpenChange(false);
  };

  const handleCaseCreated = (caseId: string, caseTitle: string) => {
    setFormData({ ...formData, caseId });
    setNewlyCreatedCase({ id: caseId, title: caseTitle });
  };

  const handleUseCaseDriveLink = () => {
    if (caseDriveLink) {
      setFormData({ ...formData, driveLink: caseDriveLink });
      toast.success("Link do Drive do processo copiado");
    }
  };

  const handleCopyDriveLink = () => {
    if (formData.driveLink) {
      navigator.clipboard.writeText(formData.driveLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copiado!");
    }
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle>Novo Prazo</DialogTitle>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Contestação, Petição inicial..."
              />
            </div>

            {/* Type */}
            {!preselectedCaseId && (
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v, caseId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processual">Processual</SelectItem>
                    <SelectItem value="interno">Interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Case selection (only for processual) */}
            {formData.type === "processual" && !preselectedCaseId && (
              <div className="space-y-2">
                <Label>Processo *</Label>
                
                {/* Show newly created case */}
                {newlyCreatedCase && formData.caseId === newlyCreatedCase.id ? (
                  <div className="p-3 rounded-md border bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{newlyCreatedCase.title}</p>
                        <p className="text-xs text-muted-foreground">Processo recém-criado</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData({ ...formData, caseId: "" });
                          setNewlyCreatedCase(null);
                        }}
                      >
                        Alterar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
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
                            onClick={() =>
                              setFormData({ ...formData, caseId: c.id })
                            }
                            className={`w-full text-left p-2 rounded text-sm transition-colors ${
                              formData.caseId === c.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            <p className="font-medium truncate">{c.title}</p>
                            {c.cnj_number && (
                              <p
                                className={`text-xs truncate ${
                                  formData.caseId === c.id
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
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
                    
                    {/* Quick add case button */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-sm text-muted-foreground">Não encontrou o processo?</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickAddCaseOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Cadastrar processo
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Responsible */}
            <div className="space-y-2">
              <Label>Responsável *</Label>
              <Select
                value={formData.responsibleMemberId}
                onValueChange={(v) =>
                  setFormData({ ...formData, responsibleMemberId: v })
                }
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
              {(!teamMembers || teamMembers.length === 0) && (
                <p className="text-sm text-destructive">
                  Nenhum membro ativo. Cadastre em Configurações → Equipe.
                </p>
              )}
            </div>

            {/* Date shortcuts */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Atalho de datas
              </Label>
              <div className="flex items-center gap-4 mb-2">
                <RadioGroup
                  value={dayMode}
                  onValueChange={(v) => setDayMode(v as "business" | "calendar")}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business" className="text-sm font-normal cursor-pointer">Dias úteis</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="calendar" id="calendar" />
                    <Label htmlFor="calendar" className="text-sm font-normal cursor-pointer">Dias corridos</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex flex-wrap gap-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.days}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDatePreset(preset.days)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Entrega *</Label>
                <Input
                  type="datetime-local"
                  value={formData.deliveryDueAt}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryDueAt: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fatal *</Label>
                <Input
                  type="datetime-local"
                  value={formData.fatalDueAt}
                  onChange={(e) =>
                    setFormData({ ...formData, fatalDueAt: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drive Link */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Link do Drive
              </Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={formData.driveLink}
                  onChange={(e) =>
                    setFormData({ ...formData, driveLink: e.target.value })
                  }
                  className="flex-1"
                />
                {formData.driveLink && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyDriveLink}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      asChild
                    >
                      <a href={formData.driveLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </>
                )}
              </div>
              {/* Botão para herdar do processo */}
              {formData.type === "processual" && 
               (formData.caseId || preselectedCaseId) && 
               caseDriveLink && 
               !formData.driveLink && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseCaseDriveLink}
                  className="w-full"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Usar Link do Drive do Processo
                </Button>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Detalhes adicionais..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Criando..." : "Criar Prazo"}
          </Button>
        </div>
      </DialogContent>

      {/* Quick Add Case Dialog */}
      <QuickAddCaseDialog
        open={quickAddCaseOpen}
        onOpenChange={setQuickAddCaseOpen}
        onCaseCreated={handleCaseCreated}
      />
    </Dialog>
  );
}
