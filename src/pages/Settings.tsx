import { useOrganization, useProfile } from "@/hooks/useOrganization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { data: organization, isLoading: orgLoading } = useOrganization();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const isLoading = orgLoading || profileLoading;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e escritório</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={profile?.full_name || ""} disabled />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escritório</CardTitle>
          <CardDescription>Informações da sua organização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="space-y-2">
              <Label>Nome do Escritório</Label>
              <Input value={organization?.name || ""} disabled />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
