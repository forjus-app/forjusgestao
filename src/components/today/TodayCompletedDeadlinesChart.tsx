import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompletedDeadlineDay } from "@/hooks/useTodayData";

interface TodayCompletedDeadlinesChartProps {
  data: CompletedDeadlineDay[] | undefined;
  isLoading: boolean;
}

export function TodayCompletedDeadlinesChart({
  data,
  isLoading,
}: TodayCompletedDeadlinesChartProps) {
  const total = data?.reduce((sum, d) => sum + d.count, 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          Prazos Cumpridos
        </CardTitle>
        {isLoading ? (
          <Skeleton className="h-6 w-8" />
        ) : (
          <span className="text-2xl font-bold">{total}</span>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : data && data.length > 0 ? (
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md">
                          <span className="font-medium">{payload[0].payload.label}</span>
                          <span className="ml-2 text-muted-foreground">
                            {payload[0].value} prazo{payload[0].value !== 1 ? "s" : ""}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
            Nenhum prazo cumprido nos últimos 3 dias
          </div>
        )}
      </CardContent>
    </Card>
  );
}
