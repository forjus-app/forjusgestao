import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ACTION_TYPES, useCreatePeticao } from "@/hooks/usePeticoes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: { id: string; name: string }[];
  defaultMemberId?: string;
}

export function AddPeticaoDialog({ open, onOpenChange, members, defaultMemberId }: Props) {
  const create = useCreatePeticao();
  const [clientName, setClientName] = useState("");
  const [typeChoice, setTypeChoice] = useState("Ação de Indenização");
  const [customType, setCustomType] = useState("");
  const [memberId, setMemberId] = useState("");
  const [facts, setFacts] = useState("");
  const [driveLink, setDriveLink] = useState("");

  useEffect(() => {
    if (open) {
      setClientName("");
      setTypeChoice("Ação de Indenização");
      setCustomType("");
      setMemberId(defaultMemberId || "");
      setFacts("");
      setDriveLink("");
    }
  }, [open, defaultMemberId]);

  const submit = () => {
    if (!clientName.trim()) return toast.error("Informe o nome do cliente");
    if (!memberId) return toast.error("Selecione o responsável");
    const actionType = typeChoice === "Outros" ? customType.trim() || "Outros" : typeChoice;
    create.mutate(
      {
        client_name: clientName.trim(),
        action_type: actionType,
        assigned_member_id: memberId,
        facts: facts.trim(),
        drive_link: driveLink.trim(),
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Ação</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[65vh] pr-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo da ação</Label>
                <Select value={typeChoice} onValueChange={setTypeChoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsável *</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {typeChoice === "Outros" && (
              <div className="space-y-2">
                <Label>Descreva o tipo da ação</Label>
                <Input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Digite o tipo da ação"
                />
              </div>
            )}

            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Criada em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} (registrado automaticamente)
            </div>

            <div className="space-y-2">
              <Label>Fatos / Resumo do caso</Label>
              <Textarea
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                rows={10}
                placeholder="O que aconteceu, relato do cliente, problema jurídico, pedidos pretendidos, observações internas..."
              />
            </div>

            <div className="space-y-2">
              <Label>Link do Drive</Label>
              <Input
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Criar ação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
