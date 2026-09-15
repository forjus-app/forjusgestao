import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUpdatePeticao, type Peticao } from "@/hooks/usePeticoes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peticao: Peticao | null;
}

export function ProtocolarDialog({ open, onOpenChange, peticao }: Props) {
  const update = useUpdatePeticao();
  const [processNumber, setProcessNumber] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [comarca, setComarca] = useState("");
  const [filedDate, setFiledDate] = useState("");

  useEffect(() => {
    if (open && peticao) {
      setProcessNumber(peticao.process_number || "");
      setTribunal(peticao.tribunal || "");
      setComarca(peticao.comarca || "");
      setFiledDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [open, peticao]);

  const submit = () => {
    if (!peticao) return;
    const filedAt = filedDate ? new Date(`${filedDate}T${format(new Date(), "HH:mm")}`) : new Date();
    update.mutate(
      {
        id: peticao.id,
        values: {
          status: "filed",
          filed_at: filedAt.toISOString(),
          process_number: processNumber.trim() || null,
          tribunal: tribunal.trim() || null,
          comarca: comarca.trim() || null,
        },
        logs: [
          {
            eventType: "filed",
            description: `Ação marcada como protocolada em ${format(filedAt, "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}${processNumber ? ` — processo ${processNumber}` : ""}.`,
          },
        ],
      },
      {
        onSuccess: () => {
          toast.success("Ação protocolada!");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como protocolada</DialogTitle>
          <DialogDescription>Os dados abaixo são opcionais.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Número do processo</Label>
            <Input value={processNumber} onChange={(e) => setProcessNumber(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tribunal</Label>
              <Input value={tribunal} onChange={(e) => setTribunal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Comarca</Label>
              <Input value={comarca} onChange={(e) => setComarca(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data do protocolo</Label>
            <Input type="date" value={filedDate} onChange={(e) => setFiledDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={update.isPending}>
            Confirmar protocolo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
