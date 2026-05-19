import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Equipment } from "@/data/mock";
import { Search, Plus, Pencil, Trash2, Monitor, ArrowRightLeft, Loader2, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";

// Componentes Shadcn UI adicionais para Date Picker
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5279/api";

const resolveImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("blob:")) return url;
  if (url.includes("r2.dev")) {
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    return `${apiUrl}/uploads/${fileName}`;
  }
  return url;
};

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Contexto 2D não obtido"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 70% quality and output as Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Erro ao converter canvas em Blob"));
            }
          },
          "image/jpeg",
          0.7
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function Equipamentos() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("todos");
  const [data, setData] = useState<Equipment[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);

  const { user } = useAuth();
  const [requestingEquipment, setRequestingEquipment] = useState<Equipment | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [loanNotes, setLoanNotes] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const handleRequestLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingEquipment) return;

    if (!startDate) {
      toast.error("A Data de Início é obrigatória.");
      return;
    }
    if (!endDate) {
      toast.error("A Data de Fim é obrigatória.");
      return;
    }

    const today = startOfDay(new Date());
    const startSelected = startOfDay(startDate);
    const endSelected = startOfDay(endDate);

    if (startSelected < today) {
      toast.error("A Data de Início não pode ser anterior à data de hoje.");
      return;
    }

    if (endSelected < startSelected) {
      toast.error("A Data de Fim não pode ser anterior à Data de Início.");
      return;
    }

    // Calcular dias de empréstimo (diferença em dias inteiros)
    let days = differenceInDays(endSelected, startSelected);
    if (days <= 0) {
      days = 1; // Mínimo de 1 dia de empréstimo caso início e fim sejam iguais
    }

    try {
      setIsSubmittingRequest(true);
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/loans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          equipmentId: requestingEquipment.id,
          days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          notes: loanNotes,
          sector: user?.sector
        })
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Erro ao solicitar equipamento.");
      }

      toast.success("Solicitação de empréstimo enviada com sucesso!");
      setRequestingEquipment(null);
      setLoanNotes("");
      setStartDate(undefined);
      setEndDate(undefined);
      fetchEquipments();
    } catch (err: any) {
      toast.error(err.message || "Não foi possível enviar a solicitação.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const fetchEquipments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/equipments`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Erro ao buscar equipamentos da API");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível conectar ao servidor backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const filtered = data.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.serialNumber.toLowerCase().includes(search.toLowerCase());

    const matchRole = user?.role === "Administrador" || e.status === "disponivel";
    const matchFilter = filter === "todos" || e.status === filter;

    return matchSearch && matchFilter && matchRole;
  });

  const handleSave = async (eq: Equipment, newImageBlob: Blob | null) => {
    try {
      const token = localStorage.getItem("resource_buddy_token");
      const formData = new FormData();
      formData.append("name", eq.name);
      formData.append("status", eq.status);
      formData.append("serialNumber", eq.serialNumber);
      formData.append("description", eq.description);

      if (eq.id) {
        formData.append("id", String(eq.id));
      }

      if (newImageBlob) {
        formData.append("image", newImageBlob, "image.jpg");
      } else if (eq.image) {
        formData.append("image", eq.image);
      }

      const method = eq.id ? "PUT" : "POST";
      const url = eq.id ? `${apiUrl}/equipments/${eq.id}` : `${apiUrl}/equipments`;

      const res = await fetch(url, {
        method,
        body: formData,
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) throw new Error("Erro ao salvar o equipamento na API");
      const saved = await res.json();

      if (eq.id) {
        setData((d) => d.map((e) => (e.id === saved.id ? saved : e)));
        toast.success("Equipamento atualizado com sucesso!");
      } else {
        setData((d) => [saved, ...d]);
        toast.success("Equipamento cadastrado com sucesso!");
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/equipments/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Erro ao remover o equipamento");
      }
      setData((d) => d.filter((e) => e.id !== id));
      toast.success("Equipamento removido com sucesso.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight">Equipamentos</h1>
            <div className="bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              Total: {data.length}
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os equipamentos da organização</p>
        </div>
        {user?.role === "Administrador" ? (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" /> Novo Equipamento
          </Button>
        ) : (
          <div className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 self-start sm:self-center">
            Perfil: Colaborador
          </div>
        )}
      </div>

      {user?.role === "Administrador" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card shadow-sm border border-border/60 rounded-xl transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total de Equipamentos</CardTitle>
              <Monitor className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">{data.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Registrados na base de dados</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border border-border/60 rounded-xl transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Disponíveis</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {data.filter((e) => e.status === "disponivel").length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Prontos para empréstimo</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border border-border/60 rounded-xl transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Emprestados</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold tracking-tight text-foreground">
                {data.filter((e) => e.status === "em_uso").length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Ativos com colaboradores</p>
            </CardContent>
          </Card>
        </div>
      )}

      {user?.role === "Administrador" && (
        <div className="flex items-center gap-2 border-b pb-2">
          <button
            onClick={() => setFilter("todos")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 select-none",
              filter === "todos"
                ? "bg-primary text-primary-foreground shadow-sm scale-102"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("disponivel")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 select-none flex items-center gap-1.5",
              filter === "disponivel"
                ? "bg-green-600 text-white shadow-sm scale-102"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Disponível
          </button>
          <button
            onClick={() => setFilter("em_uso")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 select-none flex items-center gap-1.5",
              filter === "em_uso"
                ? "bg-purple-600 text-white shadow-sm scale-102"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            Emprestado
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou número de série..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 text-sm sm:text-base font-bold text-muted-foreground py-3">Foto</TableHead>
                  <TableHead className="text-sm sm:text-base font-bold text-muted-foreground py-3">Equipamento</TableHead>
                  <TableHead className="text-sm sm:text-base font-bold text-muted-foreground py-3">Status</TableHead>
                  <TableHead className="hidden lg:table-cell text-sm sm:text-base font-bold text-muted-foreground py-3">Nº Série</TableHead>
                  <TableHead className="text-right text-sm sm:text-base font-bold text-muted-foreground py-3">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando dados...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Monitor className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Nenhum equipamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell className="py-4">
                        {eq.image ? (
                          <img
                            src={resolveImageUrl(eq.image)}
                            alt={eq.name}
                            className="w-28 h-20 object-cover rounded-lg border shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer"
                            title="Clique para ampliar a imagem"
                            aria-label={`Foto de ${eq.name}. Clique para ampliar.`}
                            onClick={() => setZoomedImage({ src: resolveImageUrl(eq.image)!, alt: eq.name })}
                          />
                        ) : (
                          <div
                            className="w-28 h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs font-semibold border border-dashed"
                            aria-label="Equipamento sem foto cadastrada"
                          >
                            Sem foto
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-base sm:text-lg font-bold text-foreground py-4">{eq.name}</TableCell>
                      <TableCell className="py-4"><StatusBadge status={eq.status} /></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm sm:text-base text-muted-foreground font-semibold py-4">{eq.serialNumber}</TableCell>
                      <TableCell className="text-right py-4">
                        {user?.role === "Administrador" ? (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setEditing(eq); setDialogOpen(true); }} aria-label="Editar" className="h-10 w-10 hover:bg-muted border">
                              <Pencil className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(eq.id!)} aria-label="Excluir" className="h-10 w-10 hover:bg-muted border">
                              <Trash2 className="h-5 w-5 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <Button
                              variant="default"
                              size="sm"
                              className="font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 h-10 border shadow-sm"
                              onClick={() => setRequestingEquipment(eq)}
                              title="Solicitar empréstimo deste equipamento"
                              aria-label={`Solicitar empréstimo de ${eq.name}`}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                              Solicitar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EquipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        equipment={editing}
        onSave={handleSave}
      />

      {/* Zoomed Image Modal Overlay for Accessibility */}
      <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
        <DialogContent className="max-w-md p-1 bg-transparent border-none shadow-none flex items-center justify-center">
          {zoomedImage && (
            <div className="relative max-h-[42vh] max-w-[42vw] flex flex-col items-center justify-center gap-2">
              <img
                src={zoomedImage.src}
                alt={zoomedImage.alt}
                className="max-h-[40vh] w-auto object-contain rounded-lg border shadow-2xl bg-background"
              />
              <span className="text-sm font-semibold text-white bg-black/60 px-3 py-1 rounded-full shadow">
                {zoomedImage.alt}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Loan Dialog for Collaborators */}
      <Dialog open={!!requestingEquipment} onOpenChange={(open) => {
        if (!open) {
          setRequestingEquipment(null);
          setStartDate(undefined);
          setEndDate(undefined);
          setLoanNotes("");
        }
      }}>
        <DialogContent className="max-w-md sm:rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Solicitar Equipamento
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Preencha os detalhes abaixo para solicitar o empréstimo de <strong>{requestingEquipment?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {requestingEquipment && (
            <form onSubmit={handleRequestLoanSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-semibold">Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal border shadow-sm h-10 px-3",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {startDate ? format(startDate, "dd/MM/yyyy") : <span>Selecione...</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={ptBR}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-semibold">Data de Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal border shadow-sm h-10 px-3",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={!startDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : <span>Selecione...</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        locale={ptBR}
                        disabled={(date) => {
                          if (!startDate) return true;
                          const startLimit = new Date(startDate);
                          startLimit.setHours(0, 0, 0, 0);
                          return date < startLimit;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="req-notes" className="text-sm font-semibold">Justificativa / Observação</Label>
                <Textarea
                  id="req-notes"
                  rows={3}
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="Justifique o motivo do empréstimo..."
                  className="resize-none"
                />
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setRequestingEquipment(null);
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setLoanNotes("");
                }} disabled={isSubmittingRequest}>
                  Cancelar
                </Button>
                <Button type="submit" variant="default" className="font-semibold" disabled={isSubmittingRequest}>
                  {isSubmittingRequest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Solicitando...
                    </>
                  ) : (
                    "Enviar Solicitação"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EquipmentDialog({
  open, onOpenChange, equipment, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; equipment: Equipment | null;
  onSave: (e: Equipment, file: Blob | null) => void;
}) {
  const [form, setForm] = useState<Partial<Equipment>>({});
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (equipment) {
        setForm(equipment);
        setPreviewUrl(equipment.image || null);
        setImageFile(null);
      } else {
        setForm({
          name: "",
          status: "disponivel",
          serialNumber: "",
          description: "",
        });
        setPreviewUrl(null);
        setImageFile(null);
      }
    }
  }, [open, equipment]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo excede o limite máximo de 10 MB.");
      e.target.value = "";
      return;
    }

    try {
      toast.loading("Comprimindo e otimizando imagem...", { id: "compress" });
      const compressedBlob = await compressImage(file);
      setImageFile(compressedBlob);
      setPreviewUrl(URL.createObjectURL(compressedBlob));
      toast.success("Imagem pronta para envio!", { id: "compress" });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar a imagem.", { id: "compress" });
    }
  };

  const handleSaveForm = () => {
    onSave(form as Equipment, imageFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">{equipment ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
          <DialogDescription>Preencha os dados do equipamento.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Foto / Imagem</Label>
            <Input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} />
            {previewUrl && (
              <div className="relative h-24 w-24 mt-2">
                <img src={resolveImageUrl(previewUrl)} alt="Preview" className="h-full w-full object-cover rounded-md border" />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setImageFile(null);
                    setForm((prev) => ({ ...prev, image: undefined }));
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-destructive/90"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Nº de Série</Label>
              <Input value={form.serialNumber || ""} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status || "disponivel"} onValueChange={(v) => setForm({ ...form, status: v as Equipment["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em uso</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSaveForm}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
