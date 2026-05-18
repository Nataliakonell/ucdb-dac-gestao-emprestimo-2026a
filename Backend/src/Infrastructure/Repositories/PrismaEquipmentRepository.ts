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
      // 1. Verificar se há algum empréstimo pendente ou aprovado (ativo)
      const activeLoan = await prisma.loan.findFirst({
        where: {
          equipmentId: id,
          status: {
            in: ["pendente", "aprovado"]
          }
        }
      });

      if (activeLoan) {
        throw new Error("Não é possível excluir o equipamento pois ele está vinculado a solicitações ou empréstimos ativos.");
      }

      // 2. Se existirem apenas empréstimos inativos (devolvidos ou recusados), deletamos o histórico e o equipamento em transação
      await prisma.$transaction([
        prisma.loan.deleteMany({
          where: { equipmentId: id }
        }),
        prisma.equipment.delete({
          where: { id }
        })
      ]);

      return true;
    } catch (error: any) {
      if (error.code === "P2003" || error.message.includes("solicitações ou empréstimos ativos")) {
        throw new Error("Não é possível excluir o equipamento pois ele está vinculado a solicitações ou empréstimos ativos.");
      }
      throw error;
    }
  }
}
