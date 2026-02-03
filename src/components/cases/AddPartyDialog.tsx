import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Search, Building, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddPartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  existingPartyIds?: string[];
}

const roleOptions = [
  { value: "cliente", label: "Cliente" },
  { value: "autor", label: "Autor" },
  { value: "reu", label: "Réu" },
  { value: "testemunha", label: "Testemunha" },
  { value: "adv_contrario", label: "Advogado Contrário" },
];

const sideOptions = [
  { value: "ativo", label: "Polo Ativo" },
  { value: "passivo", label: "Polo Passivo" },
];

export function AddPartyDialog({
  open,
  onOpenChange,
  caseId,
  existingPartyIds = [],
}: AddPartyDialogProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [role, setRole] = useState("cliente");
  const [side, setSide] = useState<string | undefined>();
  const [isPrimaryClient, setIsPrimaryClient] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts", organization?.id, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*")
        .order("name");

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cpf_cnpj.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
    enabled: open && !!organization?.id,
  });

  const addPartyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContactId || !organization?.id) {
        throw new Error("Selecione um contato");
      }

      const { error } = await supabase.from("case_parties").insert({
        organization_id: organization.id,
        case_id: caseId,
        contact_id: selectedContactId,
        role,
        side: side || null,
        is_primary_client: isPrimaryClient,
        notes: notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Parte vinculada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      handleClose();
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Este contato já está vinculado com este papel");
      } else {
        toast.error("Erro ao vincular parte: " + error.message);
      }
    },
  });

  const handleClose = () => {
    setSearchTerm("");
    setSelectedContactId(null);
    setRole("cliente");
    setSide(undefined);
    setIsPrimaryClient(false);
    setNotes("");
    onOpenChange(false);
  };

  const selectedContact = contacts?.find((c) => c.id === selectedContactId);
  const availableContacts = contacts?.filter(
    (c) => !existingPartyIds.includes(c.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle>Adicionar Parte ao Processo</DialogTitle>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
          {/* Search and contact selection */}
          <div className="space-y-2">
            <Label>Buscar Contato</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Contact list */}
          <div className="space-y-2">
            <Label>Selecione o Contato</Label>
            <ScrollArea className="h-48 rounded-md border">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando...
                </div>
              ) : availableContacts?.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm
                    ? "Nenhum contato encontrado"
                    : "Nenhum contato disponível"}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {availableContacts?.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => setSelectedContactId(contact.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedContactId === contact.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          selectedContactId === contact.id
                            ? "bg-primary-foreground/20"
                            : "bg-muted"
                        }`}
                      >
                        {contact.type === "PJ" ? (
                          <Building className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p
                          className={`text-sm truncate ${
                            selectedContactId === contact.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {contact.email || contact.phone || contact.cpf_cnpj || "-"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Selected contact info */}
          {selectedContact && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm font-medium">Selecionado:</p>
              <p className="text-sm text-muted-foreground">
                {selectedContact.name} ({selectedContact.type})
              </p>
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label>Papel no Processo *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Polo (opcional)</Label>
            <Select value={side || "none"} onValueChange={(v) => setSide(v === "none" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o polo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {sideOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary client toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">Cliente Principal</Label>
              <p className="text-sm text-muted-foreground">
                Marcar como o cliente principal deste processo
              </p>
            </div>
            <Switch
              checked={isPrimaryClient}
              onCheckedChange={setIsPrimaryClient}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Notas sobre a participação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            onClick={() => addPartyMutation.mutate()}
            disabled={!selectedContactId || addPartyMutation.isPending}
          >
            {addPartyMutation.isPending ? "Vinculando..." : "Vincular Parte"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
