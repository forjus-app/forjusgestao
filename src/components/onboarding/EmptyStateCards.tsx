import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Clock, UserPlus, Plus } from "lucide-react";

interface EmptyStateCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
}

function EmptyStateCard({ icon: Icon, title, description, href, buttonLabel }: EmptyStateCardProps) {
  return (
    <Card className="border-dashed border-2 border-border/60 hover:border-primary/30 transition-colors">
      <CardContent className="flex flex-col items-center text-center py-8 px-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button asChild size="sm">
          <Link to={href}>
            <Plus className="h-4 w-4 mr-1" />
            {buttonLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

interface EmptyStateCardsProps {
  hasTeam: boolean;
  hasContacts: boolean;
  hasCases: boolean;
  hasDeadlines: boolean;
}

export function EmptyStateCards({ hasTeam, hasContacts, hasCases, hasDeadlines }: EmptyStateCardsProps) {
  const cards = [
    !hasTeam && {
      icon: UserPlus,
      title: "Adicione sua equipe",
      description: "Cadastre os advogados e colaboradores do escritório",
      href: "/team",
      buttonLabel: "Adicionar membro",
    },
    !hasContacts && {
      icon: Users,
      title: "Cadastre um contato",
      description: "Adicione clientes e partes interessadas",
      href: "/contacts",
      buttonLabel: "Novo contato",
    },
    !hasCases && {
      icon: Briefcase,
      title: "Registre um processo",
      description: "Crie seu primeiro processo judicial",
      href: "/cases/new",
      buttonLabel: "Novo processo",
    },
    !hasDeadlines && {
      icon: Clock,
      title: "Crie um prazo",
      description: "Não perca nenhuma data importante",
      href: "/deadlines",
      buttonLabel: "Novo prazo",
    },
  ].filter(Boolean) as EmptyStateCardProps[];

  if (cards.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <EmptyStateCard key={card.href} {...card} />
      ))}
    </div>
  );
}
