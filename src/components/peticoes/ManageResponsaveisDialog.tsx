import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  is_active: boolean;
  show_in_kanban?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
}

export function ManageResponsaveisDialog({ open, onOpenChange, members }: Props) {
  const { data: organization } = useOrganization();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["team-members"] });
    qc.invalidateQueries({ queryKey: ["peticao-members"] });
  };

  const createMember = useMutation({
    mutationFn: async (name: string) => {
      if (!organization) throw new Error("Organização não encontrada");
      const { error } = await supabase.from("team_members").insert({
        organization_id: organization.id,
        name,
        role: "advogado",
        is_active: true,
        show_in_kanban: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName("");
      refresh();
      toast.success("Responsável cadastrado!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao cadastrar"),
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, any> }) => {
      const { error } = await supabase.from("team_members").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => refresh(),
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar"),
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { count } = await supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("assigned_member_id", id);
      if (count && count > 0) throw new Error("Este responsável possui ações vinculadas. Inative-o em vez de excluir.");
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Responsável excluído");
    },
    onError: (e: any) => toast.error(e.message || "Não foi possível excluir"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Responsáveis</DialogTitle>
          <DialogDescription>Cadastre, edite, inative e escolha quem aparece no Kanban.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do responsável"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) createMember.mutate(newName.trim());
            }}
          />
          <Button onClick={() => newName.trim() && createMember.mutate(newName.trim())} disabled={createMember.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        <ScrollArea className="max-h-[50vh] pr-3">
          <div className="space-y-2">
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum responsável cadastrado.</p>
            )}
            {members.map((m) => (
              <div key={m.id} className={cn("border rounded-md p-3 space-y-2", !m.is_active && "opacity-60")}>
                <div className="flex items-center gap-2">
                  {editingId === m.id ? (
                    <>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          if (editName.trim()) updateMember.mutate({ id: m.id, values: { name: editName.trim() } });
                          setEditingId(null);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium flex-1">{m.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingId(m.id);
                          setEditName(m.name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMember.mutate(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-6 pl-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={m.is_active}
                      onCheckedChange={(v) => updateMember.mutate({ id: m.id, values: { is_active: v } })}
                    />
                    <Label className="text-xs text-muted-foreground">Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={m.show_in_kanban !== false}
                      onCheckedChange={(v) => updateMember.mutate({ id: m.id, values: { show_in_kanban: v } })}
                    />
                    <Label className="text-xs text-muted-foreground">Mostrar no Kanban</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
