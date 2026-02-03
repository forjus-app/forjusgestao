import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";

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
import { Label } from "@/components/ui/label";

import { useCreateInteraction } from "@/hooks/useSettlements";

const formSchema = z.object({
  type: z.enum(["whatsapp", "email", "phone_call", "note"]),
  direction: z.enum(["outbound", "inbound"]).optional(),
  message: z.string().min(1, "Mensagem é obrigatória"),
  occurred_at: z.string(),
  set_followup: z.boolean().default(false),
  next_followup_at: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddInteractionDialogProps {
  settlementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddInteractionDialog({ settlementId, open, onOpenChange }: AddInteractionDialogProps) {
  const createInteraction = useCreateInteraction();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "whatsapp",
      direction: "outbound",
      message: "",
      occurred_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      set_followup: false,
      next_followup_at: "",
    },
  });

  const setFollowup = form.watch("set_followup");
  const interactionType = form.watch("type");

  const onSubmit = async (data: FormData) => {
    try {
      await createInteraction.mutateAsync({
        settlement_case_id: settlementId,
        type: data.type,
        direction: data.type !== "note" ? data.direction : null,
        message: data.message,
        occurred_at: new Date(data.occurred_at).toISOString(),
        next_followup_at: data.set_followup && data.next_followup_at 
          ? new Date(data.next_followup_at).toISOString() 
          : null,
      });

      toast.success("Contato registrado com sucesso!");
      form.reset({
        type: "whatsapp",
        direction: "outbound",
        message: "",
        occurred_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        set_followup: false,
        next_followup_at: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao registrar contato");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Contato</DialogTitle>
          <DialogDescription>
            Registre uma mensagem, e-mail, ligação ou nota
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="phone_call">Ligação</SelectItem>
                        <SelectItem value="note">Nota</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {interactionType !== "note" && (
                <FormField
                  control={form.control}
                  name="direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direção</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="outbound">Enviado</SelectItem>
                          <SelectItem value="inbound">Recebido</SelectItem>
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
              name="occurred_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data/Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {interactionType === "note" ? "Conteúdo da Nota *" : "Mensagem / Resumo *"}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={
                        interactionType === "note" 
                          ? "Escreva sua anotação..." 
                          : "Descreva o conteúdo da comunicação..."
                      }
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Definir próximo follow-up */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Definir próximo follow-up</Label>
                  <p className="text-sm text-muted-foreground">
                    Agendar manualmente o próximo contato
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="set_followup"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {setFollowup && (
                <FormField
                  control={form.control}
                  name="next_followup_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data/Hora do Follow-up</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createInteraction.isPending}>
                {createInteraction.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
