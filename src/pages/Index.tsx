import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, Shield, Clock, BarChart3, Users, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoFull from "@/assets/logo-forjus.png";

const KIWIFY_LINK = "https://pay.kiwify.com.br/1janI9l";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(220 25% 10%)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(210 100% 56%)" }} />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-theme min-h-screen" style={{ background: "hsl(220 25% 10%)", color: "hsl(0 0% 98%)" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "hsl(220 25% 10% / 0.9)", backdropFilter: "blur(12px)", borderColor: "hsl(220 20% 20%)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <img src={logoFull} alt="ForJus Gestão" className="h-8" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-sm" style={{ color: "hsl(0 0% 85%)" }}>
              <Link to="/auth">Já sou cliente</Link>
            </Button>
            <Button asChild className="text-sm font-semibold" style={{ background: "hsl(210 100% 56%)", color: "hsl(0 0% 100%)" }}>
              <a href={KIWIFY_LINK} target="_blank" rel="noopener noreferrer">Começar agora</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "hsl(210 100% 56% / 0.08)" }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "hsl(210 100% 68% / 0.06)" }} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8" style={{ background: "hsl(210 100% 56% / 0.12)", color: "hsl(210 100% 68%)", border: "1px solid hsl(210 100% 56% / 0.2)" }}>
            <Shield className="w-3.5 h-3.5" /> Sistema jurídico completo
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Organize seu escritório e{" "}
            <span style={{ color: "hsl(210 100% 56%)" }}>nunca mais perca um prazo.</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: "hsl(220 15% 65%)" }}>
            Controle processos, prazos e execução em um único sistema simples e direto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base font-semibold px-8 h-12" style={{ background: "hsl(210 100% 56%)", color: "hsl(0 0% 100%)" }}>
              <a href={KIWIFY_LINK} target="_blank" rel="noopener noreferrer">
                Começar agora <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12" style={{ borderColor: "hsl(220 20% 25%)", color: "hsl(0 0% 85%)", background: "transparent" }}>
              <Link to="/auth">Já sou cliente</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* DOR */}
      <section className="py-20 px-4" style={{ background: "hsl(220 20% 12%)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: "hsl(40 95% 55%)" }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O problema não é só receber a intimação.
            </h2>
            <p className="text-lg" style={{ color: "hsl(220 15% 65%)" }}>
              A maioria dos escritórios não perde prazo por falta de informação…<br />
              mas por <strong style={{ color: "hsl(0 0% 98%)" }}>falta de organização.</strong>
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              "Controle feito em planilhas",
              "Informações espalhadas no WhatsApp",
              "Falta de visão do que vence hoje",
              "Equipe desorganizada",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "hsl(0 70% 50% / 0.08)", border: "1px solid hsl(0 70% 50% / 0.15)" }}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(0 70% 60%)" }} />
                <span style={{ color: "hsl(220 15% 75%)" }}>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xl font-bold" style={{ color: "hsl(0 70% 60%)" }}>
            É assim que prazos são perdidos.
          </p>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span style={{ color: "hsl(210 100% 56%)" }}>ForJus Gestão</span> resolve isso
          </h2>
          <p className="mb-12" style={{ color: "hsl(220 15% 65%)" }}>Tudo o que seu escritório precisa, em um só lugar.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "Centralização total", desc: "Todos os processos organizados em um painel único." },
              { icon: Clock, title: "Controle de prazos", desc: "Prazos com responsáveis e contagem automática." },
              { icon: Users, title: "Equipe organizada", desc: "Atribua tarefas e acompanhe a execução." },
              { icon: Shield, title: "Funis inteligentes", desc: "Hoje, Amanhã, Semana, Mês e Atrasados." },
              { icon: CheckCircle2, title: "Visão diária", desc: "Painel com tudo que importa no seu dia." },
              { icon: Star, title: "Registro completo", desc: "Histórico de tarefas e ações concluídas." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl text-left" style={{ background: "hsl(220 20% 14%)", border: "1px solid hsl(220 20% 20%)" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "hsl(210 100% 56% / 0.12)" }}>
                  <Icon className="w-5 h-5" style={{ color: "hsl(210 100% 68%)" }} />
                </div>
                <h3 className="font-semibold text-lg mb-1">{title}</h3>
                <p className="text-sm" style={{ color: "hsl(220 15% 65%)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-20 px-4" style={{ background: "hsl(220 20% 12%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">O que muda no seu escritório</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { emoji: "📊", text: "Mais controle do escritório" },
              { emoji: "🎯", text: "Mais previsibilidade" },
              { emoji: "⚡", text: "Menos retrabalho" },
              { emoji: "🔒", text: "Mais segurança jurídica" },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-4 p-5 rounded-xl" style={{ background: "hsl(220 25% 10%)", border: "1px solid hsl(220 20% 20%)" }}>
                <span className="text-2xl">{emoji}</span>
                <span className="font-medium text-lg">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Cadastre seus processos", desc: "Adicione os dados do caso e vincule ao cliente." },
              { step: "2", title: "Organize os prazos", desc: "Defina datas, responsáveis e prioridades." },
              { step: "3", title: "Execute com controle", desc: "Acompanhe tudo em tempo real no painel." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" style={{ background: "hsl(210 100% 56%)", color: "hsl(0 0% 100%)" }}>
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm" style={{ color: "hsl(220 15% 65%)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section className="py-20 px-4" style={{ background: "hsl(220 20% 12%)" }}>
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Acesso completo ao sistema</h2>
          <p className="mb-8" style={{ color: "hsl(220 15% 65%)" }}>Tudo incluso. Sem surpresas.</p>
          <div className="rounded-2xl p-8" style={{ background: "hsl(220 25% 10%)", border: "2px solid hsl(210 100% 56% / 0.4)" }}>
            <div className="mb-6">
              <span className="text-5xl font-bold" style={{ color: "hsl(210 100% 56%)" }}>R$ 99</span>
              <span className="text-lg" style={{ color: "hsl(220 15% 65%)" }}>/mês</span>
            </div>
            <ul className="text-left space-y-3 mb-8">
              {["Processos ilimitados", "Controle de prazos", "Gestão de equipe", "Painel diário completo", "Suporte por e-mail"].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(152 72% 46%)" }} />
                  <span style={{ color: "hsl(220 15% 75%)" }}>{f}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild className="w-full text-base font-semibold h-12" style={{ background: "hsl(210 100% 56%)", color: "hsl(0 0% 100%)" }}>
              <a href={KIWIFY_LINK} target="_blank" rel="noopener noreferrer">
                Começar agora <ChevronRight className="ml-1 w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">O que dizem nossos clientes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { text: "Depois que comecei a usar, nunca mais me perdi nos prazos.", name: "Dr. Rafael M.", role: "Advogado autônomo" },
              { text: "Organizou totalmente minha rotina. Simples e eficiente.", name: "Dra. Camila S.", role: "Escritório familiar" },
            ].map((t) => (
              <div key={t.name} className="p-6 rounded-xl" style={{ background: "hsl(220 20% 14%)", border: "1px solid hsl(220 20% 20%)" }}>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-current" style={{ color: "hsl(40 95% 55%)" }} />
                  ))}
                </div>
                <p className="mb-4 italic" style={{ color: "hsl(220 15% 75%)" }}>"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs" style={{ color: "hsl(220 15% 55%)" }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(210 100% 56% / 0.15), hsl(220 25% 10%))" }}>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Não espere perder um prazo para se organizar.
          </h2>
          <p className="text-lg mb-8" style={{ color: "hsl(220 15% 65%)" }}>
            Tenha controle total do seu escritório hoje.
          </p>
          <Button size="lg" asChild className="text-base font-semibold px-10 h-12" style={{ background: "hsl(210 100% 56%)", color: "hsl(0 0% 100%)" }}>
            <a href={KIWIFY_LINK} target="_blank" rel="noopener noreferrer">
              Começar agora <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="py-8 px-4" style={{ borderTop: "1px solid hsl(220 20% 18%)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <img src={logoFull} alt="ForJus" className="h-6" />
            <span className="text-sm" style={{ color: "hsl(220 15% 50%)" }}>Sistema de Gestão Jurídica</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: "hsl(220 15% 50%)" }}>
            <span>© 2026 ForJus Gestão</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
