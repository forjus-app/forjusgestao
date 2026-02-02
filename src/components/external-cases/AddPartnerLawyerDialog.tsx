import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  oab: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  office_name: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface AddPartnerLawyerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPartner?: any;
}

export function AddPartnerLawyerDialog({ 
  open, 
  onOpenChange,
  editingPartner 
}: AddPartnerLawyerDialogProps) {
  const { data: organization } = useOrganization();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      oab: "",
      email: "",
      whatsapp: "",
      office_name: "",
      notes: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (editingPartner) {
      form.reset({
        name: editingPartner.name || "",
        oab: editingPartner.oab || "",
        email: editingPartner.email || "",
        whatsapp: editingPartner.whatsapp || "",
        office_name: editingPartner.office_name || "",
        notes: editingPartner.notes || "",
        is_active: editingPartner.is_active ?? true,
      });
    } else {
      form.reset({
        name: "",
        oab: "",
        email: "",
        whatsapp: "",
        office_name: "",
        notes: "",
        is_active: true,
      });
    }
  }, [editingPartner, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!organization) throw new Error("Organização não encontrada");

      if (editingPartner) {
        const { error } = await supabase
          .from("partner_lawyers")
          .update({
            name: data.name,
            oab: data.oab || null,
            email: data.email || null,
            whatsapp: data.whatsapp || null,
            office_name: data.office_name || null,
            notes: data.notes || null,
            is_active: data.is_active,
          })
          .eq("id", editingPartner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("partner_lawyers")
          .insert({
            organization_id: organization.id,
            name: data.name,
            oab: data.oab || null,
            email: data.email || null,
            whatsapp: data.whatsapp || null,
            office_name: data.office_name || null,
            notes: data.notes || null,
            is_active: data.is_active,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-lawyers"] });
      toast.success(editingPartner ? "Parceiro atualizado com sucesso" : "Parceiro criado com sucesso");
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error(editingPartner ? "Erro ao atualizar parceiro" : "Erro ao criar parceiro");
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingPartner ? "Editar Advogado Parceiro" : "Novo Advogado Parceiro"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="oab"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OAB</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: SP 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="office_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Escritório</FormLabel>
                  <FormControl>
                    <Input placeholder="Escritório parceiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionais..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Parceiros inativos não aparecem na seleção
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : editingPartner ? "Salvar" : "Criar Parceiro"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
