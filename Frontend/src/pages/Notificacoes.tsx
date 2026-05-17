import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Bell, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface PendingLoan {
  id: number;
  equipmentId: number;
  equipmentName: string;
  userId: number;
  userName: string;
  sector: string;
  days: number;
  requestDate: string;
  notes?: string;
}

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5279/api";

export default function Notificacoes() {
  const [data, setData] = useState<PendingLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingLoans = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar solicitações de empréstimo.");
      }

      const json = await res.json();
      
      // Filtrar apenas os que estão como "pendente" (ou "recusado" mapeado como "rejeitado" no front)
      const pending = json
        .filter((l: any) => l.status === "pendente")
        .map((l: any) => ({
          id: l.id,
          equipmentId: l.equipmentId,
          equipmentName: l.equipment?.name || `Equipamento #${l.equipmentId}`,
          userId: l.userId,
          userName: l.user?.name || `Usuário #${l.userId}`,
          sector: l.sector || l.user?.sector || "N/A",
          days: l.days,
          requestDate: new Date(l.requestedAt).toLocaleDateString("pt-BR"),
          notes: l.notes,
        }));

      setData(pending);
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível carregar o painel de aprovações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${id}/approve`, {
        method: "PATCH",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao aprovar empréstimo.");
      }

      toast.success("Empréstimo aprovado com sucesso!");
      fetchPendingLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${id}/reject`, {
        method: "PATCH",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao recusar empréstimo.");
      }

      toast.info("Empréstimo rejeitado.");
      fetchPendingLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight font-heading">Painel de Aprovações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {data.length} solicitação(ões) pendente(s) necessitando de aprovação
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-8 w-8 animate-spin opacity-60" />
          Carregando solicitações pendentes...
        </div>
      ) : data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Nenhuma solicitação de empréstimo necessita de aprovação no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((loan) => (
            <Card key={loan.id} className="transition-colors border-primary/20 bg-primary/5">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-primary bg-primary/10">
                    <Bell className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-semibold text-foreground">Solicitação de Empréstimo</p>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-secondary font-semibold text-secondary-foreground">
                        ID #{loan.id}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      O colaborador <span className="font-medium text-foreground">{loan.userName}</span> ({loan.sector}) solicitou o equipamento <span className="font-medium text-foreground">{loan.equipmentName}</span> por <span className="font-medium text-foreground">{loan.days} dias</span>.
                    </p>
                    {loan.notes && (
                      <p className="text-xs italic text-muted-foreground/80 mt-1 bg-background/40 p-1.5 rounded">
                        Observação: "{loan.notes}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1.5">Solicitado em: {loan.requestDate}</p>
                  </div>
                </div>
                <div className="flex gap-2 self-end md:self-center shrink-0">
                  <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleReject(loan.id)}>
                    <XCircle className="h-4 w-4 mr-1.5" /> Recusar
                  </Button>
                  <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => handleApprove(loan.id)}>
                    <CheckCircle className="h-4 w-4 mr-1.5" /> Aprovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
