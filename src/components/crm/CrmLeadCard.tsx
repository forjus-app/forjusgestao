import { Phone, MapPin, FolderOpen, FileText, MessageCircle, MoreHorizontal, Trash2, Copy, Mail, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface CrmLeadCardProps {
  lead: any;
  columns: any[];
  onOpen: () => void;
  onMove: (toColumnId: string) => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function CrmLeadCard({ lead, columns, onOpen, onMove, onDelete, onDragStart }: CrmLeadCardProps) {
  const whatsappUrl = lead.phone
    ? `https://wa.me/${lead.phone.replace(/\D/g, "")}`
    : null;

  const tags = lead.crm_lead_tags?.map((lt: any) => lt.tags).filter(Boolean) || [];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-foreground leading-tight">{lead.name}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onOpen}>Abrir detalhes</DropdownMenuItem>
            {whatsappUrl && (
              <DropdownMenuItem onClick={() => window.open(whatsappUrl, "_blank")}>
                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
              </DropdownMenuItem>
            )}
            {lead.phone && (
              <DropdownMenuItem onClick={() => copyToClipboard(lead.phone, "Telefone")}>
                <Copy className="h-4 w-4 mr-2" /> Copiar telefone
              </DropdownMenuItem>
            )}
            {lead.email && (
              <DropdownMenuItem onClick={() => copyToClipboard(lead.email, "E-mail")}>
                <Mail className="h-4 w-4 mr-2" /> Copiar e-mail
              </DropdownMenuItem>
            )}
            {lead.drive_link && (
              <DropdownMenuItem onClick={() => window.open(lead.drive_link, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" /> Abrir Drive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {columns.map((col) =>
              col.id !== lead.column_id ? (
                <DropdownMenuItem key={col.id} onClick={() => onMove(col.id)}>
                  Mover → {col.name}
                </DropdownMenuItem>
              ) : null
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1">
        {lead.phone && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" /> {lead.phone}
          </span>
        )}
        {lead.city && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {lead.city}
          </span>
        )}
      </div>

      {lead.crm_categories?.name && (
        <Badge variant="secondary" className="text-[10px] h-5">
          {lead.crm_categories.name}
        </Badge>
      )}

      <div className="flex flex-wrap gap-1">
        {tags.map((tag: any) => (
          <Badge
            key={tag.id}
            className="text-[10px] h-5"
            style={{ backgroundColor: tag.color || undefined }}
          >
            {tag.name}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {lead.summary && <FileText className="h-3 w-3 text-muted-foreground" />}
        {lead.drive_link && <FolderOpen className="h-3 w-3 text-muted-foreground" />}
        {whatsappUrl && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto text-green-600 hover:text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              window.open(whatsappUrl, "_blank");
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
