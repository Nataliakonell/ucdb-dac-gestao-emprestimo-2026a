import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  disponivel: { label: "Disponível", className: "bg-success/15 text-success border-success/30" },
  em_uso: { label: "Em uso", className: "bg-info/15 text-info border-info/30" },
  manutencao: { label: "Manutenção", className: "bg-warning/15 text-warning border-warning/30" },
  pendente: { label: "Pendente", className: "bg-warning/15 text-warning border-warning/30" },
  aprovado: { label: "Aprovado", className: "bg-success/15 text-success border-success/30" },
  rejeitado: { label: "Rejeitado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  devolvido: { label: "Devolvido", className: "bg-muted text-muted-foreground border-muted" },
  atrasado: { label: "Atrasado", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: "" };
  return (
    <Badge variant="outline" className={`text-xs sm:text-sm font-semibold px-3 py-1 border shadow-sm ${config.className}`}>
      {config.label}
    </Badge>
  );
}
