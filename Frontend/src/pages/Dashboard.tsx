import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, ArrowRightLeft, Bell, CheckCircle2, Clock3, TriangleAlert, Gauge, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5279/api";

type EquipmentItem = {
  id: number;
  status: "disponivel" | "em_uso" | "manutencao";
};

type LoanItem = {
  id: number;
  status: "pendente" | "aprovado" | "recusado" | "devolvido" | "atrasado" | "rejeitado";
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardContent className="p-0">
        <div className={`h-1 w-full ${accent}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const token = localStorage.getItem("resource_buddy_token");

      const [equipmentsRes, loansRes] = await Promise.all([
        fetch(`${apiUrl}/equipments`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
        fetch(`${apiUrl}/loans`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }),
      ]);

      if (!equipmentsRes.ok) {
        throw new Error("Erro ao buscar equipamentos do dashboard.");
      }

      if (!loansRes.ok) {
        throw new Error("Erro ao buscar empréstimos do dashboard.");
      }

      const equipments = (await equipmentsRes.json()) as EquipmentItem[];
      const loans = (await loansRes.json()) as LoanItem[];

      return { equipments, loans };
    },
  });

  const summary = useMemo(() => {
    const equipments = data?.equipments || [];
    const loans = data?.loans || [];

    const total = equipments.length;
    const available = equipments.filter((item) => item.status === "disponivel").length;
    const borrowed = equipments.filter((item) => item.status === "em_uso").length;
    const maintenance = equipments.filter((item) => item.status === "manutencao").length;
    const approved = loans.filter((item) => item.status === "aprovado").length;
    const pending = loans.filter((item) => item.status === "pendente").length;
    const activeLoans = loans.filter((item) => item.status === "aprovado" || item.status === "atrasado").length;
    const availabilityRate = total > 0 ? Math.round((available / total) * 100) : 0;

    return {
      total,
      available,
      borrowed,
      maintenance,
      approved,
      pending,
      activeLoans,
      availabilityRate,
    };
  }, [data]);

  const highlight =
    summary.pending > 0
      ? `Você tem ${summary.pending} solicitação(ões) pendente(s) esperando aprovação.`
      : summary.maintenance > 0
        ? `Há ${summary.maintenance} equipamento(s) em manutenção. Vale revisar o estoque.`
        : "Tudo está em ordem no momento. Nenhuma solicitação pendente e nenhum equipamento em manutenção.";

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin" />
        Carregando dashboard administrativo...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-6 text-sm text-destructive">
          Não foi possível carregar o dashboard no momento.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="flex flex-col gap-4 rounded-2xl border border-slate-700/80 p-6 text-white shadow-lg md:flex-row md:items-end md:justify-between"
        style={{
          backgroundColor: "#0f172a",
          backgroundImage: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #1e293b 100%)",
        }}
      >
        <div className="space-y-3">
          <Badge className="w-fit border-white/15 bg-white/10 text-white hover:bg-white/10">
            <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
            Dashboard administrativo
          </Badge>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {user?.name || "Administrador"}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Visão rápida do estoque, da fila de aprovações e do ritmo de utilização dos equipamentos.
            </p>
          </div>
        </div>

        <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/35 p-4 backdrop-blur-sm sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-white/60">Taxa de disponibilidade</p>
            <p className="mt-1 text-2xl font-semibold">{summary.availabilityRate}%</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-white/60">Empréstimos ativos</p>
            <p className="mt-1 text-2xl font-semibold">{summary.activeLoans}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Equipamentos totais"
          value={summary.total}
          description="Todos os itens cadastrados no estoque"
          icon={Package}
          accent="bg-slate-700"
        />
        <StatCard
          title="Equipamentos disponíveis"
          value={summary.available}
          description="Prontos para novas solicitações"
          icon={CheckCircle2}
          accent="bg-emerald-500"
        />
        <StatCard
          title="Equipamentos emprestados"
          value={summary.borrowed}
          description="Em uso pelos colaboradores"
          icon={ArrowRightLeft}
          accent="bg-sky-500"
        />
        <StatCard
          title="Solicitações aprovadas"
          value={summary.approved}
          description="Pedidos liberados para retirada"
          icon={Bell}
          accent="bg-violet-500"
        />
        <StatCard
          title="Solicitações pendentes"
          value={summary.pending}
          description="Aguardando decisão do administrador"
          icon={Clock3}
          accent="bg-amber-500"
        />
        <StatCard
          title="Equipamentos em manutenção"
          value={summary.maintenance}
          description="Itens indisponíveis temporariamente"
          icon={TriangleAlert}
          accent="bg-rose-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Resumo operacional</CardTitle>
            <CardDescription>Indicadores extras para leitura rápida da operação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Gauge className="h-4 w-4" />
                  Taxa de disponibilidade
                </div>
                <div className="mt-3 text-3xl font-bold">{summary.availabilityRate}%</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {summary.available} de {summary.total} equipamentos estão livres agora.
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ArrowRightLeft className="h-4 w-4" />
                  Empréstimos ativos
                </div>
                <div className="mt-3 text-3xl font-bold">{summary.activeLoans}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Solicitações aprovadas e em atraso que ainda exigem acompanhamento.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
              <p className="font-semibold text-primary">Insight do momento</p>
              <p className="mt-2 leading-6 text-muted-foreground">{highlight}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
            <CardDescription>Atalhos para os fluxos administrativos mais usados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start gap-2">
              <Link to="/notificacoes">
                <Bell className="h-4 w-4" />
                Ver aprovações pendentes
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/equipamentos">
                <Package className="h-4 w-4" />
                Gerenciar equipamentos
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start gap-2">
              <Link to="/emprestimos">
                <ArrowRightLeft className="h-4 w-4" />
                Conferir empréstimos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}