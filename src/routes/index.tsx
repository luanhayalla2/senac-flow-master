import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Timer, Workflow, Zap, Layers, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SENAC Service Desk Enterprise" },
      { name: "description", content: "Portal corporativo de Service Desk do SENAC-MA. Classificação automática N1/N2/N3, controle de SLA e auditoria completa." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gradient-primary grid place-items-center text-primary-foreground font-display font-bold">S</div>
            <div className="leading-tight">
              <div className="font-display font-bold text-sm">SENAC Service Desk</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Enterprise · MA</div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">Entrar</Button></Link>
            <Link to="/auth"><Button>Acessar Portal <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="container mx-auto px-6 py-24 lg:py-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-widest backdrop-blur">
              <Zap className="h-3 w-3" /> Conformidade ITIL · SLA monitorado
            </div>
            <h1 className="mt-6 font-display text-5xl lg:text-6xl font-bold leading-tight">
              Atendimento corporativo de TI do <span className="text-primary-glow">SENAC-MA</span>
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-white/85 max-w-2xl">
              Abertura, classificação automática N1 / N2 / N3, encaminhamento para a fila correta e
              atendimento com rastreabilidade total — em um só lugar.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="shadow-elegant">
                  Acessar o sistema <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#fluxo">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Ver fluxo operacional
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="fluxo" className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Como funciona</p>
          <h2 className="mt-2 font-display text-3xl lg:text-4xl font-bold">Do problema à resolução em 4 passos</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Workflow, t: "1. Abertura", d: "Solicitante escolhe a categoria e o problema no Portal de Serviços." },
            { icon: Layers, t: "2. Classificação", d: "Sistema identifica o nível (N1/N2/N3) e calcula o SLA automaticamente." },
            { icon: Timer, t: "3. Atendimento", d: "Chamado entra na fila correta. Técnico responsável é notificado em tempo real." },
            { icon: ShieldCheck, t: "4. Encerramento", d: "Solicitante valida a solução, avalia e tudo fica registrado em auditoria." },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border bg-card p-6 shadow-card">
              <div className="h-10 w-10 rounded-lg bg-accent grid place-items-center text-secondary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/40 border-y">
        <div className="container mx-auto px-6 py-20 grid gap-10 lg:grid-cols-3">
          {[
            { n: "N1", titulo: "Suporte Operacional", lista: ["Impressoras", "Reset de senha", "Software básico", "Configuração de e-mail"], sla: "30 min resposta · 4h solução" },
            { n: "N2", titulo: "Suporte Especializado", lista: ["Rede corporativa", "Active Directory", "Servidores", "VPN e domínio"], sla: "1h resposta · 8h solução" },
            { n: "N3", titulo: "Especialistas", lista: ["Banco de Dados", "Sistemas corporativos", "Integrações", "Segurança"], sla: "2h resposta · 24h solução" },
          ].map((n) => (
            <div key={n.n} className="rounded-2xl border bg-card p-7 shadow-card">
              <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg font-display font-bold text-white ${n.n === "N1" ? "bg-n1" : n.n === "N2" ? "bg-n2" : "bg-n3"}`}>
                {n.n}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{n.titulo}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {n.lista.map((i) => <li key={i} className="flex gap-2"><span className="text-primary">·</span>{i}</li>)}
              </ul>
              <div className="mt-5 pt-4 border-t text-xs text-muted-foreground">{n.sla}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="rounded-3xl bg-gradient-hero text-white p-10 lg:p-14 grid lg:grid-cols-2 gap-8 items-center shadow-elegant">
          <div>
            <BarChart3 className="h-10 w-10 text-primary-glow" />
            <h3 className="mt-4 font-display text-3xl font-bold">Indicadores em tempo real</h3>
            <p className="mt-3 text-white/85">
              Dashboard com chamados ativos, SLA em dia, vencidos, distribuição por nível e por unidade.
              Auditoria completa de cada ação no sistema.
            </p>
          </div>
          <div className="flex justify-end">
            <Link to="/auth">
              <Button size="lg" className="shadow-elegant">
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="container mx-auto px-6 py-8 text-center text-xs text-muted-foreground">
          SENAC Service Desk Enterprise · SENAC-MA · Conforme boas práticas ITIL
        </div>
      </footer>
    </div>
  );
}
