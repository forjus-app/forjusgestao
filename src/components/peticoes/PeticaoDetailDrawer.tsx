import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  ACTION_TYPES,
  PETICAO_CHECKLIST,
  PETICAO_STATUSES,
  getPeticaoStatus,
  normalizeStatus,
  usePeticaoHistory,
  useUpdatePeticao,
  type Peticao,
} from "@/hooks/usePeticoes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peticao: Peticao | null;
  members: { id: string; name: string }[];
  onFile: () => void;
}

export function PeticaoDetailDrawer({ open, onOpenChange, peticao, members, onFile }: Props) {
  const update = useUpdatePeticao();
  const { data: history } = usePeticaoHistory(peticao?.id);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (peticao && open) {
      setForm({
        client_name: peticao.client_name || peticao.title || "",
        action_type: peticao.action_type || "",
        assigned_member_id: peticao.assigned_member_id,
        status: normalizeStatus(peticao.status),
        facts: peticao.facts || peticao.case_description || "",
        drive_link: peticao.drive_link || "",
        notes: peticao.notes || "",
      });
    }
  }, [peticao, open]);

  if (!peticao) return null;

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));
  const status = getPeticaoStatus(form.status);

  const save = () => {
    const logs: { eventType: string; description: string }[] = [];
    const oldMember = members.find((m) => m.id === peticao.assigned_member_id)?.name || "—";
    const newMember = members.find((m) => m.id === form.assigned_member_id)?.name || "—";

    if (form.assigned_member_id !== peticao.assigned_member_id)
      logs.push({ eventType: "transfer", description: `Responsável alterado de ${oldMember} para ${newMember}.` });
    if (normalizeStatus(form.status) !== normalizeStatus(peticao.status))
      logs.push({ eventType: "status", description: `Status alterado para ${getPeticaoStatus(form.status).label}.` });
    if ((form.facts || "") !== (peticao.facts || ""))
      logs.push({ eventType: "facts", description: "Fatos do caso atualizados." });
    if ((form.drive_link || "") !== (peticao.drive_link || ""))
      logs.push({
        eventType: "drive",
        description: peticao.drive_link ? "Link do Drive alterado." : "Link do Drive adicionado.",
      });
    if ((form.action_type || "") !== (peticao.action_type || ""))
      logs.push({ eventType: "type", description: `Tipo da ação alterado para ${form.action_type || "—"}.` });

    update.mutate(
      {
        id: peticao.id,
        values: {
          client_name: form.client_name,
          title: `${form.client_name}${form.action_type ? ` — ${form.action_type}` : ""}`,
          action_type: form.action_type || null,
          assigned_member_id: form.assigned_member_id,
          status: form.status,
          facts: form.facts || null,
          case_description: form.facts || "",
          drive_link: form.drive_link || null,
          notes: form.notes || null,
        },
        logs,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", status.dot)} />
            {form.client_name || peticao.title}
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">
            Criada em {format(new Date(peticao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input value={form.client_name || ""} onChange={(e) => set("client_name", e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo da ação</Label>
                <Input
                  value={form.action_type || ""}
                  onChange={(e) => set("action_type", e.target.value)}
                  list="peticao-action-types"
                />
                <datalist id="peticao-action-types">
                  {ACTION_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={form.assigned_member_id} onValueChange={(v) => set("assigned_member_id", v)}>
                  <SelectTrigger>
                    <SelectValue />
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

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PETICAO_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fatos do caso</Label>
              <Textarea value={form.facts || ""} onChange={(e) => set("facts", e.target.value)} rows={10} />
            </div>

            <div className="space-y-2">
              <Label>Link do Drive</Label>
              <div className="flex gap-2">
                <Input value={form.drive_link || ""} onChange={(e) => set("drive_link", e.target.value)} />
                {form.drive_link && (
                  <Button variant="outline" size="icon" onClick={() => window.open(form.drive_link, "_blank")}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Checklist de documentos</Label>
              <div className="rounded-md border divide-y">
                {PETICAO_CHECKLIST.map((item) => {
                  const checked = !!(form.checklist || {})[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          setForm((p: any) => ({
                            ...p,
                            checklist: { ...(p.checklist || {}), [item.key]: !!v },
                          }))
                        }
                      />
                      <span className={cn(checked && "text-muted-foreground line-through")}>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </div>

            {peticao.filed_at && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Protocolada
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(peticao.filed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {peticao.process_number && <p className="text-xs">Processo: {peticao.process_number}</p>}
                {peticao.tribunal && <p className="text-xs">Tribunal: {peticao.tribunal}</p>}
                {peticao.comarca && <p className="text-xs">Comarca: {peticao.comarca}</p>}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label>Histórico</Label>
              <div className="space-y-2">
                {(history || []).length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum registro ainda.</p>
                )}
                {(history || []).map((h: any) => (
                  <div key={h.id} className="border-l-2 border-border pl-3 py-1">
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(h.occurred_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-xs">{h.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t">
          {normalizeStatus(peticao.status) !== "filed" ? (
            <Button variant="outline" size="sm" onClick={onFile}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Protocolada
            </Button>
          ) : (
            <Badge variant="secondary">Concluída</Badge>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
