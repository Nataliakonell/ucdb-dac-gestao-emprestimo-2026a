import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { User } from "../../Domain/Entities/User";
import { prisma } from "../Database/PrismaClient";

export class PrismaUserRepository implements IUserRepository {
  async getByEmail(email: string): Promise<User | null> {
    const result = await prisma.user.findUnique({
      where: { email }
    });
    if (!result) return null;
    return {
      ...result,
      role: result.role as "Administrador" | "Colaborador"
    };
  }

  async getById(id: number): Promise<User | null> {
    const result = await prisma.user.findUnique({
      where: { id }
    });
    if (!result) return null;
    return {
      ...result,
      role: result.role as "Administrador" | "Colaborador"
    };
  }

  async create(user: User): Promise<User> {
    const result = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        sector: user.sector,
        role: user.role
      }
    });
    return {
      ...result,
      role: result.role as "Administrador" | "Colaborador"
    };
  }

  async getAll(): Promise<User[]> {
    const results = await prisma.user.findMany({
      orderBy: { id: 'desc' }
    });
    return results.map(result => ({
      ...result,
      role: result.role as "Administrador" | "Colaborador"
    }));
  }
}
