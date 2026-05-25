import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ApprovedLoan {
  id: number;
  equipmentId: number;
  equipmentName: string;
  userId: number;
  userName: string;
  sector: string;
  days: number;
  requestDate: string;
  approvedAt?: string;
  notes?: string;
}

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5279/api";

export default function Aprovacoes() {
  const { data = [], isLoading } = useQuery<ApprovedLoan[]>({
    queryKey: ["approved-loans"],
    queryFn: async () => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar empréstimos aprovados.");
      }

      const json = await res.json();
      return json
        .filter((l: any) => l.status === "aprovado")
        .map((l: any) => ({
          id: l.id,
          equipmentId: l.equipmentId,
          equipmentName: l.equipment?.name || `Equipamento #${l.equipmentId}`,
          userId: l.userId,
          userName: l.user?.name || `Usuário #${l.userId}`,
          sector: l.sector || l.user?.sector || "N/A",
          days: l.days,
          requestDate: new Date(l.requestedAt).toLocaleDateString("pt-BR"),
          approvedAt: l.approvedAt
            ? new Date(l.approvedAt).toLocaleDateString("pt-BR")
            : undefined,
          notes: l.notes,
        }));
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Aprovações
        </h1>
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? "Carregando..."
            : `${data.length} empréstimo(s) aprovado(s) encontrado(s)`}
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin opacity-60" />
          <span className="text-sm">Carregando empréstimos aprovados...</span>
        </div>
      ) : data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
            <CheckCircle2 className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">
              Nenhum empréstimo aprovado encontrado no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {data.map((loan) => (
            <Card
              key={loan.id}
              className="group relative overflow-hidden border-emerald-500/20 bg-emerald-500/5 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/10"
            >
              {/* Top accent bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <CardContent className="p-5 flex flex-col gap-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {loan.equipmentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Empréstimo #{loan.id}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Aprovado
                  </Badge>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-0.5">
                      Colaborador
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {loan.userName}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-0.5">
                      Setor
                    </span>
                    <span className="font-medium text-foreground truncate block">
                      {loan.sector}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-0.5">
                      Duração
                    </span>
                    <span className="font-medium text-foreground">
                      {loan.days} dia{loan.days !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-0.5">
                      Solicitado em
                    </span>
                    <span className="font-medium text-foreground">
                      {loan.requestDate}
                    </span>
                  </div>
                  {loan.approvedAt && (
                    <div className="col-span-2">
                      <span className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-0.5">
                        Aprovado em
                      </span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {loan.approvedAt}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {loan.notes && (
                  <p className="text-[11px] italic text-muted-foreground/80 bg-background/50 px-2.5 py-1.5 rounded-md border border-border/50">
                    "{loan.notes}"
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
