import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { Equipment } from "../../Domain/Entities/Equipment";
import { IBlobStorageService } from "../../Domain/Services/IBlobStorageService";

function getFilenameFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parts = url.split("/");
    return parts[parts.length - 1];
  } catch {
    return null;
  }
}

export interface UpdateEquipmentInput {
  name: string;
  status: "disponivel" | "em_uso" | "manutencao";
  description: string;
  serialNumber: string;
  image?: string | null;
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}

export class UpdateEquipment {
  constructor(
    private equipmentRepository: IEquipmentRepository,
    private blobStorageService: IBlobStorageService
  ) {}

  async execute(id: number, input: UpdateEquipmentInput): Promise<Equipment | null> {
    // 1. Fetch existing equipment to compare images
    const existing = await this.equipmentRepository.getById(id);
    if (!existing) return null;

    let finalImageUrl: string | null | undefined = input.image;

    // A. If a new file is uploaded
    if (input.file) {
      const fileName = `${Date.now()}-${input.file.originalname.replace(/\s+/g, "_")}`;
      finalImageUrl = await this.blobStorageService.uploadFile(
        input.file.buffer,
        fileName,
        input.file.mimetype
      );

      // Clean up the OLD image file in Cloudflare R2
      if (existing.image) {
        const oldFileName = getFilenameFromUrl(existing.image);
        if (oldFileName) {
          await this.blobStorageService.deleteFile(oldFileName);
        }
      }
    } else if (input.image === undefined || input.image === null || input.image === "") {
      // B. If image was removed in the frontend form (clicked "x")
      if (existing.image) {
        const oldFileName = getFilenameFromUrl(existing.image);
        if (oldFileName) {
          await this.blobStorageService.deleteFile(oldFileName);
        }
      }
      finalImageUrl = null;
    }

    const updatedEquipment: Equipment = {
      name: input.name,
      status: input.status,
      description: input.description,
      serialNumber: input.serialNumber,
      image: finalImageUrl || undefined,
    };

    return this.equipmentRepository.update(id, updatedEquipment);
  }
}
