import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) throw signInError;
      if (!signInData.session?.access_token) {
        throw new Error("Sessão de administrador não encontrada");
      }

      localStorage.setItem("forjus_admin_token", signInData.session.access_token);
      localStorage.setItem("forjus_admin_email", normalizedEmail);

      const { data, error } = await supabase.functions.invoke("admin-users", {
        headers: { Authorization: `Bearer ${signInData.session.access_token}` },
        body: { action: "list-users" },
      });

      if (error || data?.error) {
        await supabase.auth.signOut();
        localStorage.removeItem("forjus_admin_token");
        localStorage.removeItem("forjus_admin_email");
        throw new Error(data?.error || error?.message || "Acesso negado. Você não é administrador.");
      }

      toast.success("Login de administrador realizado!");
      navigate("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive rounded-xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-destructive-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Administrador</CardTitle>
            <CardDescription>Painel de controle do ForJus Gestão</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">E-mail</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@forjus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar como Administrador"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
