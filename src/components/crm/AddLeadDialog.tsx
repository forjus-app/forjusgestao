import { useState } from "react";
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
import { useCreateCrmLead, useCrmCategories } from "@/hooks/useCrm";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
}

export function AddLeadDialog({ open, onOpenChange, columnId }: AddLeadDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [summary, setSummary] = useState("");
  const [driveLink, setDriveLink] = useState("");

  const createLead = useCreateCrmLead();
  const { data: categories } = useCrmCategories();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createLead.mutateAsync({
      name: name.trim(),
      phone: phone || undefined,
      city: city || undefined,
      email: email || undefined,
      category_id: categoryId || undefined,
      summary: summary || undefined,
      drive_link: driveLink || undefined,
      column_id: columnId,
    });
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setCity("");
    setEmail("");
    setCategoryId("");
    setSummary("");
    setDriveLink("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do contato" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
            </div>
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <Label>Categoria do caso</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Resumo dos fatos</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Descreva o caso..." rows={4} />
          </div>
          <div>
            <Label>Link do Google Drive</Label>
            <Input value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="https://drive.google.com/..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || createLead.isPending}>
            {createLead.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
