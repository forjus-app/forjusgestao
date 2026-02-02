import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Calendar, Plus, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  });
  const [caseSearch, setCaseSearch] = useState("");

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
    enabled: open && !!organization?.id && formData.type === "processual",
  });

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
        delivery_due_at: formData.deliveryDueAt,
        fatal_due_at: formData.fatalDueAt,
        priority: parseInt(formData.priority),
        notes: formData.notes || null,
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
    });
    setCaseSearch("");
    onOpenChange(false);
  };

  const selectedCase = cases?.find((c) => c.id === formData.caseId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Prazo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Criando..." : "Criar Prazo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
