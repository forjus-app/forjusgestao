import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddDeadlineDialog } from "@/components/deadlines/AddDeadlineDialog";
import { DeadlineActions } from "@/components/deadlines/DeadlineActions";
import { Calendar, Plus } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CaseDeadlinesTabProps {
  caseId: string;
}

export function CaseDeadlinesTab({ caseId }: CaseDeadlinesTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ["case-deadlines", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deadlines")
        .select(
          `
          *,
          team_members (id, name)
        `
        )
        .eq("case_id", caseId)
        .order("fatal_due_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });

  const formatDateTime = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const getDateBadge = (fatalDate: string, status: string) => {
    if (status !== "open") return null;

    const fatal = new Date(fatalDate);

    if (isPast(fatal) && !isToday(fatal)) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    if (isToday(fatal)) {
      return <Badge variant="destructive">Hoje!</Badge>;
    }
    return null;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prazos ({deadlines?.length || 0})
          </CardTitle>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Prazo
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : !deadlines || deadlines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum prazo vinculado a este processo</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddDialogOpen(true)}
              >
                Adicionar prazo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Fatal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.map((deadline) => (
                  <TableRow key={deadline.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{deadline.title}</span>
                        {getDateBadge(deadline.fatal_due_at, deadline.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {deadline.team_members?.name || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(deadline.delivery_due_at)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatDateTime(deadline.fatal_due_at)}
                    </TableCell>
                    <TableCell>
                      {deadline.status === "open" && (
                        <Badge variant="outline">Aberto</Badge>
                      )}
                      {deadline.status === "completed" && (
                        <Badge className="bg-accent text-accent-foreground">
                          Concluído
                        </Badge>
                      )}
                      {deadline.status === "reviewed" && (
                        <Badge className="bg-success text-success-foreground">
                          Conferido
                        </Badge>
                      )}
                      {deadline.status === "adjustment_requested" && (
                        <Badge variant="destructive">Ajuste</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DeadlineActions deadline={deadline} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog - pre-selected case */}
      <AddDeadlineDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        preselectedCaseId={caseId}
      />
    </>
  );
}
