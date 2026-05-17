import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { Loan } from "../../Domain/Entities/Loan";
import { prisma } from "../Database/PrismaClient";

export class PrismaLoanRepository implements ILoanRepository {
  private mapToDomain(dbLoan: any): Loan {
    return {
      id: dbLoan.id,
      equipmentId: dbLoan.equipmentId,
      userId: dbLoan.userId,
      sector: dbLoan.sector,
      days: dbLoan.days,
      status: dbLoan.status as "pendente" | "aprovado" | "recusado" | "devolvido",
      notes: dbLoan.notes || undefined,
      requestedAt: dbLoan.requestedAt,
      approvedAt: dbLoan.approvedAt || undefined,
      equipment: dbLoan.equipment ? {
        ...dbLoan.equipment,
        status: dbLoan.equipment.status as "disponivel" | "em_uso" | "manutencao",
        image: dbLoan.equipment.image || undefined
      } : undefined,
      user: dbLoan.user ? {
        ...dbLoan.user,
        role: dbLoan.user.role as "Administrador" | "Colaborador"
      } : undefined
    };
  }

  async create(loan: Loan): Promise<Loan> {
    const result = await prisma.loan.create({
      data: {
        equipmentId: loan.equipmentId,
        userId: loan.userId,
        sector: loan.sector,
        days: loan.days,
        status: loan.status,
        notes: loan.notes || null,
      },
      include: {
        equipment: true,
        user: true
      }
    });
    return this.mapToDomain(result);
  }

  async getById(id: number): Promise<Loan | null> {
    const result = await prisma.loan.findUnique({
      where: { id },
      include: {
        equipment: true,
        user: true
      }
    });
    if (!result) return null;
    return this.mapToDomain(result);
  }

  async getAll(): Promise<Loan[]> {
    const results = await prisma.loan.findMany({
      orderBy: { id: "desc" },
      include: {
        equipment: true,
        user: true
      }
    });
    return results.map(row => this.mapToDomain(row));
  }

  async getByUserId(userId: number): Promise<Loan[]> {
    const results = await prisma.loan.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      include: {
        equipment: true,
        user: true
      }
    });
    return results.map(row => this.mapToDomain(row));
  }

  async update(id: number, loan: Partial<Loan>): Promise<Loan | null> {
    try {
      const data: any = {};
      if (loan.status) data.status = loan.status;
      if (loan.approvedAt) data.approvedAt = loan.approvedAt;
      if (loan.notes !== undefined) data.notes = loan.notes;

      const result = await prisma.loan.update({
        where: { id },
        data,
        include: {
          equipment: true,
          user: true
        }
      });
      return this.mapToDomain(result);
    } catch {
      return null;
    }
  }
}
