import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Clock, ArrowRight } from "lucide-react";
import logoFull from "@/assets/logo-forjus.png";

export function WelcomeDialog() {
  const { data: organization } = useOrganization();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (organization) {
      const key = `forjus_welcome_shown_${organization.id}`;
      if (!localStorage.getItem(key)) {
        setOpen(true);
        localStorage.setItem(key, "true");
      }
    }
  }, [organization]);

  const features = [
    { icon: Users, label: "Equipe", desc: "Cadastre membros do escritório" },
    { icon: Briefcase, label: "Processos", desc: "Gerencie casos judiciais" },
    { icon: Clock, label: "Prazos", desc: "Nunca perca uma data importante" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
          <img src={logoFull} alt="ForJus" className="h-12 mb-4" />
          <DialogTitle className="text-2xl">
            Bem-vindo ao ForJus! 🎉
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {organization?.name ? (
              <>Seu escritório <strong>{organization.name}</strong> está pronto.</>
            ) : (
              "Seu escritório está configurado e pronto para uso."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => { setOpen(false); navigate("/team"); }} className="w-full">
            Começar configuração
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} className="w-full text-muted-foreground">
            Explorar por conta própria
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
