import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { Equipment } from "../../Domain/Entities/Equipment";
import { prisma } from "../Database/PrismaClient";

export class PrismaEquipmentRepository implements IEquipmentRepository {
  async getAll(): Promise<Equipment[]> {
    const results = await prisma.equipment.findMany({
      orderBy: { id: 'desc' }
    });
    return results.map(eq => ({
      ...eq,
      status: eq.status as "disponivel" | "em_uso" | "manutencao",
      image: eq.image || undefined
    }));
  }

  async getById(id: number): Promise<Equipment | null> {
    const result = await prisma.equipment.findUnique({
      where: { id }
    });
    if (!result) return null;
    return {
      ...result,
      status: result.status as "disponivel" | "em_uso" | "manutencao",
      image: result.image || undefined
    };
  }

  async create(eq: Equipment): Promise<Equipment> {
    const result = await prisma.equipment.create({
      data: {
        name: eq.name,
        status: eq.status,
        description: eq.description,
        serialNumber: eq.serialNumber,
        image: eq.image || null
      }
    });
    return {
      ...result,
      status: result.status as "disponivel" | "em_uso" | "manutencao",
      image: result.image || undefined
    };
  }

  async update(id: number, eq: Equipment): Promise<Equipment | null> {
    const result = await prisma.equipment.update({
      where: { id },
      data: {
        name: eq.name,
        status: eq.status,
        description: eq.description,
        serialNumber: eq.serialNumber,
        image: eq.image || null
      }
    }).catch(() => null);

    if (!result) return null;
    return {
      ...result,
      status: result.status as "disponivel" | "em_uso" | "manutencao",
      image: result.image || undefined
    };
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.equipment.delete({
        where: { id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
