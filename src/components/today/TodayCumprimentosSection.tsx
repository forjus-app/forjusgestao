import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeadlineDetailDrawer } from "@/components/deadlines/DeadlineDetailDrawer";
import { EditDeadlineDialog } from "@/components/deadlines/EditDeadlineDialog";
import { DeadlineTagBadges } from "@/components/deadlines/DeadlineTagBadges";
import { useDeadlineTagLinks } from "@/hooks/useDeadlineTags";
import { Gavel, Check, Pencil, ExternalLink, User, Copy, ArrowRight } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDateTime } from "@/lib/dateUtils";
import { toast } from "sonner";

interface Props {
  items: any[];
  openCount: number;
  isLoading: boolean;
}

export function TodayCumprimentosSection({ items, openCount, isLoading }: Props) {
  const queryClient = useQueryClient();
  const { data: tagLinks } = useDeadlineTagLinks();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("deadlines")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cumprimento concluído!");
      queryClient.invalidateQueries({ queryKey: ["today-cumprimentos"] });
      queryClient.invalidateQueries({ queryKey: ["cumprimentos"] });
    },
    onError: () => toast.error("Erro ao concluir"),
  });

  const copyCnj = (cnj?: string | null) => {
    if (!cnj) {
      toast.error("Processo sem número CNJ");
      return;
    }
    navigator.clipboard.writeText(cnj);
    toast.success("CNJ copiado!");
  };

  const fatalBadge = (item: any) => {
    if (!item.fatal_due_at) return null;
    const fatal = parseLocalDateTime(item.fatal_due_at);
    if (isPast(fatal) && !isToday(fatal)) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Atrasado</Badge>;
    if (isToday(fatal)) return <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">Hoje</Badge>;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Gavel className="h-4 w-4 text-primary" />
            </div>
            Cumprimentos de Sentença
            <Badge variant="secondary" className="ml-1">{openCount} em aberto</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cumprimentos-sentenca">
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-6">
              <Gavel className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum cumprimento em aberto</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      setSelectedId(item.id);
                      setDetailOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      {fatalBadge(item)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      {item.fatal_due_at && (
                        <span className="font-medium text-foreground">
                          Fatal: {format(parseLocalDateTime(item.fatal_due_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      )}
                      {item.transit_judged_at && (
                        <span>
                          Trânsito: {format(parseLocalDateTime(item.transit_judged_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      {item.team_members?.name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.team_members.name}
                        </span>
                      )}
                      {item.cases && (
                        <Link
                          to={`/cases/${item.cases.id}`}
                          className="text-primary hover:underline truncate max-w-[160px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.cases.cnj_number || item.cases.title}
                        </Link>
                      )}
                    </div>
                    <DeadlineTagBadges tags={tagLinks?.[item.id]} className="mt-1" />
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Concluir"
                      onClick={() => completeMutation.mutate(item.id)}
                      disabled={completeMutation.isPending}
                    >
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar"
                      onClick={() => setEditItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Copiar CNJ"
                      onClick={() => copyCnj(item.cases?.cnj_number)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {item.drive_link && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Abrir Drive" asChild>
                        <a href={item.drive_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeadlineDetailDrawer
        deadlineId={selectedId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {editItem && (
        <EditDeadlineDialog
          deadline={editItem}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
        />
      )}
    </>
  );
}
