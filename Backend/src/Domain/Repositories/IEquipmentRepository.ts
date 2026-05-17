import { Equipment } from "../Entities/Equipment";

export interface IEquipmentRepository {
  getAll(): Promise<Equipment[]>;
  getById(id: number): Promise<Equipment | null>;
  create(equipment: Equipment): Promise<Equipment>;
  update(id: number, equipment: Equipment): Promise<Equipment | null>;
  delete(id: number): Promise<boolean>;
}
