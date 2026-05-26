import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { Loan } from "../../Domain/Entities/Loan";
import { INotificationRepository } from "../../Domain/Repositories/INotificationRepository";

export class ApproveLoan {
  constructor(
    private loanRepository: ILoanRepository,
    private equipmentRepository: IEquipmentRepository,
    private notificationRepository: INotificationRepository
  ) {}

  async execute(loanId: number): Promise<Loan> {
    const loan = await this.loanRepository.getById(loanId);
    if (!loan) {
      throw new Error("Solicitação de empréstimo não encontrada.");
    }

    if (loan.status !== "pendente") {
      throw new Error(`Este empréstimo não pode ser aprovado pois está com status: ${loan.status}`);
    }

    const equipment = await this.equipmentRepository.getById(loan.equipmentId);
    if (!equipment) {
      throw new Error("Equipamento associado não encontrado.");
    }

    if (equipment.status !== "disponivel") {
      throw new Error("O equipamento já não está mais disponível.");
    }

    // 1. Atualiza status do empréstimo
    const updatedLoan = await this.loanRepository.update(loanId, {
      status: "aprovado",
      approvedAt: new Date(),
    });

    if (!updatedLoan) {
      throw new Error("Erro ao aprovar empréstimo.");
    }

    // 2. Atualiza status do equipamento para em_uso
    await this.equipmentRepository.update(loan.equipmentId, {
      ...equipment,
      status: "em_uso",
    });

    // 3. Notificar o colaborador
    await this.notificationRepository.create({
      userId: loan.userId,
      message: `Sua solicitação do equipamento '${equipment.name}' foi APROVADA! Você já pode retirá-lo.`,
    });

    return updatedLoan;
  }
}
