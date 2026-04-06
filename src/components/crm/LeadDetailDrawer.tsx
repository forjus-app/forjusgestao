import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, ExternalLink, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useUpdateCrmLead, useCrmCategories, useCrmLeadHistory, useManageCrmLeadTags } from "@/hooks/useCrm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface LeadDetailDrawerProps {
  lead: any | null;
  columns: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailDrawer({ lead, columns, open, onOpenChange }: LeadDetailDrawerProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [summary, setSummary] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const updateLead = useUpdateCrmLead();
  const manageTags = useManageCrmLeadTags();
  const { data: categories } = useCrmCategories();
  const { data: history } = useCrmLeadHistory(lead?.id);
  const { data: organization } = useOrganization();

  const { data: allTags } = useQuery({
    queryKey: ["tags", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase.from("tags").select("*").eq("organization_id", organization.id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  useEffect(() => {
    if (lead) {
      setName(lead.name || "");
      setPhone(lead.phone || "");
      setCity(lead.city || "");
      setEmail(lead.email || "");
      setCategoryId(lead.category_id || "");
      setSummary(lead.summary || "");
      setDriveLink(lead.drive_link || "");
      setSelectedTags(lead.crm_lead_tags?.map((lt: any) => lt.tag_id) || []);
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead || !name.trim()) return;
    await updateLead.mutateAsync({
      id: lead.id,
      name: name.trim(),
      phone: phone || null,
      city: city || null,
      email: email || null,
      category_id: categoryId || null,
      summary: summary || null,
      drive_link: driveLink || null,
    });
    await manageTags.mutateAsync({ leadId: lead.id, tagIds: selectedTags });
    toast.success("Lead atualizado!");
    onOpenChange(false);
  };

  const whatsappUrl = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Lead</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefone</Label>
              <div className="flex gap-2">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1" />
                {whatsappUrl && (
                  <Button variant="outline" size="icon" onClick={() => window.open(whatsappUrl, "_blank")} className="text-green-600">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {allTags?.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color || undefined } : {}}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Resumo dos fatos</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} />
          </div>
          <div>
            <Label>Link do Google Drive</Label>
            <div className="flex gap-2">
              <Input value={driveLink} onChange={(e) => setDriveLink(e.target.value)} className="flex-1" />
              {driveLink && (
                <Button variant="outline" size="icon" onClick={() => window.open(driveLink, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={!name.trim() || updateLead.isPending} className="flex-1">
              Salvar alterações
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>

          {history && history.length > 0 && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-semibold">Histórico de movimentação</Label>
                <div className="space-y-2 mt-2">
                  {history.map((h: any) => (
                    <div key={h.id} className="text-xs text-muted-foreground border-l-2 border-primary/20 pl-3 py-1">
                      <span className="font-medium">{(h as any).from_col?.name || "—"}</span>
                      {" → "}
                      <span className="font-medium">{(h as any).to_col?.name || "—"}</span>
                      <br />
                      {format(new Date(h.moved_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Criado em: {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            <p>Atualizado em: {format(new Date(lead.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
