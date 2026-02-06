import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeadlineDetailDrawer } from "@/components/deadlines/DeadlineDetailDrawer";
import { EditDeadlineDialog } from "@/components/deadlines/EditDeadlineDialog";
import {
  AlertTriangle,
  Clock,
  Check,
  Pencil,
  ExternalLink,
  User,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface TodayDeadlinesSectionProps {
  overdue: any[];
  today: any[];
  isLoading: boolean;
}

export function TodayDeadlinesSection({
  overdue,
  today,
  isLoading,
}: TodayDeadlinesSectionProps) {
  const queryClient = useQueryClient();
  const [selectedDeadlineId, setSelectedDeadlineId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState<any | null>(null);

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("deadlines")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prazo concluído!");
      queryClient.invalidateQueries({ queryKey: ["today-deadlines"] });
      queryClient.invalidateQueries({ queryKey: ["today-stats"] });
      queryClient.invalidateQueries({ queryKey: ["deadlines"] });
    },
    onError: () => toast.error("Erro ao concluir prazo"),
  });

  const formatDateTime = (date: string) =>
    format(parseLocalDateTime(date), "dd/MM HH:mm", { locale: ptBR });

  const renderDeadlineItem = (deadline: any) => (
    <div
      key={deadline.id}
      className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
    >
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => {
          setSelectedDeadlineId(deadline.id);
          setDetailOpen(true);
        }}
      >
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{deadline.title}</p>
          {deadline.priority === 2 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Crítica
            </Badge>
          )}
          {deadline.priority === 1 && (
            <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">
              Alta
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
          <span className="font-medium text-foreground">
            Fatal: {formatDateTime(deadline.fatal_due_at)}
          </span>
          {deadline.team_members?.name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {deadline.team_members.name}
            </span>
          )}
          {deadline.cases && (
            <Link
              to={`/cases/${deadline.cases.id}`}
              className="text-primary hover:underline truncate max-w-[140px]"
              onClick={(e) => e.stopPropagation()}
            >
              {deadline.cases.title}
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Concluir"
          onClick={(e) => {
            e.stopPropagation();
            completeMutation.mutate(deadline.id);
          }}
          disabled={completeMutation.isPending}
        >
          <Check className="h-4 w-4 text-success" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Editar"
          onClick={(e) => {
            e.stopPropagation();
            setEditDeadline(deadline);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {deadline.drive_link && (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Abrir Drive" asChild>
            <a href={deadline.drive_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => <Skeleton key={j} className="h-16 w-full" />)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Atrasados */}
        <Card className={overdue.length > 0 ? "border-destructive/40" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              Prazos Atrasados
              {overdue.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {overdue.length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/deadlines">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <div className="text-center py-6">
                <Check className="h-8 w-8 mx-auto text-success mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum prazo atrasado!</p>
              </div>
            ) : (
              <div className="space-y-2">{overdue.map(renderDeadlineItem)}</div>
            )}
          </CardContent>
        </Card>

        {/* Hoje */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-warning/10">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              Prazos de Hoje
              {today.length > 0 && (
                <Badge className="bg-warning text-warning-foreground ml-1">
                  {today.length}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/deadlines">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum prazo para hoje</p>
              </div>
            ) : (
              <div className="space-y-2">{today.map(renderDeadlineItem)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeadlineDetailDrawer
        deadlineId={selectedDeadlineId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {editDeadline && (
        <EditDeadlineDialog
          deadline={editDeadline}
          open={!!editDeadline}
          onOpenChange={(open) => !open && setEditDeadline(null)}
        />
      )}
    </>
  );
}
