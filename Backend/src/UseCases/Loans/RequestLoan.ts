import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { Loan } from "../../Domain/Entities/Loan";

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
    private equipmentRepository: IEquipmentRepository
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

    const loan: Loan = {
      equipmentId: input.equipmentId,
      userId: input.userId,
      sector: input.sector,
      days: input.days,
      status: "pendente",
      notes: input.notes,
    };

    return this.loanRepository.create(loan);
  }
}
