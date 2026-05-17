export interface Equipment {
  id?: number;
  name: string;
  status: "disponivel" | "em_uso" | "manutencao";
  description: string;
  serialNumber: string;
  image?: string;
}
