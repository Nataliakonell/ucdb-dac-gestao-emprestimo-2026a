import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, CheckCircle, XCircle, ArrowRightLeft, Loader2, Eye } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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

interface Loan {
  id: string | number;
  equipmentId: string | number;
  equipmentName: string;
  userId: string | number;
  userName: string;
  sector: string;
  requestDate: string;
  expectedReturn: string;
  status: "pendente" | "aprovado" | "rejeitado" | "devolvido" | "atrasado";
}

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5279/api";

export default function Emprestimos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");

  const { data: loans = [], isLoading } = useQuery<Loan[]>({
    queryKey: ["loans"],
    queryFn: async () => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar empréstimos da API.");
      }

      const json = await res.json();
      
      return json.map((l: any) => {
        const reqDate = new Date(l.requestedAt);
        const expDate = new Date(reqDate.getTime() + l.days * 24 * 60 * 60 * 1000);
        
        return {
          id: l.id,
          equipmentId: l.equipmentId,
          equipmentName: l.equipment?.name || `Equipamento #${l.equipmentId}`,
          userId: l.userId,
          userName: l.user?.name || `Usuário #${l.userId}`,
          sector: l.sector || l.user?.sector || "N/A",
          requestDate: reqDate.toLocaleDateString("pt-BR"),
          expectedReturn: expDate.toLocaleDateString("pt-BR"),
          status: l.status === "recusado" ? "rejeitado" : l.status,
        };
      });
    }
  });

  const filtered = loans.filter((l) => {
    const matchSearch = l.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "todos" || l.status === filter;
    return matchSearch && matchFilter;
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${id}/approve`, {
        method: "PATCH",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao aprovar empréstimo.");
      }
    },
    onSuccess: () => {
      toast.success("Empréstimo aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      // Também invalida "pending-loans" para comunicação com a outra tela Notificacoes.tsx (boa prática!)
      queryClient.invalidateQueries({ queryKey: ["pending-loans"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${id}/reject`, {
        method: "PATCH",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao recusar empréstimo.");
      }
    },
    onSuccess: () => {
      toast.info("Empréstimo rejeitado.");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["pending-loans"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const returnMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${id}/return`, {
        method: "PATCH",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao registrar devolução.");
      }
    },
    onSuccess: () => {
      toast.success("Devolução registrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleReturn = (id: string | number) => returnMutation.mutate(id);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {user?.role === "Administrador" ? "Empréstimos" : "Minhas Solicitações"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {user?.role === "Administrador" 
                ? "Controle de solicitações, aprovações e devoluções de toda a organização" 
                : "Acompanhe o status e histórico de solicitações dos seus equipamentos"}
            </p>
          </div>
          {user?.role !== "Administrador" && (
            <div className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 self-start sm:self-center">
              Perfil: Colaborador
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por equipamento ou usuário..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="devolvido">Devolvido</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin opacity-60" />
                Carregando empréstimos...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm sm:text-base font-bold text-muted-foreground py-3">Equipamento</TableHead>
                    <TableHead className="text-sm sm:text-base font-bold text-muted-foreground py-3">Solicitante</TableHead>
                    <TableHead className="hidden md:table-cell text-sm sm:text-base font-bold text-muted-foreground py-3">Setor</TableHead>
                    <TableHead className="hidden md:table-cell text-sm sm:text-base font-bold text-muted-foreground py-3">Data Solicitação</TableHead>
                    <TableHead className="hidden lg:table-cell text-sm sm:text-base font-bold text-muted-foreground py-3">Devolução Prevista</TableHead>
                    <TableHead className="text-sm sm:text-base font-bold text-muted-foreground py-3">Status</TableHead>
                    <TableHead className="text-right text-sm sm:text-base font-bold text-muted-foreground py-3">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        Nenhum empréstimo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="text-base sm:text-lg font-bold text-foreground py-4">{loan.equipmentName}</TableCell>
                        <TableCell className="text-sm sm:text-base font-semibold text-foreground py-4">{loan.userName}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm sm:text-base font-medium py-4">{loan.sector}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm sm:text-base font-medium py-4">{loan.requestDate}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm sm:text-base font-medium py-4">{loan.expectedReturn}</TableCell>
                        <TableCell className="py-4"><StatusBadge status={loan.status} /></TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/solicitacao/${loan.id}`)} aria-label="Ver detalhes" className="h-10 w-10 hover:bg-muted border">
                              <Eye className="h-5 w-5 text-primary" />
                            </Button>
                            {user?.role === "Administrador" && (
                              <>
                                {loan.status === "pendente" && (
                                  <>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" aria-label="Aprovar" className="h-10 w-10 hover:bg-muted border">
                                          <CheckCircle className="h-5 w-5 text-success" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Aprovar solicitação?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Ao aprovar, o equipamento mudará o status para "Em uso".
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

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" aria-label="Rejeitar" className="h-10 w-10 hover:bg-muted border">
                                          <XCircle className="h-5 w-5 text-destructive" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Recusar solicitação?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta ação mudará o status da solicitação para "rejeitado".
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
                                  </>
                                )}
                                {(loan.status === "aprovado" || loan.status === "atrasado") && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-10 px-4 font-bold border hover:bg-muted shadow-sm">
                                        Devolver
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Registrar devolução?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          O equipamento será devolvido ao estoque e ficará disponível novamente.
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
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
