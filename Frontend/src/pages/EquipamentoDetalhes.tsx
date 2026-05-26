import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Loader2, Monitor } from "lucide-react";

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

export default function EquipamentoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: equipamento, isLoading, error } = useQuery({
    queryKey: ["equipment", id],
    queryFn: async () => {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/equipments`, {
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Erro ao buscar equipamentos da API");
      
      const allEquipments = await res.json();
      const found = allEquipments.find((e: any) => String(e.id) === id);
      
      if (!found) throw new Error("Equipamento não encontrado");
      return found;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin opacity-60" />
        <span className="text-sm">Carregando detalhes do equipamento...</span>
      </div>
    );
  }

  if (error || !equipamento) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
            <Monitor className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">Equipamento não encontrado ou indisponível no momento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Voltar para lista
        </Button>
        <StatusBadge status={equipamento.status} />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Foto do Equipamento */}
        <div className="w-full md:w-2/5 shrink-0">
          <div className="aspect-square rounded-2xl overflow-hidden border shadow-sm bg-muted flex items-center justify-center">
            {equipamento.image ? (
              <img 
                src={resolveImageUrl(equipamento.image)} 
                alt={equipamento.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-muted-foreground/60 flex flex-col items-center gap-2 p-6">
                <Monitor className="h-16 w-16 opacity-40" />
                <span className="text-sm font-medium">Sem imagem disponível</span>
              </div>
            )}
          </div>
        </div>

        {/* Detalhes */}
        <div className="w-full md:w-3/5 space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
              {equipamento.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-mono bg-muted/50 w-fit px-2 py-1 rounded">
              S/N: {equipamento.serialNumber}
            </p>
          </div>

          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Descrição e Observações
              </h3>
              {equipamento.description ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {equipamento.description}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground/60">Nenhuma descrição detalhada fornecida para este equipamento.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
