import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, FileText, CheckCircle2, FileSignature } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { exportProductionReportPDF, type ProductionRow } from "@/lib/productionReportPdf";

function buildMonthOptions(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = subMonths(now, i);
    return {
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM 'de' yyyy", { locale: ptBR }),
    };
  });
}

export default function Reports() {
  const { data: organization } = useOrganization();
  const monthOptions = useMemo(() => buildMonthOptions(12), []);
  const [month, setMonth] = useState<string>(monthOptions[0].value);

  const range = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const base = new Date(y, m - 1, 1);
    return { start: startOfMonth(base), end: endOfMonth(base) };
  }, [month]);

  const periodLabel = monthOptions.find((o) => o.value === month)?.label || month;

  const { data: members } = useQuery({
    queryKey: ["team-members-report", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: completedDeadlines, isLoading: loadingDeadlines } = useQuery({
    queryKey: ["report-deadlines", organization?.id, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deadlines")
        .select("id, responsible_member_id, completed_at")
        .eq("status", "completed")
        .gte("completed_at", range.start.toISOString())
        .lte("completed_at", range.end.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: filedPeticoes, isLoading: loadingPeticoes } = useQuery({
    queryKey: ["report-peticoes", organization?.id, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, assigned_member_id, filed_at")
        .not("filed_at", "is", null)
        .gte("filed_at", range.start.toISOString())
        .lte("filed_at", range.end.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const isLoading = loadingDeadlines || loadingPeticoes;

  const rows: ProductionRow[] = useMemo(() => {
    if (!members) return [];
    const map = new Map<string, ProductionRow>();
    members.forEach((m) => map.set(m.id, { name: m.name, deadlines: 0, peticoes: 0, total: 0 }));

    (completedDeadlines || []).forEach((d: any) => {
      const row = map.get(d.responsible_member_id);
      if (row) row.deadlines++;
    });
    (filedPeticoes || []).forEach((p: any) => {
      const row = map.get(p.assigned_member_id);
      if (row) row.peticoes++;
    });

    return Array.from(map.values())
      .map((r) => ({ ...r, total: r.deadlines + r.peticoes }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [members, completedDeadlines, filedPeticoes]);

  const totals = rows.reduce(
    (acc, r) => ({
      deadlines: acc.deadlines + r.deadlines,
      peticoes: acc.peticoes + r.peticoes,
    }),
    { deadlines: 0, peticoes: 0 }
  );

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error("Nenhuma produção registrada no período");
      return;
    }
    exportProductionReportPDF({ rows, periodLabel });
    toast.success("Relatório exportado!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Indicadores e relatórios do escritório</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} className="capitalize">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Cumpridos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totals.deadlines}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Petições Protocoladas</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totals.peticoes}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totals.deadlines + totals.peticoes}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatório de Produção
            <Badge variant="secondary" className="ml-2 capitalize">
              {periodLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma produção registrada neste período</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-center">Prazos Cumpridos</TableHead>
                  <TableHead className="text-center">Petições Protocoladas</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-center">{r.deadlines}</TableCell>
                    <TableCell className="text-center">{r.peticoes}</TableCell>
                    <TableCell className="text-center font-semibold">{r.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
