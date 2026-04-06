import { Phone, MapPin, FolderOpen, FileText, MessageCircle, MoreHorizontal, Trash2, Copy, Mail, ExternalLink, GripVertical } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface CrmLeadCardProps {
  lead: any;
  columns: any[];
  isDragging?: boolean;
  onOpen: () => void;
  onMove: (toColumnId: string) => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function CrmLeadCard({ lead, columns, isDragging, onOpen, onMove, onDelete, onDragStart, onDragEnd }: CrmLeadCardProps) {
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
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "bg-card border rounded-lg p-3 hover:shadow-md transition-all duration-200 space-y-2 group",
        isDragging
          ? "opacity-40 scale-95 ring-2 ring-primary/30 shadow-lg rotate-1"
          : "cursor-grab active:cursor-grabbing active:shadow-lg active:scale-[1.02] active:ring-2 active:ring-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors shrink-0" />
          <h4 className="font-medium text-sm text-foreground leading-tight">{lead.name}</h4>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
            className="h-6 w-6 ml-auto text-primary/70 hover:text-primary"
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
