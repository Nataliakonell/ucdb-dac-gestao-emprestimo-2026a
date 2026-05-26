import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { Loan } from "../../Domain/Entities/Loan";
import { INotificationRepository } from "../../Domain/Repositories/INotificationRepository";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";

export interface RequestLoanInput {
  equipmentId: number;
  userId: number;
  sector: string;
  days: number;
  notes?: string;
}

export class RequestLoan {
  constructor(
    private loanRepository: ILoanRepository,
    private equipmentRepository: IEquipmentRepository,
    private notificationRepository: INotificationRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: RequestLoanInput): Promise<Loan> {
    if (!input.equipmentId) throw new Error("O ID do equipamento é obrigatório.");
    if (!input.userId) throw new Error("O ID do usuário solicitante é obrigatório.");
    if (!input.sector) throw new Error("O setor de destino é obrigatório.");
    if (!input.days || input.days <= 0) throw new Error("A quantidade de dias deve ser maior que zero.");

    const equipment = await this.equipmentRepository.getById(input.equipmentId);
    if (!equipment) {
      throw new Error("Equipamento não encontrado.");
    }

    if (equipment.status !== "disponivel") {
      throw new Error(`Este equipamento não está disponível para empréstimo. Status atual: ${equipment.status}`);
    }

    const user = await this.userRepository.getById(input.userId);
    const userName = user ? user.name : "Um colaborador";

    const loan: Loan = {
      equipmentId: input.equipmentId,
      userId: input.userId,
      sector: input.sector,
      days: input.days,
      status: "pendente",
      notes: input.notes,
    };

    const createdLoan = await this.loanRepository.create(loan);

    // Notify all administrators
    try {
      const allUsers = await this.userRepository.getAll();
      const admins = allUsers.filter(u => u.role === "Administrador");
      const message = `${userName} solicitou o equipamento '${equipment.name}' para o setor ${input.sector} por ${input.days} dias.`;
      
      for (const admin of admins) {
        if (admin.id) {
          await this.notificationRepository.create({
            userId: admin.id,
            message,
          });
        }
      }
    } catch (err) {
      console.error("Erro ao notificar administradores:", err);
    }

    return createdLoan;
  }
}
