import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isPast, isToday, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";
import { Clock, AlertTriangle, CheckCircle, User, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { DeadlineActions } from "./DeadlineActions";

interface DeadlineKanbanViewProps {
  deadlines: any[];
  onDeadlineClick: (id: string) => void;
}

const KANBAN_COLUMNS = [
  { status: "open", label: "Abertos", icon: Clock, colorClass: "border-t-blue-500" },
  { status: "in_progress", label: "Em Execução", icon: Clock, colorClass: "border-t-yellow-500" },
  { status: "completed", label: "Concluídos", icon: CheckCircle, colorClass: "border-t-green-500" },
];

export function DeadlineKanbanView({ deadlines, onDeadlineClick }: DeadlineKanbanViewProps) {
  const grouped = KANBAN_COLUMNS.map((col) => ({
    ...col,
    items: deadlines.filter((d) => d.status === col.status),
  }));

  const getPriorityBadge = (priority: number) => {
    if (priority === 2) return <Badge variant="destructive" className="text-[10px] px-1.5">Crítica</Badge>;
    if (priority === 1) return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5">Alta</Badge>;
    return null;
  };

  const getDateBadge = (fatalDate: string, status: string) => {
    if (status === "completed") return null;
    const fatal = parseLocalDateTime(fatalDate);
    if (isPast(fatal) && !isToday(fatal)) return <Badge variant="destructive" className="text-[10px] px-1.5">Vencido</Badge>;
    if (isToday(fatal)) return <Badge variant="destructive" className="text-[10px] px-1.5">Hoje!</Badge>;
    if (isBefore(fatal, addDays(new Date(), 3))) return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5">Próximo</Badge>;
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {grouped.map((col) => (
        <div key={col.status} className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3 px-1">
            <col.icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{col.label}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
              {col.items.length}
            </Badge>
          </div>
          <ScrollArea className="flex-1 max-h-[calc(100vh-380px)]">
            <div className="space-y-2 pr-2">
              {col.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs border border-dashed rounded-lg">
                  Nenhum prazo
                </div>
              ) : (
                col.items.map((deadline) => (
                  <Card
                    key={deadline.id}
                    className={`p-3 cursor-pointer hover:shadow-md transition-shadow border-t-2 ${col.colorClass}`}
                    onClick={() => onDeadlineClick(deadline.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-medium text-sm leading-tight line-clamp-2">
                          {deadline.title}
                        </h4>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DeadlineActions deadline={deadline} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {getPriorityBadge(deadline.priority)}
                        {getDateBadge(deadline.fatal_due_at, deadline.status)}
                        {deadline.type === "interno" && (
                          <Badge variant="outline" className="text-[10px] px-1.5">Interno</Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>Fatal: {format(parseLocalDateTime(deadline.fatal_due_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        </div>
                        {deadline.team_members?.name && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{deadline.team_members.name}</span>
                          </div>
                        )}
                        {deadline.cases && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            <Link
                              to={`/cases/${deadline.cases.id}`}
                              className="text-primary hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {deadline.cases.title}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
