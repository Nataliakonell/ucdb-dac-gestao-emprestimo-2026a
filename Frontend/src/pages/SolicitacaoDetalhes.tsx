import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Loader2, ArrowRightLeft, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5279/api";

export default function SolicitacaoDetalhes() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: loan, isLoading, error } = useQuery({
    queryKey: ["loan", id],
    queryFn: async () => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Erro ao buscar solicitações");
      
      const allLoans = await res.json();
      const found = allLoans.find((l: any) => String(l.id) === id);
      
      if (!found) throw new Error("Solicitação não encontrada");
      
      const reqDate = new Date(found.requestedAt);
      const expDate = new Date(reqDate.getTime() + found.days * 24 * 60 * 60 * 1000);
      
      return {
        id: found.id,
        equipmentId: found.equipmentId,
        equipmentName: found.equipment?.name || `Equipamento #${found.equipmentId}`,
        userId: found.userId,
        userName: found.user?.name || `Usuário #${found.userId}`,
        sector: found.sector || found.user?.sector || "N/A",
        requestDate: reqDate.toLocaleDateString("pt-BR"),
        expectedReturn: expDate.toLocaleDateString("pt-BR"),
        days: found.days,
        notes: found.notes,
        status: found.status === "recusado" ? "rejeitado" : found.status,
      };
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (loanId: string | number) => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${loanId}/approve`, {
        method: "PATCH",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Erro ao aprovar empréstimo.");
    },
    onSuccess: () => {
      toast.success("Empréstimo aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["loan", id] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-loans"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const rejectMutation = useMutation({
    mutationFn: async (loanId: string | number) => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${loanId}/reject`, {
        method: "PATCH",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Erro ao recusar empréstimo.");
    },
    onSuccess: () => {
      toast.info("Empréstimo rejeitado.");
      queryClient.invalidateQueries({ queryKey: ["loan", id] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-loans"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const returnMutation = useMutation({
    mutationFn: async (loanId: string | number) => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${loanId}/return`, {
        method: "PATCH",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Erro ao registrar devolução.");
    },
    onSuccess: () => {
      toast.success("Devolução registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["loan", id] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin opacity-60" />
        <span className="text-sm">Carregando detalhes da solicitação...</span>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
            <ArrowRightLeft className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Solicitação não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <StatusBadge status={loan.status} />
      </div>

      <Card className="shadow-sm border-border/60">
        <CardContent className="p-8 space-y-8">
          {/* Cabeçalho */}
          <div className="border-b pb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ArrowRightLeft className="h-6 w-6 text-primary" />
              Detalhes da Solicitação #{loan.id}
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize as informações completas deste pedido de empréstimo.
            </p>
          </div>

          {/* Grid de Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1">
                  Equipamento
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {loan.equipmentName}
                </span>
              </div>
              
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1">
                  Colaborador (Solicitante)
                </span>
                <span className="text-base font-medium text-foreground">
                  {loan.userName}
                </span>
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1">
                  Setor do Solicitante
                </span>
                <span className="text-base font-medium text-foreground">
                  {loan.sector}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1">
                  Duração Solicitada
                </span>
                <span className="text-base font-medium text-foreground">
                  {loan.days} dia{loan.days !== 1 ? "s" : ""}
                </span>
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1">
                  Data da Solicitação
                </span>
                <span className="text-base font-medium text-foreground">
                  {loan.requestDate}
                </span>
              </div>

              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1">
                  Devolução Prevista
                </span>
                <span className="text-base font-medium text-foreground">
                  {loan.expectedReturn}
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          {loan.notes && (
            <div className="pt-4 border-t border-dashed">
              <span className="block text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-2">
                Justificativa / Observações
              </span>
              <p className="text-sm italic text-foreground/90 bg-muted/30 p-4 rounded-md border border-border/50">
                "{loan.notes}"
              </p>
            </div>
          )}
          
          {/* Ações Administrativas */}
          {user?.role === "Administrador" && (
            <div className="pt-6 border-t flex flex-wrap gap-3 justify-end">
              {loan.status === "pendente" && (
              <>
                {/* Modal Recusar */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-2">
                      <XCircle className="h-4 w-4" /> Recusar Solicitação
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza que quer recusar?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação mudará o status da solicitação para "rejeitado". O colaborador não poderá retirar o equipamento.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => rejectMutation.mutate(loan.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, recusar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Modal Aprovar */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-success text-success-foreground hover:bg-success/90 gap-2">
                      <CheckCircle className="h-4 w-4" /> Aprovar Solicitação
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza que quer aprovar?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao aprovar, o equipamento mudará o status para "Em uso" e o colaborador estará autorizado a retirá-lo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => approveMutation.mutate(loan.id)} className="bg-success text-success-foreground hover:bg-success/90">
                        Sim, aprovar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {(loan.status === "aprovado" || loan.status === "atrasado") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="font-bold border hover:bg-muted shadow-sm gap-2">
                    <ArrowRightLeft className="h-4 w-4" /> Registrar Devolução
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza que quer registrar a devolução?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isto indicará que o equipamento foi devolvido ao estoque e ficará disponível novamente para novos empréstimos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => returnMutation.mutate(loan.id)}>
                      Sim, registrar devolução
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
