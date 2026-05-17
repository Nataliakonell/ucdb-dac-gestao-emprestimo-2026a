import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, CheckCircle, XCircle, ArrowRightLeft, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [data, setData] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar empréstimos da API.");
      }

      const json = await res.json();
      
      const mappedLoans: Loan[] = json.map((l: any) => {
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

      setData(mappedLoans);
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível carregar os empréstimos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filtered = data.filter((l) => {
    const matchSearch = l.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "todos" || l.status === filter;
    return matchSearch && matchFilter;
  });

  const handleApprove = async (id: string | number) => {
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
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (id: string | number) => {
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
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReturn = async (id: string | number) => {
    try {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans/${id}/return`, {
        method: "PATCH",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erro ao registrar devolução.");
      }

      toast.success("Devolução registrada com sucesso!");
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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
                    {user?.role === "Administrador" && <TableHead className="text-right text-sm sm:text-base font-bold text-muted-foreground py-3">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={user?.role === "Administrador" ? 7 : 6} className="text-center py-8 text-muted-foreground">
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
                        {user?.role === "Administrador" && (
                          <TableCell className="text-right py-4">
                            <div className="flex justify-end gap-2">
                              {loan.status === "pendente" && (
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => handleApprove(loan.id)} aria-label="Aprovar" className="h-10 w-10 hover:bg-muted border">
                                    <CheckCircle className="h-5 w-5 text-success" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleReject(loan.id)} aria-label="Rejeitar" className="h-10 w-10 hover:bg-muted border">
                                    <XCircle className="h-5 w-5 text-destructive" />
                                  </Button>
                                </>
                              )}
                              {(loan.status === "aprovado" || loan.status === "atrasado") && (
                                <Button variant="outline" size="sm" onClick={() => handleReturn(loan.id)} className="h-10 px-4 font-bold border hover:bg-muted shadow-sm">
                                  Devolver
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
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
