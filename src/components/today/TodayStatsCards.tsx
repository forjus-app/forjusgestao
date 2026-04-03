import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, CalendarDays, Handshake } from "lucide-react";

interface TodayStatsCardsProps {
  stats: {
    overdueDeadlines: number;
    todayDeadlines: number;
    upcomingEvents: number;
  } | null | undefined;
  followupCount: number;
  isLoading: boolean;
}

export function TodayStatsCards({ stats, followupCount, isLoading }: TodayStatsCardsProps) {
  const cards = [
    {
      title: "Prazos Atrasados",
      value: stats?.overdueDeadlines || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      urgent: (stats?.overdueDeadlines || 0) > 0,
    },
    {
      title: "Prazos Hoje",
      value: stats?.todayDeadlines || 0,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Agenda (7 dias)",
      value: stats?.upcomingEvents || 0,
      icon: CalendarDays,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Follow-ups Pendentes",
      value: followupCount,
      icon: Handshake,
      color: "text-primary",
      bgColor: "bg-primary/10",
      urgent: followupCount > 0,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={`card-hover ${card.urgent ? "border-destructive/50" : ""}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mt-1" />
                ) : (
                  <p className={`text-3xl font-bold mt-1 ${card.urgent ? "text-destructive" : ""}`}>
                    {card.value}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
