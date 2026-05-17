import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
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

export class DeleteEquipment {
  constructor(
    private equipmentRepository: IEquipmentRepository,
    private blobStorageService: IBlobStorageService
  ) {}

  async execute(id: number): Promise<boolean> {
    // 1. Fetch existing equipment to clean up S3/R2 image
    const existing = await this.equipmentRepository.getById(id);
    if (existing && existing.image) {
      const fileName = getFilenameFromUrl(existing.image);
      if (fileName) {
        await this.blobStorageService.deleteFile(fileName);
      }
    }

    // 2. Perform database deletion
    return this.equipmentRepository.delete(id);
  }
}
