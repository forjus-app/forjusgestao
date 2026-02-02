import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { AddPartnerLawyerDialog } from "./AddPartnerLawyerDialog";

const formSchema = z.object({
  client_contact_id: z.string().min(1, "Cliente é obrigatório"),
  type_id: z.string().min(1, "Tipo é obrigatório"),
  partner_lawyer_id: z.string().min(1, "Advogado parceiro é obrigatório"),
  authority_name: z.string().min(1, "Órgão/Local é obrigatório"),
  city: z.string().optional(),
  state: z.string().optional(),
  process_number: z.string().optional(),
  protocol_number: z.string().optional(),
  has_official_number: z.boolean().default(false),
  portal_link: z.string().url("URL inválida").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddExternalCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddExternalCaseDialog({ open, onOpenChange }: AddExternalCaseDialogProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addPartnerOpen, setAddPartnerOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_contact_id: "",
      type_id: "",
      partner_lawyer_id: "",
      authority_name: "",
      city: "",
      state: "",
      process_number: "",
      protocol_number: "",
      has_official_number: false,
      portal_link: "",
      notes: "",
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["contacts", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("organization_id", organization.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const { data: types } = useQuery({
    queryKey: ["external-case-types", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("external_case_types")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const { data: partners } = useQuery({
    queryKey: ["partner-lawyers", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("partner_lawyers")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const { data: statuses } = useQuery({
    queryKey: ["external-case-statuses", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("external_case_statuses")
        .select("*")
        .eq("organization_id", organization.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!organization) throw new Error("Organização não encontrada");

      const defaultStatus = statuses?.find(s => s.is_default) || statuses?.[0];

      const { data: newCase, error } = await supabase
        .from("external_cases")
        .insert({
          organization_id: organization.id,
          client_contact_id: data.client_contact_id,
          type_id: data.type_id,
          partner_lawyer_id: data.partner_lawyer_id,
          authority_name: data.authority_name,
          city: data.city || null,
          state: data.state || null,
          process_number: data.process_number || null,
          protocol_number: data.protocol_number || null,
          has_official_number: data.has_official_number,
          portal_link: data.portal_link || null,
          notes: data.notes || null,
          status_id: defaultStatus?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create timeline event for case creation
      await supabase.from("external_case_timeline_events").insert({
        organization_id: organization.id,
        external_case_id: newCase.id,
        event_type: "status_change",
        title: "Caso criado",
        description: `Caso externo criado com status "${defaultStatus?.name || 'inicial'}"`,
      });

      return newCase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-cases"] });
      toast.success("Caso externo criado com sucesso");
      form.reset();
      onOpenChange(false);
      navigate(`/external-cases/${data.id}`);
    },
    onError: () => {
      toast.error("Erro ao criar caso externo");
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const states = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Caso Externo</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Cliente */}
              <FormField
                control={form.control}
                name="client_contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contacts?.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setAddContactOpen(true)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo */}
              <FormField
                control={form.control}
                name="type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Advogado Parceiro */}
              <FormField
                control={form.control}
                name="partner_lawyer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advogado Parceiro *</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione o parceiro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners?.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              {partner.name} {partner.office_name ? `(${partner.office_name})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setAddPartnerOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Órgão/Local */}
              <FormField
                control={form.control}
                name="authority_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Órgão / Local de Tramitação *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: INSS Agência Centro, Prefeitura Municipal..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cidade e Estado */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Números */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="process_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Processo</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do processo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="protocol_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Protocolo</FormLabel>
                      <FormControl>
                        <Input placeholder="Protocolo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Has Official Number */}
              <FormField
                control={form.control}
                name="has_official_number"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Possui número oficial</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Marque se o processo já tem numeração oficial
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Portal Link */}
              <FormField
                control={form.control}
                name="portal_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link do Portal</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observações */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionais sobre o caso..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Caso Externo"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AddContactDialog open={addContactOpen} onOpenChange={setAddContactOpen} />
      <AddPartnerLawyerDialog open={addPartnerOpen} onOpenChange={setAddPartnerOpen} />
    </>
  );
}
