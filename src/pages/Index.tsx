import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, Shield, Clock, BarChart3, Users, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoLight from "@/assets/logo-forjus-light.png";

const KIWIFY_LINK = "https://pay.kiwify.com.br/1janI9l";

// ForJus brand — dark + green (matching smart-law-alerts style)
const GREEN = "hsl(152 72% 46%)";
const GREEN_L = "hsl(152 72% 58%)";
const BG_DARK = "#0a0a0a";
const BG_CARD = "#141414";
const BG_SECTION = "#111111";
const BORDER_CLR = "#1e1e1e";
const TEXT_W = "#f5f5f5";
const TEXT_M = "#888888";
const TEXT_ML = "#aaaaaa";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG_DARK }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: BG_DARK, color: TEXT_W }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <img src={logoLight} alt="ForJus Gestão" className="h-20" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-sm" style={{ color: TEXT_ML }}>
              <Link to="/auth">Já sou cliente</Link>
            </Button>
            <Button asChild className="text-sm font-semibold rounded-lg" style={{ background: GREEN, color: "#fff" }}>
              <a href={KIWIFY_LINK} target="_blank" rel="noopener noreferrer">Começar agora</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO — with green glow gradient */}
      <section className="pt-28 pb-24 px-4 relative overflow-hidden" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 40%, hsl(152 72% 46% / 0.12) 0%, transparent 70%), ${BG_DARK}` }}>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <img src={logoLight} alt="ForJus" className="h-28 mx-auto mb-10" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Organize seu escritório e{" "}
            <br />
            <span style={{ color: GREEN }}>nunca mais perca um prazo.</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: TEXT_M }}>
            Controle processos, prazos e execução em um único sistema simples e direto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base font-semibold px-8 h-12 rounded-lg" style={{ background: GREEN, color: "#fff" }}>
              <a href={KIWIFY_LINK} target="_blank" rel="noopener noreferrer">
                Começar agora <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 rounded-lg" style={{ borderColor: "hsl(152 72% 46% / 0.4)", color: GREEN_L, background: "transparent" }}>
              <Link to="/auth">Já sou cliente</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* DOR */}
      <section className="py-20 px-4" style={{ background: BG_SECTION }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: "hsl(40 95% 55%)" }} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O problema não é só receber a intimação.
            </h2>
            <p className="text-lg" style={{ color: TEXT_M }}>
              A maioria dos escritórios não perde prazo por falta de informação…<br />
              mas por <strong style={{ color: TEXT_W }}>falta de organização.</strong>
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              "Controle feito em planilhas",
              "Informações espalhadas no WhatsApp",
              "Falta de visão do que vence hoje",
              "Equipe desorganizada",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "rgba(220,50,50,0.06)", border: "1px solid rgba(220,50,50,0.12)" }}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(0 70% 60%)" }} />
                <span style={{ color: TEXT_ML }}>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xl font-bold" style={{ color: "hsl(0 70% 60%)" }}>
            É assim que prazos são perdidos.
          </p>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="py-20 px-4" style={{ background: BG_DARK }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span style={{ color: GREEN }}>ForJus Gestão</span> resolve isso
          </h2>
          <p className="mb-12" style={{ color: TEXT_M }}>Tudo o que seu escritório precisa, em um só lugar.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: "Centralização total", desc: "Todos os processos organizados em um painel único." },
              { icon: Clock, title: "Controle de prazos", desc: "Prazos com responsáveis e contagem automática." },
              { icon: Users, title: "Equipe organizada", desc: "Atribua tarefas e acompanhe a execução." },
              { icon: Shield, title: "Funis inteligentes", desc: "Hoje, Amanhã, Semana, Mês e Atrasados." },
              { icon: CheckCircle2, title: "Visão diária", desc: "Painel com tudo que importa no seu dia." },
              { icon: Star, title: "Registro completo", desc: "Histórico de tarefas e ações concluídas." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl text-left" style={{ background: BG_CARD, border: `1px solid ${BORDER_CLR}` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "hsl(152 72% 46% / 0.1)" }}>
                  <Icon className="w-5 h-5" style={{ color: GREEN_L }} />
                </div>
                <h3 className="font-semibold text-lg mb-1">{title}</h3>
                <p className="text-sm" style={{ color: TEXT_M }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-20 px-4" style={{ background: BG_SECTION }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">O que muda no seu escritório</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { emoji: "📊", text: "Mais controle do escritório" },
              { emoji: "🎯", text: "Mais previsibilidade" },
              { emoji: "⚡", text: "Menos retrabalho" },
              { emoji: "🔒", text: "Mais segurança jurídica" },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-center gap-4 p-5 rounded-xl" style={{ background: BG_DARK, border: `1px solid ${BORDER_CLR}` }}>
                <span className="text-2xl">{emoji}</span>
                <span className="font-medium text-lg">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 px-4" style={{ background: BG_DARK }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Cadastre seus processos", desc: "Adicione os dados do caso e vincule ao cliente." },
              { step: "2", title: "Organize os prazos", desc: "Defina datas, responsáveis e prioridades." },
              { step: "3", title: "Execute com controle", desc: "Acompanhe tudo em tempo real no painel." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold" style={{ background: GREEN, color: "#fff" }}>
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm" style={{ color: TEXT_M }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section className="py-20 px-4" style={{ background: BG_SECTION }}>
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Acesso completo ao sistema</h2>
          <p className="mb-8" style={{ color: TEXT_M }}>Tudo incluso. Sem surpresas.</p>
          <div className="rounded-2xl p-8" style={{ background: BG_DARK, border: `2px solid hsl(152 72% 46% / 0.35)` }}>
            <div className="mb-6">
              <span className="text-5xl font-bold" style={{ color: GREEN }}>R$ 99</span>
              <span className="text-lg" style={{ color: TEXT_M }}>/mês</span>
            </div>
            <ul className="text-left space-y-3 mb-8">
              {["Processos ilimitados", "Controle de prazos", "Gestão de equipe", "Painel diário completo", "Suporte por e-mail"].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: GREEN }} />
                  <span style={{ color: TEXT_ML }}>{f}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild className="w-full text-base font-semibold h-12 rounded-lg" style={{ background: GREEN, color: "#fff" }}>
              <a href={KIWIFY_LINK} target="_blank" rel="noopener noreferrer">
                Começar agora <ChevronRight className="ml-1 w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="py-20 px-4" style={{ background: BG_DARK }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">O que dizem nossos clientes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { text: "Depois que comecei a usar, nunca mais me perdi nos prazos.", name: "Dr. Rafael M.", role: "Advogado autônomo" },
              { text: "Organizou totalmente minha rotina. Simples e eficiente.", name: "Dra. Camila S.", role: "Escritório familiar" },
            ].map((t) => (
              <div key={t.name} className="p-6 rounded-xl" style={{ background: BG_CARD, border: `1px solid ${BORDER_CLR}` }}>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-current" style={{ color: "hsl(40 95% 55%)" }} />
                  ))}
                </div>
                <p className="mb-4 italic" style={{ color: TEXT_ML }}>"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs" style={{ color: TEXT_M }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 relative overflow-hidden" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 60%, hsl(152 72% 46% / 0.1) 0%, transparent 70%), ${BG_SECTION}` }}>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Não espere perder um prazo para se organizar.
          </h2>
          <p className="text-lg mb-8" style={{ color: TEXT_M }}>
            Tenha controle total do seu escritório hoje.
          </p>
          <Button size="lg" asChild className="text-base font-semibold px-10 h-12 rounded-lg" style={{ background: GREEN, color: "#fff" }}>
            <a href={KIWIFY_LINK} target="_blank" rel="noopener noreferrer">
              Começar agora <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="py-8 px-4" style={{ borderTop: `1px solid ${BORDER_CLR}`, background: BG_DARK }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <img src={logoLight} alt="ForJus" className="h-16" />
            <span className="text-sm" style={{ color: TEXT_M }}>Sistema de Gestão Jurídica</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: TEXT_M }}>
            <span>© 2026 ForJus Gestão</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
