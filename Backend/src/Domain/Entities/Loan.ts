import { Equipment } from "./Equipment";
import { User } from "./User";

export interface Loan {
  id?: number;
  equipmentId: number;
  userId: number;
  sector: string;
  days: number;
  status: "pendente" | "aprovado" | "recusado" | "devolvido";
  notes?: string;
  requestedAt?: Date;
  approvedAt?: Date;
  
  // Relações opcionais para enriquecer a exibição da timeline
  equipment?: Equipment;
  user?: User;
}
