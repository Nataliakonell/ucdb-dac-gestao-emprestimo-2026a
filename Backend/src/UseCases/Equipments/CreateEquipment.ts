import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { Equipment } from "../../Domain/Entities/Equipment";
import { IBlobStorageService } from "../../Domain/Services/IBlobStorageService";

export interface CreateEquipmentInput {
  name: string;
  status: "disponivel" | "em_uso" | "manutencao";
  description: string;
  serialNumber: string;
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}

export class CreateEquipment {
  constructor(
    private equipmentRepository: IEquipmentRepository,
    private blobStorageService: IBlobStorageService
  ) {}

  async execute(input: CreateEquipmentInput): Promise<Equipment> {
    if (!input.name) {
      throw new Error("O nome do equipamento é obrigatório.");
    }

    let imageUrl: string | undefined;

    if (input.file) {
      const fileName = `${Date.now()}-${input.file.originalname.replace(/\s+/g, "_")}`;
      imageUrl = await this.blobStorageService.uploadFile(
        input.file.buffer,
        fileName,
        input.file.mimetype
      );
    }

    const equipment: Equipment = {
      name: input.name,
      status: input.status,
      description: input.description,
      serialNumber: input.serialNumber,
      image: imageUrl,
    };

    return this.equipmentRepository.create(equipment);
  }
}
