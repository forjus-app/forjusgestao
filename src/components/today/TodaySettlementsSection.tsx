import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Handshake,
  AlertTriangle,
  Calendar,
  User,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";

const statusLabels: Record<string, string> = {
  open: "Aberto",
  negotiating: "Negociando",
  awaiting_response: "Aguardando",
  closed: "Encerrado",
};

interface TodaySettlementsSectionProps {
  overdue: any[];
  today: any[];
  isLoading: boolean;
}

export function TodaySettlementsSection({
  overdue,
  today,
  isLoading,
}: TodaySettlementsSectionProps) {
  const navigate = useNavigate();

  const renderItem = (settlement: any, isOverdue: boolean) => (
    <div
      key={settlement.id}
      className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={() => navigate(`/settlements/${settlement.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{settlement.title}</p>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            {statusLabels[settlement.status] || settlement.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
          {settlement.next_followup_at && (
            <span className={`font-medium ${isOverdue ? "text-destructive" : "text-warning"}`}>
              Follow-up: {format(new Date(settlement.next_followup_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          )}
          {settlement.assigned_member?.name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {settlement.assigned_member.name}
            </span>
          )}
          {settlement.client_contact?.name && (
            <span className="truncate max-w-[120px]">
              Cliente: {settlement.client_contact.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/settlements/${settlement.id}`);
          }}
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          Registrar
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  const hasItems = overdue.length > 0 || today.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent/10">
            <Handshake className="h-4 w-4 text-accent" />
          </div>
          Follow-ups de Acordos
          {hasItems && (
            <Badge variant="secondary" className="ml-1">
              {overdue.length + today.length}
            </Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settlements">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {!hasItems ? (
          <div className="text-center py-6">
            <Handshake className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum follow-up pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {overdue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-semibold text-destructive uppercase">
                    Atrasados ({overdue.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {overdue.map((s) => renderItem(s, true))}
                </div>
              </div>
            )}
            {today.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-3.5 w-3.5 text-warning" />
                  <span className="text-xs font-semibold text-warning uppercase">
                    Hoje ({today.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {today.map((s) => renderItem(s, false))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
