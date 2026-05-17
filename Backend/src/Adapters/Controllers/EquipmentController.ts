import { Request, Response } from "express";
import { GetAllEquipments } from "../../UseCases/Equipments/GetAllEquipments";
import { CreateEquipment } from "../../UseCases/Equipments/CreateEquipment";
import { UpdateEquipment } from "../../UseCases/Equipments/UpdateEquipment";
import { DeleteEquipment } from "../../UseCases/Equipments/DeleteEquipment";
import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { IBlobStorageService } from "../../Domain/Services/IBlobStorageService";

export class EquipmentController {
  private getAllEquipments: GetAllEquipments;
  private createEquipment: CreateEquipment;
  private updateEquipment: UpdateEquipment;
  private deleteEquipment: DeleteEquipment;

  constructor(
    equipmentRepository: IEquipmentRepository,
    blobStorageService: IBlobStorageService
  ) {
    this.getAllEquipments = new GetAllEquipments(equipmentRepository);
    this.createEquipment = new CreateEquipment(equipmentRepository, blobStorageService);
    this.updateEquipment = new UpdateEquipment(equipmentRepository, blobStorageService);
    this.deleteEquipment = new DeleteEquipment(equipmentRepository, blobStorageService);
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const equipments = await this.getAllEquipments.execute();
      res.json(equipments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const input = {
        ...req.body,
        file: req.file ? {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
        } : undefined,
      };

      const newEquipment = await this.createEquipment.execute(input);
      res.status(201).json(newEquipment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "ID inválido." });
        return;
      }

      const input = {
        ...req.body,
        file: req.file ? {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
        } : undefined,
      };

      const updated = await this.updateEquipment.execute(id, input);
      if (!updated) {
        res.status(404).json({ error: "Equipamento não encontrado." });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "ID inválido." });
        return;
      }
      const success = await this.deleteEquipment.execute(id);
      if (!success) {
        res.status(404).json({ error: "Equipamento não encontrado." });
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
