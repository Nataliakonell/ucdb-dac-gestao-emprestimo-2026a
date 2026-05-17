import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { Equipment } from "../../Domain/Entities/Equipment";

export class GetAllEquipments {
  constructor(private equipmentRepository: IEquipmentRepository) {}

  async execute(): Promise<Equipment[]> {
    return this.equipmentRepository.getAll();
  }
}
