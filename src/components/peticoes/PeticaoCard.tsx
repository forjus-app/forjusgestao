import { FolderOpen, GripVertical, MoreHorizontal, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PETICAO_STATUSES, getPeticaoStatus, type Peticao } from "@/hooks/usePeticoes";

interface Props {
  peticao: Peticao;
  members: { id: string; name: string }[];
  isDragging?: boolean;
  onOpen: () => void;
  onStatusChange: (status: string) => void;
  onTransfer: (memberId: string) => void;
  onDelete: () => void;
  onFile: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function PeticaoCard({
  peticao,
  members,
  isDragging,
  onOpen,
  onStatusChange,
  onTransfer,
  onDelete,
  onFile,
  onDragStart,
  onDragEnd,
}: Props) {
  const status = getPeticaoStatus(peticao.status);
  const created = new Date(peticao.created_at);
  const days = differenceInCalendarDays(new Date(), created);
  const aging = days >= 30 ? "text-destructive" : days >= 14 ? "text-orange-500" : "text-muted-foreground";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        "bg-card border rounded-md px-3 py-2.5 space-y-1.5 group transition-all duration-200",
        isDragging
          ? "opacity-40 scale-95 ring-2 ring-primary/30"
          : "cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <GripVertical className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight truncate uppercase">
              {peticao.client_name || peticao.title}
            </p>
            {peticao.action_type && (
              <p className="text-xs text-muted-foreground truncate">{peticao.action_type}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="w-56">
            <DropdownMenuItem onClick={onOpen}>Abrir detalhes</DropdownMenuItem>
            {peticao.drive_link && (
              <DropdownMenuItem onClick={() => window.open(peticao.drive_link!, "_blank")}>
                <FolderOpen className="h-4 w-4 mr-2" /> Abrir Drive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
            {PETICAO_STATUSES.filter((s) => s.value !== "filed").map((s) => (
              <DropdownMenuItem key={s.value} onClick={() => onStatusChange(s.value)}>
                <span className={cn("h-2 w-2 rounded-full mr-2", s.dot)} />
                {s.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={onFile}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar protocolada
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Transferir para</DropdownMenuLabel>
            {members
              .filter((m) => m.id !== peticao.assigned_member_id)
              .map((m) => (
                <DropdownMenuItem key={m.id} onClick={() => onTransfer(m.id)}>
                  {m.name}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between gap-2 pl-5">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
        {peticao.drive_link && <FolderOpen className="h-3 w-3 text-muted-foreground/70" />}
      </div>

      <p className={cn("pl-5 text-[11px]", aging)}>
        {peticao.filed_at
          ? `Protocolada em ${format(new Date(peticao.filed_at), "dd/MM/yyyy", { locale: ptBR })}`
          : days === 0
          ? "Criada hoje"
          : `Criada há ${days} ${days === 1 ? "dia" : "dias"} · ${format(created, "dd/MM/yyyy", { locale: ptBR })}`}
      </p>
    </div>
  );
}
