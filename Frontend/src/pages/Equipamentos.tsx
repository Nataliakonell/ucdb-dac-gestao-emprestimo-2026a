import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Equipment } from "@/data/mock";
import { Search, Plus, Pencil, Trash2, Monitor, ArrowRightLeft, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { Textarea } from "@/components/ui/textarea";

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
  const [loanDays, setLoanDays] = useState("7");
  const [loanNotes, setLoanNotes] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const handleRequestLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingEquipment) return;

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
          days: parseInt(loanDays, 10),
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
      setLoanDays("7");
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
      if (!res.ok) throw new Error("Erro ao remover o equipamento");
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
            <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
              Total: {filtered.length}
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os equipamentos da organização</p>
        </div>
        {user?.role === "Administrador" ? (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Equipamento
          </Button>
        ) : (
          <div className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 self-start sm:self-center">
            Perfil: Colaborador
          </div>
        )}
      </div>

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
            {user?.role === "Administrador" && (
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em uso</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            )}
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
      <Dialog open={!!requestingEquipment} onOpenChange={(open) => !open && setRequestingEquipment(null)}>
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
              <div className="space-y-1">
                <Label htmlFor="req-days" className="text-sm font-semibold">Prazo de Empréstimo (Dias)</Label>
                <Input
                  id="req-days"
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={loanDays}
                  onChange={(e) => setLoanDays(e.target.value)}
                  placeholder="Ex: 7"
                />
                <span className="text-[11px] text-muted-foreground">Prazo máximo sugerido de 30 dias.</span>
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
                <Button type="button" variant="outline" onClick={() => setRequestingEquipment(null)} disabled={isSubmittingRequest}>
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
