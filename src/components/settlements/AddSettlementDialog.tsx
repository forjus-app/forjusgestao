import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { useCreateSettlement } from "@/hooks/useSettlements";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useContacts } from "@/hooks/useContacts";
import { useCases } from "@/hooks/useCases";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  assigned_member_id: z.string().min(1, "Responsável é obrigatório"),
  client_contact_id: z.string().optional(),
  counterparty_contact_id: z.string().optional(),
  case_id: z.string().optional(),
  status: z.string().default("open"),
  notes: z.string().optional(),
  followup_enabled: z.boolean().default(false),
  followup_every_n_days: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSettlementDialog({ open, onOpenChange }: AddSettlementDialogProps) {
  const [linkToCase, setLinkToCase] = useState(false);
  
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: contacts = [] } = useContacts();
  const { data: cases = [] } = useCases();
  const createSettlement = useCreateSettlement();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      assigned_member_id: "",
      client_contact_id: "",
      counterparty_contact_id: "",
      case_id: "",
      status: "open",
      notes: "",
      followup_enabled: false,
      followup_every_n_days: undefined,
    },
  });

  const followupEnabled = form.watch("followup_enabled");

  const onSubmit = async (data: FormData) => {
    try {
      await createSettlement.mutateAsync({
        title: data.title,
        assigned_member_id: data.assigned_member_id,
        client_contact_id: data.client_contact_id || null,
        counterparty_contact_id: data.counterparty_contact_id || null,
        case_id: linkToCase && data.case_id ? data.case_id : null,
        status: data.status,
        notes: data.notes || null,
        followup_enabled: data.followup_enabled,
        followup_every_n_days: data.followup_enabled ? data.followup_every_n_days : null,
      });

      toast.success("Acordo criado com sucesso!");
      form.reset();
      setLinkToCase(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao criar acordo");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Acordo</DialogTitle>
          <DialogDescription>
            Cadastre uma nova negociação ou acordo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Acordo trabalhista - João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="counterparty_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraparte</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Vinculação a processo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Vincular a processo</FormLabel>
                <Switch checked={linkToCase} onCheckedChange={setLinkToCase} />
              </div>
              
              {linkToCase && (
                <FormField
                  control={form.control}
                  name="case_id"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o processo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cases.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.cnj_number || c.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="negotiating">Negociando</SelectItem>
                      <SelectItem value="awaiting_response">Aguardando Resposta</SelectItem>
                      <SelectItem value="closed">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Automação de follow-up */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-base">Automação de Follow-up</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Agendar automaticamente após cada contato enviado
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="followup_enabled"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {followupEnabled && (
                <FormField
                  control={form.control}
                  name="followup_every_n_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agendar a cada (dias)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          placeholder="Ex: 3" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Anotações sobre a negociação..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSettlement.isPending}>
                {createSettlement.isPending ? "Salvando..." : "Criar Acordo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
