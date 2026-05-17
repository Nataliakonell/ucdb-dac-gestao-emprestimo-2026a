import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { Loan } from "../../Domain/Entities/Loan";

export class ReturnEquipment {
  constructor(
    private loanRepository: ILoanRepository,
    private equipmentRepository: IEquipmentRepository
  ) {}

  async execute(loanId: number): Promise<Loan> {
    const loan = await this.loanRepository.getById(loanId);
    if (!loan) {
      throw new Error("Solicitação de empréstimo não encontrada.");
    }

    if (loan.status !== "aprovado") {
      throw new Error(`Apenas empréstimos aprovados podem ser devolvidos. Status atual: ${loan.status}`);
    }

    const equipment = await this.equipmentRepository.getById(loan.equipmentId);
    if (!equipment) {
      throw new Error("Equipamento associado não encontrado.");
    }

    // 1. Atualiza empréstimo para devolvido
    const updatedLoan = await this.loanRepository.update(loanId, {
      status: "devolvido",
    });

    if (!updatedLoan) {
      throw new Error("Erro ao devolver empréstimo.");
    }

    // 2. Atualiza equipamento para disponivel
    await this.equipmentRepository.update(loan.equipmentId, {
      ...equipment,
      status: "disponivel",
    });

    return updatedLoan;
  }
}
